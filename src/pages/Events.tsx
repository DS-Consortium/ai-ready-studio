import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getFilterById, getFilterColor } from "@/lib/filters";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  event_type: string;
  filter_id: string | null;
  max_attendees: number | null;
  registration_deadline: string | null;
}

interface Registration {
  event_id: string;
  status: string;
}

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("event_date", { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const fetchRegistrations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("event_registrations")
      .select("event_id, status")
      .eq("user_id", user.id);

    if (data) {
      setRegistrations(data);
    }
  };

  const isRegistered = (eventId: string) => {
    return registrations.some((r) => r.event_id === eventId);
  };

  const handleRegister = async (eventId: string) => {
    // Lead to main website for paid registrations
    window.open("https://legroupeds.com/events", "_blank");
    
    // Optionally still record the intent in Supabase
    if (user) {
      try {
        await supabase.from("event_registrations").upsert({
          event_id: eventId,
          user_id: user.id,
          status: "interested",
        });
        fetchRegistrations();
      } catch (e) {
        console.error("Failed to record interest:", e);
      }
    }
  };

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      workshop: "Workshop",
      seminar: "Seminar",
      masterclass: "Masterclass",
      bootcamp: "Bootcamp",
      webinar: "Webinar",
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="font-display font-bold">Events & Workshops</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-4">
            2026 Roadmap
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Upcoming Events
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our workshops, seminars, and masterclasses to level up your AI readiness.
            Each event is linked to an AI identity filter.
          </p>
        </motion.div>

        {/* Events list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No events scheduled</h3>
            <p className="text-muted-foreground">
              Check back soon for upcoming workshops and seminars!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => {
              const filter = event.filter_id
                ? getFilterById(event.filter_id)
                : null;
              const registered = isRegistered(event.id);
              const isPast = new Date(event.event_date) < new Date();

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-lg ${
                    isPast
                      ? "border-border opacity-60"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Color accent */}
                    <div
                      className="w-full md:w-2 h-2 md:h-auto flex-shrink-0"
                      style={{
                        backgroundColor: filter
                          ? getFilterColor(filter.id)
                          : "hsl(var(--primary))",
                      }}
                    />

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          {/* Type & Filter badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              {getEventTypeLabel(event.event_type)}
                            </span>
                            {filter && (
                              <span
                                className="px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1.5"
                                style={{
                                  backgroundColor: getFilterColor(filter.id),
                                }}
                              >
                                <filter.icon className="h-3 w-3" />
                                {filter.shortName}
                              </span>
                            )}
                            {isPast && (
                              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                                Past Event
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-display text-xl font-semibold mb-2">
                            {event.title}
                          </h3>

                          {/* Description */}
                          {event.description && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(event.event_date), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(event.event_date), "h:mm a")}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.max_attendees && (
                              <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{event.max_attendees} spots</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 lg:flex-shrink-0">
                          {!isPast && (
                            <Button
                              onClick={() => handleRegister(event.id)}
                              disabled={registering === event.id}
                              variant={registered ? "outline" : "default"}
                              className="gap-2"
                            >
                              {registering === event.id ? (
                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : registered ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Registered
                                </>
                              ) : (
                                "Register Now"
                              )}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* My Registrations section */}
        {user && registrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16"
          >
            <h3 className="font-display text-xl font-bold mb-6">
              My Registrations ({registrations.length})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events
                .filter((e) => isRegistered(e.id))
                .map((event) => {
                  const filter = event.filter_id
                    ? getFilterById(event.filter_id)
                    : null;

                  return (
                    <div
                      key={event.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: filter
                              ? getFilterColor(filter.id)
                              : "hsl(var(--primary))",
                          }}
                        >
                          {filter ? (
                            <filter.icon className="h-5 w-5 text-white" />
                          ) : (
                            <Calendar className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {event.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.event_date), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Events;
