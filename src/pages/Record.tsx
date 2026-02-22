import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, type AIFilter } from "@/lib/filters";
import { ShareModal } from "@/components/ShareModal";
import {
  ArrowLeft,
  Video,
  Square,
  RotateCcw,
  Check,
  Sparkles,
  Share2,
} from "lucide-react";
import { moderateVideo, moderateLocally, pollModerationStatus } from "@/lib/moderation";

type RecordingState = "idle" | "recording" | "preview" | "uploading" | "done";

// ─── AR Text Lens overlay definitions ────────────────────────────────────────
interface LensConfig {
  line1: string;
  line2: string;
  color: string;
  tagline?: string;
}

const getLensConfig = (filter: AIFilter): LensConfig => {
  const colorMap: Record<string, string> = {
    ready:      "#3B82F6",
    savvy:      "#0EA5E9",
    accountable:"#10B981",
    driven:     "#F59E0B",
    enabler:    "#8B5CF6",
    building:   "#22C55E",
    leading:    "#EF4444",
    shaping:    "#06B6D4",
  };
  const color = colorMap[filter.id] || "#3B82F6";

  const labelMap: Record<string, { line1: string; line2: string; tagline?: string }> = {
    ready:      { line1: "I AM",  line2: "AI READY",       tagline: "#IAmAIReady" },
    savvy:      { line1: "I AM",  line2: "AI SAVVY",        tagline: "#IAmAISavvy" },
    accountable:{ line1: "I AM",  line2: "AI ACCOUNTABLE",  tagline: "#IAmAIAccountable" },
    driven:     { line1: "I AM",  line2: "AI DRIVEN",       tagline: "#IAmAIDriven" },
    enabler:    { line1: "I AM AN", line2: "AI ENABLER",    tagline: "#IAmAnAIEnabler" },
    building:   { line1: "I AM",  line2: "BUILDING AI-READY\nINSTITUTIONS", tagline: "#BuildingAIReady" },
    leading:    { line1: "I AM",  line2: "LEADING\nRESPONSIBLE AI", tagline: "#LeadingResponsibleAI" },
    shaping:    { line1: "I AM",  line2: "SHAPING AI\nECOSYSTEMS", tagline: "#ShapingAIEcosystems" },
  };

  const labels = labelMap[filter.id] || { line1: "I AM", line2: "AI READY" };
  return { ...labels, color };
};

