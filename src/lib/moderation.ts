/**
 * moderation.ts
 *
 * Client-side helper that invokes the `moderate-video` Supabase Edge Function
 * after a video is uploaded. The function runs a local content check and
 * auto-approves the video if it passes.
 *
 * Usage:
 *   import { moderateVideo } from "@/lib/moderation";
 *   await moderateVideo(videoId);
 */

import { supabase } from "@/integrations/supabase/client";

export interface ModerationResponse {
  status: "approved" | "flagged" | "error";
  message?: string;
  reason?: string;
  flags?: string[];
}

/**
 * Sends the video ID to the moderation edge function.
 * Returns the moderation result.
 */
export async function moderateVideo(videoId: string): Promise<ModerationResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("moderate-video", {
      body: { video_id: videoId },
    });

    if (error) {
      console.error("Moderation invocation error:", error);
      return { status: "error", message: error.message };
    }

    return data as ModerationResponse;
  } catch (err) {
    console.error("Moderation error:", err);
    return { status: "error", message: String(err) };
  }
}

/**
 * Local fallback moderation — runs entirely in the browser.
 * Used when the edge function is unavailable (e.g. during development).
 * Checks the video title and description against a keyword blocklist.
 */
const BLOCKED_TERMS = [
  "nude", "nudity", "naked", "sex", "sexual", "explicit", "porn",
  "fuck", "shit", "bitch", "cunt", "rape", "murder", "terrorist",
  "bomb", "suicide", "self-harm", "hate speech",
];

export function moderateLocally(title: string, description = ""): ModerationResponse {
  const text = `${title} ${description}`.toLowerCase();
  const found = BLOCKED_TERMS.filter((term) => text.includes(term));

  if (found.length > 0) {
    return {
      status: "flagged",
      reason: `Content policy violation: ${found.join(", ")}`,
      flags: found,
    };
  }

  return { status: "approved", message: "Content passed local moderation." };
}
