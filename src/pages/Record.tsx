import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RotateCcw, Check, ArrowLeft, Zap, Sparkles, Camera, Share2, Volume2, Mic, ZoomIn, ZoomOut } from "lucide-react";
import { AI_FILTERS, AIFilter } from "@/lib/filters";
import { getLensConfig } from "@/lib/canvas-recorder";
import { CanvasCamera } from "@/lib/canvas-camera";
import { usePinchZoom } from "@/hooks/usePinchZoom";
import { awardCredits, CREDIT_COSTS } from "@/lib/credits";
import { moderateVideo, moderateLocally, pollModerationStatus } from "@/lib/moderation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StickerMetadata, DEFAULT_STICKERS } from "@/lib/sticker-system";
import { LensLaunchData, encodeLaunchData } from "@/lib/lens-parameters";
import { shareToSnapchatCreativeKit } from "@/lib/snapchat-creative-kit";

// Snapchat-style icon wrapper component
const SnapIcon = ({ icon: Icon, size = 24, color = "white", filled = false }: { icon: any; size?: number; color?: string; filled?: boolean }) => (
  <Icon 
    size={size} 
    strokeWidth={filled ? 0 : 3} 
    style={{ color }} 
    className={filled ? "fill-current" : ""}
  />
);

type RecordingState = "idle" | "recording" | "edit" | "preview" | "uploading" | "moderating";

