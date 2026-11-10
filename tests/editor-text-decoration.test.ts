import { describe, expect, it } from 'vitest';
import { applyCharacterStyle, selectionStyle, type TextObject } from '../src/editor/text-style';
import { createDocument, DocumentStore, cloneGraphicDocument, parseGraphicDocument, type Measure } from '../src/editor/model';
const text = (): TextObject => ({ id: 'text', type: 'text', xMm: 5, yMm: 4, text: 'Città 😀\nTEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', textAlign: 'center', textBox: { widthMm: 30, heightMm: 8, autoWidth: false, autoHeight: true } });
const measure: Measure = () => ({ widthMm: 30, heightMm: 8 });
describe('decorazioni e giustificazione nel documento comune', () => {
  it('decorazioni dei soli caratteri Unicode e uniformazione del box preservano gli altri stili', () => {
    const partial = applyCharacterStyle(text(), { linethrough: true, overline: true, fontWeight: 'bold' }, { start: 4, end: 7 }); expect(partial.characterStyles).toEqual([{ start: 4, end: 7, style: { fontWeight: 'bold', linethrough: true, overline: true } }]); expect(selectionStyle(partial, 0, 7).mixed).toContain('linethrough'); expect(selectionStyle(partial, 0, 7).mixed).toContain('overline');
    const whole = applyCharacterStyle(partial, { linethrough: false, overline: true }); expect(whole).toMatchObject({ linethrough: false, overline: true, characterStyles: [{ start: 4, end: 7, style: { fontWeight: 'bold' } }] }); expect(partial.linethrough).toBeUndefined();
  });
  it('stesso updateObject per manuale/AI, JSON e storico', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure), decorated = applyCharacterStyle(text(), { linethrough: true, overline: true }, { start: 0, end: 5 }); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object: decorated } }, 'manual');
    const justified = { ...decorated, textAlign: 'justify-left' }; store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 1, arguments: { object: justified } }, 'ai-simulation'); expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects[0]).toEqual(justified); store.undo(); expect(store.document.objects[0]).toEqual(decorated); store.redo(); expect(store.document.objects[0]).toEqual(justified);
  });
  it('rifiuta giustificazione in larghezza automatica, tipi arbitrari e nuove proprietà nel v1', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure), before = cloneGraphicDocument(store.document);
    for (const object of [{ ...text(), textAlign: 'justify-left', textBox: undefined }, { ...text(), textAlign: 'justify-left', textBox: { ...text().textBox, autoWidth: true } }, { ...text(), linethrough: 'yes' }, { ...text(), characterStyles: [{ start: 0, end: 1, style: { overline: 1 } }] }]) { expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object } }, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); }
    expect(() => parseGraphicDocument({ ...createDocument(), schemaVersion: 1, objects: [{ id: 'text', type: 'text', xMm: 5, yMm: 4, text: 'TEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', overline: true }] })).toThrow();
  });
});
