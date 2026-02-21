import { useState, useRef, useEffect } from "react";
import { VideoRecorder, VideoRecorderOptions } from '@capacitor-community/video-recorder';
import { Share } from '@capacitor/share';
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, type AIFilter } from "@/lib/filters";
import {
  ArrowLeft,
  Video,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  Info
} from "lucide-react";

type RecordingState = "idle" | "recording" | "preview" | "uploading" | "done";

const Record = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<AIFilter | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoFileRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const filterId = searchParams.get("filter");
    if (filterId) {
      const filter = AI_FILTERS.find(f => f.id === filterId);
      if (filter) setSelectedFilter(filter);
    } else {
      setSelectedFilter(AI_FILTERS[0]);
    }
    startCamera();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [searchParams]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", aspectRatio: 9/16 },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use filters.",
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

    try {
      const options: VideoRecorderOptions = {
        quality: 'HIGH',
        duration: 60,
        camera: 'FRONT',
      };
      const { videoFilePath } = await VideoRecorder.startRecording(options);
      videoFileRef.current = videoFilePath;
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
    } catch (error) {
      setRecordingState("idle");
    }
  };

  const stopRecording = async () => {
    try {
      const { videoFilePath } = await VideoRecorder.stopRecording();
      if (videoFilePath) {
        const response = await fetch(videoFilePath);
        const blob = await response.blob();
        setRecordedBlob(blob);
        setRecordingState("preview");
      }
    } catch (error) {
      toast({ title: "Recording failed", variant: "destructive" });
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSubmit = async () => {
    if (!recordedBlob || !selectedFilter || !user) return;
    setRecordingState("uploading");
    try {
      const fileName = `${user.id}/${Date.now()}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, recordedBlob, { contentType: "video/mp4" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(fileName);
      await supabase.from("videos").insert({
        user_id: user.id,
        title: videoTitle || `My ${selectedFilter.name} Declaration`,
        filter_id: selectedFilter.id,
        video_url: urlData.publicUrl,
        is_submitted: true,
        duration_seconds: recordingTime,
      });

      setUploadedVideoUrl(urlData.publicUrl);
      setRecordingState("done");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setRecordingState("preview");
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* Full Screen Camera View */}
      <div className="relative flex-1 bg-neutral-900">
        {recordingState !== "preview" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <video
            ref={previewRef}
            src={recordedBlob ? URL.createObjectURL(recordedBlob) : ""}
            loop
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Dynamic Filter Overlay */}
        <AnimatePresence>
          {selectedFilter && recordingState !== "preview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: getFilterColor(selectedFilter.id) }}
            />
          )}
        </AnimatePresence>

        {/* UI Overlays */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
          <div className="flex justify-between items-start">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-white bg-black/20 backdrop-blur-md rounded-full">
              <ArrowLeft />
            </Button>
            {recordingState === "recording" && (
              <div className="bg-red-500 text-white px-4 py-1 rounded-full font-mono flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </div>
            )}
          </div>

          {countdown !== null && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-display font-bold text-white drop-shadow-lg">{countdown}</span>
            </motion.div>
          )}

          {/* Bottom Controls */}
          <div className="space-y-6">
            {recordingState === "idle" && (
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar px-10">
                {AI_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter)}
                    className={`flex-shrink-0 w-16 h-16 rounded-full border-4 transition-all ${selectedFilter?.id === filter.id ? "border-white scale-110 shadow-lg" : "border-white/30 scale-90"}`}
                    style={{ backgroundColor: getFilterColor(filter.id) }}
                  >
                    <filter.icon className="w-8 h-8 m-auto text-white" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-center items-center gap-8">
              {recordingState === "idle" && (
                <button onClick={startRecording} className="w-20 h-20 rounded-full border-4 border-white p-1">
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
              )}
              {recordingState === "recording" && (
                <button onClick={stopRecording} className="w-20 h-20 rounded-full border-4 border-white p-1">
                  <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                    <Square className="text-white fill-white" />
                  </div>
                </button>
              )}
              {recordingState === "preview" && (
                <div className="flex gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-3xl w-full max-w-sm border border-white/20">
                  <Button variant="ghost" onClick={resetRecording} className="text-white gap-2 flex-1"><RotateCcw /> Retake</Button>
                  <Button onClick={handleSubmit} className="bg-white text-black hover:bg-white/90 gap-2 flex-1"><Check /> Submit</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {recordingState === "done" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-card w-full max-w-md rounded-3xl p-8 text-center border border-border shadow-2xl">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="text-white w-10 h-10" /></div>
              <h2 className="text-2xl font-display font-bold mb-2">Declaration Live!</h2>
              <p className="text-muted-foreground mb-8">Your identity is now part of the global movement. Share your voice to inspire others.</p>
              <div className="space-y-3">
                <Button className="w-full h-12 gap-2" onClick={() => Share.share({ title: "My AI Ready Declaration", url: uploadedVideoUrl })}><Sparkles /> Share to Network</Button>
                <Button variant="outline" className="w-full h-12" asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Record;
