import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import {
  ArrowLeft,
  Calendar,
  Video,
  Gift,
  Ticket,
  Users,
  Check,
  X,
  Play,
  Trash2,
  Plus,
  Trophy,
  QrCode,
  Settings,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface AdminVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  is_approved: boolean;
  is_submitted: boolean;
  created_at: string;
  user_id: string;
  filter_id: string | null;
}

interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  event_type: string;
  filter_id: string | null;
  max_attendees: number | null;
  is_active: boolean;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  valid_until: string | null;
}

interface VideoWithVotes extends AdminVideo {
  vote_count: number;
}

interface Winner {
  id: string;
  video_id: string;
  rank: number;
  selected_at: string;
}

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");

  // Data states
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [videosWithVotes, setVideosWithVotes] = useState<VideoWithVotes[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [prizeDraws, setPrizeDraws] = useState<PrizeDraw[]>([]);

  // Form states
  const [showEventForm, setShowEventForm] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showDrawForm, setShowDrawForm] = useState(false);

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "Online",
    event_type: "workshop",
    filter_id: "",
    max_attendees: "",
  });

  // New discount code form
  const [newCode, setNewCode] = useState({
    code: "",
    discount_percent: "",
    description: "",
    max_uses: "",
    valid_until: "",
  });

  // New prize draw form
  const [newDraw, setNewDraw] = useState({
    title: "",
    description: "",
    prize_description: "",
    draw_date: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      checkAdminRole();
    }
  }, [user, loading]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
    setCheckingRole(false);

    if (data) {
      fetchAllData();
    }
  };

  const fetchAllData = async () => {
    const [videosRes, eventsRes, codesRes, drawsRes, votesRes, winnersRes] = await Promise.all([
      supabase.from("videos").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("discount_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("prize_draws").select("*").order("draw_date", { ascending: true }),
      supabase.from("votes").select("video_id, count").eq("is_active", true),
      supabase.from("winners").select("*").order("rank", { ascending: true }),
    ]);

    if (videosRes.data) {
      setVideos(videosRes.data);
      // Calculate vote counts for each video
      const voteCounts = votesRes.data?.reduce((acc: Record<string, number>, vote) => {
        acc[vote.video_id] = vote.count;
        return acc;
      }, {}) || {};

      const videosWithVotesData = videosRes.data
        .filter(v => v.is_approved)
        .map(video => ({
          ...video,
          vote_count: voteCounts[video.id] || 0,
        }))
        .sort((a, b) => b.vote_count - a.vote_count);

      setVideosWithVotes(videosWithVotesData);
    }
    if (eventsRes.data) setEvents(eventsRes.data);
    if (codesRes.data) setDiscountCodes(codesRes.data);
    if (drawsRes.data) setPrizeDraws(drawsRes.data);
    if (winnersRes.data) setWinners(winnersRes.data);
  };

  const approveVideo = async (videoId: string, approve: boolean) => {
    const { error } = await supabase
      .from("videos")
      .update({ is_approved: approve })
      .eq("id", videoId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: approve ? "Video approved" : "Video rejected" });
      fetchAllData();
    }
  };

  const deleteVideo = async (videoId: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", videoId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Video deleted" });
      fetchAllData();
    }
  };

  const createEvent = async () => {
    const { error } = await supabase.from("events").insert({
      title: newEvent.title,
      description: newEvent.description || null,
      event_date: new Date(newEvent.event_date).toISOString(),
      location: newEvent.location || null,
      event_type: newEvent.event_type,
      filter_id: newEvent.filter_id || null,
      max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null,
      is_active: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event created!" });
      setShowEventForm(false);
      setNewEvent({
        title: "",
        description: "",
        event_date: "",
        location: "Online",
        event_type: "workshop",
        filter_id: "",
        max_attendees: "",
      });
      fetchAllData();
    }
  };

  const toggleEventActive = async (eventId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("events")
      .update({ is_active: !isActive })
      .eq("id", eventId);

    if (!error) {
      fetchAllData();
    }
  };

  const createDiscountCode = async () => {
    const { error } = await supabase.from("discount_codes").insert({
      code: newCode.code.toUpperCase(),
      discount_percent: parseInt(newCode.discount_percent),
      description: newCode.description || null,
      max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
      valid_until: newCode.valid_until ? new Date(newCode.valid_until).toISOString() : null,
      is_active: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Discount code created!" });
      setShowCodeForm(false);
      setNewCode({ code: "", discount_percent: "", description: "", max_uses: "", valid_until: "" });
      fetchAllData();
    }
  };

  const createPrizeDraw = async () => {
    const { error } = await supabase.from("prize_draws").insert({
      title: newDraw.title,
      description: newDraw.description || null,
      prize_description: newDraw.prize_description,
      draw_date: new Date(newDraw.draw_date).toISOString(),
      is_completed: false,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prize draw created!" });
      setShowDrawForm(false);
      setNewDraw({ title: "", description: "", prize_description: "", draw_date: "" });
      fetchAllData();
    }
  };

  // Returns a cryptographically secure random integer in the range [0, max)
  const getSecureRandomInt = (max: number): number => {
    if (max <= 0) {
      return 0;
    }

    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    const limit = Math.floor((maxUint32 + 1) / max) * max;

    while (true) {
      window.crypto.getRandomValues(array);
      const randomValue = array[0];
      if (randomValue < limit) {
        return randomValue % max;
      }
    }
  };

  const selectWinners = async (topCount: number = 3) => {
    const topVideos = videosWithVotes.slice(0, topCount);

    // Clear existing winners
    await supabase.from("winners").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert new winners
    const winnersData = topVideos.map((video, index) => ({
      video_id: video.id,
      rank: index + 1,
    }));

    const { error } = await supabase.from("winners").insert(winnersData);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Winners selected!", description: `Top ${topCount} videos selected as winners.` });
      fetchAllData();
    }
  };

  const clearWinners = async () => {
    const { error } = await supabase.from("winners").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Winners cleared" });
      fetchAllData();
    }
  };

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Settings className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have admin privileges.</p>
        <Button asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

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
          <h1 className="font-display font-bold">Admin Dashboard</h1>
          <QRCodeGenerator url={appUrl} title="Share App" />
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Video className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{videos.length}</p>
            <p className="text-sm text-muted-foreground">Videos</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Calendar className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Ticket className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{discountCodes.length}</p>
            <p className="text-sm text-muted-foreground">Discount Codes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Trophy className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{prizeDraws.length}</p>
            <p className="text-sm text-muted-foreground">Prize Draws</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="winners" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Winners</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="codes" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Codes</span>
            </TabsTrigger>
            <TabsTrigger value="draws" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Draws</span>
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Video Moderation</h2>
              <p className="text-sm text-muted-foreground">
                {videos.filter((v) => v.is_submitted && !v.is_approved).length} pending approval
              </p>
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No videos yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{video.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(video.created_at), "MMM d, yyyy")}
                        {video.filter_id && ` • ${video.filter_id}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.is_submitted ? (
                        video.is_approved ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                            Approved
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveVideo(video.id, true)}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveVideo(video.id, false)}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )
                      ) : (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                          Draft
                        </span>
                      )}
                      <QRCodeGenerator
                        url={`${appUrl}/gallery?video=${video.id}`}
                        title={video.title}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteVideo(video.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Event Management</h2>
              <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="event-title">Title</Label>
                      <Input
                        id="event-title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-desc">Description</Label>
                      <Textarea
                        id="event-desc"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Event description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event-date">Date & Time</Label>
                        <Input
                          id="event-date"
                          type="datetime-local"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-type">Type</Label>
                        <Select
                          value={newEvent.event_type}
                          onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="seminar">Seminar</SelectItem>
                            <SelectItem value="masterclass">Masterclass</SelectItem>
                            <SelectItem value="bootcamp">Bootcamp</SelectItem>
                            <SelectItem value="webinar">Webinar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event-location">Location</Label>
                        <Input
                          id="event-location"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                          placeholder="Online"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-attendees">Max Attendees</Label>
                        <Input
                          id="event-attendees"
                          type="number"
                          value={newEvent.max_attendees}
                          onChange={(e) => setNewEvent({ ...newEvent, max_attendees: e.target.value })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="event-filter">Linked AI Filter</Label>
                      <Select
                        value={newEvent.filter_id}
                        onValueChange={(v) => setNewEvent({ ...newEvent, filter_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ready">AI Ready</SelectItem>
                          <SelectItem value="savvy">AI Savvy</SelectItem>
                          <SelectItem value="accountable">AI Accountable</SelectItem>
                          <SelectItem value="driven">AI Driven</SelectItem>
                          <SelectItem value="enabler">AI Enabler</SelectItem>
                          <SelectItem value="building">Building Institutions</SelectItem>
                          <SelectItem value="leading">Leading Responsibly</SelectItem>
                          <SelectItem value="shaping">Shaping Ecosystems</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createEvent} className="w-full">
                      Create Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border bg-card ${
                      event.is_active ? "border-border" : "border-border opacity-60"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), "MMM d, yyyy • h:mm a")}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          event.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {event.is_active ? "Active" : "Inactive"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleEventActive(event.id, event.is_active)}
                      >
                        {event.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discount Codes Tab */}
          <TabsContent value="codes" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Discount Codes</h2>
              <Dialog open={showCodeForm} onOpenChange={setShowCodeForm}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Discount Code</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        value={newCode.code}
                        onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                        placeholder="SAVE20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount">Discount %</Label>
                        <Input
                          id="discount"
                          type="number"
                          value={newCode.discount_percent}
                          onChange={(e) => setNewCode({ ...newCode, discount_percent: e.target.value })}
                          placeholder="20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-uses">Max Uses</Label>
                        <Input
                          id="max-uses"
                          type="number"
                          value={newCode.max_uses}
                          onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="code-desc">Description</Label>
                      <Input
                        id="code-desc"
                        value={newCode.description}
                        onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                        placeholder="20% off all services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valid-until">Valid Until</Label>
                      <Input
                        id="valid-until"
                        type="datetime-local"
                        value={newCode.valid_until}
                        onChange={(e) => setNewCode({ ...newCode, valid_until: e.target.value })}
                      />
                    </div>
                    <Button onClick={createDiscountCode} className="w-full">
                      Create Code
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {discountCodes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No discount codes yet</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {discountCodes.map((code) => (
                  <div
                    key={code.id}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <code className="px-3 py-1 bg-primary text-primary-foreground rounded-lg font-mono font-bold">
                        {code.code}
                      </code>
                      <span className="text-2xl font-bold text-primary">
                        {code.discount_percent}%
                      </span>
                    </div>
                    {code.description && (
                      <p className="text-sm text-muted-foreground mb-2">{code.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {code.current_uses}/{code.max_uses || "∞"} uses
                      </span>
                      {code.valid_until && (
                        <span>Until {format(new Date(code.valid_until), "MMM d")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Prize Draws Tab */}
          <TabsContent value="draws" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Prize Draws</h2>
              <Dialog open={showDrawForm} onOpenChange={setShowDrawForm}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Draw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Prize Draw</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="draw-title">Title</Label>
                      <Input
                        id="draw-title"
                        value={newDraw.title}
                        onChange={(e) => setNewDraw({ ...newDraw, title: e.target.value })}
                        placeholder="Weekly Prize Draw"
                      />
                    </div>
                    <div>
                      <Label htmlFor="draw-desc">Description</Label>
                      <Textarea
                        id="draw-desc"
                        value={newDraw.description}
                        onChange={(e) => setNewDraw({ ...newDraw, description: e.target.value })}
                        placeholder="Enter to win..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="prize">Prize</Label>
                      <Input
                        id="prize"
                        value={newDraw.prize_description}
                        onChange={(e) => setNewDraw({ ...newDraw, prize_description: e.target.value })}
                        placeholder="£100 Amazon Gift Card"
                      />
                    </div>
                    <div>
                      <Label htmlFor="draw-date">Draw Date</Label>
                      <Input
                        id="draw-date"
                        type="datetime-local"
                        value={newDraw.draw_date}
                        onChange={(e) => setNewDraw({ ...newDraw, draw_date: e.target.value })}
                      />
                    </div>
                    <Button onClick={createPrizeDraw} className="w-full">
                      Create Draw
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {prizeDraws.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No prize draws yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prizeDraws.map((draw) => (
                  <div
                    key={draw.id}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{draw.title}</h4>
                        <p className="text-sm text-muted-foreground">{draw.prize_description}</p>
                      </div>
                      {draw.is_completed ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                          Completed
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => runPrizeDraw(draw.id)}>
                          Run Draw
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Draw date: {format(new Date(draw.draw_date), "MMM d, yyyy • h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
