import { describe, expect, it } from 'vitest';
import { regularPolygonPoints, starPoints } from '../src/editor/polygon-geometry';
import { strokeGeometry } from '../src/editor/path-geometry';
describe('costruzione di poligoni e stelle vettoriali', () => {
  it('i lati del poligono sono uguali e i vertici stanno sulla circonferenza richiesta', () => {
    for (const sides of [3, 5, 8, 32]) {
      const points = regularPolygonPoints(sides, 4), length = Math.hypot(points[1]!.xMm - points[0]!.xMm, points[1]!.yMm - points[0]!.yMm);
      expect(points).toHaveLength(sides); expect(points[0]!.yMm).toBe(-4);
      for (let i = 0; i < sides; i++) { const a = points[i]!, b = points[(i + 1) % sides]!; expect(Math.hypot(a.xMm, a.yMm)).toBeCloseTo(4, 9); expect(Math.hypot(a.xMm - b.xMm, a.yMm - b.yMm)).toBeCloseTo(length, 9); }
    }
  });
  it('la stella alterna raggi interni/esterni e rimane un unico tracciato chiuso', () => {
    const points = starPoints(5, 4, 0.45); expect(points).toHaveLength(10);
    points.forEach((p, i) => expect(Math.hypot(p.xMm, p.yMm)).toBeCloseTo(i % 2 ? 1.8 : 4, 9));
    const geometry = strokeGeometry(points); expect(geometry.points).toHaveLength(10); expect(Math.min(...geometry.points.map(p => p.x))).toBe(0); expect(Math.max(...geometry.points.map(p => p.y))).toBe(1);
  });
  it('rifiuta conteggi, raggi e rapporti invalidi prima di costruire una forma', () => {
    for (const sides of [0, 2, 3.5, 33, Infinity]) { expect(() => regularPolygonPoints(sides, 4)).toThrow(); expect(() => starPoints(sides, 4, 0.5)).toThrow(); }
    for (const radius of [0, -1, 1501, NaN]) { expect(() => regularPolygonPoints(5, radius)).toThrow(); expect(() => starPoints(5, radius, 0.5)).toThrow(); }
    for (const ratio of [0, 1, NaN, Infinity]) expect(() => starPoints(5, 4, ratio)).toThrow();
  });
});
