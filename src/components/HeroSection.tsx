import { motion } from "framer-motion";
import { ArrowRight, Play, Users, Video, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTutorial } from "./VideoTutorial";

const stats = [
  { icon: Users, value: "2,500+", label: "Participants" },
  { icon: Video, value: "1,200", label: "Videos Submitted" },
  { icon: Award, value: "8", label: "AI Identities" },
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden hero-gradient">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-filter-savvy/20 blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -right-20 top-1/2 h-80 w-80 rounded-full bg-filter-accountable/20 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-filter-enabler/15 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center pb-16 pt-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-filter-savvy" />
            DS Consortium 2026 Campaign
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Are You{" "}
          <span className="relative">
            <span className="relative z-10 bg-gradient-to-r from-filter-savvy via-filter-accountable to-filter-driven bg-clip-text text-transparent">
              AI Ready
            </span>
            <motion.span
              className="absolute -inset-x-2 -inset-y-1 -z-10 block rounded-lg bg-white/10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </span>
          ?
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl"
        >
          Declare your AI readiness. Join thousands of leaders shaping the future of institutions.
          Create your video, choose your identity, and inspire others.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            variant="hero"
            size="lg"
            className="group min-w-[200px] rounded-xl text-base"
          >
            Create Your Video
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <VideoTutorial />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 md:gap-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <stat.icon className="h-5 w-5 text-white/80" />
              </div>
              <p className="font-display text-2xl font-bold text-white md:text-3xl">
                {stat.value}
              </p>
              <p className="text-sm text-white/60">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/40"
          >
            <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
            <div className="h-10 w-6 rounded-full border border-white/30 p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-full rounded-full bg-white/50"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
