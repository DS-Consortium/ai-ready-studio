import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  author: string;
}

export const VideoPlayerModal = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  author,
}: VideoPlayerModalProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlay = (videoElement: HTMLVideoElement) => {
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (videoElement: HTMLVideoElement) => {
    videoElement.muted = !videoElement.muted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-[2rem] border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <div>{title}</div>
        </DialogHeader>

        <div className="relative bg-black">
          <video
            src={videoUrl}
            className="w-full aspect-video object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onClick={(e) => handlePlay(e.currentTarget)}
            controls
          />
        </div>

        {/* Video Info */}
        <div className="p-6">
          <h2 className="text-xl font-display font-bold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-4">By {author}</p>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={(e) => {
                  const video = (e.currentTarget.parentElement?.parentElement?.querySelector('video') as HTMLVideoElement);
                  if (video) handlePlay(video);
                }}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={(e) => {
                  const video = (e.currentTarget.parentElement?.parentElement?.querySelector('video') as HTMLVideoElement);
                  if (video) toggleMute(video);
                }}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
