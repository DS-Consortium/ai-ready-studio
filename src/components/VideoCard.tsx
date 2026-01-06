import { motion } from "framer-motion";
import { Heart, Play, Eye, Share2 } from "lucide-react";
import { getFilterById, getFilterColor } from "@/lib/filters";
import { Button } from "@/components/ui/button";

interface VideoEntry {
  id: string;
  title: string;
  author: string;
  organization: string;
  filterId: string;
  votes: number;
  views: number;
  thumbnail: string;
}

interface VideoCardProps {
  video: VideoEntry;
  index: number;
  onVote?: (videoId: string) => void;
}

export const VideoCard = ({ video, index, onVote }: VideoCardProps) => {
  const filter = getFilterById(video.filterId);
  const filterColor = getFilterColor(video.filterId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-elevated"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden bg-muted sm:aspect-video">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40"
          style={{
            background: `linear-gradient(135deg, ${filterColor}40 0%, ${filterColor}10 100%)`,
          }}
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-elevated backdrop-blur-sm transition-transform"
          >
            <Play className="h-7 w-7 text-primary ml-1" fill="currentColor" />
          </motion.button>
        </div>

        {/* Filter badge */}
        <div
          className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-soft"
          style={{ backgroundColor: filterColor }}
        >
          {filter?.shortName || "AI Ready"}
        </div>

        {/* Views count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          <Eye className="h-3.5 w-3.5" />
          {video.views.toLocaleString()}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3 className="font-semibold leading-snug line-clamp-2">{video.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {video.author} · {video.organization}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote?.(video.id)}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <Heart className="h-4 w-4" />
            <span className="font-semibold">{video.votes.toLocaleString()}</span>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export type { VideoEntry };
