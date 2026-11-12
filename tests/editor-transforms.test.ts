import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectGeometry, validateLayout, parseGraphicDocument, type Measure, type TransformArguments } from '../src/editor/model';

const measure: Measure = o => o.type === 'image' ? { widthMm: o.widthMm, heightMm: o.heightMm } : o.type === 'path' || o.type === 'bezier' || o.type === 'vector' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : o.type === 'ellipse' ? { widthMm: o.rxMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm), heightMm: o.ryMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm) } : o.type === 'line' ? { widthMm: o.lengthMm + o.strokeMm, heightMm: o.strokeMm } : o.type === 'rect' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm }
  : o.type === 'circle' ? { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm }
    : { widthMm: o.text.length * o.fontSizePt * 0.2, heightMm: o.fontSizePt * 0.4 };
const transform = (revision: number, objectId: string, args: TransformArguments) => ({ schemaVersion: 1, tool: 'transformObject', expectedRevision: revision, objectId, arguments: args });
const rectArgs: TransformArguments = { xMm: 3, yMm: 4, rotationDeg: 30, size: { type: 'rect', widthMm: 10, heightMm: 4 } };

describe('trasformazioni fisiche del documento v2', () => {
  it('UI e simulazione applicano trasformazioni atomiche senza perdere identità e stile', () => {
    const store = new DocumentStore(createDocument(), measure), initial = structuredClone(store.document);
    store.dispatch(transform(0, 'frame-1', rectArgs), 'manual');
    store.dispatch(transform(1, 'text-1', { xMm: 20, yMm: 2, rotationDeg: -30, size: { type: 'text', fontSizePt: 12 } }), 'ai-simulation');
    expect(store.document.objects[0]).toMatchObject({ id: 'frame-1', widthMm: 10, heightMm: 4, strokeMm: 0.25, rotationDeg: 30 });
    expect(store.document.objects[1]).toMatchObject({ text: 'TEST · Città', fontSizePt: 12, fill: '#000000', rotationDeg: -30 });
    const final = structuredClone(store.document);
    store.undo(); store.undo(); expect(store.document).toEqual({ ...initial, revision: 4 });
    store.redo(); store.redo(); expect(store.document).toEqual({ ...final, revision: 6 });
  });
  it('rifiuta stale, tipi errati, cerchi ruotati, dimensioni e ingombri invalidi conservando redo', () => {
    const doc = createDocument(); doc.objects.push({ id: 'circle-1', type: 'circle', xMm: 5, yMm: 5, radiusMm: 2, strokeMm: 0.25, stroke: '#000000' });
    const store = new DocumentStore(doc, measure);
    store.dispatch(transform(0, 'frame-1', rectArgs), 'manual'); store.undo();
    const before = structuredClone(store.document), events = structuredClone(store.events);
    const invalid = [
      transform(0, 'frame-1', rectArgs), transform(2, 'missing', rectArgs), transform(2, 'text-1', rectArgs),
      transform(2, 'frame-1', { ...rectArgs, size: { type: 'rect', widthMm: -1, heightMm: 4 } }),
      transform(2, 'frame-1', { ...rectArgs, rotationDeg: 181 }), transform(2, 'frame-1', { ...rectArgs, xMm: NaN }),
      transform(2, 'text-1', { ...rectArgs, size: { type: 'text', fontSizePt: 0.09 } }),
      transform(2, 'circle-1', { ...rectArgs, size: { type: 'circle', radiusMm: 3 } }),
      transform(2, 'frame-1', { ...rectArgs, xMm: 1001, rotationDeg: 90, size: { type: 'rect', widthMm: 30, heightMm: 4 } }),
      { ...transform(2, 'frame-1', rectArgs), arguments: { ...rectArgs, scaleX: 2 } },
    ];
    for (const command of invalid) {
      expect(() => store.dispatch(command, 'ai-simulation')).toThrow();
      expect(store.document).toEqual(before); expect(store.events).toEqual(events);
    }
    store.redo(); expect(store.document.objects[0]).toMatchObject({ widthMm: 10 });
  });
  it('ridimensiona un cerchio senza deformazioni e conserva il tratto fisico', () => {
    const doc = createDocument(); doc.objects = [{ id: 'circle-1', type: 'circle', xMm: 5, yMm: 5, radiusMm: 2, strokeMm: 0.25, stroke: '#000000' }];
    const store = new DocumentStore(doc, measure);
    store.dispatch(transform(0, 'circle-1', { xMm: 7, yMm: 8, rotationDeg: 0, size: { type: 'circle', radiusMm: 4 } }), 'manual');
    expect(store.document.objects[0]).toMatchObject({ radiusMm: 4, strokeMm: 0.25 });
    expect(objectGeometry(store.document.objects[0]!, measure)).toMatchObject({ widthMm: 8.25, heightMm: 8.25 });
  });
  it('a 90 gradi scambia gli ingombri includendo il tratto, senza spostare X/Y', () => {
    const geometry = objectGeometry({ id: 'rect', type: 'rect', xMm: 4, yMm: 6, widthMm: 10, heightMm: 4, rotationDeg: 90, strokeMm: 0.25, stroke: '#000000' }, measure);
    expect(geometry.widthMm).toBeCloseTo(4.25); expect(geometry.heightMm).toBeCloseTo(10.25);
    expect(Math.min(...geometry.corners.map(p => p.x))).toBeCloseTo(4);
    expect(Math.min(...geometry.corners.map(p => p.y))).toBeCloseTo(6);
  });
  it('controlla i vertici orientati nel cerchio, non gli angoli del bounding box', () => {
    const doc = createDocument(); doc.shape = 'round'; doc.areaMm = { width: 30, height: 30 }; doc.objects = [];
    const store = new DocumentStore(doc, measure);
    const offset = 15 - (26.25 + 2.25) * Math.SQRT1_2 / 2;
    const object = { id: 'diagonal', type: 'rect', xMm: offset, yMm: offset, widthMm: 26, heightMm: 2, rotationDeg: 45, strokeMm: 0.25, stroke: '#000000' };
    store.dispatch({ schemaVersion: 1, tool: 'addObject', expectedRevision: 0, objectId: object.id, arguments: { object } }, 'manual');
    validateLayout(store.document, measure);
    store.dispatch(transform(1, 'diagonal', { xMm: offset + 2, yMm: offset, rotationDeg: 45, size: { type: 'rect', widthMm: 26, heightMm: 2 } }), 'manual');
    expect(() => validateLayout(store.document, measure)).toThrow('circolare');
    expect(store.document.revision).toBe(2);
  });
  it('importa v1 con metadati e ID conservati e rifiuta versioni ignote o v1 con rotazioni', () => {
    const current = createDocument(); for (const object of current.objects) if (object.type === 'text') delete object.textAlign;
    const legacy = { ...current, schemaVersion: 1 };
    expect(parseGraphicDocument(legacy)).toEqual(current);
    const store = new DocumentStore(current, measure); store.import(legacy);
    expect(store.document.schemaVersion).toBe(2); expect(store.document.documentId).toBe(legacy.documentId);
    expect(() => store.import({ ...legacy, schemaVersion: 3 })).toThrow();
    expect(() => store.import({ ...legacy, objects: legacy.objects.map(o => ({ ...o, rotationDeg: 45 })) })).toThrow();
    expect(store.document.revision).toBe(1);
  });
  it('JSON v2 riapribile conserva rotazione, geometria e flag TEST', () => {
    const store = new DocumentStore(createDocument(), measure);
    store.dispatch(transform(0, 'frame-1', rectArgs), 'manual');
    const saved = JSON.parse(JSON.stringify(store.document)); store.import(saved);
    expect(store.document.objects).toEqual(saved.objects); expect(store.document).toMatchObject({ schemaVersion: 2, fixture: true, validatedForProduction: false, revision: 2 });
  });
  it('ordine livelli condiviso, senza cambiare geometrie e con undo/redo', () => {
    const doc = createDocument(); doc.objects.push({ id: 'circle-1', type: 'circle', xMm: 5, yMm: 5, radiusMm: 2, strokeMm: 0.25, stroke: '#000000' });
    const store = new DocumentStore(doc, measure), original = structuredClone(store.document.objects);
    const order = (revision: number, position: string) => ({ schemaVersion: 1, tool: 'reorderObject', objectId: 'frame-1', expectedRevision: revision, arguments: { position } });
    store.dispatch(order(0, 'forward'), 'manual'); expect(store.document.objects.map(o => o.id)).toEqual(['text-1', 'frame-1', 'circle-1']);
    store.dispatch(order(1, 'front'), 'ai-simulation'); expect(store.document.objects.map(o => o.id)).toEqual(['text-1', 'circle-1', 'frame-1']);
    store.dispatch(order(2, 'backward'), 'manual'); expect(store.document.objects.map(o => o.id)).toEqual(['text-1', 'frame-1', 'circle-1']);
    store.dispatch(order(3, 'back'), 'manual'); expect(store.document.objects).toEqual(original);
    store.undo(); store.redo(); expect(store.document.objects).toEqual(original);
    expect(() => store.dispatch(order(0, 'front'), 'ai-simulation')).toThrow('obsoleta');
    expect(() => store.dispatch(order(6, 'somewhere'), 'manual')).toThrow();
  });
  it.each(['left', 'centerX', 'right', 'top', 'centerY', 'bottom'] as const)('allineamento %s usa l’ingombro ruotato e conserva stile e dimensioni', alignment => {
    const doc = createDocument(); doc.objects = [{ id: 'r', type: 'rect', xMm: 6, yMm: 6, rotationDeg: 30, widthMm: 10, heightMm: 4, strokeMm: 0.25, stroke: '#000000' }];
    const store = new DocumentStore(doc, measure), before = structuredClone(store.document.objects[0]!), bounds = objectGeometry(before, measure);
    store.dispatch({ schemaVersion: 1, tool: 'alignObject', expectedRevision: 0, objectId: 'r', arguments: { alignment } }, 'manual');
    const next = store.document.objects[0]!;
    const expectedX = alignment === 'left' ? 1 : alignment === 'centerX' ? (58 - bounds.widthMm) / 2 : alignment === 'right' ? 57 - bounds.widthMm : before.xMm;
    const expectedY = alignment === 'top' ? 1 : alignment === 'centerY' ? (22 - bounds.heightMm) / 2 : alignment === 'bottom' ? 21 - bounds.heightMm : before.yMm;
    expect(next).toEqual({ ...before, xMm: expectedX, yMm: expectedY });
    store.undo(); expect(store.document.objects[0]).toEqual(before);
    store.redo(); expect(store.document.objects[0]).toEqual(next);
  });
  it('allineamento parziale nel cerchio ammesso in modifica, segnalato dalla verifica stretta', () => {
    const doc = createDocument(); doc.shape = 'round'; doc.areaMm = { width: 30, height: 30 };
    const offset = 15 - (26.25 + 2.25) * Math.SQRT1_2 / 2;
    doc.objects = [{ id: 'r', type: 'rect', xMm: offset, yMm: offset, widthMm: 26, heightMm: 2, rotationDeg: 45, strokeMm: 0.25, stroke: '#000000' }];
    const store = new DocumentStore(doc, measure);
    store.dispatch({ schemaVersion: 1, tool: 'alignObject', expectedRevision: 0, objectId: 'r', arguments: { alignment: 'left' } }, 'ai-simulation');
    expect(store.document.objects[0]!.xMm).toBe(1);
    expect(() => validateLayout(store.document, measure)).toThrow('circolare');
  });
});
