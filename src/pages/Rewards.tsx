import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Gift,
  Ticket,
  Trophy,
  Clock,
  CheckCircle,
  Copy,
  Sparkles,
  Calendar,
  Star,
} from "lucide-react";
import { format } from "date-fns";

interface Reward {
  id: string;
  reward_type: string;
  description: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  expires_at: string | null;
  created_at: string;
  discount_code_id: string | null;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
}

interface PrizeDraw {
  id: string;
  title: string;
  description: string | null;
  draw_date: string;
  prize_description: string;
  is_completed: boolean;
  winner_user_id: string | null;
}

interface DrawEntry {
  draw_id: string;
}

const Rewards = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [discountCodes, setDiscountCodes] = useState<Record<string, DiscountCode>>({});
  const [prizeDraws, setPrizeDraws] = useState<PrizeDraw[]>([]);
  const [myEntries, setMyEntries] = useState<DrawEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch rewards
    const { data: rewardsData } = await supabase
      .from("rewards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (rewardsData) {
      setRewards(rewardsData);

      // Fetch related discount codes
      const codeIds = rewardsData
        .filter((r) => r.discount_code_id)
        .map((r) => r.discount_code_id);

      if (codeIds.length > 0) {
        const { data: codesData } = await supabase
          .from("discount_codes")
          .select("*")
          .in("id", codeIds as string[]);

        if (codesData) {
          const codesMap: Record<string, DiscountCode> = {};
          codesData.forEach((code) => {
            codesMap[code.id] = code;
          });
          setDiscountCodes(codesMap);
        }
      }
    }

    // Fetch prize draws
    const { data: drawsData } = await supabase
      .from("prize_draws")
      .select("*")
      .order("draw_date", { ascending: true });

    if (drawsData) {
      setPrizeDraws(drawsData);
    }

    // Fetch my entries
    const { data: entriesData } = await supabase
      .from("prize_draw_entries")
      .select("draw_id")
      .eq("user_id", user.id);

    if (entriesData) {
      setMyEntries(entriesData);
    }

    setLoading(false);
  };

  const handleClaimReward = async (rewardId: string) => {
    setClaiming(rewardId);

    try {
      await supabase
        .from("rewards")
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", rewardId);

      toast({
        title: "Reward claimed!",
        description: "Check your email for details.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Discount code copied to clipboard.",
    });
  };

  const hasEnteredDraw = (drawId: string) => {
    return myEntries.some((e) => e.draw_id === drawId);
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount":
        return Ticket;
      case "prize":
        return Trophy;
      case "invitation":
        return Calendar;
      default:
        return Gift;
    }
  };

  if (authLoading || loading) {
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
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="font-display font-bold">Rewards & Prizes</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container py-8">
        {/* Hero stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-3 mb-12"
        >
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold">{rewards.length}</p>
            <p className="text-sm text-muted-foreground">Total Rewards</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold">
              {rewards.filter((r) => r.is_claimed).length}
            </p>
            <p className="text-sm text-muted-foreground">Claimed</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold">{myEntries.length}</p>
            <p className="text-sm text-muted-foreground">Draw Entries</p>
          </div>
        </motion.div>

        {/* My Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            My Rewards
          </h2>

          {rewards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No rewards yet</h3>
              <p className="text-muted-foreground mb-4">
                Submit videos and get votes to earn rewards!
              </p>
              <Button asChild>
                <Link to="/record">Create Video</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => {
                const Icon = getRewardIcon(reward.reward_type);
                const discountCode = reward.discount_code_id
                  ? discountCodes[reward.discount_code_id]
                  : null;
                const isExpired =
                  reward.expires_at && new Date(reward.expires_at) < new Date();

                return (
                  <div
                    key={reward.id}
                    className={`rounded-2xl border bg-card overflow-hidden ${
                      reward.is_claimed || isExpired
                        ? "border-border opacity-60"
                        : "border-primary/30"
                    }`}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold capitalize">
                            {reward.reward_type} Reward
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Earned {format(new Date(reward.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        {reward.description ||
                          "Thank you for your participation!"}
                      </p>

                      {/* Discount code display */}
                      {discountCode && (
                        <div className="bg-muted rounded-xl p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Discount Code
                              </p>
                              <p className="font-mono font-bold text-lg">
                                {discountCode.code}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-500">
                                {discountCode.discount_percent}%
                              </p>
                              <p className="text-xs text-muted-foreground">OFF</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3 gap-2"
                            onClick={() => copyCode(discountCode.code)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy Code
                          </Button>
                        </div>
                      )}

                      {/* Expiry */}
                      {reward.expires_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <Clock className="h-3 w-3" />
                          {isExpired
                            ? "Expired"
                            : `Expires ${format(
                                new Date(reward.expires_at),
                                "MMM d, yyyy"
                              )}`}
                        </div>
                      )}

                      {/* Claim button */}
                      {!reward.is_claimed && !isExpired && (
                        <Button
                          className="w-full"
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={claiming === reward.id}
                        >
                          {claiming === reward.id ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Claim Reward"
                          )}
                        </Button>
                      )}

                      {reward.is_claimed && (
                        <div className="flex items-center justify-center gap-2 text-green-500 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Claimed
                        </div>
                      )}

                      {isExpired && !reward.is_claimed && (
                        <div className="text-center text-sm text-muted-foreground">
                          This reward has expired
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Prize Draws */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Star className="h-5 w-5" />
            Fortnightly Prize Draws
          </h2>

          {prizeDraws.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No active draws</h3>
              <p className="text-muted-foreground">
                Check back soon for upcoming prize draws!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {prizeDraws.map((draw) => {
                const isPast = new Date(draw.draw_date) < new Date();
                const entered = hasEnteredDraw(draw.id);
                const isWinner = draw.winner_user_id === user?.id;

                return (
                  <div
                    key={draw.id}
                    className={`rounded-2xl border overflow-hidden ${
                      isWinner
                        ? "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-display text-lg font-semibold">
                            {draw.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {draw.description}
                          </p>
                        </div>
                        {isWinner && (
                          <div className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Winner!
                          </div>
                        )}
                      </div>

                      {/* Prize */}
                      <div className="bg-muted rounded-xl p-4 mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Prize</p>
                        <p className="font-semibold">{draw.prize_description}</p>
                      </div>

                      {/* Date & Status */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(draw.draw_date), "MMM d, yyyy")}
                          </span>
                        </div>

                        {entered && !draw.is_completed && (
                          <span className="flex items-center gap-1 text-green-500 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Entered
                          </span>
                        )}

                        {draw.is_completed && !isWinner && (
                          <span className="text-muted-foreground">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Rewards;
