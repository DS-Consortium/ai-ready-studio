import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, type AIFilter } from "@/lib/filters";
import { ShareModal } from "@/components/ShareModal";
import { CanvasVideoRecorder } from "@/lib/canvas-recorder";
import {
  ArrowLeft,
  RotateCcw,
  Check,
  Sparkles,
  Share2,
  X,
  Mic,
  MicOff,
  Zap,
} from "lucide-react";
import { moderateVideo, moderateLocally, pollModerationStatus } from "@/lib/moderation";

type RecordingState = "idle" | "recording" | "preview" | "uploading" | "done";

// ─── Snapchat-style AR Text Lens Overlay ───────────────────────────────────────────
const ARTextLens = ({ filter, visible }: { filter: AIFilter; visible: boolean }) => {
  const [key, setKey] = useState(0);
  
  const labelMap: Record<string, { line1: string; line2: string; tagline?: string; color: string }> = {
    ready:      { line1: "I AM",  line2: "AI READY",       tagline: "#IAmAIReady", color: "#3B82F6" },
    savvy:      { line1: "I AM",  line2: "AI SAVVY",        tagline: "#IAmAISavvy", color: "#0EA5E9" },
    accountable:{ line1: "I AM",  line2: "AI ACCOUNTABLE",  tagline: "#IAmAIAccountable", color: "#10B981" },
    driven:     { line1: "I AM",  line2: "AI DRIVEN",       tagline: "#IAmAIDriven", color: "#F59E0B" },
    enabler:    { line1: "I AM AN", line2: "AI ENABLER",    tagline: "#IAmAnAIEnabler", color: "#8B5CF6" },
    building:   { line1: "I AM",  line2: "BUILDING AI-READY\nINSTITUTIONS", tagline: "#BuildingAIReady", color: "#22C55E" },
    leading:    { line1: "I AM",  line2: "LEADING\nRESPONSIBLE AI", tagline: "#LeadingResponsibleAI", color: "#EF4444" },
    shaping:    { line1: "I AM",  line2: "SHAPING AI\nECOSYSTEMS", tagline: "#ShapingAIEcosystems", color: "#06B6D4" },
  };

  const cfg = labelMap[filter.id] || { line1: "I AM", line2: "AI READY", color: "#3B82F6" };

  useEffect(() => {
    setKey((k) => k + 1);
  }, [filter.id]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-20 z-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 30, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-1 px-6 text-center"
        >
          <motion.span
            initial={{ opacity: 0, letterSpacing: "0.4em" }}
            animate={{ opacity: 1, letterSpacing: "0.25em" }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="text-white/90 text-lg font-bold tracking-[0.25em] uppercase drop-shadow-lg"
          >
            {cfg.line1}
          </motion.span>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
            className="leading-none"
          >
            {cfg.line2.split("\n").map((word, i) => (
              <div
                key={i}
                className="lens-shimmer-text font-black uppercase"
                style={{
                  color: cfg.color,
                  fontSize: cfg.line2.length > 12 ? "clamp(1.6rem, 7vw, 2.8rem)" : "clamp(2rem, 9vw, 3.5rem)",
                  lineHeight: 1.05,
                  textShadow: `0 0 20px ${cfg.color}99, 0 0 40px ${cfg.color}55`,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {word}
              </div>
            ))}
          </motion.div>

          {cfg.tagline && (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-white text-xs font-medium tracking-widest mt-1"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
            >
              {cfg.tagline}
            </motion.span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Record = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<AIFilter>(AI_FILTERS[0]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const canvasRecorderRef = useRef<CanvasVideoRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    startCamera();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        const { Camera } = await import('@capacitor/camera');
        await Camera.requestPermissions();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", aspectRatio: 9 / 16 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({ title: "Camera access denied", description: "Please allow camera access.", variant: "destructive" });
    }
  };

  const startRecording = async () => {
    if (!streamRef.current || !selectedFilter) return;

    canvasRecorderRef.current = new CanvasVideoRecorder(streamRef.current, selectedFilter);
    canvasRecorderRef.current.start();
    
    setRecordingState("recording");
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((t) => {
        if (t >= 60) {
          stopRecording();
          return t;
        }
        return t + 1;
      });
    }, 1000);
  };

  const stopRecording = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (canvasRecorderRef.current) {
      const blob = await canvasRecorderRef.current.stop();
      setRecordedBlob(blob);
      setRecordingState("preview");
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob);
      }
      canvasRecorderRef.current.cleanup();
      canvasRecorderRef.current = null;
    }
  }, []);

  const handleSubmit = async () => {
    if (!recordedBlob || !selectedFilter || !user) return;
    setRecordingState("uploading");

    try {
      const fileName = `${user.id}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, recordedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(fileName);

      const { data: videoData, error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        url: publicUrl,
        title: `My ${selectedFilter.shortName} Declaration`,
        filter_type: selectedFilter.id,
        is_approved: false
      }).select().single();

      if (dbError) throw dbError;

      setUploadedVideoUrl(publicUrl);
      setRecordingState("done");
      setShareModalOpen(true);
      
      // Poll for moderation status
      pollModerationStatus(videoData.id, (status) => {
        if (status === 'approved') {
          toast({ title: "Live!", description: "Your video is now in the gallery." });
        }
      });

    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setRecordingState("preview");
    }
  };

  const handleFilterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 80; // Approximate width of filter icon + gap
    const index = Math.round(scrollLeft / itemWidth);
    if (AI_FILTERS[index] && AI_FILTERS[index].id !== selectedFilter.id) {
      setSelectedFilter(AI_FILTERS[index]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col h-screen w-screen">
      {/* Camera Feed */}
      <div className="absolute inset-0 z-0">
        {recordingState === "preview" || recordingState === "uploading" || recordingState === "done" ? (
          <video ref={previewRef} className="w-full h-full object-cover" autoPlay loop playsInline />
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
        )}
      </div>

      {/* Snapchat AR Text Lens (Visual only in UI, baked in CanvasRecorder) */}
      {(recordingState === "idle" || recordingState === "recording") && (
        <ARTextLens filter={selectedFilter} visible={true} />
      )}

      {/* Top Controls */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-30">
        <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-md text-white rounded-full h-10 w-10" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {recordingState === "recording" && (
          <div className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold flex items-center gap-2 animate-pulse shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full" />
            00:{recordingTime.toString().padStart(2, '0')}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-md text-white rounded-full h-10 w-10" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="bg-black/20 backdrop-blur-md text-white rounded-full h-10 w-10">
            <Zap className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls - Snapchat Style */}
      <div className="absolute bottom-0 inset-x-0 pb-12 pt-20 bg-gradient-to-t from-black/80 to-transparent z-30">
        <AnimatePresence mode="wait">
          {recordingState === "idle" || recordingState === "recording" ? (
            <div className="flex flex-col items-center gap-6">
              {/* Filter Carousel Snapped to Record Button */}
              <div 
                ref={scrollRef}
                onScroll={handleFilterScroll}
                className="w-full flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-[calc(50%-40px)] gap-4"
              >
                {AI_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={cn(
                      "snap-center shrink-0 w-16 h-16 rounded-full border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden",
                      selectedFilter.id === filter.id 
                        ? "border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                        : "border-white/30 scale-90 opacity-60"
                    )}
                  >
                    <div className="absolute inset-0 opacity-40" style={{ backgroundColor: getFilterColor(filter.id) }} />
                    <Sparkles className="h-6 w-6 text-white relative z-10" />
                  </button>
                ))}
              </div>

              {/* Main Record Button */}
              <button
                onClick={recordingState === "idle" ? startRecording : stopRecording}
                className={cn(
                  "relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300",
                  recordingState === "recording" ? "scale-125" : "hover:scale-105"
                )}
              >
                <div className={cn(
                  "transition-all duration-300 bg-white",
                  recordingState === "recording" ? "w-8 h-8 rounded-sm" : "w-16 h-16 rounded-full"
                )} />
                {recordingState === "recording" && (
                  <svg className="absolute inset-0 -rotate-90 w-full h-full">
                    <circle
                      cx="40" cy="40" r="36"
                      fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4"
                    />
                    <motion.circle
                      cx="40" cy="40" r="36"
                      fill="none" stroke="#EF4444" strokeWidth="4"
                      strokeDasharray="226.2"
                      initial={{ strokeDashoffset: 226.2 }}
                      animate={{ strokeDashoffset: 226.2 - (recordingTime / 60) * 226.2 }}
                    />
                  </svg>
                )}
              </button>
              <p className="text-white/70 text-sm font-medium">
                {recordingState === "idle" ? "Tap to record" : "Tap to stop"}
              </p>
            </div>
          ) : recordingState === "preview" ? (
            <div className="px-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2" onClick={resetRecording}>
                  <RotateCcw className="h-5 w-5" /> Retake
                </Button>
                <Button className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20" onClick={handleSubmit}>
                  <Check className="h-5 w-5" /> Submit
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 px-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-medium animate-pulse">Uploading your declaration...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {uploadedVideoUrl && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          videoUrl={uploadedVideoUrl}
          title={`My AI Readiness Declaration`}
        />
      )}
    </div>
  );
};

export default Record;
