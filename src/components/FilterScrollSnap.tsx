import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AI_FILTERS, type AIFilter } from '@/lib/filters';

interface FilterScrollSnapProps {
  selectedFilter: AIFilter | null;
  onFilterChange: (filter: AIFilter) => void;
}

export const FilterScrollSnap: React.FC<FilterScrollSnapProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      scrollTimeoutRef.current = setTimeout(() => {
        // Snap to nearest filter
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const itemWidth = 80; // Filter button width + gap
        const centerOffset = (containerWidth - itemWidth) / 2;

        const targetScroll = Math.round((scrollLeft - centerOffset) / itemWidth) * itemWidth + centerOffset;
        
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        });

        // Determine which filter is centered
        const centerIndex = Math.round((scrollLeft - centerOffset + itemWidth / 2) / itemWidth);
        if (centerIndex >= 0 && centerIndex < AI_FILTERS.length) {
          onFilterChange(AI_FILTERS[centerIndex]);
        }

        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [onFilterChange]);

  return (
    <div className="w-full bg-black/40 backdrop-blur-sm py-3 px-2 rounded-t-2xl border-t border-white/10">
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
        }}
      >
        {/* Spacer for center alignment */}
        <div className="flex-shrink-0 w-[calc(50vw-50px)]" />

        {AI_FILTERS.map((filter) => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter)}
            className={`flex-shrink-0 w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300 border-2 scroll-snap-align-center ${
              selectedFilter?.id === filter.id
                ? `border-white bg-white/20 scale-110 shadow-lg shadow-white/30`
                : `border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10`
            }`}
            style={{
              scrollSnapAlign: 'center',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{filter.emoji}</span>
            <span className="text-xs font-semibold text-white text-center leading-tight truncate px-1">
              {filter.label.split(' ')[0]}
            </span>
          </motion.button>
        ))}

        {/* Spacer for center alignment */}
        <div className="flex-shrink-0 w-[calc(50vw-50px)]" />
      </div>

      {/* Center indicator line */}
      <div className="flex justify-center mt-2">
        <div className="w-1 h-1 rounded-full bg-white/50" />
      </div>
    </div>
  );
};
