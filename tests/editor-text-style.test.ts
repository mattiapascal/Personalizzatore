import { describe, expect, it } from 'vitest';
import { applyCharacterStyle, characterStyles, selectionStyle, type TextObject } from '../src/editor/text-style';
import { createDocument, DocumentStore, type Measure } from '../src/editor/model';
const text = (): TextObject => ({ id: 'text-1', type: 'text', text: 'Città\n😀 TEST', xMm: 5, yMm: 5, fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', textBox: { widthMm: 20, heightMm: 12, autoWidth: false, autoHeight: true } });
const measure: Measure = () => ({ widthMm: 20, heightMm: 12 });
const command = (object: TextObject, revision: number) => ({ schemaVersion: 1, tool: 'updateObject', objectId: 'text-1', expectedRevision: revision, arguments: { object } });
describe('stili dei caratteri nel documento comune', () => {
  it('selezione Unicode e multilinea modifica solo gli intervalli richiesti, senza spezzare emoji', () => {
    const original = text(), bold = applyCharacterStyle(original, { fontWeight: 'bold' }, { start: 4, end: 7 });
    expect(bold.characterStyles).toEqual([{ start: 4, end: 7, style: { fontWeight: 'bold' } }]);
    expect(characterStyles(bold)[7]).toEqual({}); expect(original.characterStyles).toBeUndefined();
    const changed = applyCharacterStyle(bold, { fontSizePt: 12, fill: '#ffffff' }, { start: 6, end: 10 });
    expect(changed.characterStyles).toEqual([
      { start: 4, end: 6, style: { fontWeight: 'bold' } },
      { start: 6, end: 7, style: { fontSizePt: 12, fill: '#ffffff', fontWeight: 'bold' } },
      { start: 7, end: 10, style: { fontSizePt: 12, fill: '#ffffff' } },
    ]);
    expect(selectionStyle(changed, 0, 11).mixed).toEqual(['fontSizePt', 'fill', 'fontWeight']);
    expect(selectionStyle(changed, 7, 10).style).toMatchObject({ fontSizePt: 12, fill: '#ffffff', fontWeight: 'normal' });
  });
  it('box intero uniforma solo gli attributi modificati conservando gli altri stili locali', () => {
    const partial = applyCharacterStyle(text(), { fontSizePt: 12, fontWeight: 'bold', underline: true }, { start: 0, end: 5 });
    const whole = applyCharacterStyle(partial, { fontSizePt: 10 });
    expect(whole.fontSizePt).toBe(10); expect(whole.characterStyles).toEqual([{ start: 0, end: 5, style: { fontWeight: 'bold', underline: true } }]);
    expect(applyCharacterStyle(whole, { fontWeight: 'normal', underline: false }).characterStyles).toBeUndefined();
  });
  it('manuale e AI, JSON, copia e undo/redo conservano frame e stili in modo indipendente', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure);
    const styled = applyCharacterStyle(text(), { fontWeight: 'bold' }, { start: 0, end: 5 });
    store.dispatch(command(styled, 0), 'manual');
    store.dispatch(command(applyCharacterStyle(styled, { fontStyle: 'italic' }, { start: 8, end: 11 }), 1), 'ai-simulation');
    const saved = structuredClone(store.document.objects); store.import(JSON.parse(JSON.stringify(store.document))); expect(store.document.objects).toEqual(saved);
    store.dispatch({ schemaVersion: 1, tool: 'duplicateObject', objectId: 'text-1', expectedRevision: 3, arguments: { newObjectId: 'copy', xMm: 6, yMm: 5 } }, 'manual');
    store.dispatch(command(applyCharacterStyle(styled, { underline: true }), 4), 'manual');
    expect(store.document.objects[1]).toMatchObject({ ...saved[0]!, id: 'copy', xMm: 6 });
    expect(store.document.objects[1]!.id).toBe('copy');
    store.undo(); expect(store.document.objects[0]).toEqual(saved[0]); store.redo(); expect(store.document.objects[0]).toMatchObject({ underline: true });
    expect(() => store.dispatch(command(styled, 0), 'ai-simulation')).toThrow('obsoleta');
  });
  it('rifiuta range invalidi, stili arbitrari, font sotto minimo e import malformati atomicamente', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure), before = structuredClone(store.document);
    for (const range of [{ start: -1, end: 3 }, { start: 2, end: 2 }, { start: 3, end: 2 }, { start: 0, end: 13 }, { start: 0.5, end: 3 }]) expect(() => applyCharacterStyle(text(), { underline: true }, range)).toThrow();
    for (const styles of [
      [{ start: 0, end: 13, style: { fontWeight: 'bold' } }],
      [{ start: 0, end: 3, style: { fontSizePt: 6 } }],
      [{ start: 0, end: 3, style: { fontFamily: 'Unknown' } }],
      [{ start: 0, end: 3, style: { stroke: 'red' } }],
      [{ start: 0, end: 3, style: { underline: true } }, { start: 2, end: 4, style: { underline: false } }],
    ]) {
      expect(() => store.dispatch(command({ ...text(), characterStyles: styles } as TextObject, 0), 'manual')).toThrow();
      expect(() => store.import({ ...doc, objects: [{ ...text(), characterStyles: styles }] })).toThrow(); expect(store.document).toEqual(before);
    }
  });
  it('scala i corpi locali con il testo; il comando uniforme cambia solo corpo e colore', () => {
    const doc = createDocument(); doc.objects = [applyCharacterStyle(text(), { fontSizePt: 12, fontWeight: 'bold' }, { start: 0, end: 5 })];
    const store = new DocumentStore(doc, measure);
    store.dispatch({ schemaVersion: 1, tool: 'transformObject', objectId: 'text-1', expectedRevision: 0, arguments: { xMm: 5, yMm: 5, rotationDeg: 0, size: { type: 'text', fontSizePt: 18 } } }, 'manual');
    expect((store.document.objects[0] as TextObject).characterStyles?.[0]?.style.fontSizePt).toBe(24);
    const before = structuredClone(store.document);
    expect(() => store.dispatch({ schemaVersion: 1, tool: 'transformObject', objectId: 'text-1', expectedRevision: 1, arguments: { xMm: 5, yMm: 5, rotationDeg: 0, size: { type: 'text', fontSizePt: 400 } } }, 'ai-simulation')).toThrow();
    expect(store.document).toEqual(before);
    store.dispatch({ schemaVersion: 1, tool: 'setObjectStyle', objectId: 'text-1', expectedRevision: 1, arguments: { fontSizePt: 10, fill: '#ffffff' } }, 'ai-simulation');
    expect(store.document.objects[0]).toMatchObject({ fontSizePt: 10, fill: '#ffffff', characterStyles: [{ start: 0, end: 5, style: { fontWeight: 'bold' } }] });
  });
  it('altezza sempre automatica: importa i primi box fissi senza perdere testo, ma rifiuta nuovi comandi con altezza fissa', () => {
    const doc = createDocument(); doc.objects = [text()]; const store = new DocumentStore(doc, measure);
    const old = JSON.parse(JSON.stringify(doc)); old.objects[0].textBox.autoHeight = false; old.objects[0].textBox.heightMm = 0.5;
    store.import(old);
    expect(store.document.objects[0]).toMatchObject({ text: text().text, textBox: { autoHeight: true, heightMm: 0.5 } });
    const before = structuredClone(store.document);
    expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text-1', expectedRevision: 1, arguments: { object: old.objects[0] } }, 'manual')).toThrow();
    expect(store.document).toEqual(before);
  });
});
