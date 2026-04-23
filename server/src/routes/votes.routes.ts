import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../db/supabase.js';

const router = Router();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const VOTE_COOLDOWN_SECONDS = 20;

const getAuthToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};

router.post('/', voteLimiter, async (req: Request, res: Response) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required.' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }

  const userId = userData.user.id;
  const { videoId } = req.body;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'videoId is required and must be a string.' });
  }

  const { data: existingVote, error: existingVoteError } = await supabaseAdmin
    .from('votes')
    .select('id, created_at')
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingVoteError) {
    return res.status(500).json({ error: existingVoteError.message });
  }

  if (existingVote) {
    const { error: deleteError } = await supabaseAdmin
      .from('votes')
      .delete()
      .eq('id', existingVote.id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    return res.json({ action: 'removed' });
  }

  const { data: lastVote, error: lastVoteError } = await supabaseAdmin
    .from('votes')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastVoteError) {
    return res.status(500).json({ error: lastVoteError.message });
  }

  if (lastVote?.created_at) {
    const lastVoteTime = new Date(lastVote.created_at).getTime();
    const now = Date.now();
    const secondsSinceLastVote = (now - lastVoteTime) / 1000;

    if (secondsSinceLastVote < VOTE_COOLDOWN_SECONDS) {
      return res.status(429).json({
        error: `Please wait ${Math.ceil(VOTE_COOLDOWN_SECONDS - secondsSinceLastVote)} seconds before voting again.`,
      });
    }
  }

  const { error: insertError } = await supabaseAdmin.from('votes').insert({
    video_id: videoId,
    user_id: userId,
  });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.status(201).json({ action: 'added' });
});

export default router;
