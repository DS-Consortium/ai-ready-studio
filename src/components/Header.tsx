import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Play, Grid3X3, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Create Video", href: "#create", icon: Play },
  { label: "Gallery", href: "#gallery", icon: Grid3X3 },
  { label: "How It Works", href: "#how-it-works", icon: BookOpen },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between md:h-20">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-lg font-bold text-primary-foreground">DS</span>
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-filter-savvy animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <p className="font-display text-lg font-semibold leading-tight">DS Consortium</p>
            <p className="text-xs text-muted-foreground">AI Readiness Initiative</p>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" 
            onClick={() => navigate("/dashboard")}/>
            Sign In
          </Button>
          <Button variant="hero" size="sm">
            Join Contest
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent md:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border/50 bg-background md:hidden"
          >
            <nav className="container flex flex-col gap-2 py-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Button variant="ghost" className="justify-start gap-2">
                  <User className="h-4 w-4" 
                  onClick={() => navigate("/dashboard")}/>
                  Sign In
                </Button>
                <Button variant="hero"
                onClick={() => navigate("/record")}
                >
                  Join Contest
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
