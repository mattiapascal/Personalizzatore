import { describe, it, expect } from 'vitest';
import { resizeTextHeight, textHeightLimits } from '../src/editor/text-sizing';
import { objectCenter, createDocument, DocumentStore, type Measure } from '../src/editor/model';
import type { TextObject } from '../src/editor/text-style';
const source = (autoWidth = true): TextObject => ({ id: 'text', type: 'text', text: 'TEST', fontFamily: 'Arial', fontSizePt: 10, xMm: 5, yMm: 5, fill: '#000000', textScaleX: 1.2, letterSpacingPt: .2, textBox: { widthMm: 30, heightMm: 4, autoWidth, autoHeight: true }, characterStyles: [{ start: 0, end: 1, style: { fontSizePt: 12, kerningPt: .1 } }] });
const measure: Measure = object => object.type === 'text' ? { widthMm: object.textBox?.autoWidth === false ? object.textBox.widthMm : object.fontSizePt * (object.textScaleX ?? 1) * 2, heightMm: object.fontSizePt * (object.textScaleY ?? 1) * .4 } : { widthMm: 4, heightMm: 3 };
describe('altezza numerica del testo tramite corpo', () => {
  it('mantiene larghezza e centro, scala corpo/stili/tracking/crenatura senza mutare la sorgente', () => {
    for (const automatic of [false, true]) { const object = source(automatic), changed = resizeTextHeight(object, 6, measure); expect(changed.fontSizePt).toBe(15); expect(changed.textScaleX).toBeCloseTo(.8); expect(changed.textScaleY).toBe(1); expect(changed.letterSpacingPt).toBeCloseTo(.3); expect(changed.characterStyles![0]!.style.fontSizePt).toBe(18); expect(changed.characterStyles![0]!.style.kerningPt).toBeCloseTo(.15); expect(measure(changed).widthMm).toBeCloseTo(measure(object).widthMm); expect(measure(changed).heightMm).toBe(6); expect(objectCenter(changed, measure)).toEqual(objectCenter(object, measure)); expect(object).toEqual(source(automatic)); }
  });
  it('normalizza una precedente scala verticale e rispetta i limiti di tutti i font', () => {
    const object = { ...source(), textScaleY: 1.25 }, changed = resizeTextHeight(object, 6, measure); expect(changed.fontSizePt).toBe(15); const limits=textHeightLimits(object, measure(object).heightMm);expect(limits.min).toBeCloseTo(.48);expect(limits.max).toBeCloseTo(48); for (const height of [0, .4, 49, NaN]) expect(() => resizeTextHeight(object, height, measure)).toThrow();
  });
  it('il cambiamento è un solo updateObject condiviso e annullabile', () => {
    const doc = createDocument(); doc.objects = [source()]; const store = new DocumentStore(doc, measure), changed = resizeTextHeight(source(), 6, measure); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation'); expect(store.document.objects[0]).toEqual(changed); store.undo(); expect(store.document.objects[0]).toEqual(source());
  });
});
