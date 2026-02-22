import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Check, ArrowLeft } from "lucide-react";
import { AI_FILTERS, AIFilter } from "@/lib/filters";
import { getLensConfig, CanvasVideoRecorder } from "@/lib/canvas-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={() => navigate(-1)} className="text-white hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-8 h-8" />
        </button>
        
        {recordingState === "recording" && (
          <div className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            {formatTime(duration)}
          </div>
        )}
        
        <div className="w-8" />
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative">
        {recordingState !== "preview" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover mirror"
            style={{ transform: "scaleX(-1)" }}
          />
        ) : (
          previewUrl && (
            <video
              ref={previewVideoRef}
              src={previewUrl}
              autoPlay
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )
        )}

        {/* Real-time Visual Filter Overlay (Only for UI feedback while recording/idle) */}
        {selectedFilter && recordingState !== "preview" && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-56 pointer-events-none z-10">
            <p className="text-white/90 text-xl font-bold tracking-[0.2em] uppercase drop-shadow-lg mb-2">
              {getLensConfig(selectedFilter).line1}
            </p>
            <p
              className="text-5xl font-serif font-bold text-center leading-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] px-6"
              style={{ color: getLensConfig(selectedFilter).color }}
            >
              {getLensConfig(selectedFilter).line2.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </p>
            {getLensConfig(selectedFilter).tagline && (
              <p className="text-white/70 text-sm font-bold mt-4 tracking-wider uppercase">
                {getLensConfig(selectedFilter).tagline}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Area (Snapchat Style) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-10 pt-20 bg-gradient-to-t from-black/80 to-transparent">
        
        {/* Filter Carousel */}
        {recordingState === "idle" && (
          <div className="relative mb-6">
            <div
              ref={filterScrollRef}
              className="flex overflow-x-auto gap-5 no-scrollbar px-[calc(50%-44px)] items-center snap-x snap-mandatory"
              style={{ scrollBehavior: "smooth" }}
            >
              {AI_FILTERS.map((filter) => {
                const cfg = getLensConfig(filter);
                const isSelected = selectedFilter.id === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 snap-center ${
                      isSelected ? "scale-110" : "scale-75 opacity-50"
                    }`}
                  >
                    <div
                      className={`rounded-full border-[3px] flex items-center justify-center transition-all ${
                        isSelected ? "w-20 h-20 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "w-16 h-16 border-white/30"
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${cfg.color}44` : "rgba(255,255,255,0.1)",
                        borderColor: isSelected ? "#fff" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      <filter.icon
                        className={isSelected ? "w-10 h-10" : "w-8 h-8"}
                        style={{ color: isSelected ? cfg.color : "#fff" }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${isSelected ? "text-white" : "text-white/40"}`}>
                      {filter.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Record Button / Actions */}
        <div className="flex justify-center items-center h-24">
          {recordingState === "idle" && (
            <button
              onClick={startRecording}
              className="group relative w-20 h-20 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full border-[6px] border-white/40 group-active:scale-110 transition-transform" />
              <div className="w-16 h-16 rounded-full bg-white shadow-xl group-active:scale-90 transition-transform" />
            </button>
          )}

          {recordingState === "recording" && (
            <button
              onClick={stopRecording}
              className="relative w-24 h-24 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full border-[6px] border-red-500 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full border-[6px] border-red-500" />
              <div className="w-10 h-10 rounded-lg bg-red-500 shadow-xl" />
            </button>
          )}

          {recordingState === "preview" && (
            <div className="flex items-center gap-8 bg-black/40 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/20 shadow-2xl">
              <button 
                onClick={resetRecording} 
                className="flex flex-col items-center gap-1 text-white hover:text-red-400 transition-colors"
              >
                <RotateCcw className="w-7 h-7" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Retake</span>
              </button>
              <div className="w-px h-10 bg-white/20" />
              <button 
                onClick={handleSubmit} 
                className="flex flex-col items-center gap-1 text-white hover:text-green-400 transition-colors"
              >
                <Check className="w-8 h-8" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Submit</span>
              </button>
            </div>
          )}

          {recordingState === "uploading" && (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-xs font-bold text-white tracking-widest uppercase animate-pulse">Uploading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Record;
