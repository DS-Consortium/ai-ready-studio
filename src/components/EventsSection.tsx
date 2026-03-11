import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadCalendar } from "@/components/DownloadCalendar";
import { useNavigate } from "react-router-dom";

const upcomingEvents = [
  {
    id: 1,
    title: "Mastering AI: Building AI-Ready Institutions",
    date: "March 24, 2026",
    location: "Dubai / Hybrid",
    filterTag: "AI Ready",
    color: "hsl(210, 100%, 50%)",
    spots: 50,
    eventUrl: "https://luma.com/ccyplzym",
  },
  {
    id: 2,
    title: "Data Governance Masterclass: Securing Your AI Investment",
    date: "March 25-27, 2026",
    location: "Dubai",
    filterTag: "AI Savvy",
    color: "hsl(175, 80%, 40%)",
    spots: 30,
    eventUrl: "https://luma.com/2phisred",
  },
  {
    id: 3,
    title: "AI Ethics, Bias & Governance in Emerging Markets",
    date: "April 15, 2026",
    location: "DC / Hybrid",
    filterTag: "AI Accountable",
    color: "hsl(40, 90%, 50%)",
    spots: 40,
    eventUrl: "https://luma.com/z93b8ot2",
  },
  {
    id: 4,
    title: "Cybersecurity for AI-Ready Ecosystems",
    date: "April 22, 2026",
    location: "Riyadh / Hybrid",
    filterTag: "AI Driven",
    color: "hsl(280, 85%, 45%)",
    spots: 50,
    eventUrl: "https://luma.com/tdyctocg",
  },
  {
    id: 5,
    title: "Applied AI in Action: From Analytics to Machine Learning",
    date: "April 30 - June, 2026",
    location: "Dubai / Hybrid",
    filterTag: "AI Savvy",
    color: "hsl(210, 100%, 50%)",
    spots: 25,
    eventUrl: "https://luma.com/8t6shpxe",
  },
  {
    id: 6,
    title: "Digital Strategy & Transformation in an AI-First Era",
    date: "May 19-22, 2026",
    location: "Dubai",
    filterTag: "AI Driven",
    color: "hsl(40, 90%, 50%)",
    spots: 35,
    eventUrl: "https://luma.com/7gh6acyl",
  },
];

export const EventsSection = () => {
  const navigate = useNavigate();
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <>
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left column - Text content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center"
            >
              <span className="inline-block w-fit rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
                Continue Your Journey
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                Your AI Readiness Journey Doesn't End Here
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Each filter connects you to curated events, masterclasses, and leadership
                programs. Transform your declaration into action.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button variant="hero" size="lg" className="gap-2" asChild>
                  <a href="https://legroupeds.com/events" target="_blank" rel="noopener noreferrer">
                    View Full 2026 Roadmap
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => setCalendarOpen(true)}
                >
                  <Download className="h-4 w-4" />
                  Download Calendar
                </Button>
              </div>
            </motion.div>

            {/* Right column - Events cards */}
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-elevated"
                >
                  <div
                    className="absolute left-0 top-0 h-full w-1.5 transition-all duration-300 group-hover:w-2"
                    style={{ backgroundColor: event.color }}
                  />

                  <div className="flex flex-col gap-4 pl-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span
                        className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: event.color }}
                      >
                        {event.filterTag}
                      </span>
                      <h3 className="mt-2 font-display text-lg font-semibold">
                        {event.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {event.location}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="group/btn self-start sm:self-center"
                      onClick={() => navigate(`/events?eventId=${event.id}`)}
                      aria-label={`Learn more about ${event.title}`}
                    >
                      Learn More
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modal – conditionally rendered only when needed */}
      {calendarOpen && (
        <DownloadCalendar open={calendarOpen} onOpenChange={setCalendarOpen} />
      )}
    </>
  );
};;