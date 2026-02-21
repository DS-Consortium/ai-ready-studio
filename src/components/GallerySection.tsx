import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Sparkles, ExternalLink, Calendar } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { SEED_VIDEOS } from "@/lib/seedData";

const sortOptions = [
  { id: "popular", label: "Most Popular", icon: TrendingUp },
  { id: "recent", label: "Most Recent", icon: Clock },
];

export const GallerySection = () => {
  const [activeSort, setActiveSort] = useState("popular");

  return (
    <section id="gallery" className="bg-secondary/30 py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-between gap-6 md:flex-row"
        >
          <div>
            <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              Community Gallery
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              AI Ready Declarations
            </h2>
            <p className="mt-2 text-muted-foreground">
              Watch, vote, and get inspired by leaders from around the world.
            </p>
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-2 rounded-xl bg-background p-1 shadow-soft">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveSort(option.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeSort === option.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <option.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Video grid using SEED_VIDEOS */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SEED_VIDEOS.map((video, index) => (
            <VideoCard
              key={video.id}
              video={{
                id: video.id,
                title: video.title,
                author: video.user_name,
                organization: video.identity,
                filterId: video.filter_id,
                votes: video.votes,
                views: Math.floor(video.votes * 4.5),
                thumbnail: video.thumbnail_url,
              }}
              index={index}
              onVote={() => console.log("Voted:", video.id)}
            />
          ))}
        </div>

        {/* Load more */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Load More Videos
          </Button>
        </motion.div>
          </div>
    </section>
  );
};
