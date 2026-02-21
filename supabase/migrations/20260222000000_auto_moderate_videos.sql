-- Migration: Auto-moderation trigger for videos
-- When a video is inserted with is_submitted = true, the application layer
-- (Record.tsx) calls the moderate-video edge function directly after insert.
-- This migration adds a helper function and documents the moderation flow.

-- Add a moderation_status column to track the review state
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'manual_review'));

-- Add a moderation_reason column for flagged content
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Update RLS policy: approved videos are those with is_approved = true
-- (already exists, no change needed)

-- Index for quick lookup of pending videos
CREATE INDEX IF NOT EXISTS idx_videos_moderation_status
  ON public.videos (moderation_status);

-- Comment documenting the moderation flow
COMMENT ON COLUMN public.videos.moderation_status IS
  'Tracks content moderation state: pending → approved (auto, via edge function) or flagged (manual review required).';

COMMENT ON COLUMN public.videos.moderation_reason IS
  'Populated when moderation_status = flagged. Contains the policy violation details.';
