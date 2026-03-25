/**
 * ar-elements.ts
 * 
 * Reusable AR drawing elements that can be anchored to face landmarks.
 */

import { FaceLandmarks } from './face-tracking';

/**
 * Draw a 3D-like halo or crown over the detected face
 */
export function drawFaceHalo(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  color: string,
  canvasWidth: number,
  canvasHeight: number
) {
  const { center, box, rotation } = landmarks;
  
  const x = center.x * canvasWidth;
  const y = center.y * canvasHeight;
  const w = box.width * canvasWidth;
  
  ctx.save();
  ctx.translate(x, y - w * 0.6); // Position above head
  ctx.rotate(rotation);
  
  // Draw glowing halo
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, w * 0.2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.stroke();
  
  // Add some "sparkles"
  for (let i = 0; i < 3; i++) {
    const angle = (Date.now() / 1000 + i * 2) % (Math.PI * 2);
    const sx = Math.cos(angle) * w * 0.6;
    const sy = Math.sin(angle) * w * 0.2;
    
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draw a tech-overlay grid around the face
 */
export function drawFaceScan(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  color: string,
  canvasWidth: number,
  canvasHeight: number
) {
  const { center, box } = landmarks;
  const x = center.x * canvasWidth;
  const y = center.y * canvasHeight;
  const w = box.width * canvasWidth;
  const h = box.height * canvasHeight;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  
  // Corner brackets
  const size = w * 0.2;
  
  // Top Left
  ctx.beginPath();
  ctx.moveTo(x - w/2, y - h/2 + size);
  ctx.lineTo(x - w/2, y - h/2);
  ctx.lineTo(x - w/2 + size, y - h/2);
  ctx.stroke();
  
  // Top Right
  ctx.beginPath();
  ctx.moveTo(x + w/2 - size, y - h/2);
  ctx.lineTo(x + w/2, y - h/2);
  ctx.lineTo(x + w/2, y - h/2 + size);
  ctx.stroke();
  
  // Scanning line
  const scanY = y - h/2 + ((Date.now() / 2000) % 1) * h;
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.moveTo(x - w/2, scanY);
  ctx.lineTo(x + w/2, scanY);
  ctx.strokeStyle = color + "80";
  ctx.stroke();
  
  ctx.restore();
}
