import { describe, expect, it } from 'vitest';
import { simplifyStroke, strokeGeometry } from '../src/editor/path-geometry';
describe('campionamento del pennello vettoriale', () => {
  it('semplifica una retta conservando gli estremi, ma conserva gli angoli', () => {
    const points = Array.from({ length: 101 }, (_, i) => ({ xMm: i / 10, yMm: 5 }));
    expect(simplifyStroke(points, 0.01)).toEqual([points[0], points.at(-1)]);
    const corner = [{ xMm: 0, yMm: 0 }, { xMm: 5, yMm: 5 }, { xMm: 10, yMm: 0 }]; expect(simplifyStroke(corner, 1)).toEqual(corner);
  });
  it('mantiene la tolleranza fisica ed evita una ricorsione proporzionale ai nodi', () => {
    const wave = Array.from({ length: 512 }, (_, i) => ({ xMm: i / 50, yMm: Math.sin(i / 10) })), reduced = simplifyStroke(wave, 0.02);
    expect(reduced.length).toBeLessThan(200); expect(reduced[0]).toEqual(wave[0]); expect(reduced.at(-1)).toEqual(wave.at(-1));
    for (const point of wave) {
      let nearest = Infinity;
      for (let i = 1; i < reduced.length; i++) {
        const a = reduced[i - 1]!, b = reduced[i]!, dx = b.xMm - a.xMm, dy = b.yMm - a.yMm, t = Math.max(0, Math.min(1, ((point.xMm - a.xMm) * dx + (point.yMm - a.yMm) * dy) / (dx * dx + dy * dy)));
        nearest = Math.min(nearest, Math.hypot(point.xMm - a.xMm - t * dx, point.yMm - a.yMm - t * dy));
      }
      expect(nearest).toBeLessThanOrEqual(0.020000001);
    }
  });
  it('normalizza un tracciato senza perdere dimensioni, posizione o forme piatte', () => {
    expect(strokeGeometry([{ xMm: 10, yMm: 5 }, { xMm: 20, yMm: 9 }, { xMm: 15, yMm: 7 }])).toEqual({ xMm: 9.875, yMm: 4.875, widthMm: 10, heightMm: 4, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0.5, y: 0.5 }] });
    expect(strokeGeometry([{ xMm: 10, yMm: 5 }, { xMm: 20, yMm: 5 }])).toMatchObject({ widthMm: 10, heightMm: 0, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] });
  });
  it('non accetta input degeneri, eccessivi o non finiti', () => {
    const p = { xMm: 1, yMm: 1 };
    expect(() => strokeGeometry([p, p])).toThrow('distinti'); expect(() => strokeGeometry([p])).toThrow(); expect(() => strokeGeometry(Array(513).fill(p))).toThrow();
    expect(() => strokeGeometry([p, { xMm: NaN, yMm: 1 }])).toThrow(); expect(() => simplifyStroke([p], Infinity)).toThrow();
  });
});
