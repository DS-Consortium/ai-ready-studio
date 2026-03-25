/**
 * moderate-video — Supabase Edge Function
 *
 * Triggered after a video is inserted with is_submitted = true.
 * Runs a local text-based moderation check on the video title and description,
 * then auto-approves or flags the video accordingly.
 *
 * For production, replace the local keyword model with a call to an
 * AI vision/audio moderation API (e.g. AWS Rekognition, OpenAI Moderation).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Local keyword-based moderation model ────────────────────────────────────
// These lists represent the minimum viable local filter.
// Extend as needed; a future upgrade can replace this with an ML model call.

const EXPLICIT_KEYWORDS = [
  "nude", "nudity", "naked", "sex", "sexual", "explicit", "porn", "pornography",
  "xxx", "adult content", "nsfw",
];

const VULGAR_KEYWORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy",
  "motherfucker", "faggot", "nigger", "whore", "slut",
];

const HARMFUL_KEYWORDS = [
  "kill", "murder", "rape", "terrorist", "bomb", "suicide", "self-harm",
  "hate speech", "violence", "abuse",
];

interface ModerationResult {
  passed: boolean;
  reason: string | null;
  flags: string[];
}

function moderateText(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const flags: string[] = [];

  for (const kw of EXPLICIT_KEYWORDS) {
    if (lower.includes(kw)) flags.push(`explicit: "${kw}"`);
  }
  for (const kw of VULGAR_KEYWORDS) {
    if (lower.includes(kw)) flags.push(`vulgar: "${kw}"`);
  }
  for (const kw of HARMFUL_KEYWORDS) {
    if (lower.includes(kw)) flags.push(`harmful: "${kw}"`);
  }

  if (flags.length > 0) {
    return {
      passed: false,
      reason: `Content policy violation detected: ${flags.join(", ")}`,
      flags,
    };
  }

  return { passed: true, reason: null, flags: [] };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const videoId: string = body.video_id;

    if (!videoId) {
      return new Response(JSON.stringify({ error: "video_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the video record
    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("id, title, description, video_url")
      .eq("id", videoId)
      .single();

    if (fetchError || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run local text moderation on title + description
    const textToCheck = [video.title, video.description ?? ""].join(" ");
    const result = moderateText(textToCheck);

    if (result.passed) {
      // Auto-approve: publish to gallery
      const { error: updateError } = await supabase
        .from("videos")
        .update({ is_approved: true })
        .eq("id", videoId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ status: "approved", message: "Video passed moderation and is now live." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Flag for manual review — keep is_approved = false, mark with reason
      // Optionally store the rejection reason in the description field or a separate column
      const { error: updateError } = await supabase
        .from("videos")
        .update({
          is_approved: false,
          description: `[FLAGGED] ${result.reason}`,
        })
        .eq("id", videoId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ status: "flagged", reason: result.reason, flags: result.flags }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Moderation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
