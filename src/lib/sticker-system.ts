/**
 * sticker-system.ts
 *
 * Defines sticker metadata and helper drawing logic for Snapchat-like overlays.
 */

export interface StickerMetadata {
  id: string;
  emoji: string;
  posX: number;
  posY: number;
  rotation: number;
  scale: number;
  color: string;
  visible: boolean;
}

export const DEFAULT_STICKERS: StickerMetadata[] = [
  {
    id: "sparkle",
    emoji: "✨",
    posX: 0.5,
    posY: 0.25,
    rotation: 0,
    scale: 1.15,
    color: "#F59E0B",
    visible: true,
  },
  {
    id: "star",
    emoji: "⭐",
    posX: 0.25,
    posY: 0.35,
    rotation: -15,
    scale: 1.0,
    color: "#22C55E",
    visible: false,
  },
  {
    id: "rocket",
    emoji: "🚀",
    posX: 0.75,
    posY: 0.4,
    rotation: 10,
    scale: 1.1,
    color: "#0EA5E9",
    visible: false,
  },
];

export const drawStickerOverlay = (
  ctx: CanvasRenderingContext2D,
  sticker: StickerMetadata,
  canvasWidth: number,
  canvasHeight: number,
  facingMode: "user" | "environment"
) => {
  if (!sticker.visible) return;

  const x = sticker.posX * canvasWidth;
  const y = sticker.posY * canvasHeight;
  const fontSize = 60 * sticker.scale;

  ctx.save();
  if (facingMode === "user") {
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.translate(x, y);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = sticker.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = sticker.color;
  ctx.fillText(sticker.emoji, 0, 0);
  ctx.restore();
};
