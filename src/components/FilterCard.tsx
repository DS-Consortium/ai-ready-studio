import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { AIFilter } from "@/lib/filters";

interface FilterCardProps {
  filter: AIFilter;
  index: number;
  onSelect?: (filter: AIFilter) => void;
}

export const FilterCard = ({ filter, index, onSelect }: FilterCardProps) => {
  const Icon = filter.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(filter)}
      className={`group relative flex flex-col items-start gap-4 rounded-2xl border border-border/50 bg-card p-6 text-left shadow-card transition-all duration-300 hover:shadow-elevated ${filter.colorClass}`}
    >
      {/* Accent glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 filter-accent-glow" />

      {/* Icon with accent background */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl filter-accent">
        <Icon className="h-6 w-6" />
        <div className="absolute inset-0 rounded-xl animate-pulse-ring filter-accent opacity-0 group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="relative space-y-2">
        <h3 className="font-display text-lg font-semibold leading-snug">{filter.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{filter.description}</p>
      </div>

      {/* Hover indicator */}
      <div className="relative mt-auto flex items-center gap-2 text-sm font-medium filter-accent-text opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span>Choose this identity</span>
        <ArrowRight className="h-4 w-4" />
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 filter-accent" />
    </motion.button>
  );
};
