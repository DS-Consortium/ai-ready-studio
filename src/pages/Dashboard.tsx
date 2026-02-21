import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { 
  Video, 
  Trophy, 
  Calendar, 
  Gift, 
  LogOut, 
  Plus, 
  Play,
  Heart,
  Eye,
  Settings,
  Home,
  Shield
} from "lucide-react";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface UserVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  is_submitted: boolean;
  is_approved: boolean;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [stats, setStats] = useState({ totalVotes: 0, totalViews: 0, totalVideos: 0, registeredEvents: 0, availableRewards: 0, leaderboardRank: "-" });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchVideos();
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
    }
  };

  const fetchVideos = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("videos")
      .select("id, title, video_url, thumbnail_url, views_count, is_submitted, is_approved, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) {
      setVideos(data);
      
      // Calculate stats
      const totalViews = data.reduce((sum, v) => sum + (v.views_count || 0), 0);
      
      // Fetch additional stats
      const { count: eventCount } = await supabase.from("event_registrations").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
      const { count: voteCount } = await supabase.from("votes").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
      
      setStats({
        totalVideos: data.length,
        totalViews,
        totalVotes: voteCount || 0,
        registeredEvents: eventCount || 0,
        availableRewards: 0, // Logic for rewards
        leaderboardRank: "1,240" // Placeholder for rank
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <span className="font-display font-bold">AI Ready</span>
          </Link>

          <div className="flex items-center gap-3">
            <QRCodeGenerator url={window.location.origin} title="Share App" />
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/admin">
                  <Shield className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold">
            Welcome back, {profile?.display_name || user?.email?.split("@")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to share your AI declaration with the world?
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <Link to="/record">
            <div className="group relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground transition-all hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <Plus className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg">Create Video</h3>
              <p className="text-sm opacity-80">Record your AI declaration</p>
            </div>
          </Link>

          <Link to="/gallery">
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <Trophy className="h-8 w-8 mb-3 text-amber-500" />
              <h3 className="font-semibold text-lg">Leaderboard</h3>
              <p className="text-sm text-muted-foreground">Rank: #{stats.leaderboardRank}</p>
            </div>
          </Link>

          <Link to="/events">
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <Calendar className="h-8 w-8 mb-3 text-blue-500" />
              <h3 className="font-semibold text-lg">Events</h3>
              <p className="text-sm text-muted-foreground">{stats.registeredEvents} Registered</p>
            </div>
          </Link>

          <Link to="/rewards">
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <Gift className="h-8 w-8 mb-3 text-pink-500" />
              <h3 className="font-semibold text-lg">Rewards</h3>
              <p className="text-sm text-muted-foreground">{stats.availableRewards} Available</p>
            </div>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-3 mb-8"
        >
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
                <p className="text-sm text-muted-foreground">Videos Created</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
                <p className="text-sm text-muted-foreground">Total Votes</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* My Videos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">My Videos</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/record">
                <Plus className="h-4 w-4 mr-2" />
                New Video
              </Link>
            </Button>
          </div>

          {videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI declaration video and share it with the world!
              </p>
              <Button asChild>
                <Link to="/record">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Video
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-full"
                        onClick={() => window.open(video.video_url, '_blank')}
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    </div>
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      {video.is_approved ? (
                        <span className="px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                          Approved
                        </span>
                      ) : video.is_submitted ? (
                        <span className="px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-medium">
                          Pending
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{video.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {video.views_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
