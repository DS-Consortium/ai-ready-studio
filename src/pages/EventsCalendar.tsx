/**
 * Events Calendar Page
 * Shows upcoming events with detailed view using real database data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Users, Share2, Bookmark, BookmarkCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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

const EventCard = ({ event, isRegistered }: { event: Event; isRegistered: boolean }) => {
  const categoryColors: Record<string, string> = {
    workshop: 'from-blue-500 to-blue-600',
    seminar: 'from-purple-500 to-purple-600',
    masterclass: 'from-emerald-500 to-emerald-600',
    bootcamp: 'from-red-500 to-red-600',
    webinar: 'from-orange-500 to-orange-600',
  };

  const color = categoryColors[event.event_type?.toLowerCase() || 'seminar'];
  const eventDate = event.event_date ? format(parseISO(event.event_date), 'MMM dd, yyyy') : 'TBD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg overflow-hidden border border-border hover:shadow-lg transition"
    >
      {/* Event Header */}
      <div className={`bg-gradient-to-r ${color} p-4 text-white`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full capitalize">
            {event.event_type}
          </span>
          <button className="text-white hover:scale-110 transition">
            {isRegistered ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>
        <h3 className="font-bold text-lg">{event.title}</h3>
      </div>

      {/* Event Details */}
      <div className="p-4 space-y-3">
        {/* Date */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">{eventDate}</p>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="font-medium">{event.location}</p>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1"
            variant={isRegistered ? 'outline' : 'default'}
            onClick={() => window.open('https://dsconsortium.com/events', '_blank')}
          >
            {isRegistered ? 'Registered' : 'Register'}
          </Button>
          <Button size="sm" variant="outline" className="px-2">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const EventsCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const fetchRegistrations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('event_registrations')
      .select('event_id, status')
      .eq('user_id', user.id);

    if (data) {
      setRegistrations(data);
    }
  };

  const isRegistered = (eventId: string) => {
    return registrations.some((r) => r.event_id === eventId);
  };

  const registeredEvents = events.filter((e) => isRegistered(e.id));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Events</h1>
            </div>
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="upcoming" className="flex-1">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="registered" className="flex-1">
                My Events ({registeredEvents.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Events List */}
      <div className="container px-4 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'upcoming' ? (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {events.length} upcoming events
            </div>
            <div className="space-y-4">
              {events.length > 0 ? (
                events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={isRegistered(event.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {registeredEvents.length > 0 ? (
              <div className="space-y-4">
                {registeredEvents.map((event) => (
                  <EventCard key={event.id} event={event} isRegistered={true} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  You haven't registered for any events yet
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('upcoming')}>
                  Browse Events
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};;

export default EventsCalendar;
