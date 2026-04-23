import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { subscribeErrorGroups } from "@/lib/error-reporting";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Record from "./pages/Record";
import Gallery from "./pages/Gallery";
import Events from "./pages/Events";
import Rewards from "./pages/Rewards";
import Admin from "./pages/Admin";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import EventsCalendar from "./pages/EventsCalendar";
import VideoPlayer from "./pages/VideoPlayer";
import Pricing from "./pages/Pricing";
import Winners from "./pages/Winners";
import BottomNavigation from "./components/BottomNavigation";

const queryClient = new QueryClient();

const App = () => {
  const [migrationStatus, setMigrationStatus] = useState<{ ok: boolean; missingTables?: string[] } | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeErrorGroups((groups) => {
      setErrorCount(groups.reduce((sum, group) => sum + group.count, 0));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/health");
        if (!response.ok) return;
        const data = await response.json();
        if (data.schemaStatus) {
          setMigrationStatus({ ok: data.schemaStatus.ok, missingTables: data.schemaStatus.missingTables });
        }
      } catch {
        // ignore network or backend not available on preview
      }
    };

    fetchHealth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          {migrationStatus && !migrationStatus.ok && (
            <div className="fixed bottom-20 left-4 right-4 z-50 rounded-3xl border border-amber-300 bg-amber-50/95 p-4 text-sm text-amber-900 shadow-lg md:left-8 md:right-auto md:w-[450px]">
              <strong>Database schema mismatch detected.</strong>
              <p className="mt-1 text-xs text-amber-800">
                Missing tables: {migrationStatus.missingTables?.join(', ') || 'unknown'}. Run the backend migration script or configure your database.
              </p>
            </div>
          )}
          {errorCount > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-50 rounded-3xl border border-slate-300 bg-slate-950/95 p-4 text-sm text-white shadow-lg md:left-8 md:right-auto md:w-[420px]">
              <strong>{errorCount} runtime error(s) captured.</strong>
              <p className="mt-1 text-xs text-slate-300">
                These are grouped by stack trace for debugging. Check browser console or backend logs.
              </p>
            </div>
          )}
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/record" element={<Record />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/events" element={<Events />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/knowledge-library" element={<KnowledgeLibrary />} />
                <Route path="/events-calendar" element={<EventsCalendar />} />
                <Route path="/video/:id" element={<VideoPlayer />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/winners" element={<Winners />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNavigation />
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
