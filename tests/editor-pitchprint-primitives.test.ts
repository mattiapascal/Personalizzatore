import { expect, it } from 'vitest';
import { emptyPitchprintPrimitive, unstrokedPitchprintPrimitive } from '../src/editor/pitchprint-primitives';
import { createDocument, DocumentSchema, DocumentStore, type Measure } from '../src/editor/model';
const circle = { type: 'circle', width: 0, height: 0, radius: 0, fill: '#466b80', strokeWidth: 0 };
it('riconosce solo primitive senza area, non gli ingombri memorizzati di tracciati o gruppi', () => {
  expect(emptyPitchprintPrimitive(circle, {}, false, 'none')).toBe('cerchio');
  expect(emptyPitchprintPrimitive({ type: 'rect', width: 0, height: 3 }, {}, false, 'none')).toBe('rettangolo');
  expect(emptyPitchprintPrimitive({ type: 'ellipse', width: 10, height: 0, rx: 5, ry: 0 }, {}, false, 'none')).toBe('ellisse');
  for (const type of ['path', 'group', 'image', 'text', 'line']) expect(emptyPitchprintPrimitive({ type, width: 0, height: 0 }, {}, false, 'none')).toBeNull();
  expect(emptyPitchprintPrimitive(circle, {}, false, '#000000')).toBeNull();
  expect(emptyPitchprintPrimitive({ type: 'rect', width: 0, height: 3, rx: 2 }, {}, false, 'none')).toBeNull();
});
it('proprietà operative, gruppi e sfondi impediscono lo scarto anche per una forma nulla', () => {
  for (const editor of [{ label: 'Logo' }, { order: -1 }, { includeInForm: true }, { transformLocked: true }, { reference: true }, { deleteLocked: true }]) expect(() => emptyPitchprintPrimitive(circle, editor, false, 'none')).toThrow('proprietà');
  expect(() => emptyPitchprintPrimitive(circle, {}, true, 'none')).toThrow('gruppo');
  for (const extra of [{ clickMask: true }, { chain: 'campo' }, { list: 'A,B' }, { tags: ['Logo'] }, { hooks: { after: 'TEST' } }, { backgroundColor: 'red' }]) expect(() => emptyPitchprintPrimitive({ ...circle, ...extra }, {}, false, 'none')).toThrow();
  expect(emptyPitchprintPrimitive({ ...circle, hooks: {}, backgroundColor: 'transparent' }, { label: '', order: 0, includeInForm: false }, false, 'none')).toBe('cerchio');
});
it('rifiuta raggi/dimensioni discordanti o invalidi, senza dedurre invisibilità dai dati obsoleti', () => {
  for (const extra of [{ radius: 5 }, { width: 2 }, { radius: -1 }, { radius: NaN }]) expect(() => emptyPitchprintPrimitive({ ...circle, ...extra }, {}, false, 'none')).toThrow();
  expect(() => emptyPitchprintPrimitive({ type: 'ellipse', width: 0, height: 0, rx: 3, ry: 0 }, {}, false, 'none')).toThrow('discordanti');
});
it('conserva forme senza contorno anche se invisibili, trasformando un cerchio dilatato in ellisse esatta', () => {
  const raw = { ...circle, radius: 10, width: 20, height: 20 }, editor = { label: 'Guida', includeInForm: true };
  expect(unstrokedPitchprintPrimitive(raw, 'circle', editor, .2, .2, 30, 'none')).toMatchObject({ type: 'circle', radiusMm: 2, rotationDeg: 0, stroke: 'none', fill: 'none', editor });
  expect(unstrokedPitchprintPrimitive({ ...raw, startAngle: 0, endAngle: Math.PI * 2 }, 'legacy-circle', editor, .2, .2, 0, '#0088cc')).toMatchObject({ type: 'circle', radiusMm: 2, fill: '#0088cc' });
  expect(unstrokedPitchprintPrimitive(raw, 'oval', editor, .2, .3, 30, '#0088cc')).toMatchObject({ type: 'ellipse', rxMm: 2, ryMm: 3, rotationDeg: 30, fill: '#0088cc', stroke: 'none' });
  expect(unstrokedPitchprintPrimitive({ type: 'ellipse', width: 20, height: 10, rx: 10, ry: 5 }, 'oval', editor, .2, .3, -30, 'none')).toMatchObject({ type: 'ellipse', rxMm: 2, ryMm: 1.5, rotationDeg: -30 });
  for (const change of [{ startAngle: 20 }, { endAngle: 270 }, { backgroundColor: 'red' }]) expect(() => unstrokedPitchprintPrimitive({ ...raw, ...change }, 'circle', editor, .2, .3, 0, 'none')).toThrow();
  expect(() => unstrokedPitchprintPrimitive(raw, 'circle', editor, 0, .2, 0, 'none')).toThrow('Scala');
});
it('guide trasparenti: stessi comandi manuali/AI, proprietà, JSON e cronologia senza aggiungere inchiostro', () => {
  const object = unstrokedPitchprintPrimitive({ ...circle, width: 20, height: 20, radius: 10 }, 'guide', { label: 'Guida' }, .2, .3, 0, 'none')!;
  const doc = createDocument(); doc.objects = [object]; const measure: Measure = object => object.type === 'ellipse' ? { widthMm: object.rxMm * 2, heightMm: object.ryMm * 2 } : { widthMm: 2, heightMm: 2 }, store = new DocumentStore(doc, measure);
  store.dispatch({ schemaVersion: 1, tool: 'moveObject', objectId: 'guide', expectedRevision: 0, arguments: { xMm: 2, yMm: 3 } }, 'manual');
  store.dispatch({ schemaVersion: 1, tool: 'moveObject', objectId: 'guide', expectedRevision: 1, arguments: { xMm: 4, yMm: 5 } }, 'ai-simulation');
  expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects[0]).toMatchObject({ fill: 'none', stroke: 'none', editor: { label: 'Guida' } });
  store.undo(); expect(store.document.objects[0]).toMatchObject({ xMm: 2, yMm: 3 }); store.undo(); expect(store.document.objects[0]).toEqual(object); store.redo();
});
