import type { PointMm } from './line-geometry';
export interface NormalizedPoint { x: number; y: number; }
export interface StrokeGeometry { xMm: number; yMm: number; widthMm: number; heightMm: number; points: NormalizedPoint[]; }
function segmentDistanceSquared(p: PointMm, a: PointMm, b: PointMm): number {
  const dx = b.xMm - a.xMm, dy = b.yMm - a.yMm, squared = dx * dx + dy * dy;
  const t = squared ? Math.max(0, Math.min(1, ((p.xMm - a.xMm) * dx + (p.yMm - a.yMm) * dy) / squared)) : 0;
  return (p.xMm - a.xMm - t * dx) ** 2 + (p.yMm - a.yMm - t * dy) ** 2;
}
/** Ramer–Douglas–Peucker iterativo: conserva estremità e ordine dei punti. */
export function simplifyStroke(points: readonly PointMm[], toleranceMm: number): PointMm[] {
  if (!Number.isFinite(toleranceMm) || toleranceMm < 0 || points.some(p => !Number.isFinite(p.xMm) || !Number.isFinite(p.yMm))) throw new Error('Punti o tolleranza non validi');
  if (points.length <= 2) return points.map(p => ({ ...p }));
  const keep = new Set([0, points.length - 1]), stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!; let farthest = -1, distance = toleranceMm * toleranceMm;
    for (let i = first + 1; i < last; i++) { const candidate = segmentDistanceSquared(points[i]!, points[first]!, points[last]!); if (candidate > distance) { distance = candidate; farthest = i; } }
    if (farthest >= 0) { keep.add(farthest); stack.push([first, farthest], [farthest, last]); }
  }
  return [...keep].sort((a, b) => a - b).map(index => ({ ...points[index]! }));
}
export function strokeGeometry(points: readonly PointMm[], strokeMm = 0.25): StrokeGeometry {
  if (points.length < 2 || points.length > 512 || !Number.isFinite(strokeMm) || strokeMm <= 0 || points.some(p => !Number.isFinite(p.xMm) || !Number.isFinite(p.yMm))) throw new Error('Tracciato non valido: da 2 a 512 punti finiti e contorno positivo');
  const xs = points.map(p => p.xMm), ys = points.map(p => p.yMm), x = Math.min(...xs), y = Math.min(...ys), widthMm = Math.max(...xs) - x, heightMm = Math.max(...ys) - y;
  if (widthMm === 0 && heightMm === 0) throw new Error('Il tracciato richiede punti distinti');
  const unit = (n: number) => Math.max(0, Math.min(1, Math.round(n * 1e9) / 1e9));
  return { xMm: x - strokeMm / 2, yMm: y - strokeMm / 2, widthMm, heightMm, points: points.map(p => ({ x: widthMm ? unit((p.xMm - x) / widthMm) : 0, y: heightMm ? unit((p.yMm - y) / heightMm) : 0 })) };
}
