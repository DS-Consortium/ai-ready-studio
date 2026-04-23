/**
 * Open Graph (OG) Image Generation Routes
 * Generates social media preview images for videos
 */
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../db/supabase.js';

const router = Router();

// Rate limiter for OG generation to prevent abuse
const ogLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many OG image requests. Please try again later.',
  },
});

/**
 * GET /api/og/video/:videoId
 * Generate Open Graph image for a video
 */
router.get('/video/:videoId', ogLimiter, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    // Fetch video data
    const { data: video, error } = await supabase
      .from('videos')
      .select('id, title, description, thumbnail_url, filter_id, user_id, created_at')
      .eq('id', videoId)
      .eq('is_approved', true)
      .single();

    if (error || !video) {
      return res.status(404).json({ error: 'Video not found or not approved' });
    }

    // Get filter info
    const { data: filter } = await supabase
      .from('ai_filters')
      .select('name, color')
      .eq('id', video.filter_id)
      .single();

    // Get user info
    const { data: user } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', video.user_id)
      .single();

    // Generate OG image
    const ogImage = await generateOGImage({
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnail_url,
      filterName: filter?.name || 'AI Ready',
      filterColor: filter?.color || '#3B82F6',
      authorName: user?.display_name || 'AI Creator',
      createdAt: video.created_at,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(ogImage);

  } catch (error: any) {
    console.error('OG generation error:', error);
    res.status(500).json({ error: 'Failed to generate OG image' });
  }
});

/**
 * Generate Open Graph image using Canvas API
 */
async function generateOGImage(data: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  filterName: string;
  filterColor: string;
  authorName: string;
  createdAt: string;
}): Promise<Buffer> {
  // This would use a library like @napi-rs/canvas or puppeteer
  // For now, return a placeholder implementation
  // In production, you'd use a proper image generation library

  const { createCanvas, loadImage } = await import('canvas');

  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Title
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  const titleLines = wrapText(ctx, data.title, 1000, 48);
  let yPos = 100;
  titleLines.forEach(line => {
    ctx.fillText(line, 600, yPos);
    yPos += 60;
  });

  // Filter badge
  ctx.fillStyle = data.filterColor;
  ctx.fillRect(100, 500, 200, 60);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(data.filterName, 200, 535);

  // Author and date
  ctx.fillStyle = '#cccccc';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`By ${data.authorName}`, 350, 520);
  ctx.fillText(new Date(data.createdAt).toLocaleDateString(), 350, 550);

  // Winner badge if applicable
  // This would be checked from a winners table
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(900, 50, 200, 60);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 WINNER', 1000, 85);

  return canvas.toBuffer('image/png');
}

/**
 * Helper function to wrap text
 */
function wrapText(ctx: any, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 3); // Max 3 lines
}

export default router;