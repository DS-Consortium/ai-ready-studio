import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Trophy, CreditCard } from "lucide-react";
import { PURCHASE_PACKS, getUserCredits, UserCredits } from "@/lib/credits";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const CreditsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      loadCredits();
    }
  }, [user, isOpen]);

  const loadCredits = async () => {
    if (!user) return;
    const data = await getUserCredits(user.id);
    setCredits(data);
  };

  const handlePurchase = async (packId: string) => {
    setLoading(true);
    // Simulate payment gateway
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Payment successful! Credits added to your account.");
    await loadCredits();
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Voting Credits
          </DialogTitle>
          <DialogDescription>
            Boost your favorite leaders or your own rank with Power Votes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-primary/5 rounded-2xl p-4 mb-6 border border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Balance</p>
              <p className="text-3xl font-display font-black text-primary">{credits?.balance || 0} <span className="text-sm font-normal text-muted-foreground">Credits</span></p>
            </div>
            <Zap className="h-10 w-10 text-primary animate-pulse" />
          </div>

          <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Power Packs</h4>
          <div className="space-y-3">
            {PURCHASE_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handlePurchase(pack.id)}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-card hover:bg-muted border border-border hover:border-primary/50 rounded-2xl p-4 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold">{pack.name}</p>
                    <p className="text-xs text-muted-foreground">{pack.credits} Credits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-lg">${pack.price}</p>
                  <p className="text-[10px] text-primary font-bold uppercase">Buy Now</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-2">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CreditCard className="h-3 w-3" /> Secure checkout powered by LeGroupeDS
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
