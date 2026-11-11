import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectCenter, type GraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
import { selectionBounds } from '../src/editor/selection';
const measure: Measure = o => o.type === 'image' ? { widthMm: o.widthMm, heightMm: o.heightMm } : o.type === 'path' || o.type === 'bezier' || o.type === 'vector' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : o.type === 'ellipse' ? { widthMm: o.rxMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm), heightMm: o.ryMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm) } : o.type === 'line' ? { widthMm: o.lengthMm + o.strokeMm, heightMm: o.strokeMm } : o.type === 'text'
  ? { widthMm: o.textBox?.autoWidth === false ? o.textBox.widthMm : o.fontSizePt * 2, heightMm: o.fontSizePt * 0.5 }
  : o.type === 'rect' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm };
const source = (): GraphicDocument => ({ ...createDocument(), areaMm: { width: 200, height: 200 }, objects: [
  { id: 'rect', type: 'rect', xMm: 30, yMm: 40, widthMm: 10, heightMm: 6, rotationDeg: 25, strokeMm: 0.2, stroke: '#000000', strokeDash: 'dashed', cornerRadiusMm: 1 },
  { id: 'text', type: 'text', xMm: 50, yMm: 40, text: 'AI TEST', fontSizePt: 9, fontFamily: 'Arial', textAlign: 'center', fill: '#000000', rotationDeg: 170, letterSpacingPt: 0.2, lineHeight: 1.3, textBox: { widthMm: 20, heightMm: 5, autoWidth: false, autoHeight: true }, characterStyles: [{ start: 0, end: 2, style: { fontSizePt: 12, fontWeight: 'bold', underline: true } }] },
  { id: 'circle', type: 'circle', xMm: 70, yMm: 45, radiusMm: 3, strokeMm: 0.3, stroke: '#ffffff', fill: '#000000' },
], groups: [{ id: 'g', objectIds: ['rect', 'text', 'circle'] }] });
const center = (doc: GraphicDocument) => { const box = selectionBounds(doc.objects, measure); return { xMm: box.xMm + box.widthMm / 2, yMm: box.yMm + box.heightMm / 2 }; };
const command = (revision: number, scale = 1.5, rotationDeg = 90, destination = { xMm: 100, yMm: 100 }, objectIds = ['rect', 'text', 'circle']) => ({ schemaVersion: 1, tool: 'transformObjects', objectId: 'rect', expectedRevision: revision, arguments: { objectIds, scale, rotationDeg, center: destination } });

