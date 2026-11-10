import { describe, it, expect } from 'vitest';
import { createDocument, DocumentStore, parseGraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
const text = (): Extract<SceneObject, { type: 'text' }> => ({ id: 'text', type: 'text', text: 'AV AV', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', xMm: 5, yMm: 5, textScaleX: 1.5, textScaleY: .8, letterSpacingPt: .2, textBox: { widthMm: 30, heightMm: 4, autoWidth: false, autoHeight: true }, characterStyles: [{ start: 0, end: 1, style: { kerningPt: -.1, fontSizePt: 10 } }] });
const measure: Measure = () => ({ widthMm: 30, heightMm: 6 });
describe('dilatazione orizzontale del testo', () => {
  it('conserva percentuale, stile e scelta del box nei comandi UI/AI, JSON e undo', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure), changed = { ...text(), textScaleX: .75 };
    store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation');
    expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects[0]).toEqual(changed); store.undo(); expect(store.document.objects[0]).toEqual(text()); store.redo(); expect(store.document.objects[0]).toEqual(changed);
  });
  it('rifiuta percentuali fuori intervallo e proprietà sui caratteri senza cambiare documento', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure);
    for (const value of [0, -.1, .099, 10.01, Infinity, NaN]) {
      expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object: { ...text(), textScaleX: value } } }, 'manual')).toThrow(); expect(store.document).toEqual(doc);
    }
    expect(() => parseGraphicDocument({ ...doc, objects: [{ ...text(), characterStyles: [{ start: 0, end: 1, style: { textScaleX: 2 } }] }] })).toThrow();
  });
  it('valida anche la dilatazione verticale come proprietà del box', () => {
    const doc = createDocument(); doc.objects = [text()]; expect(parseGraphicDocument(doc).objects[0]).toMatchObject({ textScaleY: .8 }); for (const textScaleY of [0, -.5, 10.01]) expect(() => parseGraphicDocument({ ...doc, objects: [{ ...text(), textScaleY }] })).toThrow();
  });
  it('trasformazione del box mantiene corpo, spaziatura, correzioni e scelta manuale', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure);
    store.dispatch({ schemaVersion: 1, tool: 'transformObject', objectId: 'text', expectedRevision: 0, arguments: { xMm: 5, yMm: 5, rotationDeg: 30, size: { type: 'text', fontSizePt: 9, textScaleX: 1.8, textBox: { ...text().textBox!, widthMm: 36 } } } }, 'manual');
    expect(store.document.objects[0]).toEqual({ ...text(), rotationDeg: 30, textScaleX: 1.8, textBox: { ...text().textBox!, widthMm: 36 } });
  });
  it('la scala uniforme del gruppo conserva il rapporto e scala le misure fisiche', () => {
    const doc = createDocument(); doc.objects = [text(), { id: 'rect', type: 'rect', xMm: 35, yMm: 5, widthMm: 4, heightMm: 3, strokeMm: .25, stroke: '#000000' }]; const store = new DocumentStore(doc, measure);
    store.dispatch({ schemaVersion: 1, tool: 'transformObjects', objectId: 'text', expectedRevision: 0, arguments: { objectIds: ['text', 'rect'], scale: 2, rotationDeg: 0, center: { xMm: 29, yMm: 11 } } }, 'manual');
    expect(store.document.objects[0]).toMatchObject({ textScaleX: 1.5, textScaleY: .8, fontSizePt: 18, letterSpacingPt: .4, textBox: { widthMm: 60, autoWidth: false }, characterStyles: [{ style: { fontSizePt: 20, kerningPt: -.2 } }] });
  });
});
