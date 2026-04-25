/**
 * canvas-camera.ts
 *
 * Provides a unified canvas-based camera engine with live WYSIWYG preview,
 * JPEG photo capture, zoom, and recording support.
 */

import { AIFilter } from "@/lib/filters";
import { FaceTracker } from './face-tracking';
import { drawFaceHalo, drawFaceScan } from './ar-elements';
import { StickerMetadata, drawStickerOverlay } from './sticker-system';
import { drawARTextLens, getLensConfig } from './canvas-recorder';

export class CanvasCamera {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private stream: MediaStream;
  private videoEl: HTMLVideoElement;
  private canvasStream: MediaStream | null = null;
  private filter: AIFilter;
  private facingMode: 'user' | 'environment';
  private faceTracker: FaceTracker | null = null;
  private sticker: StickerMetadata | null = null;
  private zoom: number = 1.0;
  private zoomOffsetX: number = 0;
  private zoomOffsetY: number = 0;

  constructor(
    stream: MediaStream,
    filter: AIFilter,
    facingMode: 'user' | 'environment' = 'user',
    sticker: StickerMetadata | null = null,
    canvasWidth = 1080,
    canvasHeight = 1920
  ) {
    this.stream = stream;
    this.filter = filter;
    this.facingMode = facingMode;
    this.sticker = sticker;

    // Hidden video element used to sample camera frames into the canvas.
    this.videoEl = document.createElement('video');
    this.videoEl.srcObject = stream;
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    this.videoEl.autoplay = true;
    void this.videoEl.play().catch(() => {
      // Play will be resumed once the stream is ready.
    });

    this.canvas = document.createElement('canvas');
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true })!;

    this.faceTracker = new FaceTracker(this.videoEl);
    this.faceTracker.initialize();
  }

  getCanvas() {
    return this.canvas;
  }

  async waitForReady(timeout = 4000): Promise<boolean> {
    if (this.videoEl.readyState >= this.videoEl.HAVE_CURRENT_DATA && this.videoEl.videoWidth > 0 && this.videoEl.videoHeight > 0) {
      return true;
    }

    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        resolve(false);
      }, timeout);

      const onReady = () => {
        window.clearTimeout(timer);
        resolve(true);
      };

      this.videoEl.addEventListener('loadedmetadata', onReady, { once: true });
      this.videoEl.addEventListener('playing', onReady, { once: true });
    });
  }

  isLensValid(): boolean {
    return Boolean(this.filter?.id && this.filter?.shortName && this.ctx);
  }

  private async applyZoomConstraint(zoom: number) {
    const track = this.stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities();
    if ('zoom' in capabilities && capabilities.zoom) {
      const maxZoom = Math.min(5, capabilities.zoom.max ?? 5);
      const minZoom = Math.max(1, capabilities.zoom.min ?? 1);
      const zoomValue = Math.max(minZoom, Math.min(maxZoom, zoom));

      try {
        await track.applyConstraints({ advanced: [{ zoom: zoomValue }] });
      } catch (error) {
        // Ignore constraints that are not supported.
      }
    }
  }

  setZoom(zoom: number, offsetX = 0, offsetY = 0) {
    this.zoom = Math.max(1.0, Math.min(5.0, zoom));
    this.zoomOffsetX = offsetX;
    this.zoomOffsetY = offsetY;
    void this.applyZoomConstraint(this.zoom);
  }

  setSticker(sticker: StickerMetadata | null) {
    this.sticker = sticker;
  }

  async startPreview(previewCanvas?: HTMLCanvasElement) {
    if (this.animationFrameId !== null) return;
    await this.waitForReady();
    this.drawLoop(previewCanvas);
  }

  startRecording() {
    this.chunks = [];
    this.canvasStream = this.canvas.captureStream(30);
    if (!this.canvasStream) {
      throw new Error('Unable to capture canvas stream.');
    }

    this.stream.getAudioTracks().forEach((track) => {
      try {
        this.canvasStream?.addTrack(track);
      } catch {
        // ignore if we cannot attach audio track
      }
    });

    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/webm;codecs=vp8';

    this.mediaRecorder = new MediaRecorder(this.canvasStream, {
      mimeType,
      videoBitsPerSecond: 2500000,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error', (event as any).error);
    };

    this.mediaRecorder.start(100);
    if (this.animationFrameId === null) {
      this.drawLoop();
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const type = this.mediaRecorder?.mimeType || 'video/webm';
          const blob = new Blob(this.chunks, { type });
          resolve(blob);
        };
        this.mediaRecorder.stop();
      } else {
        resolve(new Blob([], { type: 'video/webm' }));
      }
    });
  }

  capturePhoto(quality = 0.95): string {
    return this.canvas.toDataURL('image/jpeg', quality);
  }

  private async drawLoop(previewCanvas?: HTMLCanvasElement) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();

    if (this.facingMode === 'user') {
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
    }

    const videoWidth = this.videoEl.videoWidth || width;
    const videoHeight = this.videoEl.videoHeight || height;
    const sourceWidth = videoWidth / this.zoom;
    const sourceHeight = videoHeight / this.zoom;
    const sourceX = Math.min(Math.max(0, (videoWidth - sourceWidth) / 2 + this.zoomOffsetX), Math.max(0, videoWidth - sourceWidth));
    const sourceY = Math.min(Math.max(0, (videoHeight - sourceHeight) / 2 + this.zoomOffsetY), Math.max(0, videoHeight - sourceHeight));

    this.ctx.drawImage(
      this.videoEl,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );

    this.ctx.restore();

    if (this.faceTracker) {
      const landmarks = await this.faceTracker.detectFace();
      if (landmarks) {
        const color = getLensConfig(this.filter).color;
        drawFaceHalo(this.ctx, landmarks, color, width, height);
        drawFaceScan(this.ctx, landmarks, color, width, height);
      }
    }

    drawARTextLens(this.ctx, this.filter, width, height);

    if (this.sticker) {
      drawStickerOverlay(this.ctx, this.sticker, width, height, this.facingMode);
    }

    if (previewCanvas) {
      const previewCtx = previewCanvas.getContext('2d');
      if (previewCtx) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.drawImage(this.canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.drawLoop(previewCanvas));
  }

  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((track) => track.stop());
      this.canvasStream = null;
    }
    this.videoEl.pause();
    this.videoEl.srcObject = null;
    this.chunks = [];
  }
}
