/**
 * Pricing Page - Credits & Subscriptions
 * Integrated with Stripe for payment processing
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Check,
  Zap,
  Crown,
  Star,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { initiateStripeCheckout } from "@/lib/stripe-integration";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  currency: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
  bestValue?: boolean;
}

// Credits pricing - user-friendly and affordable
const CREDIT_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for trying out voting",
    credits: 50,
    price: 0.99,
    currency: "USD",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "50 voting credits",
      "Vote on 50 declarations",
      "Valid for 30 days",
      "Instant delivery",
    ],
  },
  {
    id: "enthusiast",
    name: "Enthusiast",
    description: "Most popular choice",
    credits: 100,
    price: 1.99,
    currency: "USD",
    icon: <TrendingUp className="w-6 h-6" />,
    features: [
      "100 voting credits",
      "Vote on 100 declarations",
      "Valid for 60 days",
      "Instant delivery",
      "1 credit = 1 vote",
    ],
    recommended: true,
  },
  {
    id: "power-voter",
    name: "Power Voter",
    description: "For serious enthusiasts",
    credits: 300,
    price: 4.99,
    currency: "USD",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "300 voting credits",
      "Vote on 300 declarations",
      "Valid for 90 days",
      "Instant delivery",
      "Priority support",
    ],
  },
];

// Knowledge Library subscription plans
const SUBSCRIPTION_PLANS: PricingPlan[] = [
  {
    id: "monthly",
    name: "Monthly Access",
    description: "Cancel anytime",
    credits: 0,
    price: 24.99,
    currency: "USD",
    icon: <Calendar className="w-6 h-6" />,
    features: [
      "Full Knowledge Library access",
      "All video series & masterclasses",
      "CPD certificate eligible",
      "Monthly billing",
      "Cancel anytime",
    ],
  },
  {
    id: "yearly",
    name: "Annual Access",
    description: "Save 15% yearly",
    credits: 0,
    price: 249.9,
    currency: "USD",
    icon: <Star className="w-6 h-6" />,
    features: [
      "Full Knowledge Library access",
      "All video series & masterclasses",
      "CPD certificate eligible",
      "Annual billing (save 15%)",
      "Early access to new content",
    ],
    bestValue: true,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"credits" | "subscription">("credits");

  const handlePurchase = async (plan: PricingPlan) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setProcessing(plan.id);

    try {
      // Call Stripe checkout endpoint
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          planType: selectedTab,
          amount: plan.price,
          credits: plan.credits,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate payment");
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      // In real implementation, this would use @stripe/react-stripe-js
      window.location.href = `/checkout/${sessionId}`;
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Payment failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getCurrentCredits = () => {
    // This would come from user metadata or context
    return user?.user_metadata?.credits || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Pricing & Credits</h1>
              <p className="text-sm text-muted-foreground">
                Unlock voting power and exclusive content
              </p>
            </div>
          </div>

          {user && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Credits</p>
              <p className="text-2xl font-bold text-primary">
                {getCurrentCredits()} ✨
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Tab selector */}
        <div className="flex justify-center gap-2 mb-12">
          <Button
            variant={selectedTab === "credits" ? "default" : "outline"}
            onClick={() => setSelectedTab("credits")}
            className="px-8"
          >
            Voting Credits
          </Button>
          <Button
            variant={selectedTab === "subscription" ? "default" : "outline"}
            onClick={() => setSelectedTab("subscription")}
            className="px-8"
          >
            Knowledge Library
          </Button>
        </div>

        {/* Credits Plans */}
        {selectedTab === "credits" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Voting Credits</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                1 credit = 1 vote on AI Ready declarations. Affordable pricing so everyone can participate in shaping AI leadership.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {CREDIT_PLANS.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    className={`relative h-full transition-all ${
                      plan.recommended
                        ? "border-primary/50 shadow-xl scale-105"
                        : ""
                    }`}
                  >
                    {plan.recommended && (
                      <Badge
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary"
                        variant="default"
                      >
                        Recommended
                      </Badge>
                    )}

                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4 text-primary">
                        {plan.icon}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Price */}
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          ${plan.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {plan.credits} credits
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          ${(plan.price / plan.credits).toFixed(4)} per credit
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handlePurchase(plan)}
                        disabled={processing === plan.id}
                        variant={plan.recommended ? "default" : "outline"}
                        className="w-full"
                      >
                        {processing === plan.id ? "Processing..." : "Buy Credits"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Earning credits info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Earn Free Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Complete your AI Ready declaration and earn free voting credits!
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>50 credits when you submit your first declaration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Start voting immediately - no purchase needed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subscription Plans */}
        {selectedTab === "subscription" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Knowledge Library</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Access all video series, masterclasses, and earn CPD certificates. Learn from global AI Ready leaders.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {SUBSCRIPTION_PLANS.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    className={`relative h-full transition-all ${
                      plan.bestValue ? "border-primary/50 shadow-xl" : ""
                    }`}
                  >
                    {plan.bestValue && (
                      <Badge
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary"
                        variant="default"
                      >
                        Best Value
                      </Badge>
                    )}

                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4 text-primary">
                        {plan.icon}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Price */}
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          ${plan.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {plan.id === "yearly"
                            ? "per year (billed annually)"
                            : "per month"}
                        </div>
                        {plan.id === "yearly" && (
                          <div className="text-xs text-primary mt-2 font-semibold">
                            Save $75/year vs monthly
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handlePurchase(plan)}
                        disabled={processing === plan.id}
                        variant={plan.bestValue ? "default" : "outline"}
                        className="w-full"
                      >
                        {processing === plan.id ? "Processing..." : "Subscribe Now"}
                      </Button>

                      {plan.id === "monthly" && (
                        <p className="text-xs text-muted-foreground text-center">
                          Cancel anytime. No long-term commitment.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* FAQ or additional info */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  What's Included?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-4 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>Complete video series access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>Exclusive masterclasses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>CPD certificate eligibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trust badges */}
        <div className="mt-16 pt-12 border-t border-border">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Secure Stripe Payment
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Money-back guarantee
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              24/7 Support
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