// ─── Animated AR Text Lens Overlay ───────────────────────────────────────────
const ARTextLens = ({ filter, visible }: { filter: AIFilter; visible: boolean }) => {
  const [key, setKey] = useState(0);
  const cfg = getLensConfig(filter);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [filter.id]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-36 z-20">
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
            style={{ fontFamily: "'Inter', sans-serif" }}
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

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="h-0.5 w-20 rounded-full mt-2"
            style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Main Record Page ─────────────────────────────────────────────────────────
const Record = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<AIFilter | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    const filterId = searchParams.get("filter");
    if (filterId) {
      const filter = AI_FILTERS.find((f) => f.id === filterId);
      if (filter) setSelectedFilter(filter);
    } else {
      setSelectedFilter(AI_FILTERS[0]);
    }
    startCamera();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopStream();
    };
  }, [searchParams]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", aspectRatio: 9 / 16 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access to record.",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);

    if (!streamRef.current) {
      toast({ title: "No camera stream", variant: "destructive" });
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setRecordingState("preview");
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob);
      }
    };

    recorder.start(100);
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

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordingState("idle");
    setRecordingTime(0);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!recordedBlob || !selectedFilter || !user) return;
    setRecordingState("uploading");

    const videoTitle = `My ${selectedFilter.shortName} Declaration`;

    const localCheck = moderateLocally(videoTitle);
    if (localCheck.status === "flagged") {
      toast({
        title: "Content not allowed",
        description: localCheck.reason || "Your submission did not meet content guidelines.",
        variant: "destructive",
      });
      setRecordingState("preview");
      return;
    }

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, recordedBlob, { contentType: "video/webm" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);

      const { data: insertedVideo, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          title: videoTitle,
          filter_id: selectedFilter.id,
          video_url: urlData.publicUrl,
          is_submitted: true,
          is_approved: false,
          duration_seconds: recordingTime,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Step 4: Invoke edge function moderation (auto-approves if clean)
      await moderateVideo(insertedVideo.id);

      // Step 5: Poll for moderation status (max 60 seconds, checks every 500ms)
      const pollResult = await pollModerationStatus(insertedVideo.id, 120, 500);

      if (pollResult.approved) {
        toast({
          title: "Video approved!",
          description: "Your video is now live in the gallery.",
        });
      } else {
        toast({
          title: "Content flagged for review",
          description: "Your video has been submitted but requires manual review before publishing.",
        });
      }

      setUploadedVideoUrl(urlData.publicUrl);
      setRecordingState("done");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setRecordingState("preview");
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* ── Full-screen camera / preview ── */}
      <div className="relative flex-1 bg-neutral-900">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            recordingState === "preview" ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />

        {/* Preview playback */}
        <video
          ref={previewRef}
          loop
          playsInline
          controls
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            recordingState === "preview" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* ── AR Text Lens Overlay ── */}
        {selectedFilter && recordingState !== "preview" && (
          <ARTextLens filter={selectedFilter} visible={true} />
        )}

        {/* ── UI Overlays ── */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-30">
          {/* Top bar — Back button + Timer */}
          <div className="flex justify-between items-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-white bg-black/20 backdrop-blur-md rounded-full"
            >
              <ArrowLeft />
            </Button>
            {recordingState === "recording" && (
              <div className="bg-red-500 text-white px-4 py-1 rounded-full font-mono flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </div>
            )}
          </div>

          {/* Countdown */}
          {countdown !== null && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="text-8xl font-display font-bold text-white drop-shadow-lg">
                {countdown}
              </span>
            </motion.div>
          )}

          {/* ── BOTTOM CONTROL AREA (Snapchat-style) ── */}
          <div className="space-y-4">
            {/* Filter carousel (Snapchat-style horizontal scroll) */}
            {recordingState === "idle" && (
              <div
                ref={filterScrollRef}
                className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-4 justify-center"
                style={{ scrollBehavior: "smooth" }}
              >
                {AI_FILTERS.map((filter) => {
                  const cfg = getLensConfig(filter);
                  const isSelected = selectedFilter?.id === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                        isSelected ? "scale-100" : "scale-75 opacity-50"
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${
                          isSelected ? "border-white shadow-xl" : "border-white/20"
                        }`}
                        style={{
                          backgroundColor: `${cfg.color}33`,
                          borderColor: isSelected ? "#fff" : `${cfg.color}44`,
                        }}
                      >
                        <filter.icon
                          className="w-8 h-8"
                          style={{ color: cfg.color }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-bold tracking-wide text-center leading-tight max-w-[64px]"
                        style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.5)" }}
                      >
                        {filter.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Record / Stop / Submit controls — centered */}
            <div className="flex justify-center items-center">
              {recordingState === "idle" && (
                <button
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full border-4 border-white p-1 active:scale-95 transition-transform shadow-2xl"
                >
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
              )}

              {recordingState === "recording" && (
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full border-4 border-white p-1 active:scale-95 transition-transform shadow-2xl"
                >
                  <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                    <Square className="text-white fill-white w-8 h-8" />
                  </div>
                </button>
              )}

              {recordingState === "preview" && (
                <div className="flex gap-4 bg-black/50 backdrop-blur-xl p-4 rounded-3xl border border-white/20">
                  <Button
                    variant="ghost"
                    onClick={resetRecording}
                    className="text-white gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> Retake
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-white text-black hover:bg-white/90 gap-2"
                  >
                    <Check className="w-5 h-5" /> Submit
                  </Button>
                </div>
              )}

              {recordingState === "uploading" && (
                <div className="flex items-center gap-3 text-white">
                  <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Uploading…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Modal ── */}
      <AnimatePresence>
        {recordingState === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="bg-card w-full max-w-md rounded-3xl p-8 text-center border border-border shadow-2xl">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="text-white w-10 h-10" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Declaration Submitted!</h2>
              <p className="text-muted-foreground mb-8">
                Your video is being reviewed. Once it passes our content check, it will be published
                to the gallery automatically.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full h-12 gap-2"
                  onClick={() => setShareModalOpen(true)}
                >
                  <Share2 /> Share to Network
                </Button>
                <Button variant="outline" className="w-full h-12" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        title={`My ${selectedFilter?.shortName} Declaration`}
        url={uploadedVideoUrl}
        hashtags={["AIReady", "AIDeclaration", "DSConsortium"]}
      />
    </div>
  );
};

export default Record;
