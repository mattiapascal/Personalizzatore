import { describe, expect, it } from 'vitest';
import { createDocument, type SceneObject, type Measure } from '../src/editor/model';
import { snapTranslation } from '../src/editor/guides';
const rect = (id: string, xMm: number, yMm = 3, widthMm = 6): SceneObject => ({ id, type: 'rect', xMm, yMm, widthMm, heightMm: 2, stroke: 'none', strokeMm: 0.25, fill: '#000000' });
const measure: Measure = o => o.type === 'rect' ? { widthMm: o.widthMm, heightMm: o.heightMm } : { widthMm: 2, heightMm: 2 };
const doc = () => ({ ...createDocument(), areaMm: { width: 100, height: 100 }, objects: [rect('a', 10)] });
describe('agganci deterministici in millimetri', () => {
  it('aggancia il centro alla griglia solo entro tolleranza e non modifica il documento', () => {
    const source = doc(), before = structuredClone(source);
    const snapped = snapTranslation(source, ['a'], 0.6, 0.6, 1, 0.45, measure);
    expect(snapped.deltaXmm).toBeCloseTo(1, 9); expect(snapped.deltaYmm).toBeCloseTo(1, 9); expect(snapped).toMatchObject({ guideXmm: 14, guideYmm: 5 });
    expect(snapTranslation(source, ['a'], 0.6, 0.6, 1, 0.2, measure)).toEqual({ deltaXmm: 0.6, deltaYmm: 0.6 }); expect(source).toEqual(before);
  });
  it('allinea bordi/centri delle altre unità, privilegiandoli sulla griglia a pari distanza', () => {
    const source = doc(); source.objects.push(rect('b', 20, 8));
    const result = snapTranslation(source, ['a'], 3.8, 3, 1, 0.25, measure);
    expect(result.deltaXmm).toBeCloseTo(4); expect(result.guideXmm).toBe(20); expect(result.guideYmm).toBe(8);
  });
  it('i membri di un gruppo di riferimento contano come una sola unità', () => {
    const source = { ...doc(), objects: [rect('a', 10), rect('b', 20, 8, 2), rect('c', 28, 8, 2)], groups: [{ id: 'g', objectIds: ['b', 'c'] }] };
    const result = snapTranslation(source, ['a'], 6, 0, 1, 0.2, measure);
    expect(result.guideXmm).toBe(19); expect(result.deltaXmm).toBe(6);
  });
  it('la tolleranza derivata da sei pixel diminuisce in mm aumentando lo zoom', () => {
    const source = doc();
    expect(snapTranslation(source, ['a'], 0.6, 0.6, 1, 6 / 8, measure).guideXmm).toBe(14);
    expect(snapTranslation(source, ['a'], 0.6, 0.6, 1, 6 / (8 * 4), measure).guideXmm).toBeUndefined();
  });
  it('un gruppo selezionato aggancia l’ingombro comune e ignora i propri membri come riferimenti', () => {
    const source = { ...doc(), objects: [rect('a', 10, 3, 2), rect('b', 16, 3, 2)], groups: [{ id: 'g', objectIds: ['a', 'b'] }] };
    const result = snapTranslation(source, ['a', 'b'], 0.8, 0, 1, 0.3, measure);
    expect(result.deltaXmm).toBeCloseTo(1); expect(result.guideXmm).toBe(15);
  });
  it('rifiuta valori non finiti o parametri di griglia invalidi', () => {
    const source = doc();
    for (const [x, grid, tolerance] of [[NaN, 1, 0.5], [0, 0, 0.5], [0, -1, 0.5], [0, 1, -0.1]]) expect(() => snapTranslation(source, ['a'], x!, 0, grid!, tolerance!, measure)).toThrow('non validi');
  });
});
