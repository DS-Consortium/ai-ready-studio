import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Animated elements */}
      <motion.div
        className="absolute left-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-filter-savvy/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-filter-accountable/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>

          <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Ready to Declare Your AI Identity?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Join the movement. Create your 30-second video, inspire your network, 
            and become part of the global AI readiness conversation.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              variant="hero"
              size="lg"
              className="group min-w-[220px] rounded-xl bg-white text-primary hover:bg-white/90"
            >
              Start Creating Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[220px] rounded-xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              View Contest Rules
            </Button>
          </div>

          <p className="mt-8 text-sm text-white/50">
            Contest runs through November 2026 · Open to all professionals and institutions
          </p>
        </motion.div>
      </div>
    </section>
  );
};
