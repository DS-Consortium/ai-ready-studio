import { motion } from "framer-motion";
import { Sparkles, Video, Upload, Trophy } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Choose Your AI Identity",
    description: "Select the filter that best represents your AI readiness journey and professional focus.",
  },
  {
    icon: Video,
    title: "Record Your Declaration",
    description: "Create a 10-30 second video sharing what AI readiness means to you and your institution.",
  },
  {
    icon: Upload,
    title: "Submit & Share",
    description: "Upload your video, add a compelling title, and share it across your professional networks.",
  },
  {
    icon: Trophy,
    title: "Engage & Win",
    description: "Vote for others, get voted, and join the community shaping the future of AI in institutions.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            Simple Process
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the movement in four simple steps. No technical expertise required.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="group relative"
            >
              {/* Connector line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-border to-transparent lg:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Step number */}
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-accent transition-all duration-300 group-hover:bg-primary group-hover:shadow-glow">
                  <step.icon className="h-9 w-9 text-accent-foreground transition-colors group-hover:text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="mt-6 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
