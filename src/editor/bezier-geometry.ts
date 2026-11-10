import { z } from 'zod';
export interface CurvePoint { x: number; y: number; }
export interface BezierNode extends CurvePoint { in?: CurvePoint; out?: CurvePoint; }
const handle = z.strictObject({ x: z.number().finite().min(-100).max(100), y: z.number().finite().min(-100).max(100) });
export const BezierNodeSchema = z.strictObject({ x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1), in: handle.optional(), out: handle.optional() });
export const MAX_BEZIER_NODES = 64;
export function cloneBezierNodes(nodes: readonly BezierNode[]): BezierNode[] { return nodes.map(node => ({ ...node, ...(node.in ? { in: { ...node.in } } : {}), ...(node.out ? { out: { ...node.out } } : {}) })); }
function assertNodes(nodes: readonly BezierNode[]): void {
  if (nodes.length < 2 || nodes.length > MAX_BEZIER_NODES || nodes.some(node => [node, node.in, node.out].some(p => p && (!Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > 1e6 || Math.abs(p.y) > 1e6)))) throw new Error('Curva non valida: da 2 a 64 nodi con coordinate finite entro i limiti');
}
export const lerpPoint = (a: CurvePoint, b: CurvePoint, t = 0.5): CurvePoint => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export function cubicPoint(a: CurvePoint, b: CurvePoint, c: CurvePoint, d: CurvePoint, t: number): CurvePoint {
  const ab = lerpPoint(a, b, t), bc = lerpPoint(b, c, t), cd = lerpPoint(c, d, t); return lerpPoint(lerpPoint(ab, bc, t), lerpPoint(bc, cd, t), t);
}
function extrema(a: number, b: number, c: number, d: number): number[] {
  const aa = -a + 3 * b - 3 * c + d, bb = 2 * (a - 2 * b + c), cc = b - a, eps = 1e-12;
  if (Math.abs(aa) < eps) return Math.abs(bb) < eps ? [] : [-cc / bb];
  const discriminant = bb * bb - 4 * aa * cc; if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant), q = -0.5 * (bb + (bb < 0 ? -root : root));
  return q === 0 ? [-bb / (2 * aa)] : [q / aa, cc / q];
}
export function bezierSegments(nodes: readonly BezierNode[], closed: boolean): [CurvePoint, CurvePoint, CurvePoint, CurvePoint][] {
  assertNodes(nodes); return Array.from({ length: nodes.length - 1 + Number(closed) }, (_, index) => {
    const a = nodes[index]!, b = nodes[(index + 1) % nodes.length]!; return [a, a.out ?? a, b.in ?? b, b];
  });
}
/** Estremi reali delle cubiche: le maniglie possono stare fuori dall'ingombro. */
export function bezierBounds(nodes: readonly BezierNode[], closed: boolean) {
  const points: CurvePoint[] = [];
  for (const [a, b, c, d] of bezierSegments(nodes, closed)) {
    points.push(a, d);
    for (const t of [...extrema(a.x, b.x, c.x, d.x), ...extrema(a.y, b.y, c.y, d.y)]) if (t > 0 && t < 1) points.push(cubicPoint(a, b, c, d, t));
  }
  const xs = points.map(p => p.x), ys = points.map(p => p.y), x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
export function normalizedBezier(nodes: readonly BezierNode[], closed: boolean, strokeMm = 0.25) {
  if (!Number.isFinite(strokeMm) || strokeMm <= 0) throw new Error('Contorno della curva non valido');
  const box = bezierBounds(nodes, closed), widthMm = box.width < 1e-10 ? 0 : box.width, heightMm = box.height < 1e-10 ? 0 : box.height;
  if (widthMm === 0 && heightMm === 0 || closed && (widthMm === 0 || heightMm === 0)) throw new Error('Curva degenere');
  const point = (p: CurvePoint): CurvePoint => ({ x: widthMm ? (p.x - box.x) / widthMm : 0, y: heightMm ? (p.y - box.y) / heightMm : 0 });
  return { xMm: box.x - strokeMm / 2, yMm: box.y - strokeMm / 2, widthMm, heightMm, nodes: nodes.map(node => {
    const p = point(node); return { x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)), ...(node.in ? { in: point(node.in) } : {}), ...(node.out ? { out: point(node.out) } : {}) };
  }) };
}
export type BezierCommand = ['M', number, number] | ['C', number, number, number, number, number, number] | ['Z'];
export function bezierCommands(nodes: readonly BezierNode[], closed: boolean, scaleX: number, scaleY: number): BezierCommand[] {
  const commands: BezierCommand[] = [['M', nodes[0]!.x * scaleX, nodes[0]!.y * scaleY]];
  for (const [, a, b, c] of bezierSegments(nodes, closed)) commands.push(['C', a.x * scaleX, a.y * scaleY, b.x * scaleX, b.y * scaleY, c.x * scaleX, c.y * scaleY]);
  if (closed) commands.push(['Z']); return commands;
}
/** Approssimazione solo per intersezioni in editing, mai per SVG o documento. */
export function flattenBezier(nodes: readonly BezierNode[], closed: boolean, width: number, height: number, toleranceMm = 0.001): CurvePoint[] {
  if (![width, height, toleranceMm].every(Number.isFinite) || width < 0 || height < 0 || toleranceMm <= 0) throw new Error('Tolleranza curva non valida');
  const result: CurvePoint[] = [], distance = (p: CurvePoint, a: CurvePoint, b: CurvePoint) => {
    const dx = (b.x - a.x) * width, dy = (b.y - a.y) * height, x = (p.x - a.x) * width, y = (p.y - a.y) * height, squared = dx * dx + dy * dy, t = squared ? Math.max(0, Math.min(1, (x * dx + y * dy) / squared)) : 0;
    return Math.hypot(x - t * dx, y - t * dy);
  };
  for (const segment of bezierSegments(nodes, closed)) {
    if (!result.length) result.push({ ...segment[0] });
    const stack = [{ segment, depth: 0 }];
    while (stack.length) {
      const { segment: [a, b, c, d], depth } = stack.pop()!;
      if (Math.max(distance(b, a, d), distance(c, a, d)) <= toleranceMm) result.push({ ...d });
      else {
        if (depth >= 20 || result.length + stack.length > 16384) throw new Error('Curva troppo complessa per la verifica locale');
        const ab = lerpPoint(a, b), bc = lerpPoint(b, c), cd = lerpPoint(c, d), abc = lerpPoint(ab, bc), bcd = lerpPoint(bc, cd), middle = lerpPoint(abc, bcd);
        stack.push({ segment: [middle, bcd, cd, d], depth: depth + 1 }, { segment: [a, ab, abc, middle], depth: depth + 1 });
      }
    }
  }
  return result;
}
