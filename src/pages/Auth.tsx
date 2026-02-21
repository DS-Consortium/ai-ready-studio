import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Sparkles, ArrowLeft, Chrome, ExternalLink } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInAppAuth, setShowInAppAuth] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const MAIN_WEBSITE_URL = "https://legroupeds.com/subscribe";

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName || email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        toast({ title: "Welcome!", description: "Account created successfully." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Signed in successfully." });
      }
    } catch (error: any) {
      toast({ title: "Auth Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Google Auth Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed inset-0 bg-pattern pointer-events-none" />
      <header className="relative z-10 p-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-card rounded-3xl shadow-elevated p-8 border border-border text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            
            {!showInAppAuth ? (
              <>
                <h1 className="font-display text-2xl font-bold mb-4">Join the Movement</h1>
                <p className="text-muted-foreground mb-8">
                  We recommend signing in through our main platform to sync your professional profile.
                </p>
                <Button size="lg" className="w-full h-14 text-lg gap-3 rounded-2xl mb-4" onClick={() => window.location.href = MAIN_WEBSITE_URL}>
                  Sign In on DS Consortium <ExternalLink className="h-5 w-5" />
                </Button>
                <button onClick={() => setShowInAppAuth(true)} className="text-sm text-primary font-medium hover:underline">
                  Or continue within the app
                </button>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
                <div className="space-y-3 mb-6 mt-6">
                  <Button variant="outline" className="w-full h-12 gap-3" onClick={handleGoogleAuth} disabled={loading}>
                    <Chrome className="h-5 w-5" /> Continue with Google
                  </Button>
                </div>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or email</span></div>
                </div>
                <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Name</Label>
                      <Input id="displayName" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-12" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={loading}>{loading ? "Wait..." : isSignUp ? "Sign Up" : "Sign In"}</Button>
                </form>
                <p className="mt-6 text-sm">
                  {isSignUp ? "Have an account?" : "No account?"}{" "}
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium">{isSignUp ? "Sign In" : "Sign Up"}</button>
                </p>
                <button onClick={() => setShowInAppAuth(false)} className="mt-4 text-xs text-muted-foreground hover:underline">Back to main sign in</button>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
