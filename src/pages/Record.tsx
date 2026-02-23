import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Check, ArrowLeft, Zap, Sparkles, Camera, Video, Share2 } from "lucide-react";
import { AI_FILTERS, AIFilter } from "@/lib/filters";
import { getLensConfig, CanvasVideoRecorder } from "@/lib/canvas-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type RecordingState = "idle" | "recording" | "preview" | "uploading";

const Record = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<AIFilter>(AI_FILTERS[0]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
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

  const startRecording = () => {
    if (!streamRef.current || !selectedFilter) return;
    
    const recorder = new CanvasVideoRecorder(streamRef.current, selectedFilter);
    canvasRecorderRef.current = recorder;
    recorder.start();
    
    setRecordingState("recording");
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
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

      toast({ title: "Video submitted!", description: "Your declaration has been submitted for review." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setRecordingState("preview");
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button onClick={() => navigate(-1)} className="text-white hover:opacity-70 transition-opacity p-2 bg-black/20 rounded-full backdrop-blur-md border border-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        {recordingState === "recording" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-sm font-black shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-400/50"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            {formatTime(duration)}
          </motion.div>
        )}
        
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative">
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

        {/* Real-time Visual AR Filter Overlay */}
        <AnimatePresence>
          {selectedFilter && recordingState !== "preview" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex flex-col items-center justify-center pb-32 pointer-events-none z-20"
            >
              <div className="bg-black/10 backdrop-blur-[2px] p-8 rounded-[3rem] border border-white/5 flex flex-col items-center">
                <p className="text-white/80 text-lg font-black tracking-[0.3em] uppercase drop-shadow-2xl mb-4">
                  {getLensConfig(selectedFilter).line1}
                </p>
                <h2
                  className="text-6xl font-display font-black text-center leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-8"
                  style={{ color: getLensConfig(selectedFilter).color }}
                >
                  {getLensConfig(selectedFilter).line2.split('\n').map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </h2>
                {getLensConfig(selectedFilter).tagline && (
                  <div className="mt-8 flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-white text-[10px] font-black tracking-widest uppercase">
                      {getLensConfig(selectedFilter).tagline}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom UI - Snapchat Style Carousel */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-12 pt-24 bg-gradient-to-t from-black via-black/60 to-transparent">
        
        {/* Filter Carousel */}
        {recordingState === "idle" && (
          <div className="relative mb-10">
            <div
              ref={filterScrollRef}
              className="flex overflow-x-auto gap-6 no-scrollbar px-[calc(50%-44px)] items-center snap-x snap-mandatory py-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {AI_FILTERS.map((filter) => {
                const cfg = getLensConfig(filter);
                const isSelected = selectedFilter.id === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex-shrink-0 flex flex-col items-center gap-3 transition-all duration-500 snap-center ${
                      isSelected ? "scale-125 z-10" : "scale-90 opacity-40 grayscale"
                    }`}
                  >
                    <div
                      className={`rounded-full border-[4px] flex items-center justify-center transition-all duration-500 ${
                        isSelected ? "w-22 h-22 border-white shadow-[0_0_30px_rgba(255,255,255,0.6)]" : "w-16 h-16 border-white/20"
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${cfg.color}33` : "rgba(255,255,255,0.05)",
                        borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.2)",
                      }}
                    >
                      <filter.icon
                        className={isSelected ? "w-11 h-11" : "w-8 h-8"}
                        style={{ color: isSelected ? cfg.color : "#fff" }}
                      />
                    </div>
                    <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${isSelected ? "text-white" : "text-white/30"}`}>
                      {filter.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-center items-center h-28 px-10">
          <div className="flex-1 flex justify-center">
             {recordingState === "idle" && (
               <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                 <Camera className="w-6 h-6" />
               </button>
             )}
          </div>

          <div className="flex-shrink-0 mx-8">
            {recordingState === "idle" && (
              <button
                onClick={startRecording}
                className="group relative w-24 h-24 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full border-[8px] border-white/30 group-active:scale-110 transition-transform duration-300" />
                <div className="w-20 h-20 rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.4)] group-active:scale-90 transition-transform duration-300" />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-[10px] font-black text-white px-3 py-1 rounded-full whitespace-nowrap animate-bounce shadow-lg">
                  HOLD TO RECORD
                </div>
              </button>
            )}

            {recordingState === "recording" && (
              <button
                onClick={stopRecording}
                className="relative w-28 h-28 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-full border-[8px] border-red-600 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-full border-[8px] border-red-600" />
                <div className="w-12 h-12 rounded-2xl bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.5)]" />
              </button>
            )}

            {recordingState === "preview" && (
              <div className="flex items-center gap-10 bg-white/10 backdrop-blur-3xl px-10 py-5 rounded-[2.5rem] border border-white/20 shadow-2xl">
                <button 
                  onClick={resetRecording} 
                  className="flex flex-col items-center gap-2 text-white hover:text-red-400 transition-colors group"
                >
                  <div className="p-3 bg-white/10 rounded-full group-hover:bg-red-400/20 transition-colors">
                    <RotateCcw className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Retake</span>
                </button>
                <div className="w-px h-12 bg-white/20" />
                <button 
                  onClick={handleSubmit} 
                  className="flex flex-col items-center gap-2 text-white hover:text-green-400 transition-colors group"
                >
                  <div className="p-3 bg-white/10 rounded-full group-hover:bg-green-400/20 transition-colors">
                    <Check className="w-10 h-10" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Submit</span>
                </button>
              </div>
            )}

            {recordingState === "uploading" && (
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-[4px] border-white/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs font-black text-white tracking-[0.3em] uppercase animate-pulse">Processing...</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-center">
            {recordingState === "idle" && (
               <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                 <Share2 className="w-6 h-6" />
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record;
