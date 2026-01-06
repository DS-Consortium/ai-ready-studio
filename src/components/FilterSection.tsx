import { motion } from "framer-motion";
import { AI_FILTERS } from "@/lib/filters";
import { FilterCard } from "@/components/FilterCard";

export const FilterSection = () => {
  return (
    <section id="create" className="bg-pattern py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Choose Your Identity
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Who Are You in the AI Era?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Select the AI identity that best represents your professional focus and values.
            Each filter connects you to relevant events and resources.
          </p>
        </motion.div>

        {/* Filter grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AI_FILTERS.map((filter, index) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              index={index}
              onSelect={(f) => console.log("Selected:", f.name)}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground">
            Can't decide?{" "}
            <button className="font-medium text-filter-savvy hover:underline">
              Start with "I AM AI Ready"
            </button>{" "}
            — the universal declaration.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
