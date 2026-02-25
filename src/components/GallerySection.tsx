import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Sparkles, ExternalLink, Calendar, ArrowRight } from "lucide-react";
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
    <section id="gallery" className="bg-background py-24 md:py-32 overflow-hidden">
      <div className="container px-6 mx-auto">
        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="w-12 h-1 bg-primary rounded-full" />
            <span className="text-sm font-black uppercase tracking-[0.3em] text-primary">Community Gallery</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-display font-black leading-tight mb-6"
          >
            AI Ready <span className="text-muted-foreground italic">Declarations</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground font-medium"
          >
            Watch, vote, and get inspired by leaders from around the world. All declarations from our web and mobile platforms are merged here.
          </motion.p>
        </div>

        {/* Video grid using SEED_VIDEOS */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SEED_VIDEOS.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
            />
          ))}
        </div>

       
      </div>
    </section>
  );
};
