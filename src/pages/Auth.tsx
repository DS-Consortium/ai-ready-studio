import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const MAIN_WEBSITE_URL = "https://legroupeds.com/subscribe"; // Centralized sign-up/sign-in

  useEffect(() => {
    // Optional: Auto-redirect after a short delay
    // const timer = setTimeout(() => {
    //   window.location.href = MAIN_WEBSITE_URL;
    // }, 3000);
    // return () => clearTimeout(timer);
  }, []);

  const handleRedirect = () => {
    window.location.href = MAIN_WEBSITE_URL;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed inset-0 bg-pattern pointer-events-none" />
      
      <header className="relative z-10 p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-card rounded-3xl shadow-elevated p-8 border border-border">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="font-display text-3xl font-bold mb-4">
              Join the Movement
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              To participate in the <strong>Are You AI Ready?</strong> campaign, please sign up or sign in through our main platform. 
              This ensures your declaration is linked to your professional profile in our Knowledge Lab.
            </p>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg gap-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleRedirect}
            >
              Sign In on LeGroupeDS
              <ExternalLink className="h-5 w-5" />
            </Button>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account? Your data will automatically sync when you return.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-8 opacity-60">
            Redirecting to legroupeds.com/subscribe
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
