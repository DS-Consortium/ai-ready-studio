import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, getFilterById } from "@/lib/filters";
import { SocialShare } from "@/components/SocialShare";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import {
  ArrowLeft,
  Trophy,
  Crown,
  Medal,
  Award,
  Calendar,
  Filter,
  Eye,
  Heart,
} from "lucide-react";

interface WinnerVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  filter_id: string | null;
  created_at: string;
  user_id: string;
  votes: { id: string }[];
  winner_badge?: string;
  prize_draw_id?: string;
}

const Winners = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<WinnerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");

  useEffect(() => {
    fetchWinners();
  }, [activeFilter, sortBy]);

  const fetchWinners = async () => {
    setLoading(true);

    // For now, fetch videos with high vote counts as "winners"
    // In production, this would query a winners table
    let query = supabase
      .from("videos")
      .select(
        `
        id,
        title,
        video_url,
        thumbnail_url,
        views_count,
        filter_id,
        created_at,
        user_id,
        votes (id)
      `
      )
      .eq("is_submitted", true)
      .eq("is_approved", true);

    if (activeFilter) {
      query = query.eq("filter_id", activeFilter);
    }

    if (sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("views_count", { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error("Error fetching winners:", error);
    } else {
      // Mark top 3 as winners for demo purposes
      const winnersData = (data as WinnerVideo[]).map((video, index) => ({
        ...video,
        winner_badge: index < 3 ? ["🥇", "🥈", "🥉"][index] : undefined,
      }));
      setVideos(winnersData);
    }

    setLoading(false);
  };

  const getWinnerIcon = (badge?: string) => {
    switch (badge) {
      case "🥇": return Crown;
      case "🥈": return Trophy;
      case "🥉": return Medal;
      default: return Award;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="font-display font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Winners Gallery
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Sort buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
            <button
              onClick={() => setSortBy("votes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === "votes"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="h-4 w-4" />
              Top Votes
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === "recent"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Recent
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Filter tags */}
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Winners
          </button>
          {AI_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter.id
                  ? "text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              style={
                activeFilter === filter.id
                  ? { backgroundColor: getFilterColor(filter.id) }
                  : undefined
              }
            >
              {filter.shortName}
            </button>
          ))}
        </div>

        {/* Winners grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No winners yet</h3>
            <p className="text-muted-foreground mb-4">
              Winners will be announced soon!
            </p>
            <Button asChild>
              <Link to="/record">Create Video</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => {
              const filter = video.filter_id
                ? getFilterById(video.filter_id)
                : null;
              const WinnerIcon = getWinnerIcon(video.winner_badge);

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  {/* Winner badge overlay */}
                  {video.winner_badge && (
                    <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                      <WinnerIcon className="h-4 w-4" />
                      Winner
                    </div>
                  )}

                  {/* Video thumbnail */}
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={video.video_url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full h-14 w-14"
                      >
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>

                    {/* Filter badge */}
                    {filter && (
                      <div
                        className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1.5"
                        style={{ backgroundColor: getFilterColor(filter.id) }}
                      >
                        <filter.icon className="h-3 w-3" />
                        {filter.shortName}
                      </div>
                    )}

                    {/* Views */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 text-white text-xs flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views_count}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{video.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Winner Declaration
                    </p>

                    {/* Winner stats */}
                    {video.winner_badge && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl">{video.winner_badge}</span>
                        <span className="text-sm font-medium text-yellow-600">
                          {video.votes.length} votes
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <QRCodeGenerator
                          url={`${window.location.origin}/video/${video.id}`}
                          title={video.title}
                          size={180}
                        />
                        <SocialShare
                          videoUrl={video.video_url}
                          videoTitle={video.title}
                          filterName={filter?.name}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Winners;