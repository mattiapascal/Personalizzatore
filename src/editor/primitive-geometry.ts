import type { SceneObject } from './model';
import { constrainedLineEnd, lineFromEndpoints, type PointMm } from './line-geometry';

export type DrawingPrimitive = 'line' | 'rect' | 'circle' | 'ellipse';
export function constrainedPrimitiveEnd(kind: DrawingPrimitive, start: PointMm, end: PointMm): PointMm {
  if (kind === 'line') return constrainedLineEnd(start, end);
  if (kind === 'circle') return end;
  const dx = end.xMm - start.xMm, dy = end.yMm - start.yMm, side = Math.max(Math.abs(dx), Math.abs(dy));
  return { xMm: start.xMm + (dx < 0 ? -side : side), yMm: start.yMm + (dy < 0 ? -side : side) };
}
/** I punti descrivono il centro del tratto; x/y canoniche includono il suo ingombro. */
export function primitiveFromEndpoints(kind: DrawingPrimitive, id: string, start: PointMm, end: PointMm): SceneObject {
  if (kind === 'line') return lineFromEndpoints(id, start, end);
  if (![start.xMm, start.yMm, end.xMm, end.yMm].every(Number.isFinite)) throw new Error('La forma richiede punti finiti');
  const strokeMm = 0.25, stroke = '#000000';
  if (kind === 'circle') {
    const radiusMm = Math.hypot(end.xMm - start.xMm, end.yMm - start.yMm);
    if (radiusMm <= 0) throw new Error('Il cerchio richiede un raggio positivo');
    return { id, type: kind, xMm: start.xMm - radiusMm - strokeMm / 2, yMm: start.yMm - radiusMm - strokeMm / 2, radiusMm, strokeMm, stroke };
  }
  const widthMm = Math.abs(end.xMm - start.xMm), heightMm = Math.abs(end.yMm - start.yMm);
  if (widthMm <= 0 || heightMm <= 0) throw new Error('Il rettangolo richiede larghezza e altezza positive');
  if (kind === 'ellipse') return { id, type: kind, xMm: Math.min(start.xMm, end.xMm) - strokeMm / 2, yMm: Math.min(start.yMm, end.yMm) - strokeMm / 2, rxMm: widthMm / 2, ryMm: heightMm / 2, strokeMm, stroke };
  return { id, type: kind, xMm: Math.min(start.xMm, end.xMm) - strokeMm / 2, yMm: Math.min(start.yMm, end.yMm) - strokeMm / 2, widthMm, heightMm, strokeMm, stroke };
}
