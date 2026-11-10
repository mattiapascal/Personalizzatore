import { describe, expect, it } from 'vitest';
import { bezierBounds, bezierCommands, bezierSegments, cubicPoint, flattenBezier, normalizedBezier } from '../src/editor/bezier-geometry';
const arch = [{ x: 0, y: 0, out: { x: 0, y: 4 } }, { x: 4, y: 0, in: { x: 4, y: 4 } }];
describe('geometria cubica analitica', () => {
  it('misura gli estremi della curva e non il rettangolo delle maniglie', () => {
    expect(bezierBounds(arch, false)).toEqual({ x: 0, y: 0, width: 4, height: 3 }); const geometry = normalizedBezier(arch, false); expect(geometry).toMatchObject({ xMm: -0.125, yMm: -0.125, widthMm: 4, heightMm: 3 }); expect(geometry.nodes[0]!.out!.y).toBeCloseTo(4 / 3, 12); const box = bezierBounds(geometry.nodes, false); expect(box.x).toBeCloseTo(0); expect(box.y).toBeCloseTo(0); expect(box.width).toBeCloseTo(1); expect(box.height).toBeCloseTo(1);
  });
  it('estremi degeneri, flessi e radici lineari: tutti i campioni restano nel bounding box', () => {
    const cases = [arch, [{ x: 0, y: 0, out: { x: 10, y: -20 } }, { x: 4, y: 1, in: { x: -10, y: 30 } }], [{ x: 0, y: 0, out: { x: 1, y: 1 } }, { x: 3, y: 3, in: { x: 2, y: 2 } }], [{ x: 2, y: 0 }, { x: 2, y: 4 }]];
    for (const nodes of cases) for (const closed of [false, true]) { const box = bezierBounds(nodes, closed); for (const [a, b, c, d] of bezierSegments(nodes, closed)) for (let i = 0; i <= 100; i++) { const p = cubicPoint(a, b, c, d, i / 100); expect(p.x).toBeGreaterThanOrEqual(box.x - 1e-10); expect(p.x).toBeLessThanOrEqual(box.x + box.width + 1e-10); expect(p.y).toBeGreaterThanOrEqual(box.y - 1e-10); expect(p.y).toBeLessThanOrEqual(box.y + box.height + 1e-10); } }
  });
  it('serializza cubiche C vere e la chiusura, senza campionamenti nel file', () => {
    const geometry = normalizedBezier(arch, false), commands = bezierCommands(geometry.nodes, true, 4, 3); expect(commands).toEqual([['M', 0, 0], ['C', 0, 4, 4, 4, 4, 0], ['C', 4, 0, 0, 0, 0, 0], ['Z']]);
  });
  it('appiattisce solo per il test di intersezione e conserva i capi senza mutare i nodi', () => {
    const original = structuredClone(arch), geometry = normalizedBezier(arch, false), points = flattenBezier(geometry.nodes, false, 4, 3); expect(points.length).toBeGreaterThan(10); expect(points[0]).toMatchObject({ x: 0, y: 0 }); expect(points.at(-1)).toMatchObject({ x: 1, y: 0 }); expect(Math.max(...points.map(p => p.y))).toBeCloseTo(1, 5); expect(arch).toEqual(original);
  });
  it('rifiuta degenerazioni, buffer smisurati, coordinate non finite e tolleranze errate', () => {
    expect(() => normalizedBezier([{ x: 1, y: 1 }, { x: 1, y: 1 }], false)).toThrow('degenere'); expect(() => normalizedBezier([{ x: 0, y: 0 }, { x: 1, y: 0 }], true)).toThrow('degenere');
    for (const nodes of [[], [{ x: 0, y: 0 }], Array(65).fill({ x: 0, y: 1 }), [{ x: 0, y: 0 }, { x: NaN, y: 1 }], [{ x: 0, y: 0 }, { x: Infinity, y: 1 }]]) expect(() => bezierBounds(nodes, false)).toThrow('non valida'); expect(() => flattenBezier(arch, false, 1, 1, 0)).toThrow('Tolleranza');
  });
});
