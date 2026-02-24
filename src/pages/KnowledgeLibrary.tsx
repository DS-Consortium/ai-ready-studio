/**
 * Knowledge Library Page - Mobile Optimized
 * Mirrors DS Consortium Knowledge Library
 * Fetches video series and videos from Supabase
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Clock, Lock, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useKnowledgeLibrary, VideoSeries } from "@/hooks/useKnowledgeLibrary";
import { motion } from "framer-motion";

// Color schemes for series cards
const SERIES_COLORS = [
  "from-primary to-navy-deep",
  "from-emerald-500 to-emerald-700",
  "from-purple-500 to-purple-700",
  "from-red-500 to-red-700",
  "from-navy-light to-navy-deep",
  "from-amber-500 to-amber-700",
];

// Pricing plans matching DS Consortium
const PRICING = {
  series: {
    monthly: 24.99,
    yearly: 249.9,
    cpdIncluded: false,
  },
  library: {
    monthly: 69.99,
    yearly: 699.9,
    cpdIncluded: true,
  },
  ppv: 0.99,
};

// Exclusive series IDs (single-video masterclasses)
const EXCLUSIVE_SERIES_IDS = [
  "dddddddd-dddd-dddd-dddd-dddddddddddd",
  "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "11111111-2222-3333-4444-555555555555",
  "22222222-3333-4444-5555-666666666666",
  "33333333-4444-5555-6666-777777777777",
];

const KnowledgeLibrary = () => {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: seriesData, isLoading, error } = useKnowledgeLibrary();

  // Check subscription status (user has library access via Auth context)
  const hasLibraryAccess = user?.user_metadata?.has_library_access || false;
  const userSeriesAccess = user?.user_metadata?.series_access || [];

  const hasAccessToSeries = (seriesId: string) => {
    return hasLibraryAccess || userSeriesAccess.includes(seriesId);
  };

  // Separate regular series from exclusive
  const { regularSeries, exclusiveSeries } = useMemo(() => {
    if (!seriesData) return { regularSeries: [], exclusiveSeries: [] };

    const sorted = [...seriesData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const regular = sorted.filter((s) => !EXCLUSIVE_SERIES_IDS.includes(s.id));
    const exclusive = sorted.filter((s) => EXCLUSIVE_SERIES_IDS.includes(s.id));

    return { regularSeries: regular, exclusiveSeries: exclusive };
  }, [seriesData]);

  const filteredSeries = useMemo(() => {
    if (selectedSeries) {
      const found = seriesData?.find((s) => s.id === selectedSeries);
      return found ? [found] : [];
    }
    return regularSeries;
  }, [seriesData, selectedSeries, regularSeries]);

  const showExclusive = !selectedSeries || EXCLUSIVE_SERIES_IDS.includes(selectedSeries);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <p className="text-destructive text-center">Failed to load Knowledge Library. Please try again.</p>
      </div>
    );
  }

  const VideoCard = ({ video, userHasAccess, colorClass, idx }: any) => {
    const isPreview = video.is_preview;
    const isLocked = !userHasAccess && !isPreview;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
      >
        <Card className="group overflow-hidden border-2 border-border hover:border-blue/50 transition-all duration-300">
          <div className="relative h-36 overflow-hidden">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${colorClass}`} />
            )}

            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              {isLocked ? (
                <div className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            <Badge variant="secondary" className="absolute top-3 left-3 bg-primary/80 text-primary-foreground">
              Ep {idx + 1}
            </Badge>

            {isPreview && (
              <Badge className="absolute top-3 right-3 bg-emerald-500 text-white">
                Preview
              </Badge>
            )}

            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-primary/80 text-primary-foreground text-xs">
              <Clock className="w-3 h-3" />
              {video.duration || "N/A"}
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground line-clamp-2 mb-3">{video.title}</h3>

            {userHasAccess || isPreview ? (
              <Button variant="gold" size="sm" className="w-full" asChild>
                <Link to={`/video/${video.id}`}>
                  <Play className="w-4 h-4 mr-1" />
                  {isPreview ? "Watch Preview" : "Watch Now"}
                </Link>
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate("/pricing")}
                >
                  Subscribe
                </Button>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const SeriesHeader = ({ s, userHasAccess }: any) => (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-bold text-xl text-foreground">{s.title}</h2>
          {userHasAccess && (
            <Badge className="bg-emerald-500 text-white text-xs">
              Unlocked
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{s.description}</p>
      </div>
      {!userHasAccess && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="cursor-default opacity-80">
            Earn CPD
          </Button>
          <Button variant="gold" size="sm" onClick={() => navigate("/pricing")}>
            Subscribe
          </Button>
        </div>
      )}
    </div>
  );

  const ExclusiveCard = ({ series, colorIndex }: { series: VideoSeries; colorIndex: number }) => {
    const userHasAccess = hasAccessToSeries(series.id);
    const video = series.videos[0];
    const colorClass = SERIES_COLORS[colorIndex % SERIES_COLORS.length];
    const isPreview = video?.is_preview;
    const isLocked = !userHasAccess && !isPreview;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: colorIndex * 0.05 }}
      >
        <Card className="group overflow-hidden border-2 border-border hover:border-gold/50 transition-all duration-300">
          <div className="relative h-32 overflow-hidden">
            {series.thumbnail_url ? (
              <img
                src={series.thumbnail_url}
                alt={series.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${colorClass}`} />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              {isLocked ? (
                <Lock className="w-8 h-8 text-white/80" />
              ) : (
                <Play className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              )}
            </div>
            <Badge className="absolute top-2 right-2 bg-gold text-primary-foreground text-xs">
              Exclusive
            </Badge>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
              <Clock className="w-3 h-3" />
              60 min
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">{series.title}</h3>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">${series.price_monthly}/mo</span>
              {userHasAccess || isPreview ? (
                <Button variant="gold" size="sm" className="h-7 text-xs px-3" asChild>
                  <Link to={`/video/${video?.id}`}>
                    <Play className="w-3 h-3 mr-1" />
                    Watch
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => navigate("/pricing")}>
                  Subscribe
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Knowledge Library</h1>
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          {seriesData && !isLoading && (
            <p className="text-sm text-muted-foreground">
              {seriesData.reduce((acc, s) => acc + (s.videos?.length || 0), 0)} Video Sessions • Stream on Demand
            </p>
          )}
        </div>
      </div>

      {/* Series Filter Bar */}
      {!isLoading && (
        <div className="sticky top-16 z-30 bg-card border-b border-border overflow-x-auto">
          <div className="flex gap-2 px-4 py-3 scrollbar-hide">
            <Button
              variant={selectedSeries === null ? "gold" : "outline"}
              size="sm"
              onClick={() => setSelectedSeries(null)}
              className="whitespace-nowrap"
            >
              All Series
            </Button>
            {regularSeries?.map((s) => (
              <Button
                key={s.id}
                variant={selectedSeries === s.id ? "gold" : "outline"}
                size="sm"
                onClick={() => setSelectedSeries(s.id)}
                className="whitespace-nowrap"
              >
                {s.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-40 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">Failed to load knowledge library</p>
            <p className="text-muted-foreground text-sm">Check your internet connection and try again</p>
          </div>
        ) : !seriesData || seriesData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground font-medium">Knowledge Library Coming Soon</p>
              <p className="text-sm text-muted-foreground">Video content will be available shortly. Check back soon!</p>
            </div>
          </div>
        ) : filteredSeries.length === 0 && !showExclusive ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No series available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Regular Series */}
            {filteredSeries.map((s, seriesIndex) => {
              const colorClass = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
              const userHasAccess = hasAccessToSeries(s.id);

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: seriesIndex * 0.1 }}
                  className="space-y-4"
                >
                  <SeriesHeader s={s} userHasAccess={userHasAccess} />
                  <div className="grid grid-cols-2 gap-4">
                    {s.videos.map((video, idx) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        idx={idx}
                        colorClass={colorClass}
                        userHasAccess={userHasAccess}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {/* Exclusive Sessions */}
            {showExclusive && exclusiveSeries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-bold text-xl text-foreground">Exclusive Sessions</h2>
                  <p className="text-muted-foreground text-sm">Masterclasses • Earn CPD hours</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {exclusiveSeries.map((series, idx) => (
                    <ExclusiveCard key={series.id} series={series} colorIndex={idx} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* CTA Section */}
      {!hasLibraryAccess && !isLoading && (
        <div className="mx-4 mb-6 p-4 bg-gradient-to-r from-primary to-blue rounded-lg">
          <h3 className="font-bold text-white mb-2">Get Full Library Access</h3>
          <p className="text-white/80 text-sm mb-3">
            Unlock all {seriesData?.reduce((acc, s) => acc + (s.videos?.length || 0), 0) || 0} sessions across {seriesData?.length || 0} series
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => navigate("/pricing")}
          >
            Subscribe Now
          </Button>
        </div>
      )}
    </div>
  );
};

export default KnowledgeLibrary;
