interface Point { x: number; y: number; }
/** Distanza euclidea dal disco ellittico, senza approssimarlo col suo riquadro. */
function distanceToEllipse(point: Point, rx: number, ry: number): number {
  const x = Math.abs(point.x), y = Math.abs(point.y);
  if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) return 0;
  const a = rx * rx, b = ry * ry;
  const equation = (t: number) => (rx * x / (t + a)) ** 2 + (ry * y / (t + b)) ** 2;
  let lo = 0, hi = Math.max(rx * x + ry * y, a, b);
  while (equation(hi) > 1) hi *= 2;
  for (let i = 0; i < 64; i++) { const mid = (lo + hi) / 2; if (equation(mid) > 1) lo = mid; else hi = mid; }
  return Math.hypot(x - a * x / (hi + a), y - b * y / (hi + b));
}
function segmentIntersectsEllipse(a: Point, b: Point, rx: number, ry: number): boolean {
  const x = a.x / rx, y = a.y / ry, dx = (b.x - a.x) / rx, dy = (b.y - a.y) / ry;
  const denominator = dx * dx + dy * dy, t = denominator ? Math.max(0, Math.min(1, -(x * dx + y * dy) / denominator)) : 0;
  return (x + t * dx) ** 2 + (y + t * dy) ** 2 < 1 - 1e-10;
}
function distanceToSegment(a: Point, b: Point, rx: number, ry: number): number {
  const at = (t: number) => distanceToEllipse({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }, rx, ry);
  let lo = 0, hi = 1;
  // La distanza da un insieme convesso è convessa lungo ciascun segmento.
  for (let i = 0; i < 48; i++) { const left = lo + (hi - lo) / 3, right = hi - (hi - lo) / 3; if (at(left) < at(right)) hi = right; else lo = left; }
  return Math.min(at(0), at(1), at((lo + hi) / 2));
}
export function ellipseIntersectsArea(center: Point, rx: number, ry: number, angleDeg: number, strokeMm: number, area: { width: number; height: number }, round: boolean): boolean {
  const angle = angleDeg * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle), padding = strokeMm / 2, epsilon = 1e-8;
  const local = (point: Point) => { const x = point.x - center.x, y = point.y - center.y; return { x: x * cos + y * sin, y: -x * sin + y * cos }; };
  if (round) return distanceToEllipse(local({ x: area.width / 2, y: area.height / 2 }), rx, ry) < area.width / 2 + padding - epsilon;
  if (center.x >= 0 && center.x <= area.width && center.y >= 0 && center.y <= area.height) return true;
  const points = [{ x: 0, y: 0 }, { x: area.width, y: 0 }, { x: area.width, y: area.height }, { x: 0, y: area.height }].map(local);
  for (let i = 0; i < 4; i++) {
    const a = points[i]!, b = points[(i + 1) % 4]!;
    if (segmentIntersectsEllipse(a, b, rx, ry) || padding > epsilon && distanceToSegment(a, b, rx, ry) < padding - epsilon) return true;
  }
  return false;
}
