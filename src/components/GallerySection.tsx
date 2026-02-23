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
            <span className="text-sm font-black uppercase tracking-[0.3em] text-primary">Global Gallery</span>
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
            Watch, vote, and get inspired by leaders from around the world. Use Power Votes to boost your favorites!
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

        {/* Journey Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-[3rem] blur-2xl transition-all group-hover:blur-3xl" />
          <div className="relative p-12 md:p-16 rounded-[3rem] bg-card border border-border shadow-2xl flex flex-col md:flex-row items-center gap-12 overflow-hidden">
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-display font-black mb-6">Your AI Readiness Journey Doesn't End Here</h3>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl">
                Connect to our curated seminars and explore the Knowledge Lab archive to deepen your expertise.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="rounded-2xl h-14 px-8 font-bold gap-2">
                  <a href="https://legroupeds.com/events" target="_blank" rel="noopener noreferrer">
                    Upcoming Seminars <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild className="rounded-2xl h-14 px-8 font-bold">
                  <a href="https://legroupeds.com/knowledge-lab" target="_blank" rel="noopener noreferrer">
                    Knowledge Lab Archive
                  </a>
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/3 aspect-square bg-muted rounded-[2rem] overflow-hidden border border-border flex items-center justify-center relative">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
               <Calendar className="h-32 w-32 text-primary/40" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
