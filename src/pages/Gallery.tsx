import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, getFilterById } from "@/lib/filters";
import { SocialShare } from "@/components/SocialShare";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import {
  ArrowLeft,
  Heart,
  Eye,
  Play,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";

interface GalleryVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  filter_id: string | null;
  created_at: string;
  user_id: string;
  votes: { id: string }[];
}

const Gallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");

  useEffect(() => {
    fetchVideos();
  }, [activeFilter, sortBy]);

  const fetchVideos = async () => {
    setLoading(true);

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
      console.error("Error fetching videos:", error);
    } else {
      setVideos((data as GalleryVideo[]) || []);
    }

    setLoading(false);
  };

  const handleVote = async (videoId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote for videos.",
        variant: "destructive",
      });
      return;
    }

    const video = videos.find((v) => v.id === videoId);
    const hasVoted = video?.votes.some(
      (v) => videos.find((vid) => vid.id === videoId)?.user_id === user.id
    );

    if (hasVoted) {
      // Remove vote
      await supabase
        .from("votes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", user.id);
    } else {
      // Add vote
      await supabase.from("votes").insert({
        video_id: videoId,
        user_id: user.id,
      });
    }

    // Refresh videos
    fetchVideos();
  };

  const userVotedFor = (video: GalleryVideo) => {
    if (!user) return false;
    // Check if current user has voted - we need to check votes table
    return false; // Simplified - would need separate query
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
          <h1 className="font-display font-bold">Global Gallery</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Sort buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
            <button
              onClick={() => setSortBy("popular")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === "popular"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Popular
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === "recent"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-4 w-4" />
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
            All
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

        {/* Videos grid */}
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
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your AI declaration!
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

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg"
                >
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
                      AI Ready Creator
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => handleVote(video.id)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-500 transition-colors"
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            userVotedFor(video)
                              ? "fill-pink-500 text-pink-500"
                              : ""
                          }`}
                        />
                        <span>{video.votes.length}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <QRCodeGenerator
                          url={`${window.location.origin}/gallery?video=${video.id}`}
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

export default Gallery;
