/**
 * Dynamic Video Watermarking
 * 
 * Automatically adds DS Consortium logo and branding to recorded videos
 * - Watermark placement (corner, edge)
 * - Opacity and size customization
 * - Applied during recording
 */

import { supabase } from '@/lib/supabase';

/**
 * Watermark configuration
 */
export const WATERMARK_CONFIG = {
  logo: '/logo-dsc.png', // DSC logo path
  position: 'bottom-right' as WatermarkPosition,
  opacity: 0.8,
  size: 'small' as WatermarkSize,
  margin: 16, // pixels from edge
};

export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export type WatermarkSize = 'small' | 'medium' | 'large';

/**
 * Get watermark dimensions based on size
 */
function getWatermarkDimensions(size: WatermarkSize): { width: number; height: number } {
  const dimensions = {
    small: { width: 80, height: 40 },
    medium: { width: 120, height: 60 },
    large: { width: 160, height: 80 },
  };
  return dimensions[size];
}

/**
 * Calculate watermark position on canvas
 */
function getWatermarkPosition(
  canvasWidth: number,
  canvasHeight: number,
  position: WatermarkPosition,
  dimensions: { width: number; height: number }
): { x: number; y: number } {
  const { width, height } = dimensions;
  const margin = WATERMARK_CONFIG.margin;

  const positions: Record<WatermarkPosition, { x: number; y: number }> = {
    'top-left': { x: margin, y: margin },
    'top-right': { x: canvasWidth - width - margin, y: margin },
    'bottom-left': { x: margin, y: canvasHeight - height - margin },
    'bottom-right': { x: canvasWidth - width - margin, y: canvasHeight - height - margin },
    center: { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2 },
  };

  return positions[position];
}

/**
 * Draw watermark on canvas
 */
export async function drawWatermarkOnCanvas(
  canvas: HTMLCanvasElement,
  config: Partial<typeof WATERMARK_CONFIG> = {}
): Promise<void> {
  const finalConfig = { ...WATERMARK_CONFIG, ...config };
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context not available');

  try {
    // Load logo image
    const logoImg = new Image();
    logoImg.src = finalConfig.logo;

    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    const dimensions = getWatermarkDimensions(finalConfig.size);
    const position = getWatermarkPosition(
      canvas.width,
      canvas.height,
      finalConfig.position,
      dimensions
    );

    // Draw watermark with opacity
    ctx.globalAlpha = finalConfig.opacity;
    ctx.drawImage(logoImg, position.x, position.y, dimensions.width, dimensions.height);
    ctx.globalAlpha = 1.0;

    console.log('Watermark drawn on canvas');
  } catch (error) {
    console.error('Failed to draw watermark:', error);
    throw error;
  }
}

/**
 * Apply watermark to video blob (client-side with canvas)
 */
export async function applyWatermarkToVideo(
  videoBlob: Blob,
  config: Partial<typeof WATERMARK_CONFIG> = {}
): Promise<Blob> {
  try {
    const finalConfig = { ...WATERMARK_CONFIG, ...config };

    // Create video element
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Wait for video metadata
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        resolve(true);
      };
    });

    // Process video frames
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);

    // Create video processor
    const processFrame = async () => {
      if (video.ended) {
        recorder.stop();
        return;
      }

      // Draw video frame
      ctx.drawImage(video, 0, 0);

      // Draw watermark
      await drawWatermarkOnCanvas(canvas, finalConfig);

      requestAnimationFrame(processFrame);
    };

    recorder.start();
    video.play();
    processFrame();

    // Wait for recording to complete
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const watermarkedBlob = new Blob(chunks, { type: 'video/webm' });
        URL.revokeObjectURL(video.src);
        resolve(watermarkedBlob);
      };
    });
  } catch (error) {
    console.error('Failed to apply watermark:', error);
    throw error;
  }
}

/**
 * Server-side watermark application using FFmpeg
 * 
 * Implementation for backend (e.g., Node.js with fluent-ffmpeg):
 *
 * const ffmpeg = require('fluent-ffmpeg');
 *
 * export async function applyWatermarkFFmpeg(
 *   inputPath: string,
 *   outputPath: string,
 *   logoPath: string
 * ): Promise<void> {
 *   return new Promise((resolve, reject) => {
 *     ffmpeg(inputPath)
 *       .output(outputPath)
 *       .videoFilter(`overlay=x=(W-w-16):y=(H-h-16):alpha=${WATERMARK_CONFIG.opacity}`, logoPath)
 *       .on('end', () => resolve())
 *       .on('error', (err) => reject(err))
 *       .run();
 *   });
 * }
 */

/**
 * Add watermark metadata to video record
 */
export async function saveWatermarkedVideo(
  userId: string,
  videoBlob: Blob,
  metadata: {
    title: string;
    description?: string;
    watermarkConfig?: Partial<typeof WATERMARK_CONFIG>;
  }
): Promise<{ videoUrl: string; recordId: string }> {
  try {
    // Upload watermarked video
    const fileName = `declarations/${userId}/${Date.now()}.webm`;
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('videos')
      .upload(fileName, videoBlob, {
        contentType: 'video/webm',
        metadata: {
          watermarked: 'true',
          watermarkConfig: JSON.stringify(metadata.watermarkConfig || WATERMARK_CONFIG),
        },
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    // Create record in database
    const { data: record, error: recordError } = await supabase
      .from('video_records')
      .insert({
        user_id: userId,
        video_url: urlData.publicUrl,
        title: metadata.title,
        description: metadata.description,
        watermarked: true,
        watermark_config: metadata.watermarkConfig || WATERMARK_CONFIG,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (recordError) throw recordError;

    return {
      videoUrl: urlData.publicUrl,
      recordId: record.id,
    };
  } catch (error) {
    console.error('Failed to save watermarked video:', error);
    throw error;
  }
}

/**
 * Get watermark preview
 */
export async function getWatermarkPreview(
  config: Partial<typeof WATERMARK_CONFIG> = {}
): Promise<string> {
  const finalConfig = { ...WATERMARK_CONFIG, ...config };
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;

  try {
    await drawWatermarkOnCanvas(canvas, finalConfig);
    return canvas.toDataURL();
  } catch (error) {
    console.error('Failed to generate watermark preview:', error);
    return '';
  }
}

/**
 * Watermark configuration presets
 */
export const WATERMARK_PRESETS = {
  subtle: {
    opacity: 0.5,
    size: 'small' as const,
    position: 'bottom-right' as const,
  },
  standard: {
    opacity: 0.8,
    size: 'medium' as const,
    position: 'bottom-right' as const,
  },
  prominent: {
    opacity: 1.0,
    size: 'large' as const,
    position: 'center' as const,
  },
};

/**
 * Usage in Record.tsx:
 *
 * import { applyWatermarkToVideo, saveWatermarkedVideo } from '@/lib/video-watermarking';
 *
 * const handleSubmitWithWatermark = async (videoBlob: Blob) => {
 *   try {
 *     // Apply watermark
 *     const watermarkedBlob = await applyWatermarkToVideo(videoBlob, {
 *       position: 'bottom-right',
 *       size: 'small',
 *     });
 *
 *     // Save watermarked video
 *     const { videoUrl, recordId } = await saveWatermarkedVideo(userId, watermarkedBlob, {
 *       title: selectedLens,
 *       description: 'My AI Ready declaration',
 *     });
 *
 *     console.log('Video uploaded:', videoUrl);
 *   } catch (error) {
 *     console.error('Failed to save video:', error);
 *   }
 * };
 */
