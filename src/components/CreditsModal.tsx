import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Trophy, CreditCard, Loader2 } from "lucide-react";
import { PURCHASE_PACKS, getUserCredits, UserCredits } from "@/lib/credits";
import { initiateStripeCheckout } from "@/lib/stripe-integration";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const CreditsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPack, setProcessingPack] = useState<string | null>(null);

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

  const handlePurchase = async (packId: string, credits: number, price: number) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    setProcessingPack(packId);
    setLoading(true);

    try {
      // Initiate Stripe checkout session
      const { sessionId, url } = await initiateStripeCheckout({
        packId,
        credits,
        price,
        customerEmail: user.email,
        userId: user.id,
      });

      // Redirect to Stripe checkout or open in new window
      if (url) {
        window.location.href = url;
      } else {
        toast.info(`Checkout session created. Session ID: ${sessionId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process payment. Please try again.");
    } finally {
      setProcessingPack(null);
      setLoading(false);
    }
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
                onClick={() => handlePurchase(pack.id, pack.credits, pack.price)}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-card hover:bg-muted border border-border hover:border-primary/50 rounded-2xl p-4 transition-all text-left flex items-center justify-between disabled:opacity-50"
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
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-display font-bold text-lg">${pack.price}</p>
                    <p className="text-[10px] text-primary font-bold uppercase">Buy Now</p>
                  </div>
                  {processingPack === pack.id && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-xl text-xs text-muted-foreground">
            <p className="font-semibold mb-2">💡 How Credits Work</p>
            <ul className="space-y-1 text-xs">
              <li>• 1 Credit = 1 Standard Vote</li>
              <li>• 50 Credits = 1 Power Vote (10x impact)</li>
              <li>• Earn 100 Credits for completing your declaration</li>
              <li>• All credits never expire</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center pb-2">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CreditCard className="h-3 w-3" /> Secure checkout powered by Stripe & DS Consortium
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
