/**
 * canvas-recorder.ts
 *
 * Implements Canvas-based video recording that bakes AR text lens filters
 * directly into the recorded video stream using MediaRecorder and Canvas API.
 * 
 * Optimized for Snapchat-like real-time preview and capture.
 */

import { AIFilter } from "@/lib/filters";
import { FaceTracker } from './face-tracking';
import { drawFaceHalo, drawFaceScan } from './ar-elements';

export interface LensConfig {
  line1: string;
  line2: string;
  color: string;
  tagline?: string;
}

export const getLensConfig = (filter: AIFilter): LensConfig => {
  const colorMap: Record<string, string> = {
    ready: "#3B82F6",
    savvy: "#0EA5E9",
    accountable: "#10B981",
    driven: "#F59E0B",
    enabler: "#8B5CF6",
    building: "#22C55E",
    leading: "#EF4444",
    shaping: "#06B6D4",
  };
  const color = colorMap[filter.id] || "#3B82F6";

  const labelMap: Record<string, { line1: string; line2: string; tagline?: string }> = {
    ready: { line1: "I AM", line2: "AI READY", tagline: "#IAmAIReady" },
    savvy: { line1: "I AM", line2: "AI SAVVY", tagline: "#IAmAISavvy" },
    accountable: { line1: "I AM", line2: "AI ACCOUNTABLE", tagline: "#IAmAIAccountable" },
    driven: { line1: "I AM", line2: "AI DRIVEN", tagline: "#IAmAIDriven" },
    enabler: { line1: "I AM AN", line2: "AI ENABLER", tagline: "#IAmAnAIEnabler" },
    building: { line1: "I AM", line2: "BUILDING AI-READY\nINSTITUTIONS", tagline: "#BuildingAIReady" },
    leading: { line1: "I AM", line2: "LEADING\nRESPONSIBLE AI", tagline: "#LeadingResponsibleAI" },
    shaping: { line1: "I AM", line2: "SHAPING AI\nECOSYSTEMS", tagline: "#ShapingAIEcosystems" },
  };

  const labels = labelMap[filter.id] || { line1: "I AM", line2: "AI READY" };
  return { ...labels, color };
};

/**
 * Draw the AR text lens onto a canvas context
 */
export const drawARTextLens = (
  ctx: CanvasRenderingContext2D,
  filter: AIFilter,
  canvasWidth: number,
  canvasHeight: number
) => {
  const cfg = getLensConfig(filter);

  ctx.save();
  
  // Clear shadow for background
  ctx.shadowBlur = 0;
  
  // Draw semi-transparent gradient background for text readability at bottom
  const gradient = ctx.createLinearGradient(0, canvasHeight * 0.5, 0, canvasHeight);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.4)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvasHeight * 0.5, canvasWidth, canvasHeight * 0.5);

  // Line 1 (e.g., "I AM")
  ctx.font = "bold 48px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "0.15em";
  ctx.fillText(cfg.line1, canvasWidth / 2, canvasHeight * 0.7);

  // Line 2 (e.g., "AI READY")
  ctx.font = `bold 90px 'Playfair Display', serif`;
  ctx.fillStyle = cfg.color;
  
  // Add a glow effect
  ctx.shadowColor = cfg.color;
  ctx.shadowBlur = 15;
  
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  const lines = cfg.line2.split("\n");
  const lineHeight = 110;
  const startY = canvasHeight * 0.78;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, canvasWidth / 2, startY + index * lineHeight);
  });

  // Tagline
  ctx.shadowBlur = 0;
  if (cfg.tagline) {
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.tagline, canvasWidth / 2, canvasHeight * 0.92);
  }

  ctx.restore();
};

/**
 * Create a canvas-based video recorder that overlays filters onto the stream
 */
export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private stream: MediaStream;
  private videoEl: HTMLVideoElement;
  private canvasStream: MediaStream | null = null;
  private filter: AIFilter;
  private facingMode: "user" | "environment";
  private faceTracker: FaceTracker | null = null;

  constructor(
    stream: MediaStream,
    filter: AIFilter,
    facingMode: "user" | "environment" = "user",
    canvasWidth: number = 1080,
    canvasHeight: number = 1920
  ) {
    this.stream = stream;
    this.filter = filter;
    this.facingMode = facingMode;

    // Create a hidden video element to draw frames from
    this.videoEl = document.createElement("video");
    this.videoEl.srcObject = stream;
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    this.videoEl.setAttribute('autoplay', 'true');
    this.videoEl.play().catch(err => console.error("Video play error:", err));

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.ctx = this.canvas.getContext("2d", { alpha: false, desynchronized: true })!;
    
    // Initialize face tracking
    this.faceTracker = new FaceTracker(this.videoEl);
    this.faceTracker.initialize();
  }

  /**
   * Start recording with the filter overlay
   */
  start() {
    this.chunks = [];
    
    // Get canvas stream with 30fps
    this.canvasStream = this.canvas.captureStream(30);
    
    if (!this.canvasStream) {
      throw new Error('Failed to capture canvas stream');
    }

    // Add audio tracks from original stream
    try {
      this.stream.getAudioTracks().forEach((track) => {
        this.canvasStream?.addTrack(track);
      });
    } catch (err) {
      console.warn('Could not add audio tracks:', err);
    }

    // Determine supported mime type
    const mimeType = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/webm;codecs=vp8";
      
    console.log(`Using MIME type: ${mimeType}`);

    this.mediaRecorder = new MediaRecorder(this.canvasStream, { 
      mimeType,
      videoBitsPerSecond: 2500000 // 2.5 Mbps for decent quality
    });
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', (event as any).error);
    };
    
    this.mediaRecorder.start(100);
    
    // Draw loop is already running if previewing, but ensure it's active
    if (this.animationFrameId === null) {
      this.drawLoop();
    }
  }

  /**
   * Start the preview loop without recording
   */
  startPreview(previewCanvas?: HTMLCanvasElement) {
    if (this.animationFrameId !== null) return;
    this.drawLoop(previewCanvas);
  }

  /**
   * Animation loop to draw the filter and camera feed
   */
  private drawLoop = async (previewCanvas?: HTMLCanvasElement) => {
    const { width, height } = this.canvas;

    this.ctx.save();
    
    // Mirror the feed if it's the front camera
    if (this.facingMode === "user") {
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
    }

    // Draw video frame from camera
    this.ctx.drawImage(this.videoEl, 0, 0, width, height);
    
    this.ctx.restore();
    
    // --- AR FACE TRACKING OVERLAYS ---
    if (this.faceTracker) {
      const landmarks = await this.faceTracker.detectFace();
      if (landmarks) {
        const color = getLensConfig(this.filter).color;
        
        // Draw specific AR elements based on filter or general AI branding
        drawFaceHalo(this.ctx, landmarks, color, width, height);
        drawFaceScan(this.ctx, landmarks, color, width, height);
      }
    }
    
    // Draw AR text lens overlay (always oriented correctly)
    drawARTextLens(this.ctx, this.filter, width, height);
    
    // If a preview canvas is provided, copy the main canvas to it
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(this.canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.drawLoop(previewCanvas));
  };

  /**
   * Stop recording and return the blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const type = this.mediaRecorder?.mimeType || "video/webm";
          const blob = new Blob(this.chunks, { type });
          resolve(blob);
        };
        this.mediaRecorder.stop();
      } else {
        resolve(new Blob([], { type: "video/webm" }));
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((t) => t.stop());
      this.canvasStream = null;
    }
    this.videoEl.pause();
    this.videoEl.srcObject = null;
    this.chunks = [];
  }
}
