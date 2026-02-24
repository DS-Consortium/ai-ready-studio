/**
 * Vertical Scroll Gallery Feed Component
 * TikTok/Reels-style vertical swipe video feed
 * 
 * Features:
 * - Full-screen video playback
 * - Vertical swipe to next/previous video
 * - Like, comment, share actions on overlay
 * - Sound toggle
 * - User info and statistics
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react';

interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  userId: string;
  userName: string;
  userImage?: string;
  title: string;
  description?: string;
  votes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  credits?: number;
}

interface VerticalGalleryFeedProps {
  videos: Video[];
  onVideoChange?: (videoId: string) => void;
  onVote?: (videoId: string) => void;
}

export const VerticalGalleryFeed: React.FC<VerticalGalleryFeedProps> = ({
  videos,
  onVideoChange,
  onVote,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const currentVideo = videos[currentIndex];

  // Handle vertical swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diff = startY.current - endY;

    // Swipe down (previous video)
    if (diff > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      onVideoChange?.(videos[currentIndex - 1].id);
    }
    // Swipe up (next video)
    else if (diff < -50 && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      onVideoChange?.(videos[currentIndex + 1].id);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        onVideoChange?.(videos[currentIndex - 1].id);
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        setCurrentIndex(currentIndex + 1);
        onVideoChange?.(videos[currentIndex + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, videos, onVideoChange]);

  // Update mute state on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Play/pause based on visibility
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && videoRef.current) {
        videoRef.current.play().catch(() => {
          // Autoplay may be blocked by browser
        });
      } else if (videoRef.current) {
        videoRef.current.pause();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!currentVideo || videos.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <p className="text-white">No videos available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Container */}
      <div className="h-full w-full relative">
        <video
          ref={videoRef}
          key={currentVideo.id}
          src={currentVideo.videoUrl}
          className="h-full w-full object-cover"
          loop
          playsInline
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

        {/* Mute Toggle - Top Right */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>

        {/* Left Sidebar Actions */}
        <div className="absolute bottom-20 right-4 z-10 space-y-4">
          {/* Like Button */}
          <button
            onClick={() => {
              setLiked(!liked);
              onVote?.(currentVideo.id);
            }}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition"
          >
            <div className="bg-black/50 hover:bg-black/70 p-3 rounded-full">
              <Heart
                className="h-6 w-6"
                fill={liked ? 'currentColor' : 'none'}
                color={liked ? '#ef4444' : 'currentColor'}
              />
            </div>
            <span className="text-xs font-semibold">{currentVideo.votes}</span>
          </button>

          {/* Comment Button */}
          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition">
            <div className="bg-black/50 hover:bg-black/70 p-3 rounded-full">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">{currentVideo.comments}</span>
          </button>

          {/* Share Button */}
          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition">
            <div className="bg-black/50 hover:bg-black/70 p-3 rounded-full">
              <Share2 className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">{currentVideo.shares}</span>
          </button>
        </div>

        {/* Video Info - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-10 max-w-[calc(100%-120px)]">
          {/* User Info */}
          <div className="flex items-center gap-2 mb-3">
            {currentVideo.userImage && (
              <img
                src={currentVideo.userImage}
                alt={currentVideo.userName}
                className="h-10 w-10 rounded-full border-2 border-white"
              />
            )}
            <div>
              <p className="font-semibold text-white text-sm">{currentVideo.userName}</p>
              {currentVideo.credits && (
                <p className="text-xs text-gray-300">
                  💰 {currentVideo.credits} credits
                </p>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <p className="text-white text-sm font-medium mb-1">{currentVideo.title}</p>
          {currentVideo.description && (
            <p className="text-gray-200 text-xs line-clamp-2">
              {currentVideo.description}
            </p>
          )}
        </div>

        {/* Navigation Hints */}
        {currentIndex < videos.length - 1 && (
          <button
            onClick={() => {
              setCurrentIndex(currentIndex + 1);
              onVideoChange?.(videos[currentIndex + 1].id);
            }}
            className="absolute bottom-4 right-4 text-white/50 hover:text-white transition"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        )}

        {currentIndex > 0 && (
          <button
            onClick={() => {
              setCurrentIndex(currentIndex - 1);
              onVideoChange?.(videos[currentIndex - 1].id);
            }}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
        )}

        {/* Video Counter */}
        <div className="absolute top-4 left-4 text-white/70 text-sm">
          {currentIndex + 1} / {videos.length}
        </div>
      </div>
    </div>
  );
};

export default VerticalGalleryFeed;
