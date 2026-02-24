/**
 * Advanced AR Filter Rendering Engine
 * Snapchat/Instagram-style filter application
 * Supports front and back camera with real-time filters
 */

import { AIFilter, getFilterColor } from './filters.js';

export interface ARFilterConfig {
  filter: AIFilter;
  cameraFacing: 'user' | 'environment';
}

/**
 * AR Filter Renderer
 * Applies visual effects to canvas in real-time
 */
export class ARFilterRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private filter: AIFilter;
  private cameraFacing: 'user' | 'environment';
  private animationFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement, config: ARFilterConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.filter = config.filter;
    this.cameraFacing = config.cameraFacing;
  }

  /**
   * Apply filter to video frame
   */
  applyFilter(sourceCanvas: HTMLCanvasElement): void {
    // Get filter color
    const filterColor = getFilterColor(this.filter.id);

    // Apply to destination canvas
    this.ctx.drawImage(sourceCanvas, 0, 0);

    // Apply overlay based on filter type
    this.applyFilterOverlay(filterColor);

    // Add filter-specific effects
    this.applyFilterEffects();

    // Add watermark/branding
    this.applyWatermark();
  }

  /**
   * Apply color overlay and gradient
   */
  private applyFilterOverlay(filterColor: string): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Create gradient overlay
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, filterColor + '15'); // 15% opacity
    gradient.addColorStop(0.5, filterColor + '08'); // 8% opacity
    gradient.addColorStop(1, filterColor + '15');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // Add subtle border glow
    this.ctx.strokeStyle = filterColor + '30';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(0, 0, width, height);
  }

  /**
   * Apply filter-specific visual effects
   */
  private applyFilterEffects(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const filterColor = getFilterColor(this.filter.id);

    switch (this.filter.id) {
      case 'ready':
        // Shimmer effect for "AI Ready"
        this.applyShimmerEffect(filterColor);
        break;

      case 'savvy':
        // Glow effect for "AI Savvy"
        this.applyGlowEffect(filterColor);
        break;

      case 'accountable':
        // Shield pattern for "AI Accountable"
        this.applyShieldPattern(filterColor);
        break;

      case 'driven':
        // Target circles for "AI Driven"
        this.applyTargetEffect(filterColor);
        break;

      case 'enabler':
        // Hexagon grid for "AI Enabler"
        this.applyHexagonGrid(filterColor);
        break;

      case 'building':
        // Brick pattern for "Building"
        this.applyBrickPattern(filterColor);
        break;

      case 'leading':
        // Crown effect for "Leading"
        this.applyCrownEffect(filterColor);
        break;

      case 'shaping':
        // Network effect for "Shaping Ecosystems"
        this.applyNetworkEffect(filterColor);
        break;
    }
  }

  /**
   * Shimmer/twinkle effect
   */
  private applyShimmerEffect(color: string): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const shimmerY = (Date.now() % 2000) / 2000 * height;

    const gradient = this.ctx.createLinearGradient(0, shimmerY, 0, shimmerY + 50);
    gradient.addColorStop(0, color + '00');
    gradient.addColorStop(0.5, color + '60');
    gradient.addColorStop(1, color + '00');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, shimmerY, width, 50);
  }

  /**
   * Glow/blur effect
   */
  private applyGlowEffect(color: string): void {
    this.ctx.filter = `drop-shadow(0 0 20px ${color}80)`;
    this.ctx.fillStyle = color + '15';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = 'none';
  }

  /**
   * Shield pattern overlay
   */
  private applyShieldPattern(color: string): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.strokeStyle = color + '60';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2, height * 0.1);
    this.ctx.lineTo(width * 0.75, height * 0.3);
    this.ctx.lineTo(width * 0.75, height * 0.7);
    this.ctx.quadraticCurveTo(width / 2, height * 0.9, width * 0.25, height * 0.7);
    this.ctx.lineTo(width * 0.25, height * 0.3);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  /**
   * Target circles effect
   */
  private applyTargetEffect(color: string): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.ctx.strokeStyle = color + '80';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 4; i++) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, (i + 1) * 80, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Center dot
    this.ctx.fillStyle = color + 'FF';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Hexagon grid pattern
   */
  private applyHexagonGrid(color: string): void {
    const hexSize = 40;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.strokeStyle = color + '40';
    this.ctx.lineWidth = 1;

    for (let y = 0; y < height; y += hexSize * 1.5) {
      for (let x = 0; x < width; x += hexSize * 1.7) {
        this.drawHexagon(x, y, hexSize / 2);
      }
    }
  }

  /**
   * Draw hexagon shape
   */
  private drawHexagon(centerX: number, centerY: number, radius: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
  }

  /**
   * Brick wall pattern
   */
  private applyBrickPattern(color: string): void {
    const brickWidth = 60;
    const brickHeight = 30;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.strokeStyle = color + '60';
    this.ctx.lineWidth = 2;

    for (let y = 0; y < height; y += brickHeight) {
      const offset = (y / brickHeight) % 2 === 0 ? brickWidth / 2 : 0;

      for (let x = 0 - offset; x < width; x += brickWidth) {
        this.ctx.strokeRect(x, y, brickWidth, brickHeight);
      }
    }
  }

  /**
   * Crown effect for leaders
   */
  private applyCrownEffect(color: string): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.fillStyle = color + '80';
    this.ctx.strokeStyle = color + 'FF';
    this.ctx.lineWidth = 3;

    // Crown outline at top
    this.ctx.beginPath();
    this.ctx.moveTo(width * 0.3, height * 0.15);
    this.ctx.lineTo(width * 0.35, height * 0.08);
    this.ctx.lineTo(width * 0.42, height * 0.12);
    this.ctx.lineTo(width * 0.5, height * 0.05);
    this.ctx.lineTo(width * 0.58, height * 0.12);
    this.ctx.lineTo(width * 0.65, height * 0.08);
    this.ctx.lineTo(width * 0.7, height * 0.15);
    this.ctx.lineTo(width * 0.3, height * 0.15);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Network/nodes effect
   */
  private applyNetworkEffect(color: string): void {
    const nodeCount = 8;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    const nodes: Array<[number, number]> = [];

    // Calculate node positions
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      nodes.push([centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]);
    }

    // Draw connecting lines
    this.ctx.strokeStyle = color + '40';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < nodeCount; i++) {
      const nextI = (i + 1) % nodeCount;
      this.ctx.beginPath();
      this.ctx.moveTo(nodes[i][0], nodes[i][1]);
      this.ctx.lineTo(nodes[nextI][0], nodes[nextI][1]);
      this.ctx.stroke();
    }

    // Draw nodes
    this.ctx.fillStyle = color + 'FF';
    for (const [x, y] of nodes) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Add DSC watermark/branding
   */
  private applyWatermark(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const filterColor = getFilterColor(this.filter.id);

    // Filter name in corner
    this.ctx.fillStyle = filterColor + 'CC';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';

    // Add background
    const text = this.filter.shortName;
    const textMetrics = this.ctx.measureText(text);
    const padding = 10;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(
      width - textMetrics.width - 30,
      height - 40,
      textMetrics.width + 20,
      35
    );

    // Text
    this.ctx.fillStyle = filterColor + 'FF';
    this.ctx.fillText(text, width - textMetrics.width - 20, height - 10);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

/**
 * Get filter effect intensity (0-1)
 */
export const getFilterIntensity = (filterId: string): number => {
  const intensities: Record<string, number> = {
    ready: 0.8,
    savvy: 0.7,
    accountable: 0.75,
    driven: 0.85,
    enabler: 0.6,
    building: 0.7,
    leading: 0.9,
    shaping: 0.8,
  };
  return intensities[filterId] || 0.7;
};
