import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AI_FILTERS, getFilterColor, getFilterById } from "@/lib/filters";
import { SocialShare } from "@/components/SocialShare";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { submitVote, getUserBalance, purchaseCredits } from "@/lib/voting";
import {
  ArrowLeft,
  Heart,
  Eye,
  Play,
  TrendingUp,
  Clock,
  Filter,
  Trophy,
  Coins,
  X,
  ChevronRight
} from "lucide-react";

interface GalleryVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  filter_id: string | null;
  created_at: string;
  user_id: string;
  total_votes?: number;
}

const Gallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");
  const [balance, setBalance] = useState(0);
  const [votingVideo, setVotingVideo] = useState<GalleryVideo | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  useEffect(() => {
    fetchVideos();
    if (user) refreshBalance();
  }, [activeFilter, sortBy, user]);

  const refreshBalance = async () => {
    const b = await getUserBalance();
    setBalance(b);
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("videos")
        .select(`
          id, title, video_url, thumbnail_url, views_count, filter_id, created_at, user_id,
          votes:votes(amount)
        `)
        .eq("is_approved", true);

      if (activeFilter) query = query.eq("filter_id", activeFilter);
      
      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data as any[]).map(v => ({
        ...v,
        total_votes: v.votes?.reduce((sum: number, vote: any) => sum + (vote.amount || 0), 0) || 0
      }));

      if (sortBy === "recent") {
        formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        formatted.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
      }

      setVideos(formatted);
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (points: number) => {
    if (!user || !votingVideo) return;
    
    try {
      await submitVote(votingVideo.id, points);
      toast({ title: "Vote Cast!", description: `You used ${points} credits to support this video.` });
      setVotingVideo(null);
      refreshBalance();
      fetchVideos();
    } catch (err: any) {
      toast({ title: "Voting Failed", description: err.message, variant: "destructive" });
      if (err.message.includes("Insufficient")) setShowBuyCredits(true);
    }
  };

  const handleBuyCredits = async (amount: number, points: number) => {
    const success = await purchaseCredits(amount, points);
    if (success) {
      toast({ title: "Credits Added!", description: `Successfully added ${points} voting credits.` });
      refreshBalance();
      setShowBuyCredits(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{balance} Credits</span>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowBuyCredits(true)}>Top Up</Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
            <button onClick={() => setSortBy("popular")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "popular" ? "bg-background shadow-sm" : "text-muted-foreground"}`}><Trophy className="h-4 w-4" /> Popular</button>
            <button onClick={() => setSortBy("recent")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "recent" ? "bg-background shadow-sm" : "text-muted-foreground"}`}><Clock className="h-4 w-4" /> Recent</button>
          </div>
          <div className="h-6 w-px bg-border" />
          <button onClick={() => setActiveFilter(null)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>All</button>
          {AI_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === f.id ? "text-white" : "bg-muted text-muted-foreground"}`} style={activeFilter === f.id ? { backgroundColor: getFilterColor(f.id) } : undefined}>{f.shortName}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, index) => {
              const filter = video.filter_id ? getFilterById(video.filter_id) : null;
              return (
                <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="group rounded-3xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl">
                  <div className="aspect-[9/16] bg-black relative">
                    <video src={video.video_url} className="w-full h-full object-cover" muted playsInline onMouseOver={e => e.currentTarget.play()} onMouseOut={e => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {filter && <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1.5" style={{ backgroundColor: getFilterColor(filter.id) }}><filter.icon className="h-3 w-3" /> {filter.shortName}</div>}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div className="text-white">
                        <h3 className="font-bold text-lg leading-tight">{video.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                          <span className="flex items-center gap-1"><Heart className="h-4 w-4 fill-primary text-primary" /> {video.total_votes}</span>
                          <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {video.views_count}</span>
                        </div>
                      </div>
                      <Button onClick={() => setVotingVideo(video)} className="rounded-full h-12 w-12 p-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/40"><Heart className="h-6 w-6 fill-white" /></Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Voting Modal */}
      <AnimatePresence>
        {votingVideo && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-card w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Support Creator</h3>
                <Button variant="ghost" size="icon" onClick={() => setVotingVideo(null)}><X /></Button>
              </div>
              <p className="text-muted-foreground mb-8 text-center">How many voting credits would you like to cast for <strong>{votingVideo.title}</strong>?</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 5, 10, 20, 50, 100].map(pts => (
                  <button key={pts} onClick={() => handleVote(pts)} className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group">
                    <span className="text-xl font-black group-hover:text-primary">{pts}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Credits</span>
                  </button>
                ))}
              </div>
              <div className="bg-muted/50 p-4 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /><span className="font-bold">{balance} Credits Left</span></div>
                <Button variant="link" onClick={() => setShowBuyCredits(true)} className="p-0 h-auto">Top Up <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          </div>
        )}

        {showBuyCredits && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-border text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><Coins className="h-10 w-10 text-primary" /></div>
              <h3 className="text-2xl font-bold mb-2">Get Voting Credits</h3>
              <p className="text-muted-foreground mb-8">Support your favorite creators and help them climb the leaderboard!</p>
              <div className="space-y-3">
                {[
                  { label: "Starter Pack", pts: 100, price: 5 },
                  { label: "Supporter Pack", pts: 500, price: 20 },
                  { label: "Whale Pack", pts: 2000, price: 50 }
                ].map(pack => (
                  <Button key={pack.pts} onClick={() => handleBuyCredits(pack.price, pack.pts)} variant="outline" className="w-full h-16 rounded-2xl flex justify-between px-6 border-2 hover:border-primary">
                    <div className="text-left"><div className="font-bold">{pack.pts} Credits</div><div className="text-xs text-muted-foreground">{pack.label}</div></div>
                    <div className="text-primary font-black">${pack.price}</div>
                  </Button>
                ))}
              </div>
              <Button variant="ghost" className="mt-6 w-full" onClick={() => setShowBuyCredits(false)}>Maybe Later</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
