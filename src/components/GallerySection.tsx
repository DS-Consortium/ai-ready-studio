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

        {/* Journey Section - Synced with LeGroupeDS Events */}
        <div className="mt-32 bg-primary/5 rounded-[3rem] p-8 md:p-16 border border-primary/10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">Next Steps</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-6">
                Your AI Readiness Journey Doesn't End Here
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Connect with our curated seminars and explore the Knowledge Lab archive on our main platform.
              </p>
              <div className="space-y-4">
                <Button size="lg" className="w-full sm:w-auto rounded-2xl gap-3" asChild>
                  <a href="https://legroupeds.com/events" target="_blank" rel="noopener noreferrer">
                    Explore Curated Seminars
                    <Calendar className="h-5 w-5" />
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  New seminars added weekly to the Knowledge Lab
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-white rounded-3xl shadow-2xl overflow-hidden border border-border group">
                <img 
                  src="https://images.unsplash.com/photo-1591115765373-520b7a217294?w=800&q=80" 
                  alt="Knowledge Lab Seminar" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl">
                    <a href="https://legroupeds.com/knowledge-lab" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-8 w-8 text-primary" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
