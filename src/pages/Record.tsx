import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Check, ArrowLeft, Zap, Sparkles, Camera, Video, Share2, Lightbulb, Flame } from "lucide-react";
import { AI_FILTERS, AIFilter } from "@/lib/filters";
import { getLensConfig, CanvasVideoRecorder } from "@/lib/canvas-recorder";
import { awardCredits, CREDIT_COSTS } from "@/lib/credits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// Snapchat-style icon wrapper component
const SnapIcon = ({ icon: Icon, size = 24, color = "white", filled = false }: { icon: any; size?: number; color?: string; filled?: boolean }) => (
  <Icon 
    size={size} 
    strokeWidth={filled ? 0 : 3} 
    style={{ color }} 
    className={filled ? "fill-current" : ""}
  />
);

type RecordingState = "idle" | "recording" | "preview" | "uploading";

const Record = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<AIFilter>(AI_FILTERS[0]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [durationWarning, setDurationWarning] = useState(false);

  const MAX_DURATION = 60; // Snapchat 60-second limit

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRecorderRef = useRef<CanvasVideoRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      canvasRecorderRef.current?.cleanup();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1080 }, 
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9/16 }
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast({ title: "Camera access denied", description: "Please allow camera access to record.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const toggleCamera = async () => {
    stopCamera();
    setFacingMode(facingMode === "user" ? "environment" : "user");
    setTimeout(startCamera, 300);
  };

  const startRecording = () => {
    if (!streamRef.current || !selectedFilter) return;
    
    const recorder = new CanvasVideoRecorder(streamRef.current, selectedFilter);
    canvasRecorderRef.current = recorder;
    recorder.start();
    
    setRecordingState("recording");
    setDuration(0);
    setDurationWarning(false);
    
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const newDuration = d + 1;
        // Auto-stop at 60 seconds
        if (newDuration >= MAX_DURATION) {
          stopRecording();
          toast({ 
            title: "Recording complete", 
            description: "Maximum 60-second recording reached.", 
            variant: "default" 
          });
          return MAX_DURATION;
        }
        // Warn at 50 seconds
        if (newDuration === 50) {
          setDurationWarning(true);
        }
        return newDuration;
      });
    }, 1000);
  };

  const stopRecording = async () => {
    if (!canvasRecorderRef.current) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    const blob = await canvasRecorderRef.current.stop();
    setRecordedBlob(blob);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setRecordingState("preview");
    
    canvasRecorderRef.current.cleanup();
    canvasRecorderRef.current = null;
  };

  const resetRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingState("idle");
    setDuration(0);
  };

  const handleSubmit = async () => {
    if (!recordedBlob || !selectedFilter) return;
    setRecordingState("uploading");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to submit your video.", variant: "destructive" });
        navigate("/auth");
        return;
      }

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(fileName, recordedBlob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: `${selectedFilter.shortName} Declaration`,
        video_url: publicUrl,
        filter_id: selectedFilter.id,
        duration_seconds: duration,
        is_submitted: true,
      });

      if (insertError) throw insertError;

      // Award credits for completing declaration
      try {
        await awardCredits(
          user.id,
          CREDIT_COSTS.DECLARATION_COMPLETION,
          'Completed declaration video'
        );
        toast({ 
          title: "Video submitted!", 
          description: `Your declaration has been submitted for review. You earned ${CREDIT_COSTS.DECLARATION_COMPLETION} credits!` 
        });
      } catch (creditErr) {
        console.warn('Could not award credits:', creditErr);
        toast({ 
          title: "Video submitted!", 
          description: "Your declaration has been submitted for review." 
        });
      }

      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setRecordingState("preview");
    }
  };

  const handleShare = async () => {
    if (!recordedBlob || !selectedFilter) return;
    
    try {
      const file = new File(
        [recordedBlob], 
        `${selectedFilter.shortName}-declaration.webm`, 
        { type: "video/webm" }
      );
      
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `I Am ${selectedFilter.shortName}`,
          text: `Check out my AI Ready declaration! Watch, vote, and get inspired by leaders from around the world.`,
          files: [file],
          url: window.location.origin
        });
      } else {
        // Fallback
        toast({ 
          title: "Share", 
          description: "Web sharing not available. Recording saved to your device." 
        });
      }
    } catch (err: any) {
      // User cancelled share
      if (err.name !== 'AbortError') {
        console.error("Share error:", err);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans select-none">
      {/* ═══════════════════════════════════════════════════════════════
          TOP BAR - Snapchat Style (Minimal, semi-transparent)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 backdrop-blur-md bg-black/30 border-b border-white/5">
        
        {/* Left: Back Button */}
        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={() => navigate(-1)} 
          className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-200 active:scale-90"
          title="Back"
        >
          <SnapIcon icon={ArrowLeft} size={22} />
          <div className="absolute inset-0 rounded-full bg-white/0 group-active:bg-white/10 transition-all" />
        </motion.button>

        {/* Center: Duration Timer (Recording Only) */}
        {recordingState === "recording" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm backdrop-blur-xl border transition-all duration-300 ${
              durationWarning 
                ? 'bg-yellow-500/30 border-yellow-400/40 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                : 'bg-red-600/30 border-red-400/40 text-red-100 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
            }`}
          >
            <motion.div 
              animate={{ scale: durationWarning ? [1, 1.2, 1] : [1, 0.8, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${durationWarning ? 'bg-yellow-300' : 'bg-red-300'}`} 
            />
            <span className="tracking-wide">{formatTime(duration)}</span>
            {durationWarning && <span className="ml-1 text-xs font-bold animate-pulse">TIME LIMIT NEAR</span>}
          </motion.div>
        )}

        {/* Right: Settings/Flash Button */}
        <motion.button 
          whileTap={{ scale: 0.85 }}
          className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-200 active:scale-90"
          title="Settings"
        >
          <SnapIcon icon={Zap} size={22} />
          <div className="absolute inset-0 rounded-full bg-white/0 group-active:bg-white/10 transition-all" />
        </motion.button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN VIEWPORT - Full Screen Camera
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative mt-16">
        <AnimatePresence mode="wait">
          {recordingState !== "preview" ? (
            <motion.video
              key="camera"
              ref={videoRef}
              autoPlay
              playsInline
              muted
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            previewUrl && (
              <motion.video
                key="preview"
                ref={previewVideoRef}
                src={previewUrl}
                autoPlay
                loop
                playsInline
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )
          )}
        </AnimatePresence>

        {/* AR Filter Overlay - Centered Text */}
        <AnimatePresence>
          {selectedFilter && recordingState !== "preview" && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex flex-col items-center justify-center pb-40 pointer-events-none z-20"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-8 bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl" />
                
                {/* Text Container */}
                <div className="relative bg-black/20 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center">
                  <p className="text-white/70 text-sm font-black tracking-[0.3em] uppercase drop-shadow-xl mb-3">
                    {getLensConfig(selectedFilter).line1}
                  </p>
                  <h2
                    className="text-7xl font-display font-black text-center leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-4"
                    style={{ 
                      color: getLensConfig(selectedFilter).color,
                      textShadow: `0 0 30px ${getLensConfig(selectedFilter).color}40`
                    }}
                  >
                    {getLensConfig(selectedFilter).line2.split('\n').map((line, i) => (
                      <span key={i} className="block">{line}</span>
                    ))}
                  </h2>
                  {getLensConfig(selectedFilter).tagline && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 flex items-center gap-2 bg-white/15 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-white text-[10px] font-black tracking-widest uppercase">
                        {getLensConfig(selectedFilter).tagline}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM ACTION BAR - Snapchat Style (Floating buttons)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-20 pt-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        
        {/* Filter Carousel - When IDLE */}
        {recordingState === "idle" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 px-4"
          >
            <div
              ref={filterScrollRef}
              className="flex overflow-x-auto gap-5 no-scrollbar px-[calc(50%-44px)] items-center snap-x snap-mandatory py-2"
              style={{ scrollBehavior: "smooth" }}
            >
              {AI_FILTERS.map((filter) => {
                const cfg = getLensConfig(filter);
                const isSelected = selectedFilter.id === filter.id;
                return (
                  <motion.button
                    key={filter.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedFilter(filter)}
                    className="flex-shrink-0 flex flex-col items-center gap-2 snap-center transition-all duration-300"
                  >
                    {/* Filter Icon Circle */}
                    <motion.div
                      animate={{ scale: isSelected ? 1.15 : 0.95 }}
                      className={`rounded-full border-[3px] flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'w-20 h-20 border-white shadow-[0_0_25px_rgba(255,255,255,0.4)]' 
                          : 'w-16 h-16 border-white/30 opacity-60'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${cfg.color}30` : "rgba(255,255,255,0.08)",
                        borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.25)",
                      }}
                    >
                      <filter.icon
                        className={isSelected ? "w-10 h-10" : "w-7 h-7"}
                        style={{ color: isSelected ? cfg.color : "#fff", opacity: isSelected ? 1 : 0.7 }}
                        strokeWidth={isSelected ? 2 : 2.5}
                      />
                    </motion.div>
                    {/* Filter Name */}
                    <span className={`text-[8px] font-black tracking-[0.15em] uppercase transition-all duration-300 ${
                      isSelected ? "text-white" : "text-white/40"
                    }`}>
                      {filter.shortName}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Main Control Buttons */}
        <div className="flex justify-center items-center gap-6 px-4">
          
          {/* LEFT: Camera Toggle (When IDLE) */}
          {recordingState === "idle" && (
            <motion.button 
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleCamera}
              title="Switch camera (front/back)"
              className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 hover:bg-white/25 hover:border-white/50 transition-all duration-200 active:scale-75 shadow-[0_8px_32px_rgba(255,255,255,0.1)]"
            >
              <SnapIcon icon={Camera} size={24} />
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-white/0 group-active:border-white/30"
                animate={{ scale: 1.2 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          )}

          {recordingState === "preview" && <div className="w-14" />}

          {/* CENTER: Main Record/Stop Button (HUGE) */}
          <div className="relative flex flex-col items-center gap-3">
            {recordingState === "idle" && (
              <>
                <motion.button
                  onMouseDown={startRecording}
                  onTouchStart={startRecording}
                  className="group relative w-28 h-28 flex items-center justify-center active:scale-75 transition-transform duration-150"
                  title="Hold to record"
                >
                  {/* Outer Ring */}
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-[4px] border-white/20" 
                  />
                  
                  {/* Center White Button */}
                  <motion.div 
                    className="relative w-24 h-24 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255,255,255,0.4)" }}
                    whileTap={{ scale: 0.9, boxShadow: "0 0 30px rgba(255,255,255,0.2)" }}
                  />
                  
                  {/* Tooltip */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-14 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-4 py-2 rounded-full whitespace-nowrap border border-white/20"
                  >
                    HOLD TO RECORD
                  </motion.div>
                </motion.button>
              </>
            )}

            {recordingState === "recording" && (
              <motion.button
                onMouseUp={stopRecording}
                onTouchEnd={stopRecording}
                className="relative w-32 h-32 flex items-center justify-center"
                title="Tap to stop"
              >
                {/* Pulsing Outer Ring */}
                <motion.div 
                  animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-[4px] border-red-600/60" 
                />
                
                {/* Static Border */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-[4px] border-red-600"
                />
                
                {/* Stop Square */}
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-12 h-12 rounded-lg bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.6)]" 
                />
              </motion.button>
            )}

            {recordingState === "preview" && (
              <div className="flex items-center gap-12 bg-black/40 backdrop-blur-xl px-8 py-6 rounded-[2rem] border border-white/20 shadow-2xl">
                
                {/* Retake */}
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={resetRecording}
                  title="Retake video"
                  className="flex flex-col items-center gap-2 text-white hover:text-red-400 transition-colors group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="p-3 bg-white/10 rounded-full group-hover:bg-red-500/20 transition-all border border-white/20 group-hover:border-red-400/40"
                  >
                    <SnapIcon icon={RotateCcw} size={24} />
                  </motion.div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Retake</span>
                </motion.button>

                <div className="w-px h-14 bg-white/20" />

                {/* Share */}
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={handleShare}
                  title="Share video"
                  className="flex flex-col items-center gap-2 text-white hover:text-blue-400 transition-colors group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="p-3 bg-white/10 rounded-full group-hover:bg-blue-500/20 transition-all border border-white/20 group-hover:border-blue-400/40"
                  >
                    <SnapIcon icon={Share2} size={24} />
                  </motion.div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Share</span>
                </motion.button>

                <div className="w-px h-14 bg-white/20" />

                {/* Submit */}
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={handleSubmit}
                  title="Submit video"
                  className="flex flex-col items-center gap-2 text-white hover:text-green-400 transition-colors group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="p-3 bg-white/10 rounded-full group-hover:bg-green-500/20 transition-all border border-white/20 group-hover:border-green-400/40"
                  >
                    <SnapIcon icon={Check} size={24} />
                  </motion.div>
                  <span className="text-[9px] font-black uppercase tracking-wider">Submit</span>
                </motion.button>
              </div>
            )}

            {recordingState === "uploading" && (
              <motion.div 
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-16 w-16 border-[4px] border-white/20 border-t-white/80 rounded-full" 
                />
                <span className="text-xs font-black text-white/80 tracking-widest uppercase animate-pulse">Processing...</span>
              </motion.div>
            )}
          </div>

          {/* RIGHT: Placeholder (for symmetry) */}
          {recordingState === "idle" && <div className="w-14" />}
          {recordingState === "preview" && <div className="w-14" />}
        </div>
      </div>
    </div>
  );
};

export default Record;
