/**
 * Events Calendar Page
 * Shows upcoming events and user registrations
 */

import { useState } from 'react';
import { Calendar, MapPin, Users, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  speakers: string[];
  capacity: number;
  registered: number;
  image?: string;
  color: string;
  category: 'Seminar' | 'Workshop' | 'Masterclass' | 'Webinar';
  isRegistered?: boolean;
}

const UPCOMING_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Mastering AI in 2026',
    date: 'March 15, 2026',
    time: '10:00 AM - 12:00 PM',
    location: 'Dubai, UAE',
    description: 'Deep dive into advanced AI applications and strategies for 2026',
    speakers: ['Dr. Sarah Chen', 'Prof. Marcus Johnson'],
    capacity: 50,
    registered: 38,
    color: 'from-blue-500 to-blue-600',
    category: 'Seminar',
    isRegistered: true,
  },
  {
    id: '2',
    title: 'Data Governance Masterclass',
    date: 'March 17-19, 2026',
    time: '9:00 AM - 5:00 PM',
    location: 'Riyadh, Saudi Arabia',
    description: 'Comprehensive training on data governance frameworks',
    speakers: ['Dr. Amina Hassan', 'James Wilson'],
    capacity: 30,
    registered: 24,
    color: 'from-purple-500 to-purple-600',
    category: 'Masterclass',
    isRegistered: false,
  },
  {
    id: '3',
    title: 'AI Ethics & Responsible Innovation',
    date: 'March 25, 2026',
    time: '2:00 PM - 4:30 PM',
    location: 'Washington D.C., USA',
    description: 'Ethics frameworks and responsible AI deployment',
    speakers: ['Dr. David Okonkwo', 'Elena Rodriguez'],
    capacity: 40,
    registered: 32,
    color: 'from-emerald-500 to-emerald-600',
    category: 'Seminar',
    isRegistered: false,
  },
  {
    id: '4',
    title: 'Cybersecurity for AI Ecosystems',
    date: 'April 10, 2026',
    time: '3:00 PM - 5:00 PM',
    location: 'Accra, Ghana',
    description: 'Protecting AI systems from emerging threats',
    speakers: ['Dr. Kwame Mensah'],
    capacity: 45,
    registered: 18,
    color: 'from-red-500 to-red-600',
    category: 'Workshop',
    isRegistered: false,
  },
  {
    id: '5',
    title: 'Applied AI Bootcamp',
    date: 'April - June 2026',
    time: 'Self-paced',
    location: 'Online',
    description: '12-week intensive bootcamp on practical AI implementation',
    speakers: ['Industry Practitioners'],
    capacity: 100,
    registered: 67,
    color: 'from-orange-500 to-orange-600',
    category: 'Webinar',
    isRegistered: true,
  },
  {
    id: '6',
    title: 'Digital Strategy & Transformation',
    date: 'May 5-7, 2026',
    time: '9:00 AM - 5:00 PM',
    location: 'Lagos, Nigeria',
    description: 'Transform your organization in the digital age',
    speakers: ['Dr. Chike Obi', 'Zainab Ahmed'],
    capacity: 50,
    registered: 35,
    color: 'from-pink-500 to-pink-600',
    category: 'Workshop',
    isRegistered: false,
  },
];

const EventCard = ({ event, isRegistered }: { event: Event; isRegistered: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg overflow-hidden border border-border hover:shadow-lg transition"
    >
      {/* Event Header */}
      <div className={`bg-gradient-to-r ${event.color} p-4 text-white`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">
            {event.category}
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
        {/* Date & Time */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">{event.date}</p>
            <p className="text-muted-foreground">{event.time}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="font-medium">{event.location}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

        {/* Speakers */}
        <div className="flex flex-wrap gap-1">
          {event.speakers.map((speaker) => (
            <span key={speaker} className="text-xs bg-muted px-2 py-1 rounded-full">
              {speaker}
            </span>
          ))}
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <p>
            <span className="font-medium">{event.registered}</span>
            <span className="text-muted-foreground">/{event.capacity} registered</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`bg-gradient-to-r ${event.color} h-full transition`}
            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1"
            variant={isRegistered ? 'outline' : 'default'}
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
  const [activeTab, setActiveTab] = useState('upcoming');
  const registeredEvents = UPCOMING_EVENTS.filter((e) => e.isRegistered);
  const upcomingEvents = UPCOMING_EVENTS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Events & Calendar</h1>
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
      <div className="px-4 py-6 space-y-4">
        {activeTab === 'upcoming' && (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {upcomingEvents.length} upcoming events
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={event.isRegistered || false}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === 'registered' && (
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
};

export default EventsCalendar;
