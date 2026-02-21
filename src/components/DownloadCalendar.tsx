import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Download, X, ExternalLink, Apple, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RegisteredEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  event_type: string;
}

interface DownloadCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Formats a Date object into the iCalendar YYYYMMDDTHHMMSSZ format.
 */
const toICalDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

/**
 * Generates an iCalendar (.ics) string from a list of events.
 */
const generateICS = (events: RegisteredEvent[]): string => {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DS Consortium//AI Ready Studio//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:AI Ready – My Registered Events",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    const start = new Date(event.event_date);
    // Default event duration: 2 hours
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@ai-ready-studio.dsconsortium`);
    lines.push(`DTSTAMP:${toICalDate(new Date())}`);
    lines.push(`DTSTART:${toICalDate(start)}`);
    lines.push(`DTEND:${toICalDate(end)}`);
    lines.push(`SUMMARY:${event.title}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

/**
 * Builds a Google Calendar "Add Event" URL for a single event.
 */
const buildGoogleCalendarUrl = (event: RegisteredEvent): string => {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toICalDate(start)}/${toICalDate(end)}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const DownloadCalendar = ({ open, onOpenChange }: DownloadCalendarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<RegisteredEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchRegisteredEvents();
    }
  }, [open, user]);

  const fetchRegisteredEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id);

      if (!registrations || registrations.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const eventIds = registrations.map((r) => r.event_id);
      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, description, event_date, location, event_type")
        .in("id", eventIds)
        .order("event_date", { ascending: true });

      setEvents(eventData || []);
    } catch {
      toast({ title: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadICS = () => {
    if (events.length === 0) return;
    const icsContent = generateICS(events);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-ready-my-events.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Calendar downloaded", description: "Open the .ics file to import into your calendar app." });
  };

  const openGoogleCalendar = () => {
    if (events.length === 0) return;
    // Open each event in Google Calendar (first event opens immediately; others in new tabs)
    events.forEach((event, i) => {
      const url = buildGoogleCalendarUrl(event);
      if (i === 0) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), i * 300);
      }
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-md bg-background border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Download Calendar</h2>
                  <p className="text-xs text-muted-foreground">Your registered events only</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !user ? (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-semibold mb-1">Sign in required</p>
                  <p className="text-sm text-muted-foreground">
                    Please sign in to download your personalised calendar.
                  </p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-semibold mb-1">No registered events</p>
                  <p className="text-sm text-muted-foreground">
                    Register for events on the Events page and they will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Event list */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {events.length} event{events.length !== 1 ? "s" : ""} will be exported:
                  </p>
                  <ul className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
                    {events.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-start gap-3 rounded-xl border border-border bg-accent/30 p-3"
                      >
                        <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium leading-tight">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(event.event_date), "MMM d, yyyy • h:mm a")}
                            {event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Download options */}
                  <div className="space-y-3">
                    <Button className="w-full gap-2" onClick={downloadICS}>
                      <Download className="h-4 w-4" />
                      Download .ics (iCalendar / Apple / Outlook)
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={openGoogleCalendar}>
                      <Globe className="h-4 w-4" />
                      Add to Google Calendar
                      <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    The .ics file works with Apple Calendar, Outlook, and any standard calendar app.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
