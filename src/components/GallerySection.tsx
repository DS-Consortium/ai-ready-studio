import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, TrendingUp, Clock, Sparkles } from "lucide-react";
import { VideoCard, type VideoEntry } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";

// Sample video data
const sampleVideos: VideoEntry[] = [
  {
    id: "1",
    title: "Why AI Accountability Matters in Public Institutions",
    author: "Dr. Sarah Chen",
    organization: "Ministry of Digital Affairs",
    filterId: "accountable",
    votes: 847,
    views: 3420,
    thumbnail: "",
  },
  {
    id: "2",
    title: "Building AI-Ready Teams: My Journey",
    author: "Marcus Williams",
    organization: "Global Bank Corp",
    filterId: "building",
    votes: 623,
    views: 2891,
    thumbnail: "",
  },
  {
    id: "3",
    title: "From Data Analyst to AI Enabler",
    author: "Priya Sharma",
    organization: "HealthTech Foundation",
    filterId: "enabler",
    votes: 512,
    views: 2156,
    thumbnail: "",
  },
  {
    id: "4",
    title: "Leading Responsible AI in Education",
    author: "Prof. James Okonkwo",
    organization: "African Union Institute",
    filterId: "leading",
    votes: 489,
    views: 1987,
    thumbnail: "",
  },
  {
    id: "5",
    title: "My AI Savvy Transformation Story",
    author: "Elena Rodriguez",
    organization: "Tech Innovation Lab",
    filterId: "savvy",
    votes: 456,
    views: 1823,
    thumbnail: "",
  },
  {
    id: "6",
    title: "Driving AI Strategy in Government",
    author: "Robert Kim",
    organization: "Smart City Initiative",
    filterId: "driven",
    votes: 398,
    views: 1654,
    thumbnail: "",
  },
];

const sortOptions = [
  { id: "popular", label: "Most Popular", icon: TrendingUp },
  { id: "recent", label: "Most Recent", icon: Clock },
  { id: "all", label: "All Filters", icon: Filter },
];

export const GallerySection = () => {
  const [activeSort, setActiveSort] = useState("popular");

  const handleVote = (videoId: string) => {
    console.log("Voted for:", videoId);
  };

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

        {/* Video grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleVideos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onVote={handleVote}
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
