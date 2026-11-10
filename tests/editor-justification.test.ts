import { describe, it, expect } from 'vitest';
import { justifySpacing, DEFAULT_JUSTIFICATION, JustificationSchema } from '../src/editor/justification';
import { createDocument, DocumentStore, type Measure } from '../src/editor/model';
describe('giustificazione additiva di parole e lettere', () => {
  it('usa i sei valori richiesti, con percentuali riferite allo spazio normale del font', () => {
    expect(DEFAULT_JUSTIFICATION).toEqual({ word: { min: 80, desired: 100, max: 133 }, letter: { min: 0, desired: 15, max: 30 } }); const result = justifySpacing(100, 112, 20, 80); expect(result.wordPercent).toBe(100); expect(result.letterPercent).toBe(15); expect(result.width).toBeCloseTo(112); expect(result.underfull).toBe(false);
  });
  it('interpola tra minimi/desiderati e desiderati/massimi conservando i limiti', () => {
    const low = justifySpacing(100, 104, 20, 80), high = justifySpacing(100, 122, 20, 80); expect(low.width).toBeCloseTo(104); expect(low.wordPercent).toBeGreaterThan(80); expect(low.wordPercent).toBeLessThan(100); expect(low.letterPercent).toBeGreaterThan(0); expect(low.letterPercent).toBeLessThan(15); expect(high.width).toBeCloseTo(122); expect(high.wordPercent).toBeGreaterThan(100); expect(high.letterPercent).toBeGreaterThan(15); expect(high.letterPercent).toBeLessThan(30);
  });
  it('non supera massimi o minimi per riempire una misura impossibile', () => {
    const max = justifySpacing(100, 200, 20, 80), min = justifySpacing(100, 80, 20, 80); expect(max).toMatchObject({ wordPercent: 133, letterPercent: 30, underfull: true }); expect(max.width).toBeCloseTo(130.6); expect(min).toMatchObject({ wordPercent: 80, letterPercent: 0, overfull: true }); expect(min.width).toBeCloseTo(96);
  });
  it('gestisce parola singola, assenza di intervalli e minimi/desiderati/massimi uguali', () => {
    expect(justifySpacing(100, 110, 0, 100)).toMatchObject({ width: 110, underfull: false }); expect(justifySpacing(100, 110, 0, 0)).toMatchObject({ width: 100, underfull: true }); const settings = { word: { min: 100, desired: 100, max: 100 }, letter: { min: 15, desired: 15, max: 15 } }; expect(justifySpacing(100, 999, 20, 80, settings)).toMatchObject({ width: 112, underfull: true });
  });
  it('valida ordinamento, numeri e comandi comuni senza alterare tracking o crenatura', () => {
    expect(() => JustificationSchema.parse({ ...DEFAULT_JUSTIFICATION, word: { min: 120, desired: 100, max: 133 } })).toThrow(); expect(() => justifySpacing(NaN, 100, 20, 80)).toThrow(); const doc = createDocument(); const object = doc.objects.find(o => o.type === 'text')!; const measure: Measure = () => ({ widthMm: 20, heightMm: 4 }), store = new DocumentStore(doc, measure), changed = { ...object, letterSpacingPt: .2, characterStyles: [{ start: 0, end: 1, style: { kerningPt: -.1 } }], justification: DEFAULT_JUSTIFICATION }; store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation'); expect(store.document.objects.find(o => o.id === object.id)).toEqual(changed); store.undo(); expect(store.document.objects).toEqual(doc.objects);
  });
});
