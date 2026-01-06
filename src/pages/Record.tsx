import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, type AIFilter } from "@/lib/filters";
import { SocialShare } from "@/components/SocialShare";
import {
  ArrowLeft,
  Video,
  Camera,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Check,
  Sparkles,
} from "lucide-react";

type RecordingState = "idle" | "recording" | "preview" | "uploading" | "done";

const Record = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<AIFilter | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access to record.",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera();
    }

    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);

    // Start recording
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current!, {
      mimeType: "video/webm;codecs=vp9",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setRecordingState("preview");

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecordingState("recording");
    setRecordingTime(0);

    // Timer
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordingState("idle");
    setRecordingTime(0);
    startCamera();
  };

  const togglePlayback = () => {
    if (previewRef.current) {
      if (isPlaying) {
        previewRef.current.pause();
      } else {
        previewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async () => {
    if (!recordedBlob || !selectedFilter || !user) return;

    setRecordingState("uploading");

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;

      // Upload video
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, recordedBlob, {
          contentType: "video/webm",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

      // Create video record
      const { error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: videoTitle || `My ${selectedFilter.shortName} Declaration`,
        description: videoDescription,
        filter_id: selectedFilter.id,
        video_url: urlData.publicUrl,
        is_submitted: true,
        duration_seconds: recordingTime,
      });

      if (dbError) throw dbError;

      setUploadedVideoUrl(urlData.publicUrl);
      setRecordingState("done");
      toast({
        title: "Video submitted!",
        description: "Your declaration has been submitted for approval.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setRecordingState("preview");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="font-display font-bold">Record Declaration</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Filter */}
          {!selectedFilter && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold mb-2">
                  Choose Your AI Identity
                </h2>
                <p className="text-muted-foreground">
                  Select the filter that best represents your AI journey
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {AI_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setSelectedFilter(filter);
                      startCamera();
                    }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-lg"
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                      style={{ backgroundColor: getFilterColor(filter.id) }}
                    />
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: getFilterColor(filter.id) }}
                      >
                        <filter.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{filter.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {filter.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Record Video */}
          {selectedFilter && recordingState !== "done" && (
            <motion.div
              key="recorder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Selected filter badge */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div
                  className="px-4 py-2 rounded-full text-white text-sm font-medium flex items-center gap-2"
                  style={{ backgroundColor: getFilterColor(selectedFilter.id) }}
                >
                  <selectedFilter.icon className="h-4 w-4" />
                  {selectedFilter.shortName}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFilter(null);
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach((track) => track.stop());
                    }
                  }}
                >
                  Change
                </Button>
              </div>

              {/* Video container */}
              <div className="relative aspect-[9/16] sm:aspect-video max-h-[60vh] mx-auto rounded-3xl overflow-hidden bg-black">
                {/* Live camera or preview */}
                {recordingState === "preview" && recordedBlob ? (
                  <video
                    ref={previewRef}
                    src={URL.createObjectURL(recordedBlob)}
                    className="w-full h-full object-cover"
                    playsInline
                    onEnded={() => setIsPlaying(false)}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}

                {/* Filter overlay */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${getFilterColor(
                      selectedFilter.id
                    )} 0%, transparent 100%)`,
                  }}
                />

                {/* Filter badge overlay */}
                <div className="absolute top-4 left-4">
                  <div
                    className="px-3 py-1.5 rounded-full text-white text-sm font-medium flex items-center gap-2"
                    style={{ backgroundColor: getFilterColor(selectedFilter.id) }}
                  >
                    <selectedFilter.icon className="h-4 w-4" />
                    {selectedFilter.name}
                  </div>
                </div>

                {/* Caption prompt */}
                <div className="absolute bottom-20 left-4 right-4 text-center">
                  <p className="text-white text-lg font-medium drop-shadow-lg">
                    "{selectedFilter.captionPrompt}"
                  </p>
                </div>

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-white text-8xl font-bold">{countdown}</span>
                  </div>
                )}

                {/* Recording indicator */}
                {recordingState === "recording" && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                {recordingState === "idle" && (
                  <Button
                    size="lg"
                    onClick={startRecording}
                    className="gap-2 rounded-full px-8"
                  >
                    <Camera className="h-5 w-5" />
                    Start Recording
                  </Button>
                )}

                {recordingState === "recording" && (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="gap-2 rounded-full px-8"
                  >
                    <Square className="h-5 w-5" />
                    Stop Recording
                  </Button>
                )}

                {recordingState === "preview" && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={resetRecording}
                      className="gap-2"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Re-record
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={togglePlayback}
                      className="gap-2"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                  </>
                )}
              </div>

              {/* Submit form */}
              {recordingState === "preview" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Video Title (optional)
                    </label>
                    <Input
                      placeholder={`My ${selectedFilter.shortName} Declaration`}
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description (optional)
                    </label>
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    className="w-full gap-2"
                  >
                    <Upload className="h-5 w-5" />
                    Submit for Voting
                  </Button>
                </motion.div>
              )}

              {recordingState === "uploading" && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="ml-3 text-muted-foreground">Uploading...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Success */}
          {recordingState === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Declaration Submitted!
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your video is being reviewed and will appear in the gallery soon.
                Share it with your network to get more votes!
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link to="/dashboard">
                    <Video className="h-4 w-4 mr-2" />
                    My Videos
                  </Link>
                </Button>
                <SocialShare
                  videoUrl={uploadedVideoUrl}
                  videoTitle={videoTitle || `My ${selectedFilter?.shortName} Declaration`}
                  filterName={selectedFilter?.name}
                  variant="default"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Record;
