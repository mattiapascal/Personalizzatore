import { describe, expect, it } from 'vitest';
import { captureSelection, clipboardInsertion } from '../src/editor/clipboard';
import { createDocument, DocumentStore, cloneGraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
import { testPng } from './helpers/png';
const measure: Measure = object => object.type === 'rect' || object.type === 'image' ? { widthMm: object.widthMm, heightMm: object.heightMm } : { widthMm: 5, heightMm: 3 };
const rect: SceneObject = { id: 'rect', type: 'rect', xMm: 5, yMm: 4, widthMm: 8, heightMm: 4, strokeMm: 0.25, stroke: '#000000' };
const text: SceneObject = { id: 'text', type: 'text', xMm: 20, yMm: 5, text: 'Città', fontFamily: 'Georgia', fontSizePt: 9, fill: '#000000', textAlign: 'center', characterStyles: [{ start: 0, end: 1, style: { fontWeight: 'bold' } }] };
const sourceDocument = () => ({ ...createDocument(), objects: [structuredClone(rect), structuredClone(text)], groups: [{ id: 'group', objectIds: ['rect', 'text'] }] });
function ids() { let next = 0; return (kind: 'object' | 'group') => `${kind}-${++next}`; }
describe('appunti grafici e inserimento atomico', () => {
  it('copia il gruppo intero in ordine senza mutare il documento o condividere proprietà mutabili', () => {
    const doc = sourceDocument(), before = cloneGraphicDocument(doc), clipboard = captureSelection(doc, ['text']);
    expect(doc).toEqual(before); expect(clipboard.objects.map(object => object.id)).toEqual(['rect', 'text']); expect(clipboard.groups).toEqual(doc.groups);
    clipboard.groups[0]!.objectIds.reverse(); const copy = clipboard.objects[1]; if (copy?.type !== 'text') throw new Error('tipo'); copy.characterStyles![0]!.style.fontWeight = 'normal'; expect(doc).toEqual(before);
    for (const selection of [[], ['missing'], ['rect', 'rect']]) expect(() => captureSelection(doc, selection)).toThrow('Selezione');
  });
  it('incolla con ID nuovi in una revisione mantenendo ordine, stili e legame del documento destinatario', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure), clipboard = captureSelection(sourceDocument(), ['rect']);
    const command = clipboardInsertion(clipboard, 0, ids()); store.dispatch(command, 'manual');
    expect(store.document.documentId).toBe(doc.documentId); expect(store.document.productId).toBeNull(); expect(store.document.objects).toEqual([{ ...rect, id: 'object-1' }, { ...text, id: 'object-2' }]); expect(store.document.groups).toEqual([{ id: 'group-3', objectIds: ['object-1', 'object-2'] }]); expect(store.document.revision).toBe(1);
    store.undo(); expect(store.document.objects).toEqual([]); store.redo(); expect(store.document.objects).toEqual(command.arguments.objects);
    expect(clipboard.objects.map(object => object.id)).toEqual(['rect', 'text']);
  });
  it('conserva sorgenti, ritaglio e riflessioni anche dopo taglia/incolla e undo', () => {
    const doc = createDocument(); const image: SceneObject = { id: 'image', type: 'image', xMm: 10, yMm: 5, widthMm: 3, heightMm: 6, crop: { leftPx: 1, topPx: 0, widthPx: 1, heightPx: 2 }, flipX: true, rotationDeg: 30, source: rasterSourceFromBytes('asset', testPng()), raster: { ...DEFAULT_RASTER } }; doc.objects = [image]; const store = new DocumentStore(doc, measure), clipboard = captureSelection(doc, ['image']);
    store.dispatch({ schemaVersion: 1, tool: 'deleteObject', objectId: 'image', expectedRevision: 0, arguments: {} }, 'manual'); store.dispatch(clipboardInsertion(clipboard, 1, ids()), 'manual');
    expect(store.document.objects[0]).toEqual({ ...image, id: 'object-1' }); store.undo(); expect(store.document.objects).toEqual([]); store.undo(); expect(store.document.objects).toEqual([image]);
  });
  it('respinge collisioni, gruppi che includono elementi esistenti e limiti, preservando scena e redo', () => {
    const store = new DocumentStore(sourceDocument(), measure), clipboard = captureSelection(store.document, ['text']); store.dispatch({ schemaVersion: 1, tool: 'moveObjects', objectId: 'rect', expectedRevision: 0, arguments: { objectIds: ['rect', 'text'], deltaXmm: 1, deltaYmm: 0 } }, 'manual'); store.undo();
    const before = cloneGraphicDocument(store.document), command = clipboardInsertion(clipboard, before.revision, ids());
    const invalid = [
      { ...command, objectId: 'wrong' },
      { ...command, expectedRevision: 0 },
      { ...command, arguments: { ...command.arguments, groups: [{ id: 'mixed', objectIds: ['object-1', 'rect'] }] } },
      { ...command, objectId: 'rect', arguments: { objects: [rect], groups: [] } },
      { ...command, arguments: { objects: Array.from({ length: 999 }, (_, i) => ({ ...rect, id: `object-${i + 1}` })), groups: [] } },
      { ...command, arguments: { objects: [{ ...rect, id: 'object-1', xMm: 1001 }], groups: [] } },
    ];
    for (const raw of invalid) { expect(() => store.dispatch(raw, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); }
    store.redo(); expect(store.document.objects[0]!.xMm).toBe(6);
  });
  it('rispetta il limite immagini e accetta lo stesso inserimento AI tipizzato', () => {
    const doc = createDocument(), image: SceneObject = { id: 'image', type: 'image', xMm: 10, yMm: 5, widthMm: 4, heightMm: 4, source: rasterSourceFromBytes('asset', testPng()), raster: { ...DEFAULT_RASTER } }; doc.objects = [image]; const store = new DocumentStore(doc, measure), clipboard = captureSelection(doc, ['image']); let n = 0;
    const makeId = (kind: 'object' | 'group') => `${kind}-${++n}`;
    for (let i = 0; i < 31; i++) store.dispatch(clipboardInsertion(clipboard, store.document.revision, makeId), 'ai-simulation');
    const before = cloneGraphicDocument(store.document); expect(() => store.dispatch(clipboardInsertion(clipboard, before.revision, makeId), 'manual')).toThrow('32 immagini'); expect(store.document).toEqual(before); expect(before.objects).toHaveLength(32);expect(store.events).toHaveLength(31);expect(store.events.every(event=>event.source==='ai-simulation')).toBe(true);
  });
});
