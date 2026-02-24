import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Trophy, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialShare } from "./SocialShare";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { spendCredits, CREDIT_COSTS } from "@/lib/credits";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CreditsModal } from "./CreditsModal";
import { getFilterById, getFilterColor } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface VideoEntry {
  id: string;
  title: string;
  author: string;
  organization: string;
  filterId: string;
  votes: number;
  views: number;
  thumbnail: string;
  videoUrl?: string;
}

interface VideoCardProps {
  video: VideoEntry;
  index: number;
  onVote?: (videoId: string) => void;
}

export const VideoCard = ({ video, index, onVote }: VideoCardProps) => {
  const [votes, setVotes] = useState(video.votes);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const { user } = useAuth();
  
  const filter = getFilterById(video.filterId);
  const filterColor = getFilterColor(video.filterId);
  const videoUrl = video.videoUrl || `https://dsconsortium.com/video/${video.id}`;

  const handleVote = async (isPowerVote: boolean = false) => {
    if (!user) {
      toast.error("Please sign in to vote!");
      return;
    }

    const cost = isPowerVote ? CREDIT_COSTS.POWER_VOTE : CREDIT_COSTS.VOTE;
    const voteGain = isPowerVote ? 10 : 1;

    try {
      await spendCredits(user.id, cost, isPowerVote ? 'Power Vote' : 'Standard Vote');
      setVotes(prev => prev + voteGain);
      toast.success(isPowerVote ? "Power Vote cast! +10 Votes" : "Vote cast!");
      onVote?.(video.id);
    } catch (err: any) {
      if (err.message === 'Insufficient credits') {
        setShowCreditsModal(true);
      } else {
        toast.error("Failed to cast vote. Please try again.");
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-elevated"
      >
        {/* Thumbnail */}
        <div className="relative aspect-[9/16] overflow-hidden bg-muted sm:aspect-video">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(135deg, ${filterColor} 0%, transparent 100%)`,
            }}
          />
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

          {/* Play button overlay */}
          <button
            onClick={() => setShowPlayerModal(true)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-elevated backdrop-blur-sm transition-transform">
              <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
            </div>
          </button>

          {/* Filter badge */}
          <div
            className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-soft"
            style={{ backgroundColor: filterColor }}
          >
            {filter?.shortName || "AI Ready"}
          </div>

          {/* Views count */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            {video.views.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex-1">
            <h3 className="font-display font-bold leading-snug line-clamp-2 text-lg">{video.title}</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {video.author} · {video.organization}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-display font-black text-foreground">{votes.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Votes</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleVote(false)}
                  className="rounded-xl border-primary/20 hover:bg-primary/5 gap-1.5 h-10 px-3"
                >
                  <Heart className="h-4 w-4" /> Vote
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleVote(true)}
                  className="rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/20 gap-1.5 h-10 px-3"
                >
                  <Zap className="h-4 w-4 fill-current" /> Power
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <SocialShare 
                videoUrl={videoUrl}
                videoTitle={video.title}
                filterName={filter?.name}
                size="sm"
              />
              <button onClick={() => setShowCreditsModal(true)} className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest">Get Credits</button>
            </div>
          </div>
        </div>
        <CreditsModal isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
      </motion.div>

      <VideoPlayerModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        videoUrl={videoUrl}
        title={video.title}
        author={video.author}
      />
    </>
  );
};
