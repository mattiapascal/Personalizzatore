import { expect, it } from 'vitest';
import { ellipseIntersectsArea } from '../src/editor/ellipse-intersection';
const area = { width: 20, height: 20 };
it('ellisse ruotata: un riquadro sovrapposto non basta a renderla visibile', () => {
  expect(ellipseIntersectsArea({ x: -3, y: -3 }, 6, 0.5, -45, 0.25, area, false)).toBe(false);
  expect(ellipseIntersectsArea({ x: -3, y: -3 }, 6, 0.5, 45, 0.25, area, false)).toBe(true);
  expect(ellipseIntersectsArea({ x: 10, y: 10 }, 6, 0.5, -45, 0, area, false)).toBe(true);
});
it('tangenza esterna esclusa, tratto e uscita parziale ammessi', () => {
  expect(ellipseIntersectsArea({ x: -5, y: 10 }, 5, 2, 0, 0, area, false)).toBe(false);
  expect(ellipseIntersectsArea({ x: -5, y: 10 }, 5, 2, 0, 0.25, area, false)).toBe(true);
  expect(ellipseIntersectsArea({ x: -5.2, y: 10 }, 5, 2, 0, 0.25, area, false)).toBe(false);
});
it('area tonda: distanza effettiva alla curva, anche vicino alla circonferenza', () => {
  expect(ellipseIntersectsArea({ x: 27, y: 10 }, 6, 1, 0, 0.25, area, true)).toBe(false);
  expect(ellipseIntersectsArea({ x: 26, y: 10 }, 6, 1, 0, 0.25, area, true)).toBe(true);
  expect(ellipseIntersectsArea({ x: 10, y: -6.2 }, 6, 1, 90, 0.25, area, true)).toBe(false);
  expect(ellipseIntersectsArea({ x: 10, y: -6 }, 6, 1, 90, 0.25, area, true)).toBe(true);
});