describe('trasformazione atomica di gruppi e selezioni', () => {
  it('trasforma tutti i centri con la stessa similitudine e scala geometrie, tratti e stili locali', () => {
    const original = source(), snapshot = structuredClone(original), store = new DocumentStore(original, measure), pivot = center(original);
    store.dispatch(command(0), 'manual');
    expect(store.document.revision).toBe(1); expect(store.events).toHaveLength(1); expect(store.document.groups).toEqual(original.groups);
    for (let i = 0; i < original.objects.length; i++) {
      const before = objectCenter(original.objects[i]!, measure), after = objectCenter(store.document.objects[i]!, measure);
      expect(after.xMm).toBeCloseTo(100 - (before.yMm - pivot.yMm) * 1.5, 8);
      expect(after.yMm).toBeCloseTo(100 + (before.xMm - pivot.xMm) * 1.5, 8);
    }
    expect(store.document.objects[0]).toMatchObject({ widthMm: 15, heightMm: 9, rotationDeg: 115, cornerRadiusMm: 1.5, strokeDash: 'dashed' });
    expect((store.document.objects[0] as Extract<SceneObject, { type: 'rect' }>).strokeMm).toBeCloseTo(0.3);
    expect(store.document.objects[1]).toMatchObject({ fontSizePt: 13.5, letterSpacingPt: 0.3, rotationDeg: -100, lineHeight: 1.3, textAlign: 'center', textBox: { widthMm: 30, heightMm: 7.5, autoHeight: true }, characterStyles: [{ start: 0, end: 2, style: { fontSizePt: 18, fontWeight: 'bold', underline: true } }] });
    expect(store.document.objects[2]).toMatchObject({ radiusMm: 4.5, fill: '#000000' }); expect(store.document.objects[2]!.rotationDeg).toBeUndefined();
    expect(original).toEqual(snapshot);
  });
  it('la stessa trasformazione funziona senza gruppi e la traslazione pura non altera nessuno stile', () => {
    const doc = source(); delete doc.groups; const store = new DocumentStore(doc, measure), pivot = center(doc);
    store.dispatch(command(0, 1, 0, { xMm: pivot.xMm + 2, yMm: pivot.yMm + 3 }), 'ai-simulation');
    expect(store.document.objects).toEqual(doc.objects.map(o => ({ ...o, xMm: o.xMm + 2, yMm: o.yMm + 3 })));
    expect(store.document.groups).toBeUndefined();
  });
  it('quattro rotazioni a 90 gradi ripristinano geometrie e angoli anche per i cerchi', () => {
    const doc = source(), store = new DocumentStore(doc, measure), pivot = center(doc);
    for (let i = 0; i < 4; i++) store.dispatch(command(i, 1, 90, pivot), 'manual');
    for (let i = 0; i < doc.objects.length; i++) {
      const before = doc.objects[i]!, after = store.document.objects[i]!;
      expect(after.xMm).toBeCloseTo(before.xMm, 8); expect(after.yMm).toBeCloseTo(before.yMm, 8);
      expect({ ...after, xMm: 0, yMm: 0 }).toEqual({ ...before, xMm: 0, yMm: 0 });
    }
  });
  it('rifiuta schema, selezione parziale e revisione obsoleta senza modificare documento o redo', () => {
    const store = new DocumentStore(source(), measure); store.dispatch(command(0), 'manual'); store.undo();
    const before = structuredClone(store.document), events = structuredClone(store.events);
    for (const raw of [command(0), command(2, 0), command(2, -1), command(2, NaN), command(2, 101), command(2, 1, 181), command(2, 1, 0, { xMm: Infinity, yMm: 1 }), command(2, 1, 0, { xMm: 50, yMm: 50 }, ['rect', 'text']), { ...command(2), arguments: { ...command(2).arguments, scaleY: 2 } }]) {
      expect(() => store.dispatch(raw, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); expect(store.events).toEqual(events);
    }
    store.redo(); expect(store.document.revision).toBe(3);
  });
  it('limiti dei caratteri locali e del contorno rifiutano l’intera selezione, senza riduzioni automatiche', () => {
    const doc = source(), text = doc.objects[1] as Extract<SceneObject, { type: 'text' }>;
    text.fontSizePt = 12; text.characterStyles![0]!.style.fontSizePt = .1;
    const store = new DocumentStore(doc, measure), before = structuredClone(store.document);
    expect(() => store.dispatch(command(0, 0.8, 0, center(doc)), 'manual')).toThrow(); expect(store.document).toEqual(before);
    const thick = source(); (thick.objects[0] as Extract<SceneObject, { type: 'rect' }>).strokeMm = 60;
    const stroke = new DocumentStore(thick, measure);
    expect(() => stroke.dispatch(command(0, 2, 0, center(thick)), 'manual')).toThrow(); expect(stroke.document).toEqual(thick);
  });
  it('JSON e storico conservano lo stesso risultato e una trasformazione totalmente esterna è atomica', () => {
    const doc = source(), store = new DocumentStore(doc, measure);
    expect(() => store.dispatch(command(0, 1, 0, { xMm: 500, yMm: 500 }), 'manual')).toThrow('fuori'); expect(store.document).toEqual(doc);
    store.dispatch(command(0), 'manual'); const transformed = structuredClone(store.document);
    store.import(JSON.parse(JSON.stringify(transformed))); expect(store.document.objects).toEqual(transformed.objects);
    store.undo(); store.undo(); expect(store.document.objects).toEqual(doc.objects); store.redo(); store.redo();
    expect(store.document.objects).toEqual(transformed.objects); expect(store.document.groups).toEqual(doc.groups); expect(store.document.revision).toBe(6);
  });
});
