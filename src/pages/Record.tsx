import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Square, RotateCcw, Check, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_FILTERS, AIFilter } from "@/lib/filters";
import { getLensConfig } from "@/lib/canvas-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecordingState = "idle" | "recording" | "preview" | "uploading";

const Record = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<AIFilter | null>(AI_FILTERS[0]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1080, height: 1920 },
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
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setRecordingState("preview");
    };
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setRecordingState("recording");
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
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
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between p-4">
        <button onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        {recordingState === "recording" && (
          <div className="flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {formatTime(duration)}
          </div>
        )}
        <div className="w-6" />
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
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

        {/* Filter overlay text */}
        {selectedFilter && recordingState !== "preview" && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-40 pointer-events-none">
            <p className="text-white/80 text-lg font-bold tracking-widest uppercase">
              {getLensConfig(selectedFilter).line1}
            </p>
            <p
              className="text-3xl font-display font-bold text-center leading-tight"
              style={{ color: getLensConfig(selectedFilter).color }}
            >
              {getLensConfig(selectedFilter).line2}
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center justify-center space-y-6 pb-4">
        {recordingState === "idle" && (
          <div className="w-full flex justify-center">
            <div
              ref={filterScrollRef}
              className="flex overflow-x-auto gap-4 no-scrollbar px-6 items-center justify-center snap-x snap-mandatory"
              style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
            >
              <div className="w-12 flex-shrink-0" />
              {AI_FILTERS.map((filter) => {
                const cfg = getLensConfig(filter);
                const isSelected = selectedFilter?.id === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 snap-center ${
                      isSelected ? "scale-100" : "scale-75 opacity-40"
                    }`}
                  >
                    <div
                      className={`rounded-full border-4 flex items-center justify-center transition-all ${
                        isSelected ? "w-20 h-20 border-white shadow-2xl" : "w-14 h-14 border-white/20"
                      }`}
                      style={{
                        backgroundColor: `${cfg.color}33`,
                        borderColor: isSelected ? "#fff" : `${cfg.color}44`,
                      }}
                    >
                      <filter.icon
                        className={isSelected ? "w-10 h-10" : "w-6 h-6"}
                        style={{ color: cfg.color }}
                      />
                    </div>
                    <span
                      className={`font-bold tracking-wide text-center leading-tight ${
                        isSelected ? "text-xs" : "text-[8px]"
                      }`}
                      style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.4)" }}
                    >
                      {filter.shortName}
                    </span>
                  </button>
                );
              })}
              <div className="w-12 flex-shrink-0" />
            </div>
          </div>
        )}

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
              <Button variant="ghost" onClick={resetRecording} className="text-white gap-2">
                <RotateCcw className="w-5 h-5" /> Retake
              </Button>
              <Button onClick={handleSubmit} className="bg-white text-black hover:bg-white/90 gap-2">
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
  );
};

export default Record;
