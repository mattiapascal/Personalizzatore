import { describe, it, expect } from 'vitest';
import { lineSelection, applyLineAlignment, lineAlignments, compressLineAlignments } from '../src/editor/text-lines';
import { createDocument, DocumentStore, parseGraphicDocument, type Measure } from '../src/editor/model';
import type { TextObject } from '../src/editor/text-style';
const source = (): TextObject => ({ id: 'text', type: 'text', xMm: 5, yMm: 5, text: 'uno due\ntre quattro\n', textAlign: 'center', fontSizePt: 9, fontFamily: 'Arial', fill: '#000000', textBox: { widthMm: 30, heightMm: 4, autoWidth: true, autoHeight: true }, characterStyles: [{ start: 0, end: 3, style: { fontWeight: 'bold' } }] });
const lines = [{ start: 0, end: 8 }, { start: 8, end: 20 }, { start: 20, end: 20 }];
const measure: Measure = () => ({ widthMm: 30, heightMm: 8 });
describe('allineamento delle righe visuali', () => {
  it('espande una selezione parziale alla riga e non tocca la riga successiva al confine', () => {
    const object = source(); expect(lineSelection(object, lines, 2, 3).indices).toEqual([0]); expect(lineSelection(object, lines, 2, 8).indices).toEqual([0]); expect(lineSelection(object, lines, 8, 8).indices).toEqual([1]); expect(lineSelection(object, lines, 20, 20).indices).toEqual([2]);
    const changed = applyLineAlignment(object, 'right', lineSelection(object, lines, 2, 3), { widthMm: 24, heightMm: 8 }); expect(changed.lineStyles).toEqual([{ start: 0, end: 8, alignment: 'right' }]); expect(changed.characterStyles).toEqual(object.characterStyles); expect(changed.textAlign).toBe('center'); expect(changed.textBox!.autoWidth).toBe(true);
  });
  it('gestisce più righe, stili misti e righe vuote finali', () => {
    const object = applyLineAlignment(source(), 'left', lineSelection(source(), lines, 9, 10), { widthMm: 24, heightMm: 8 }); expect(lineSelection(object, lines, 0, 19).mixed).toBe(true);
    const changed = applyLineAlignment(object, 'right', lineSelection(object, lines, 20, 20), { widthMm: 24, heightMm: 8 }); expect(changed.lineStyles!.at(-1)).toEqual({ start: 20, end: 20, alignment: 'right' }); expect(compressLineAlignments(lineAlignments(changed), 20, true)).toEqual(changed.lineStyles);
  });
  it('fissa la larghezza visibile solo quando si richiede giustificazione e conserva le altre proprietà', () => {
    const object = { ...source(), textScaleX: 1.5, textScaleY: .8 }, changed = applyLineAlignment(object, 'justify-left', lineSelection(object, lines, 1, 2), { widthMm: 24, heightMm: 8 }); expect(changed).toMatchObject({ textBox: { widthMm: 24, heightMm: 8, autoWidth: false, autoHeight: true }, textScaleX: 1.5, textScaleY: .8, textAlign: 'center' });
  });
  it('comandi UI/AI, JSON e undo condividono gli intervalli, con rifiuti atomici', () => {
    const doc = createDocument(); doc.objects = [source()]; const store = new DocumentStore(doc, measure), object = applyLineAlignment(source(), 'justify-left', lineSelection(source(), lines, 1, 2), { widthMm: 24, heightMm: 8 }), command = { schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object } }; store.dispatch(command, 'ai-simulation'); expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects[0]).toEqual(object); store.undo(); expect(store.document.objects[0]).toEqual(source());
    const before = structuredClone(store.document); for (const lineStyles of [[{ start: 3, end: 2, alignment: 'left' }], [{ start: 0, end: 99, alignment: 'left' }], [{ start: 0, end: 4, alignment: 'right' }, { start: 2, end: 6, alignment: 'center' }], [{ start: 0, end: 4, alignment: 'justify-left' }]]) { expect(() => store.dispatch({ ...command, expectedRevision: before.revision, arguments: { object: { ...source(), lineStyles } } }, 'manual')).toThrow(); expect(store.document).toEqual(before); } store.redo(); expect(store.document.objects[0]).toEqual(object);
  });
});

it('sostituire tutto il testo rimuove gli intervalli precedenti senza lasciare riferimenti obsoleti', () => {
  const doc = createDocument(); doc.objects = [{ ...source(), lineStyles: [{ start: 8, end: 20, alignment: 'right' }] }]; const store = new DocumentStore(doc, measure); store.dispatch({ schemaVersion: 1, tool: 'setText', objectId: 'text', expectedRevision: 0, arguments: { text: 'Città' } }, 'ai-simulation'); expect(store.document.objects[0]).toMatchObject({ text: 'Città' }); expect(store.document.objects[0]).not.toHaveProperty('lineStyles'); store.undo(); expect(store.document.objects).toEqual(doc.objects);
});
