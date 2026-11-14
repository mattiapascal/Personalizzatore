import { describe, expect, it } from 'vitest';
import { createDocument, DocumentSchema, DocumentStore, parseGraphicDocument, validateLayout, type Measure, type SceneObject } from '../src/editor/model';
import { expandSelection, selectionBounds } from '../src/editor/selection';
const measure: Measure = o => o.type==='qr'?{widthMm:o.widthMm,heightMm:o.heightMm}: o.type === 'image' ? { widthMm: o.widthMm, heightMm: o.heightMm } : o.type === 'path' || o.type === 'bezier' || o.type === 'vector' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : o.type === 'ellipse' ? { widthMm: o.rxMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm), heightMm: o.ryMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm) } : o.type === 'line' ? { widthMm: o.lengthMm + o.strokeMm, heightMm: o.strokeMm } : o.type === 'rect' ? { widthMm: o.widthMm + (o.stroke === 'none' ? 0 : o.strokeMm), heightMm: o.heightMm + (o.stroke === 'none' ? 0 : o.strokeMm) } : o.type === 'circle' ? { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm } : { widthMm: o.textBox?.widthMm ?? 8, heightMm: 4 };
const rectangle = (id: string, xMm: number, yMm = 5): SceneObject => ({ id, type: 'rect', xMm, yMm, widthMm: 4, heightMm: 2, strokeMm: 0.25, stroke: '#000000' });
const document = () => ({ ...createDocument(), objects: [rectangle('a', 3), rectangle('b', 16, 9), { id: 'c', type: 'text' as const, xMm: 30, yMm: 5, text: 'TEST', fontSizePt: 9, fontFamily: 'Arial' as const, fill: '#000000' as const, textAlign: 'center' as const, characterStyles: [{ start: 0, end: 2, style: { fontWeight: 'bold' as const } }] }] });
const command = (revision: number, tool: string, args: unknown, objectId = 'a') => ({ schemaVersion: 1, tool, objectId, expectedRevision: revision, arguments: args });
describe('selezione multipla e gruppi sul documento comune', () => {
  it('raggruppa elementi non contigui al livello più alto, senza cambiare geometrie o stili', () => {
    const doc = document(), store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['c', 'a'], groupId: 'g' }), 'manual');
    expect(store.document.objects).toEqual([doc.objects[1], doc.objects[0], doc.objects[2]]);
    expect(store.document.groups).toEqual([{ id: 'g', objectIds: ['a', 'c'] }]);
    expect(expandSelection(store.document, ['c'])).toEqual(['a', 'c']);
    store.dispatch(command(1, 'moveObjects', { objectIds: ['a', 'c'], deltaXmm: 2, deltaYmm: 1 }), 'ai-simulation');
    expect(store.document.objects.filter(o => o.id !== 'b')).toEqual([doc.objects[0], doc.objects[2]].map(o => ({ ...o, xMm: o!.xMm + 2, yMm: o!.yMm + 1 })));
    store.dispatch(command(2, 'ungroupObjects', { groupIds: ['g'] }), 'manual'); expect(store.document.groups).toBeUndefined();
    store.undo(); expect(store.document.groups?.[0]?.id).toBe('g'); store.undo(); store.undo(); expect(store.document.objects).toEqual(doc.objects);
    store.redo(); store.redo(); store.redo(); expect(store.document.revision).toBe(9);
  });
  it('copia selezione e gruppi con nuovi ID, poi elimina e recupera atomicamente', () => {
    const store = new DocumentStore(document(), measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['a', 'c'], groupId: 'g' }), 'manual');
    store.dispatch(command(1, 'duplicateObjects', { copies: [{ objectId: 'c', newObjectId: 'copy-c' }, { objectId: 'a', newObjectId: 'copy-a' }], groups: [{ groupId: 'g', newGroupId: 'copy-g' }] }), 'manual');
    expect(store.document.groups?.[1]).toEqual({ id: 'copy-g', objectIds: ['copy-a', 'copy-c'] });
    expect(store.document.objects.at(-1)).toEqual({ ...store.document.objects[2], id: 'copy-c' });
    const saved = structuredClone(store.document); store.import(JSON.parse(JSON.stringify(saved))); expect(store.document.objects).toEqual(saved.objects); expect(store.document.groups).toEqual(saved.groups);
    store.dispatch(command(3, 'deleteObjects', { objectIds: ['a', 'c'] }), 'ai-simulation');
    expect(store.document.groups).toEqual([saved.groups![1]]); store.undo(); expect(store.document.groups).toEqual(saved.groups);
    expect(() => store.dispatch(command(1, 'deleteObjects', { objectIds: ['a', 'c'] }), 'ai-simulation')).toThrow('obsoleta');
  });
  it('rifiuta selezioni parziali, ID duplicati, gruppi annidati e singoli edit senza perdere redo', () => {
    const store = new DocumentStore(document(), measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['a', 'c'], groupId: 'g' }), 'manual');
    store.dispatch(command(1, 'ungroupObjects', { groupIds: ['g'] }), 'manual'); store.undo();
    const before = structuredClone(store.document), events = structuredClone(store.events);
    const invalid = [
      command(3, 'moveObjects', { objectIds: ['a'], deltaXmm: 1, deltaYmm: 0 }),
      command(3, 'moveObjects', { objectIds: ['a', 'a'], deltaXmm: 1, deltaYmm: 0 }),
      command(3, 'deleteObjects', { objectIds: ['a', 'c', 'missing'] }),
      command(3, 'groupObjects', { objectIds: ['a', 'c'], groupId: 'nested' }),
      command(3, 'moveObject', { xMm: 4, yMm: 5 }),
      command(3, 'duplicateObjects', { copies: [{ objectId: 'a', newObjectId: 'copy-a' }, { objectId: 'c', newObjectId: 'copy-c' }], groups: [] }),
      command(3, 'ungroupObjects', { groupIds: ['g', 'g'] }),
      command(3, 'moveObjects', { objectIds: ['a', 'c'], deltaXmm: 1, deltaYmm: 0 }, 'b'),
    ];
    for (const c of invalid) { expect(() => store.dispatch(c, 'manual')).toThrow(); expect(store.document).toEqual(before); expect(store.events).toEqual(events); }
    store.redo(); expect(store.document.groups).toBeUndefined();
  });
  it('valida appartenenze, unicità e livelli anche all’importazione; v1 rimane stretto', () => {
    const doc = document();
    for (const groups of [
      [{ id: 'a', objectIds: ['a', 'b'] }], [{ id: 'g', objectIds: ['a', 'a'] }], [{ id: 'g', objectIds: ['a', 'missing'] }],
      [{ id: 'g', objectIds: ['a', 'c'] }], [{ id: 'g', objectIds: ['a', 'b'] }, { id: 'g2', objectIds: ['b', 'c'] }],
    ]) expect(() => parseGraphicDocument({ ...doc, groups })).toThrow();
    const valid = { ...doc, groups: [{ id: 'g', objectIds: ['a', 'b'] }] }; expect(DocumentSchema.parse(valid)).toEqual(valid);
    expect(() => parseGraphicDocument({ ...valid, schemaVersion: 1 })).toThrow();
  });
  it('gruppo esterno conservato durante la composizione; vincoli produttivi e Undo distinti', () => {
    const store = new DocumentStore(document(), measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['a', 'b'], groupId: 'g' }), 'manual');
    store.dispatch(command(1, 'moveObjects', { objectIds: ['a', 'b'], deltaXmm: -10, deltaYmm: 0 }), 'manual');
    expect(store.document.objects[0]!.xMm).toBe(-7); expect(() => validateLayout(store.document, measure)).toThrow('fuori');
    const before = structuredClone(store.document);
    store.dispatch(command(2,'moveObjects',{objectIds:['a','b'],deltaXmm:-30,deltaYmm:0}),'manual');expect(store.document.objects[0]!.xMm).toBe(-37);store.undo();expect(store.document.objects).toEqual(before.objects);
  });
  it('allinea oggetti e gruppi come unità senza cambiare le distanze interne', () => {
    const store = new DocumentStore(document(), measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['a', 'b'], groupId: 'g' }), 'manual');
    const before = structuredClone(store.document);
    store.dispatch(command(1, 'alignObjects', { objectIds: ['a', 'b', 'c'], alignment: 'centerY' }), 'manual');
    expect(store.document.objects[1]!.yMm - store.document.objects[0]!.yMm).toBe(4);
    const group = selectionBounds(store.document.objects.slice(0, 2), measure), text = selectionBounds(store.document.objects.slice(2), measure);
    expect(group.yMm + group.heightMm / 2).toBeCloseTo(text.yMm + text.heightMm / 2);
    expect(store.document.objects.map(o => o.xMm)).toEqual(before.objects.map(o => o.xMm));
  });
  it('distribuisce spazi fisici uguali, rifiutando sovrapposizioni atomicamente', () => {
    const doc = document(); doc.objects = [rectangle('a', 3), rectangle('b', 10), rectangle('c', 30)];
    const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'distributeObjects', { objectIds: ['a', 'b', 'c'], axis: 'horizontal' }), 'ai-simulation');
    expect(store.document.objects.map(o => o.xMm)).toEqual([3, 16.5, 30]);
    const overlap = { ...doc, objects: [rectangle('a', 3), rectangle('b', 4), rectangle('c', 5)] }; const invalid = new DocumentStore(overlap, measure);
    expect(() => invalid.dispatch(command(0, 'distributeObjects', { objectIds: ['a', 'b', 'c'], axis: 'horizontal' }), 'manual')).toThrow('sovrapposizioni'); expect(invalid.document).toEqual(overlap);
  });
  it('ordine di un singolo salta i gruppi senza spezzarne i livelli', () => {
    const store = new DocumentStore(document(), measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['b', 'c'], groupId: 'g' }, 'b'), 'manual');
    store.dispatch(command(1, 'reorderObject', { position: 'forward' }), 'manual'); expect(store.document.objects.map(o => o.id)).toEqual(['b', 'c', 'a']);
    expect(store.document.groups).toEqual([{ id: 'g', objectIds: ['b', 'c'] }]);
  });
});
