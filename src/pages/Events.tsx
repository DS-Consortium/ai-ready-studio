import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Calendar, MapPin, ExternalLink, ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const upcomingEvents = [
  {
    id: 1,
    title: "The AI Readiness Roadmap: Shaping Future Institutions",
    date: "Tuesday, February 18, 2025",
    time: "10:00 AM - 12:00 PM GMT+4",
    location: "Online / Dubai",
    lumaUrl: "https://lu.ma/3f35f29k",
    type: "Seminar",
  },
  {
    id: 2,
    title: "Data Governance Masterclass: The Foundation of AI",
    date: "March 17 - 19, 2025",
    time: "9:00 AM - 4:00 PM",
    location: "Nairobi, Kenya",
    lumaUrl: "https://lu.ma/dg-masterclass",
    type: "Masterclass",
  },
  {
    id: 3,
    title: "AI Ethics & Governance: Building Trust in AI",
    date: "Wednesday, March 25, 2025",
    time: "10:00 AM - 1:00 PM",
    location: "Riyadh, Saudi Arabia",
    lumaUrl: "https://lu.ma/ai-ethics-gov",
    type: "Seminar",
  },
  {
    id: 4,
    title: "Applied AI Bootcamp: From Strategy to Execution",
    date: "April 14 - June 20, 2025",
    time: "Ongoing (Hybrid)",
    location: "Accra, Ghana",
    lumaUrl: "https://lu.ma/ai-bootcamp-2025",
    type: "Bootcamp",
  },
  {
    id: 5,
    title: "Cybersecurity for AI Ecosystems",
    date: "Thursday, April 24, 2025",
    time: "2:00 PM - 5:00 PM",
    location: "Lagos, Nigeria",
    lumaUrl: "https://lu.ma/ai-security-2025",
    type: "Workshop",
  },
  {
    id: 6,
    title: "Digital Strategy & Transformation Workshop",
    date: "May 12 - 14, 2025",
    time: "9:00 AM - 5:00 PM",
    location: "New York, USA",
    lumaUrl: "https://lu.ma/digital-strategy-2025",
    type: "Workshop",
  },
  {
    id: 7,
    title: "Operational Change & AI Readiness",
    date: "June 10, 2025",
    time: "10:00 AM - 12:00 PM",
    location: "London, UK",
    lumaUrl: "https://lu.ma/op-change-ai",
    type: "Seminar",
  },
  {
    id: 8,
    title: "Culture, Change & Talent Seminar",
    date: "July 15, 2025",
    time: "10:00 AM - 1:00 PM",
    location: "Singapore",
    lumaUrl: "https://lu.ma/culture-change-talent",
    type: "Seminar",
  },
  {
    id: 9,
    title: "Storytelling with Data Masterclass",
    date: "July 22 - 24, 2025",
    time: "9:00 AM - 4:00 PM",
    location: "Nairobi, Kenya",
    lumaUrl: "https://lu.ma/data-storytelling-2025",
    type: "Masterclass",
  },
  {
    id: 10,
    title: "Cloud-Ready Culture Workshop",
    date: "September 9, 2025",
    time: "10:00 AM - 4:00 PM",
    location: "Dubai, UAE",
    lumaUrl: "https://lu.ma/cloud-ready-culture",
    type: "Workshop",
  },
  {
    id: 11,
    title: "Cross-Market AI Partnerships",
    date: "September 10, 2025",
    time: "2:00 PM - 5:00 PM",
    location: "Accra, Ghana",
    lumaUrl: "https://lu.ma/ai-partnerships",
    type: "Seminar",
  },
  {
    id: 12,
    title: "Pre-UNGA Strategy Review",
    date: "September 17, 2025",
    time: "9:00 AM - 12:00 PM",
    location: "New York, USA",
    lumaUrl: "https://lu.ma/unga-strategy-2025",
    type: "Seminar",
  },
  {
    id: 13,
    title: "Leadership in the Digital Era",
    date: "November 11, 2025",
    time: "10:00 AM - 1:00 PM",
    location: "Riyadh, Saudi Arabia",
    lumaUrl: "https://lu.ma/digital-leadership-2025",
    type: "Seminar",
  },
  {
    id: 14,
    title: "AI Readiness 2025 Closing Session",
    date: "November 18, 2025",
    time: "2:00 PM - 5:00 PM",
    location: "Online / Global",
    lumaUrl: "https://lu.ma/ai-ready-closing",
    type: "Seminar",
  },
];

const Events = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-12 h-1 bg-primary rounded-full" />
              <span className="text-sm font-black uppercase tracking-[0.3em] text-primary">2025 Roadmap</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-display font-black leading-tight mb-6"
            >
              Upcoming <span className="text-muted-foreground italic">Seminars</span>
            </motion.h1>
            <p className="text-lg text-muted-foreground font-medium">
              Join our curated sessions to deepen your AI expertise. Register via Luma for access to live events and materials.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card border border-border rounded-3xl p-8 hover:border-primary/50 transition-all hover:shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <span className="px-4 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
                      {event.type}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-display font-black mb-4 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/50">
                    <Button asChild className="w-full rounded-2xl h-12 font-bold gap-2">
                      <a href={event.lumaUrl} target="_blank" rel="noopener noreferrer">
                        Register on Luma <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
