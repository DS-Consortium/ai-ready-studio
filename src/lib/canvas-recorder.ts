/**
 * canvas-recorder.ts
 *
 * Implements Canvas-based video recording that bakes AR text lens filters
 * directly into the recorded video stream using MediaRecorder and Canvas API.
 */

import { AIFilter } from "@/lib/filters";

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

  constructor(
    stream: MediaStream,
    filter: AIFilter,
    canvasWidth: number = 1080,
    canvasHeight: number = 1920
  ) {
    this.stream = stream;
    this.filter = filter;

    // Create a hidden video element to draw frames from
    this.videoEl = document.createElement("video");
    this.videoEl.srcObject = stream;
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    this.videoEl.play();

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.ctx = this.canvas.getContext("2d", { alpha: false })!;
  }

  /**
   * Start recording with the filter overlay
   */
  start() {
    this.chunks = [];
    
    // Get canvas stream
    this.canvasStream = this.canvas.captureStream(30);
    
    // Add audio tracks from original stream
    this.stream.getAudioTracks().forEach((track) => {
      this.canvasStream?.addTrack(track);
    });

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
      
    this.mediaRecorder = new MediaRecorder(this.canvasStream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    
    this.mediaRecorder.start(100);
    
    // Draw filter overlay on canvas continuously
    this.drawLoop();
  }

  /**
   * Animation loop to draw the filter and camera feed
   */
  private drawLoop = () => {
    // Draw video frame from camera
    this.ctx.drawImage(this.videoEl, 0, 0, this.canvas.width, this.canvas.height);
    
    // Draw AR text lens overlay
    drawARTextLens(this.ctx, this.filter, this.canvas.width, this.canvas.height);
    
    this.animationFrameId = requestAnimationFrame(this.drawLoop);
  };

  /**
   * Stop recording and return the blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: "video/webm" });
          resolve(blob);
        };
        this.mediaRecorder.stop();
      }
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((t) => t.stop());
    }
    this.videoEl.pause();
    this.videoEl.srcObject = null;
  }
}
