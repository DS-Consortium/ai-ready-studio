import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Share2, ThumbsUp, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  views_count?: number;
  created_at?: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

const VideoPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      if (!id) {
        setLoading(false);
        return;
      }

      // Try fetching from knowledge_videos first
      const { data: knowledgeVideo, error: knowledgeError } = await supabase
        .from("knowledge_videos")
        .select("*")
        .eq("id", id)
        .single();

      if (knowledgeError && knowledgeError.code !== "PGRST116") {
        throw knowledgeError;
      }

      if (knowledgeVideo) {
        setVideo(knowledgeVideo);
        setLoading(false);
        return;
      }

      // Fall back to regular videos table
      const { data: regularVideo, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();

      if (videoError && videoError.code !== "PGRST116") {
        throw videoError;
      }

      if (regularVideo) {
        setVideo(regularVideo);
        
        // Increment view count
        await supabase
          .from("videos")
          .update({ views_count: (regularVideo.views_count || 0) + 1 })
          .eq("id", id)
          .catch(err => console.warn('Could not update view count:', err));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching video:", error);
      toast({ 
        title: "Error", 
        description: "Could not load video", 
        variant: "destructive" 
      });
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!video) return;
    
    setShareLoading(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description || "Check out this amazing video!",
          url: window.location.href,
        });
      } else {
        // Fallback: Copy link to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({ 
          title: "Link copied", 
          description: "Video link copied to clipboard" 
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Share error:", err);
      }
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center pb-24">
        <Skeleton className="w-full aspect-video rounded-none" />
        <div className="w-full p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white pb-24">
        <h1 className="text-2xl font-bold mb-4">Video not found</h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-primary rounded-lg hover:bg-primary/80 transition"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pb-24"
    >
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-lg transition text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-white font-black text-sm">AI READY</span>
        <div className="w-10" />
      </div>

      {/* Video Player */}
      <div className="relative w-full aspect-video bg-black mt-0">
        <video
          src={video.video_url}
          poster={video.thumbnail_url || undefined}
          controls
          autoPlay
          playsInline
          className="w-full h-full"
          controlsList="nodownload"
        />
      </div>

      {/* Video Info */}
      <div className="px-4 py-6 text-white">
        <div className="mb-6">
          <h1 className="text-2xl font-black mb-2 leading-tight">
            {video.title}
          </h1>
          
          {video.description && (
            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              {video.description}
            </p>
          )}

          {/* Video Stats */}
          <div className="flex items-center gap-4 text-xs text-white/50 mb-6">
            {video.views_count !== undefined && (
              <span>{video.views_count.toLocaleString()} views</span>
            )}
            {video.duration_seconds !== undefined && (
              <span>{Math.floor(video.duration_seconds / 60)}m {video.duration_seconds % 60}s</span>
            )}
            {video.created_at && (
              <span>{new Date(video.created_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLiked(!liked)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black transition ${
              liked 
                ? 'bg-primary text-white' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Liked' : 'Like'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            disabled={shareLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-lg font-black hover:bg-white/20 transition disabled:opacity-50"
          >
            <Share2 className="w-5 h-5" />
            {shareLoading ? 'Sharing...' : 'Share'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-lg font-black hover:bg-white/20 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Comment
          </motion.button>
        </div>

        {/* Related Videos Placeholder */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-black mb-4">More Videos</h2>
          <p className="text-white/50 text-sm">Recommended videos will appear here</p>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;