// Text-to-speech helper
const synthesizeDeclaration = async (filterName: string, onComplete?: () => void): Promise<Blob | null> => {
  try {
    const text = `I am ${filterName}. I am committed to responsible AI leadership and declare my readiness to shape the future of AI.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = onComplete;
    
    window.speechSynthesis.speak(utterance);
    
    return null;
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
};


const Record = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const defaultFilterId = searchParams.get("filter") || AI_FILTERS[0].id;
  const initialFilter = AI_FILTERS.find((filter) => filter.id === defaultFilterId) || AI_FILTERS[0];
  const [selectedFilter, setSelectedFilter] = useState<AIFilter>(initialFilter);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [titleText, setTitleText] = useState<string>(`${initialFilter.shortName} Declaration`);
  const [descriptionText, setDescriptionText] = useState<string>(initialFilter.description);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [durationWarning, setDurationWarning] = useState(false);
  const [sticker, setSticker] = useState<StickerMetadata>(DEFAULT_STICKERS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const { zoom, setZoom, onTouchStart, onTouchMove, onTouchEnd, isPinching } = usePinchZoom({ initialZoom: 1, minZoom: 1, maxZoom: 5 });
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [captureMode, setCaptureMode] = useState<'video' | 'photo'>('video');
  const [engineReady, setEngineReady] = useState(false);

  const MAX_DURATION = 60; // Snapchat 60-second limit

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRecorderRef = useRef<CanvasCamera | null>(null);
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

  // Update recorder when filter changes
  useEffect(() => {
    if (streamRef.current && recordingState === "idle") {
      setupRecorder();
    }
  }, [selectedFilter, facingMode, sticker]);

  // Update zoom on recorder
  useEffect(() => {
    if (canvasRecorderRef.current) {
      canvasRecorderRef.current.setZoom(zoom, zoomOffset.x, zoomOffset.y);
    }
  }, [zoom, zoomOffset]);

  const setupRecorder = () => {
    if (!streamRef.current) return;
    
    // Cleanup old recorder
    if (canvasRecorderRef.current) {
      canvasRecorderRef.current.cleanup();
    }
    
    // Create new recorder with the active sticker overlay
    const recorder = new CanvasVideoRecorder(streamRef.current, selectedFilter, facingMode, sticker.visible ? sticker : null);
    canvasRecorderRef.current = recorder;
    
    // Start preview loop
    if (canvasRef.current) {
      recorder.startPreview(canvasRef.current);
    }
  };

  const startCamera = async () => {
    try {
      // Request camera permissions on Android 6.0+
      try {
        const { Camera } = await import('@capacitor/camera');
        await Camera.requestPermissions({ permissions: ['camera'] });
      } catch (e) {
        console.warn('Capacitor camera permission check skipped:', e);
      }

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
      
      // Setup the canvas-based recorder/previewer
      setupRecorder();
      
    } catch (err) {
      console.error('Camera error:', err);
      const errorMessage = (err as any)?.message || '';
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast({ 
          title: "Camera permission denied", 
          description: "Please allow camera access in your device settings to record videos.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Camera access denied", 
          description: "Please allow camera access to record. Check your device settings.", 
          variant: "destructive" 
        });
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    canvasRecorderRef.current?.cleanup();
  };

  const createVideoThumbnail = async (blob: Blob): Promise<string | null> => {
    try {
      const tempVideo = document.createElement("video");
      tempVideo.src = URL.createObjectURL(blob);
      tempVideo.muted = true;
      tempVideo.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        tempVideo.addEventListener("loadedmetadata", () => {
          tempVideo.currentTime = Math.min(0.5, tempVideo.duration / 2);
        });
        tempVideo.addEventListener("seeked", () => resolve());
        tempVideo.addEventListener("error", () => reject(new Error("Thumbnail capture failed")));
      });

      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 1200;
      thumbCanvas.height = 630;
      const thumbCtx = thumbCanvas.getContext("2d");
      if (!thumbCtx) return null;

      thumbCtx.fillStyle = "#111827";
      thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
      thumbCtx.drawImage(tempVideo, 0, 0, thumbCanvas.width, thumbCanvas.height);
      thumbCtx.fillStyle = "rgba(0,0,0,0.36)";
      thumbCtx.fillRect(0, thumbCanvas.height - 140, thumbCanvas.width, 140);
      thumbCtx.fillStyle = "white";
      thumbCtx.font = "bold 42px Inter, sans-serif";
      thumbCtx.fillText(titleText, 40, thumbCanvas.height - 70);

      const dataUrl = thumbCanvas.toDataURL("image/png");
      URL.revokeObjectURL(tempVideo.src);
      return dataUrl;
    } catch (error) {
      console.warn("Thumbnail generation failed:", error);
      return null;
    }
  };

  const toggleCamera = async () => {
    stopCamera();
    setFacingMode(facingMode === "user" ? "environment" : "user");
    setTimeout(startCamera, 300);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5.0, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(1.0, prev - 0.5));
  };

  const resetZoom = () => {
    setZoom(1.0);
    setZoomOffset({ x: 0, y: 0 });
  };

  // Pinch gesture handlers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      setInitialDistance(getTouchDistance(e.touches));
      setInitialZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches);
      if (initialDistance > 0) {
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(1.0, Math.min(5.0, initialZoom * scale));
        setZoom(newZoom);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
    setInitialDistance(0);
  };

  const startRecording = () => {
    if (!canvasRecorderRef.current) return;
    
    canvasRecorderRef.current.start();
    
    setRecordingState("recording");
    setDuration(0);
    setDurationWarning(false);
    
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const newDuration = d + 1;
        if (newDuration >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
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
    setRecordingState("edit");

    const thumbnail = await createVideoThumbnail(blob);
    if (thumbnail) {
      setThumbnailUrl(thumbnail);
    }
    
    // Don't cleanup yet, we might need the preview
  };

  const capturePhoto = () => {
    const photoDataUrl = canvasRecorderRef.current?.capturePhoto() || canvasRef.current?.toDataURL("image/jpeg", 0.95);
    if (!photoDataUrl) return;

    setCapturedPhoto(photoDataUrl);
    setRecordingState("edit");
    setThumbnailUrl(photoDataUrl);
  };

  const resetRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setCapturedPhoto(null);
    setPreviewUrl(null);
    setThumbnailUrl(null);
    setRecordingState("idle");
    setDuration(0);
    // Restart preview
    setupRecorder();
  };

  const handleSubmit = async () => {
    if ((!recordedBlob && !capturedPhoto) || !selectedFilter) return;
    setRecordingState("uploading");
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", description: "Please sign in to submit your content.", variant: "destructive" });
        navigate("/auth");
        return;
      }

      let mediaUrl: string;
      let thumbnailPublicUrl: string | null = null;
      let mediaType: 'video' | 'photo' = recordedBlob ? 'video' : 'photo';

      if (recordedBlob) {
        // Handle video upload
        const fileName = `${user.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage.from("videos").upload(fileName, recordedBlob);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(fileName);
        mediaUrl = publicUrl;

        // Create and upload thumbnail
        if (thumbnailUrl) {
          try {
            const thumbBlob = await fetch(thumbnailUrl).then((res) => res.blob());
            const thumbPath = `${user.id}/${Date.now()}-thumb.png`;
            const { error: thumbError } = await supabase.storage.from("videos").upload(thumbPath, thumbBlob, {
              contentType: "image/png",
            });
            if (!thumbError) {
              const { data: { publicUrl: thumbUrl } } = supabase.storage.from("videos").getPublicUrl(thumbPath);
              thumbnailPublicUrl = thumbUrl || null;
            }
          } catch (thumbError) {
            console.warn("Thumbnail upload failed", thumbError);
          }
        }
      } else if (capturedPhoto) {
        // Handle photo upload
        const photoBlob = await fetch(capturedPhoto).then(res => res.blob());
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("videos").upload(fileName, photoBlob, {
          contentType: "image/jpeg",
        });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(fileName);
        mediaUrl = publicUrl;
        thumbnailPublicUrl = mediaUrl; // Photo is its own thumbnail
      } else {
        throw new Error("No media to upload");
      }

      const { data: videoData, error: insertError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: titleText || `${selectedFilter.shortName} Declaration`,
        description: descriptionText || null,
        video_url: mediaUrl,
        thumbnail_url: thumbnailPublicUrl,
        filter_id: selectedFilter.id,
        duration_seconds: recordedBlob ? duration : null,
        is_submitted: true,
      }).select().single();

      if (insertError) throw insertError;

      setRecordingState("moderating");
      
      let moderationResult;
      try {
        moderationResult = await moderateVideo(videoData.id);
      } catch (err) {
        moderationResult = moderateLocally(videoData.title);
      }

      if (moderationResult.status === "flagged") {
        await supabase.from("videos").update({
          is_approved: false,
          description: moderationResult.reason || "Content policy violation"
        }).eq("id", videoData.id);

        toast({ 
          title: "Content Review", 
          description: moderationResult.reason || "Your content has been flagged for review.",
          variant: "destructive" 
        });
      } else {
        await supabase.from("videos").update({
          is_approved: true
        }).eq("id", videoData.id);

        toast({ 
          title: mediaType === 'video' ? "Video approved!" : "Photo approved!", 
          description: "Your declaration has been approved and is now live!" 
        });
      }

      try {
        await awardCredits(user.id, CREDIT_COSTS.DECLARATION_COMPLETION, 'Completed declaration');
      } catch (creditErr) {
        console.warn('Could not award credits:', creditErr);
      }

      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setRecordingState("preview");
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = async () => {
    if ((!recordedBlob && !capturedPhoto) || !selectedFilter) return;
    
    try {
      if (recordedBlob) {
        const file = new File([recordedBlob], `${selectedFilter.shortName}-declaration.webm`, { type: "video/webm" });
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'My AI Declaration',
            text: `I just declared my AI readiness as ${selectedFilter.shortName}! #IAmAIReady #DSCConsortium`,
          });
        } else {
          const url = URL.createObjectURL(recordedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedFilter.shortName}-declaration.webm`;
          a.click();
        }
      } else if (capturedPhoto) {
        const photoBlob = await fetch(capturedPhoto).then(res => res.blob());
        const file = new File([photoBlob], `${selectedFilter.shortName}-declaration.jpg`, { type: "image/jpeg" });
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'My AI Declaration',
            text: `I just declared my AI readiness as ${selectedFilter.shortName}! #IAmAIReady #DSCConsortium`,
          });
        } else {
          const a = document.createElement('a');
          a.href = capturedPhoto;
          a.download = `${selectedFilter.shortName}-declaration.jpg`;
          a.click();
        }
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleShareToSnapchat = async () => {
    if ((!recordedBlob && !capturedPhoto) || !selectedFilter) return;

    const payload: LensLaunchData = {
      lensId: selectedFilter.id,
      filterId: selectedFilter.id,
      filterName: selectedFilter.shortName,
      themeColor: getLensConfig(selectedFilter).color,
      caption: `I declare ${selectedFilter.shortName} as my AI readiness filter.`,
      sticker: sticker.visible ? sticker : undefined,
      timestamp: Date.now(),
    };

    const launchData = encodeLaunchData(payload);
    await shareToSnapchatCreativeKit({ caption: payload.caption, launchData });
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col font-sans">
      {/* ── Edit Step Overlay ── */}
      {recordingState === "edit" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
            <h2 className="text-white text-xl font-black mb-4 text-center">Edit Your Declaration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Enter video title..."
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {thumbnailUrl && (
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Thumbnail Preview</label>
                  <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full rounded-xl border border-white/20"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setRecordingState("preview")}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                variant="outline"
              >
                Skip Edit
              </Button>
              <Button
                onClick={() => setRecordingState("preview")}
                className="flex-1 bg-white text-black hover:bg-white/90"
              >
                Continue
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      <div className="absolute inset-0 z-0">
        {recordingState === "preview" ? (
          recordedBlob ? (
            <video
              ref={previewVideoRef}
              src={previewUrl!}
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
            />
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
          ) : null
        ) : (
          <canvas 
            ref={canvasRef}
            className="w-full h-full object-cover"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }} // Prevent default touch behaviors
          />
        )}
        
        {/* Mirror effect overlay for preview (front camera only) */}
        {facingMode === "user" && recordingState === "idle" && (
          <div className="absolute inset-0 pointer-events-none" />
        )}
      </div>

      {/* ── UI Layer ── */}
      <div className="relative z-10 flex flex-col h-full justify-between p-6">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-start pt-safe">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white"
          >
            <ArrowLeft size={24} />
          </motion.button>

          <div className="flex flex-col items-end gap-3">
            <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${recordingState === "recording" ? "bg-red-500 animate-pulse" : "bg-white/40"}`} />
              <span className="text-white font-black text-[10px] tracking-widest uppercase">
                {recordingState === "recording" ? `REC ${duration}s` : "READY"}
              </span>
              {recordingState === "idle" && (
                <Badge variant="secondary" className="ml-2 bg-filter-ready text-white border-none animate-pulse">
                  BETA
                </Badge>
              )}
            </div>
            
            {recordingState === "idle" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2"
              >
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white">
                  <Zap size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white">
                  <Sparkles size={20} />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white">
                  <Mic size={20} />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="pb-safe-offset-4 flex flex-col gap-8">
          
          {/* Filter Carousel */}
          {recordingState === "idle" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div 
                ref={filterScrollRef}
                className="flex gap-4 overflow-x-auto no-scrollbar px-[40%] snap-x snap-mandatory h-24 items-center"
              >
                {AI_FILTERS.map((filter) => {
                  const isSelected = selectedFilter.id === filter.id;
                  return (
                    <motion.button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter)}
                      whileTap={{ scale: 0.9 }}
                      className={`flex-shrink-0 flex flex-col items-center gap-2 snap-center transition-all duration-300 ${
                        isSelected ? "scale-110" : "scale-90 opacity-40 blur-[1px]"
                      }`}
                    >
                      {/* Icon Circle */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isSelected 
                          ? "bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.4)]" 
                          : "bg-black/40 border-white/30"
                      }`}>
                        <filter.icon 
                          size={24} 
                          className={isSelected ? "text-black" : "text-white"} 
                        />
                      </div>
                      
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

              <div className="mt-4 rounded-3xl border border-white/10 bg-black/40 p-4">
<div className="flex flex-col gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">Zoom & Sticker Controls</p>
                    <p className="text-[10px] text-white/60">Zoom: {zoom.toFixed(1)}x • Pinch to zoom on mobile</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 1.0}
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetZoom}
                      aria-label="Reset zoom to 1x"
                    >
                      1x
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 5.0}
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.1}
                      value={zoom}
                      aria-label="Zoom level"
                      aria-valuemin={1}
                      aria-valuemax={5}
                      aria-valuenow={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {DEFAULT_STICKERS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSticker({ ...option, visible: true })}
                      className={`flex h-16 w-16 items-center justify-center rounded-3xl border transition-all duration-200 ${
                        sticker.id === option.id ? "border-white bg-white/20" : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 text-white/80 text-[11px]">
                  <button
                    onClick={() => setSticker((prev) => ({ ...prev, posY: Math.max(0.05, prev.posY - 0.05) }))}
                    className="rounded-2xl bg-white/10 py-2"
                  >Up</button>
                  <button
                    onClick={() => setSticker((prev) => ({ ...prev, posY: Math.min(0.95, prev.posY + 0.05) }))}
                    className="rounded-2xl bg-white/10 py-2"
                  >Down</button>
                  <button
                    onClick={() => setSticker((prev) => ({ ...prev, posX: Math.max(0.05, prev.posX - 0.05) }))}
                    className="rounded-2xl bg-white/10 py-2"
                  >Left</button>
                  <button
                    onClick={() => setSticker((prev) => ({ ...prev, posX: Math.min(0.95, prev.posX + 0.05) }))}
                    className="rounded-2xl bg-white/10 py-2"
                  >Right</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Control Buttons */}
          <div className="flex justify-center items-center gap-6 px-4">
            
            {/* LEFT: Camera Toggle */}
            {recordingState === "idle" && (
              <motion.button 
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={toggleCamera}
                aria-label="Switch camera"
                className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 flex items-center justify-center"
              >
                <SnapIcon icon={Camera} size={24} />
              </motion.button>
            )}

            {/* RIGHT: TTS Button */}
            {recordingState === "idle" && (
              <motion.button 
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => synthesizeDeclaration(selectedFilter.shortName)}
                aria-label="Play sample declaration aloud"
                className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 flex items-center justify-center"
              >
                <SnapIcon icon={Volume2} size={24} />
              </motion.button>
            )}

            <div className="relative flex flex-col items-center gap-3">
              {recordingState === "idle" && (
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    onClick={capturePhoto}
                    className="group relative w-20 h-20 flex items-center justify-center active:scale-75 transition-transform duration-150"
                  >
                    <div className="relative w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                    </div>
                    <div className="absolute -top-12 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20">
                      PHOTO
                    </div>
                  </motion.button>

                  <motion.button
                    onMouseDown={startRecording}
                    onTouchStart={startRecording}
                    className="group relative w-28 h-28 flex items-center justify-center active:scale-75 transition-transform duration-150"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-[4px] border-white/20"
                    />
                    <div className="relative w-24 h-24 rounded-full bg-white shadow-lg" />
                    <div className="absolute -top-14 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/20">
                      HOLD TO RECORD
                    </div>
                  </motion.button>
                </div>
              )}

              {recordingState === "recording" && (
                <motion.button
                  onMouseUp={stopRecording}
                  onTouchEnd={stopRecording}
                  className="relative w-32 h-32 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-[4px] border-red-600/60"
                  />
                  <div className="absolute inset-0 rounded-full border-[4px] border-red-600" />
                  <div className="w-12 h-12 rounded-lg bg-red-600 shadow-lg" />
                </motion.button>
              )}

              {recordingState === "preview" && (
                <div className="flex items-center gap-12 bg-black/40 backdrop-blur-xl px-8 py-6 rounded-[2rem] border border-white/20 shadow-2xl">
                  <motion.button onClick={resetRecording} className="flex flex-col items-center gap-2 text-white group">
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-red-500/20 transition-all border border-white/20">
                      <SnapIcon icon={RotateCcw} size={24} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Retake</span>
                  </motion.button>

                  <div className="w-px h-14 bg-white/20" />

                  <motion.button onClick={handleShareToSnapchat} className="flex flex-col items-center gap-2 text-white group">
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-yellow-300/20 transition-all border border-white/20">
                      <SnapIcon icon={Sparkles} size={24} color="#FFFC00" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Snapchat</span>
                  </motion.button>

                  <div className="w-px h-14 bg-white/20" />

                  <motion.button onClick={handleShare} className="flex flex-col items-center gap-2 text-white group">
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-blue-500/20 transition-all border border-white/20">
                      <SnapIcon icon={Share2} size={24} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Share</span>
                  </motion.button>

                  <div className="w-px h-14 bg-white/20" />

                  <motion.button onClick={handleSubmit} className="flex flex-col items-center gap-2 text-white group">
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-green-500/20 transition-all border border-white/20">
                      <SnapIcon icon={Check} size={24} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Submit</span>
                  </motion.button>
                </div>
              )}

              {recordingState === "edit" && (
                <div className="flex flex-col items-center gap-4">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-16 w-16 border-[4px] border-white/20 border-t-white/80 rounded-full" 
                  />
                  <span className="text-xs font-black text-white/80 tracking-widest uppercase">Edit your video...</span>
                </div>
              )}
            </div>
            {recordingState === "idle" && <div className="w-14" />}
            {recordingState === "recording" && <div className="w-14" />}
            {recordingState === "edit" && <div className="w-14" />}
            {recordingState === "preview" && <div className="w-14" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record;
