import { objectCenter, placeObjectAtCenter, type Measure, type SceneObject } from './model';
import { cloneBezierNodes, lerpPoint, normalizedBezier, MAX_BEZIER_NODES, type BezierNode, type CurvePoint } from './bezier-geometry';
export type BezierObject = Extract<SceneObject, { type: 'bezier' }>;
export type BezierPart = 'point' | 'in' | 'out';
export function bezierWorldNodes(object: BezierObject, measure: Measure): BezierNode[] {
  const center = objectCenter(object, measure), angle = (object.rotationDeg ?? 0) * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  const world = (point: CurvePoint): CurvePoint => { const x = (point.x - 0.5) * object.widthMm, y = (point.y - 0.5) * object.heightMm; return { x: center.xMm + x * cos - y * sin, y: center.yMm + x * sin + y * cos }; };
  return object.nodes.map(node => ({ ...world(node), ...(node.in ? { in: world(node.in) } : {}), ...(node.out ? { out: world(node.out) } : {}) }));
}
function rebuild(object: BezierObject, world: BezierNode[], measure: Measure, closed = object.closed): BezierObject {
  const center = objectCenter(object, measure), angle = (object.rotationDeg ?? 0) * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  const local = (point: CurvePoint): CurvePoint => { const x = point.x - center.xMm, y = point.y - center.yMm; return { x: x * cos + y * sin, y: -x * sin + y * cos }; };
  const nodes = world.map(node => ({ ...local(node), ...(node.in ? { in: local(node.in) } : {}), ...(node.out ? { out: local(node.out) } : {}) }));
  const geometry = normalizedBezier(nodes, closed, object.strokeMm), x = geometry.xMm + (geometry.widthMm + object.strokeMm) / 2, y = geometry.yMm + (geometry.heightMm + object.strokeMm) / 2;
  const next = { ...object, ...geometry, closed, ...(!closed ? { fill: 'none' as const } : {}) };
  return placeObjectAtCenter(next, { xMm: center.xMm + x * cos - y * sin, yMm: center.yMm + x * sin + y * cos }, measure) as BezierObject;
}
function assertIndex(object: BezierObject, index: number) { if (!Number.isInteger(index) || index < 0 || index >= object.nodes.length) throw new Error('Nodo della curva non presente'); }
export function bezierPartAvailable(object: BezierObject, index: number, part: BezierPart): boolean {
  return part === 'point' || part === 'in' && (object.closed || index > 0) || part === 'out' && (object.closed || index < object.nodes.length - 1);
}
export function moveBezierPart(object: BezierObject, index: number, part: BezierPart, point: CurvePoint, measure: Measure): BezierObject {
  assertIndex(object, index); if (!bezierPartAvailable(object, index, part) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('Punto o maniglia della curva non validi');
  const nodes = bezierWorldNodes(object, measure), node = nodes[index]!;
  if (part === 'point') {
    const dx = point.x - node.x, dy = point.y - node.y; for (const side of ['in', 'out'] as const) if (node[side]) node[side] = { x: node[side]!.x + dx, y: node[side]!.y + dy }; node.x = point.x; node.y = point.y;
  } else { if (!node[part]) throw new Error('Abilita prima la maniglia della curva'); node[part] = { ...point }; }
  return rebuild(object, nodes, measure);
}
export function setBezierHandle(object: BezierObject, index: number, side: 'in' | 'out', enabled: boolean, measure: Measure): BezierObject {
  assertIndex(object, index); if (!bezierPartAvailable(object, index, side)) throw new Error('Maniglia non utilizzata nel capo aperto');
  const nodes = bezierWorldNodes(object, measure), node = nodes[index]!;
  if (!enabled) delete node[side]; else if (!node[side]) node[side] = lerpPoint(node, nodes[(index + (side === 'out' ? 1 : -1) + nodes.length) % nodes.length]!, 1 / 3);
  return rebuild(object, nodes, measure);
}
export type BezierHandleAction = 'align' | 'symmetric' | 'remove';
/** One-shot handle shaping in physical coordinates; no persistent coupling. */
export function shapeBezierHandles(object: BezierObject, index: number, action: BezierHandleAction, guide: 'in' | 'out', measure: Measure): BezierObject {
  assertIndex(object, index);
  if (!['align', 'symmetric', 'remove'].includes(action) || !['in', 'out'].includes(guide)) throw new Error('Operazione sulle maniglie non valida');
  const nodes = bezierWorldNodes(object, measure), node = nodes[index]!;
  if (action === 'remove') { delete node.in; delete node.out; return rebuild(object, nodes, measure); }
  if (!bezierPartAvailable(object, index, 'in') || !bezierPartAvailable(object, index, 'out')) throw new Error('Servono due segmenti adiacenti al nodo');
  const previous = nodes[(index - 1 + nodes.length) % nodes.length]!, next = nodes[(index + 1) % nodes.length]!;
  const length = (point?: CurvePoint) => point ? Math.hypot(point.x - node.x, point.y - node.y) : 0;
  const incoming = length(node.in), outgoing = length(node.out), epsilon = 1e-9;
  let dx = 0, dy = 0;
  const use = (side: 'in' | 'out') => { const handle = node[side], sign = side === 'out' ? 1 : -1; if (!handle || length(handle) <= epsilon) return false; dx = (handle.x - node.x) * sign; dy = (handle.y - node.y) * sign; return true; };
  if (!use(guide) && !use(guide === 'out' ? 'in' : 'out')) { dx = next.x - previous.x; dy = next.y - previous.y; }
  const direction = Math.hypot(dx, dy); if (direction <= epsilon) throw new Error('Non è possibile determinare la direzione delle maniglie'); dx /= direction; dy /= direction;
  const fallbackIn = Math.hypot(previous.x - node.x, previous.y - node.y) / 3, fallbackOut = Math.hypot(next.x - node.x, next.y - node.y) / 3;
  const inLength = incoming > epsilon ? incoming : fallbackIn, outLength = outgoing > epsilon ? outgoing : fallbackOut;
  const symmetricLength = guide === 'out' ? outLength : inLength;
  const a = action === 'symmetric' ? symmetricLength : inLength, b = action === 'symmetric' ? symmetricLength : outLength;
  if (a <= epsilon || b <= epsilon) throw new Error('Le maniglie richiedono una lunghezza positiva');
  node.in = { x: node.x - dx * a, y: node.y - dy * a }; node.out = { x: node.x + dx * b, y: node.y + dy * b };
  return rebuild(object, nodes, measure);
}
export function setBezierClosed(object: BezierObject, closed: boolean, measure: Measure): BezierObject { return rebuild(object, bezierWorldNodes(object, measure), measure, closed); }
/** Cut at a node, keeping the closing cubic as an explicit segment. */
export function openBezierAtNode(object: BezierObject, index: number, measure: Measure): BezierObject {
  assertIndex(object, index); if (!object.closed) throw new Error('La curva è già aperta'); if (object.nodes.length >= MAX_BEZIER_NODES) throw new Error('L’apertura richiede un nodo aggiuntivo: limite di 64 nodi');
  const world = bezierWorldNodes(object, measure), nodes = [...world.slice(index), ...world.slice(0, index)], last = structuredClone(nodes[0]!);
  delete nodes[0]!.in; delete last.out; nodes.push(last); return rebuild(object, nodes, measure, false);
}
export function insertBezierNode(object: BezierObject, index: number, measure: Measure): BezierObject {
  assertIndex(object, index); if (object.nodes.length >= MAX_BEZIER_NODES) throw new Error('Limite di 64 nodi raggiunto'); if (!object.closed && index === object.nodes.length - 1) throw new Error('Il nodo finale non ha un segmento successivo');
  const nodes = bezierWorldNodes(object, measure), a = nodes[index]!, next = (index + 1) % nodes.length, d = nodes[next]!, b = a.out ?? a, c = d.in ?? d;
  const ab = lerpPoint(a, b), bc = lerpPoint(b, c), cd = lerpPoint(c, d), abc = lerpPoint(ab, bc), bcd = lerpPoint(bc, cd), middle = lerpPoint(abc, bcd);
  a.out = ab; d.in = cd; nodes.splice(index + 1, 0, { ...middle, in: abc, out: bcd }); return rebuild(object, nodes, measure);
}
export function deleteBezierNode(object: BezierObject, index: number, measure: Measure): BezierObject {
  assertIndex(object, index); if (object.nodes.length <= 2) throw new Error('La curva richiede almeno due nodi'); const nodes = bezierWorldNodes(object, measure); nodes.splice(index, 1); return rebuild(object, nodes, measure);
}
export function reverseBezier(object: BezierObject): BezierObject {
  return { ...object, nodes: [...object.nodes].reverse().map(node => ({ x: node.x, y: node.y, ...(node.out ? { in: { ...node.out } } : {}), ...(node.in ? { out: { ...node.in } } : {}) })) };
}
export function reflectBezier(object: BezierObject, axis: 'horizontal' | 'vertical', measure: Measure): BezierObject {
  const center = objectCenter(object, measure), nodes = cloneBezierNodes(object.nodes), reflect = (point: CurvePoint) => { if (axis === 'horizontal' && object.widthMm > 0) point.x = 1 - point.x; if (axis === 'vertical' && object.heightMm > 0) point.y = 1 - point.y; };
  for (const node of nodes) { reflect(node); if (node.in) reflect(node.in); if (node.out) reflect(node.out); }
  return placeObjectAtCenter({ ...object, nodes, rotationDeg: -(object.rotationDeg || 0) }, center, measure) as BezierObject;
}
