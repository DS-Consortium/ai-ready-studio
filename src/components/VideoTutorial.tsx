import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Sparkles, Video, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// The tutorial video URL. Can be set via environment variable VITE_TUTORIAL_VIDEO_URL
// or imported from a CDN. Currently set to null to show the animated placeholder state.
// To enable the tutorial video:
// 1. Generate or upload the video to a CDN (e.g., Vimeo, YouTube, S3)
// 2. Set VITE_TUTORIAL_VIDEO_URL environment variable
// 3. Or update this constant directly with the video URL
const TUTORIAL_VIDEO_URL: string | null = import.meta.env.VITE_TUTORIAL_VIDEO_URL || null;

const steps = [
  {
    title: "Choose Your Identity",
    description: "Select one of the 8 DSC Filters that best represents your role in the AI future.",
    icon: <Sparkles className="text-primary" size={20} />,
  },
  {
    title: "Record Your Declaration",
    description: "Declare your readiness and vision for AI using our native camera view (max 60 seconds).",
    icon: <Video className="text-primary" size={20} />,
  },
  {
    title: "Share & Inspire",
    description: "Post to LinkedIn or WhatsApp and join the global AI readiness movement.",
    icon: <Share2 className="text-primary" size={20} />,
  },
];

export const VideoTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="min-w-[200px] rounded-xl border-white/30 bg-white/5 text-base text-white hover:bg-white/10 hover:text-white"
      >
        <Play className="h-4 w-4 mr-2" />
        Watch Tutorial
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-background border border-border rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* ── Video / Placeholder Panel ── */}
                <div className="relative w-full md:w-3/5 bg-neutral-900 aspect-video md:aspect-auto min-h-[260px] flex items-center justify-center overflow-hidden">

                  {TUTORIAL_VIDEO_URL ? (
                    /* Real video player */
                    <>
                      <video
                        ref={videoRef}
                        src={TUTORIAL_VIDEO_URL}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        onClick={togglePlay}
                      />

                      {/* Play / Pause overlay */}
                      <AnimatePresence>
                        {!isPlaying && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={togglePlay}
                            className="absolute z-20 h-20 w-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors"
                          >
                            <Play className="text-white fill-white ml-1" size={32} />
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Controls bar */}
                      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/70 to-transparent">
                        {/* Progress bar */}
                        <div
                          className="w-full h-1.5 bg-white/30 rounded-full mb-2 cursor-pointer"
                          onClick={handleProgressClick}
                        >
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={togglePlay} className="text-white hover:text-white/80">
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <button onClick={toggleMute} className="text-white hover:text-white/80">
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>
                          <span className="text-white/60 text-[10px] font-mono ml-auto">
                            Campaign Tutorial · 15:00
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Animated placeholder — video coming soon */
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-filter-savvy/40"
                      />
                      <div className="relative z-20 text-center p-8">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-6 mx-auto border border-white/20"
                        >
                          <Play className="text-white fill-white ml-1" size={32} />
                        </motion.div>
                        <p className="text-white/60 text-xs font-mono tracking-widest uppercase mb-2">
                          Campaign Tutorial
                        </p>
                        <h3 className="text-white text-2xl font-display font-bold">
                          Master the AI Declaration
                        </h3>
                        <p className="text-white/50 text-sm mt-2">15 min · Coming soon</p>
                      </div>
                      {/* Simulated REC indicator */}
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white/60 text-[10px] font-mono">00:15 REC</span>
                      </div>
                    </>
                  )}

                  {/* Mobile close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 text-white md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* ── Instructions Panel ── */}
                <div className="w-full md:w-2/5 p-8 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold font-display text-black">How it Works</h2>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="hidden md:block p-1 hover:bg-secondary rounded-md transition-colors"
                      >
                        <X size={24} className="text-black" />
                      </button>
                    </div>

                    <div className="space-y-8">
                      {steps.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex gap-4"
                        >
                          <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            {step.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-black">{step.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10">
                    <Button className="w-full rounded-xl py-6 text-lg" onClick={() => setIsOpen(false)}>
                      Start Creating
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
