import { describe, it, expect } from 'vitest';
import { normalizedBezier, type BezierNode } from '../src/editor/bezier-geometry';
import { bezierWorldNodes, shapeBezierHandles, type BezierObject } from '../src/editor/bezier-nodes';
import { createDocument, DocumentStore, parseGraphicDocument, type Measure } from '../src/editor/model';
const measure: Measure = object => object.type === 'bezier' ? { widthMm: object.widthMm + object.strokeMm, heightMm: object.heightMm + object.strokeMm } : { widthMm: 4, heightMm: 3 };
const curve = (angle = 0): BezierObject => ({ id: 'curve', type: 'bezier', ...normalizedBezier([{ x: 7, y: 8, out: { x: 9, y: 3 } }, { x: 20, y: 8, in: { x: 17, y: 4 }, out: { x: 28, y: 9 } }, { x: 35, y: 12, in: { x: 30, y: 16 } }], false), rotationDeg: angle, closed: false, strokeMm: .25, stroke: '#000000' });
const near = (a: { x: number; y: number }, b: { x: number; y: number }) => { expect(a.x).toBeCloseTo(b.x, 7); expect(a.y).toBeCloseTo(b.y, 7); };
const length = (node: BezierNode, side: 'in' | 'out') => Math.hypot(node[side]!.x - node.x, node[side]!.y - node.y);
const smooth = (node: BezierNode) => { const a = node.in!, b = node.out!; expect((a.x - node.x) * (b.y - node.y) - (a.y - node.y) * (b.x - node.x)).toBeCloseTo(0, 7); expect((a.x - node.x) * (b.x - node.x) + (a.y - node.y) * (b.y - node.y)).toBeLessThan(0); };
describe('operazioni singole sulle maniglie Bézier', () => {
  it('allinea alla guida conservando lunghezze e tutti gli altri punti fisici, anche ruotati', () => {
    for (const angle of [0, 30, -90]) for (const guide of ['in', 'out'] as const) {
      const source = curve(angle), original = bezierWorldNodes(source, measure), changed = shapeBezierHandles(source, 1, 'align', guide, measure), after = bezierWorldNodes(changed, measure), a = original[1]!, b = after[1]!;
      smooth(b); expect(length(b, 'in')).toBeCloseTo(length(a, 'in'), 7); expect(length(b, 'out')).toBeCloseTo(length(a, 'out'), 7); near(b[guide]!, a[guide]!); near(b, a); for (const i of [0, 2]) { near(after[i]!, original[i]!); if (original[i]!.in) near(after[i]!.in!, original[i]!.in!); if (original[i]!.out) near(after[i]!.out!, original[i]!.out!); } expect(source).toEqual(curve(angle));
    }
  });
  it('rende simmetriche le maniglie rispetto al nodo usando la lunghezza della guida', () => {
    for (const guide of ['in', 'out'] as const) { const source = curve(30), original = bezierWorldNodes(source, measure)[1]!, node = bezierWorldNodes(shapeBezierHandles(source, 1, 'symmetric', guide, measure), measure)[1]!; smooth(node); expect(length(node, 'in')).toBeCloseTo(length(original, guide), 7); expect(length(node, 'out')).toBeCloseTo(length(original, guide), 7); near(node[guide]!, original[guide]!); }
  });
  it('costruisce maniglie mancanti dalla secante e funziona sul primo nodo chiuso', () => {
    const source = curve(); source.nodes = source.nodes.map(({ x, y }) => ({ x, y })); const node = bezierWorldNodes(shapeBezierHandles(source, 1, 'align', 'out', measure), measure)[1]!; smooth(node); const closed = { ...source, closed: true }; smooth(bezierWorldNodes(shapeBezierHandles(closed, 0, 'symmetric', 'in', measure), measure)[0]!);
  });
  it('rimuove maniglie senza muovere nodi; respinge estremità aperte e direzioni degeneri', () => {
    const source = curve(30), original = bezierWorldNodes(source, measure), after = bezierWorldNodes(shapeBezierHandles(source, 1, 'remove', 'out', measure), measure); original.forEach((node, i) => near(after[i]!, node)); expect(after[1]).not.toHaveProperty('in'); expect(after[1]).not.toHaveProperty('out'); expect(() => shapeBezierHandles(source, 0, 'align', 'out', measure)).toThrow('due segmenti'); expect(() => shapeBezierHandles(source, -1, 'remove', 'out', measure)).toThrow('non presente');
    const degenerate = { ...source, ...normalizedBezier([{ x: 10, y: 8 }, { x: 20, y: 8 }, { x: 10, y: 8 }], false) }; expect(() => shapeBezierHandles(degenerate, 1, 'align', 'out', measure)).toThrow('direzione');
  });
  it('usa comandi condivisi, JSON e undo, senza aggirare revisioni e gruppi', () => {
    const doc = createDocument(); doc.objects = [curve()]; const store = new DocumentStore(doc, measure), shaped = shapeBezierHandles(curve(), 1, 'symmetric', 'out', measure), command = { schemaVersion: 1, tool: 'updateObject', objectId: 'curve', expectedRevision: 0, arguments: { object: shaped } };
    store.dispatch(command, 'ai-simulation'); expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects[0]).toEqual(shaped); expect(() => store.dispatch(command, 'manual')).toThrow('obsoleta'); store.undo(); expect(store.document.objects[0]).toEqual(curve()); store.redo(); expect(store.document.objects[0]).toEqual(shaped);
    const grouped = createDocument(); grouped.objects = [curve(), { ...curve(), id: 'copy', xMm: 20 }]; grouped.groups = [{ id: 'g', objectIds: ['curve', 'copy'] }]; const protectedStore = new DocumentStore(grouped, measure); expect(() => protectedStore.dispatch(command, 'manual')).toThrow('Separa'); expect(protectedStore.document).toEqual(grouped);
  });
});
