import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Sparkles, ArrowLeft, Chrome, ExternalLink, Linkedin } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [showInAppAuth, setShowInAppAuth] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const MAIN_WEBSITE_URL = "https://dsconsortium.com/auth";

  // Aligned with DS Consortium redirect logic
  const redirectPath = (location.state as any)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Validation Error", description: err.errors[0].message, variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast({ title: "Welcome!", description: "Check your email for the confirmation link." });
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
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Google Auth Error", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const handleLinkedInAuth = async () => {
    setLinkedinLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "LinkedIn Auth Error", description: error.message, variant: "destructive" });
      setLinkedinLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed inset-0 bg-pattern pointer-events-none opacity-20" />
      <header className="relative z-10 p-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-card rounded-[2rem] shadow-2xl p-8 border border-border text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg shadow-primary/20">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            
            {!showInAppAuth ? (
              <>
                <h1 className="font-display text-3xl font-bold mb-4">Join the Movement</h1>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                  We recommend signing in through our main platform to sync your professional profile and Knowledge Lab access.
                </p>
                <Button size="lg" className="w-full h-14 text-lg gap-3 rounded-2xl mb-4 shadow-md" onClick={() => window.location.href = MAIN_WEBSITE_URL}>
                  Sign In on DS Consortium <ExternalLink className="h-5 w-5" />
                </Button>
                <button onClick={() => setShowInAppAuth(true)} className="text-sm text-primary font-semibold hover:underline transition-all">
                  Or continue within the app
                </button>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
                <p className="text-muted-foreground text-xs mb-6">Quick access via social accounts</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button variant="outline" className="h-12 gap-2 rounded-xl border-border hover:bg-muted" onClick={handleGoogleAuth} disabled={googleLoading || linkedinLoading}>
                    <Chrome className="h-4 w-4 text-red-500" /> Google
                  </Button>
                  <Button variant="outline" className="h-12 gap-2 rounded-xl border-border hover:bg-muted" onClick={handleLinkedInAuth} disabled={googleLoading || linkedinLoading}>
                    <Linkedin className="h-4 w-4 text-blue-600" /> LinkedIn
                  </Button>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-card px-3 text-muted-foreground font-bold">Or use email</span></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                  {isSignUp && (
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-xs font-bold ml-1">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input id="displayName" placeholder="Efua Dougan" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-12 pl-10 rounded-xl bg-muted/30 border-border focus:ring-primary" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10 rounded-xl bg-muted/30 border-border focus:ring-primary" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10 rounded-xl bg-muted/30 border-border focus:ring-primary" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                </form>
                
                <p className="mt-6 text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-bold hover:underline">{isSignUp ? "Sign In" : "Sign Up"}</button>
                </p>
                <button onClick={() => setShowInAppAuth(false)} className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Back to platform sign in</button>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
