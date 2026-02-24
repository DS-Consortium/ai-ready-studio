import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeVideo {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  is_preview: boolean;
  sort_order: number;
  series_id: string;
  thumbnail_url: string | null;
  video_url: string | null;
}

export interface VideoSeries {
  id: string;
  title: string;
  description: string | null;
  price_monthly: number;
  price_annual: number;
  is_enterprise_only: boolean;
  stripe_monthly_price_id: string | null;
  stripe_annual_price_id: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  videos: KnowledgeVideo[];
}

export const useKnowledgeLibrary = () => {
  return useQuery({
    queryKey: ["knowledge-library"],
    queryFn: async (): Promise<VideoSeries[]> => {
      try {
        // Fetch all video series
        const { data: seriesData, error: seriesError } = await supabase
          .from("video_series")
          .select("*")
          .order("sort_order", { ascending: true });

        if (seriesError) throw seriesError;

        // Fetch all videos
        const { data: videosData, error: videosError } = await supabase
          .from("knowledge_videos")
          .select("*")
          .order("sort_order", { ascending: true });

        if (videosError) throw videosError;

        // Map series with their videos
        const seriesWithVideos: VideoSeries[] = (seriesData || []).map((series) => ({
          ...series,
          videos: (videosData || []).filter((v) => v.series_id === series.id),
        }));

        return seriesWithVideos;
      } catch (error) {
        console.error("Error fetching knowledge library:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
