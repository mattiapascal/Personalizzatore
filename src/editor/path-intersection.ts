import type { NormalizedPoint } from './path-geometry';
interface Point { x: number; y: number; }
function distanceSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
  const t = squared ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / squared)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function segmentHitsRectangle(a: Point, b: Point, width: number, height: number): boolean {
  let lo = 0, hi = 1;
  for (const [origin, delta, limit] of [[a.x, b.x - a.x, width], [a.y, b.y - a.y, height]] as const) {
    if (delta === 0) { if (origin < 0 || origin > limit) return false; continue; }
    let start = -origin / delta, end = (limit - origin) / delta; if (start > end) [start, end] = [end, start];
    lo = Math.max(lo, start); hi = Math.min(hi, end); if (lo > hi) return false;
  }
  return true;
}
function insidePolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!, b = polygon[j]!;
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function pathIntersectsArea(points: readonly NormalizedPoint[], widthMm: number, heightMm: number, center: Point, angleDeg: number, strokeMm: number, filled: boolean, closed: boolean, area: { width: number; height: number }, round: boolean): boolean {
  const angle = angleDeg * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle), padding = strokeMm / 2, epsilon = 1e-8;
  const world = points.map(p => { const x = (p.x - 0.5) * widthMm, y = (p.y - 0.5) * heightMm; return { x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos }; });
  const areaCenter = { x: area.width / 2, y: area.height / 2 };
  if (filled && closed && insidePolygon(areaCenter, world)) return true;
  const corners = [{ x: 0, y: 0 }, { x: area.width, y: 0 }, { x: area.width, y: area.height }, { x: 0, y: area.height }];
  for (let i = 1; i < world.length + (closed ? 1 : 0); i++) {
    const a = world[i - 1]!, b = world[i % world.length]!;
    if (round) { if (distanceSegment(areaCenter, a, b) < area.width / 2 + padding - epsilon) return true; }
    else {
      if (segmentHitsRectangle(a, b, area.width, area.height)) return true;
      const endpointDistance = (p: Point) => Math.hypot(p.x - Math.max(0, Math.min(area.width, p.x)), p.y - Math.max(0, Math.min(area.height, p.y)));
      if (Math.min(endpointDistance(a), endpointDistance(b), ...corners.map(p => distanceSegment(p, a, b))) < padding - epsilon) return true;
    }
  }
  return false;
}
