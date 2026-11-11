import { describe, expect, it } from 'vitest';
import { createDocument, DocumentSchema, DocumentStore, objectCenter, parseGraphicDocument, SceneObjectSchema, type Measure, type SceneObject } from '../src/editor/model';
import { TextPathGuideSchema } from '../src/editor/text-path-spec';
import { EDITOR_LIMITS } from '../src/editor/limits';

const appearance = { stroke: '#000000' as const, strokeMm: 9.2, fill: 'none' as const };
const geometries = [
  { type: 'rect', widthMm: 50, heightMm: 30 },
  { type: 'circle', radiusMm: 15 },
  { type: 'ellipse', rxMm: 25, ryMm: 15 },
  { type: 'line', lengthMm: 50 },
  { type: 'path', widthMm: 50, heightMm: 30, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], closed: false },
  { type: 'bezier', widthMm: 50, heightMm: 30, nodes: [{ x: 0, y: 0 }, { x: 1, y: 1 }], closed: false },
  { type: 'vector', widthMm: 50, heightMm: 30, commands: [['M', 0, 0], ['L', 1, 1]], fillRule: 'nonzero', strokeLineCap: 'round', strokeLineJoin: 'round', strokeMiterLimit: 4 },
];
const objects = geometries.map((geometry, i) => SceneObjectSchema.parse({ id: `shape-${i}`, xMm: 20 + i * 70, yMm: 20, ...appearance, ...geometry }));
const measure: Measure = object => {
  if (object.type === 'text' || object.type === 'image') throw Error('Il campione contiene solo contorni');
  const stroke = object.stroke === 'none' ? 0 : object.strokeMm;
  return { widthMm: (object.type === 'circle' ? object.radiusMm * 2 : object.type === 'ellipse' ? object.rxMm * 2 : object.type === 'line' ? object.lengthMm : object.widthMm) + stroke,
    heightMm: (object.type === 'circle' ? object.radiusMm * 2 : object.type === 'ellipse' ? object.ryMm * 2 : object.type === 'line' ? 0 : object.heightMm) + stroke };
};
const document = () => ({ ...createDocument(), areaMm: { width: 800, height: 600 }, objects: structuredClone(objects) });

describe('capacità dei contorni fisici, distinta dai vincoli produttivi', () => {
  it('tutte le geometrie e le guide del testo ammettono il medesimo confine finito in mm', () => {
    for (const geometry of geometries) {
      const shape = { id: 'shape', xMm: 20, yMm: 20, ...appearance, ...geometry };
      expect(SceneObjectSchema.parse({ ...shape, strokeMm: EDITOR_LIMITS.maxStrokeMm })).toMatchObject({ strokeMm: 100 });
      if (geometry.type !== 'rect') expect(TextPathGuideSchema.parse({ ...appearance, ...geometry, strokeMm: 100 }).strokeMm).toBe(100);
      for (const strokeMm of [0, -1, NaN, Infinity, 100.01]) {
        expect(() => SceneObjectSchema.parse({ ...shape, strokeMm })).toThrow();
        if (geometry.type !== 'rect') expect(() => TextPathGuideSchema.parse({ ...appearance, ...geometry, strokeMm })).toThrow();
      }
    }
    expect(DocumentSchema.parse(document()).objects).toHaveLength(7);
    const legacy = { ...createDocument(), schemaVersion: 1, objects: [{ id: 'old', type: 'rect', xMm: 4, yMm: 4, widthMm: 10, heightMm: 10, stroke: '#000000', strokeMm: 2 }] };
    expect(parseGraphicDocument(legacy).schemaVersion).toBe(2);
    expect(() => parseGraphicDocument({ ...legacy, objects: [{ ...legacy.objects[0], strokeMm: 9.2 }] })).toThrow();
  });

  it('ispettore e AI condividono stile, centri, JSON e storico senza clamp degli spessori importati', () => {
    const original = document(), stores = ['manual', 'ai-simulation'].map(source => {
      const store = new DocumentStore(original, measure), centers = store.document.objects.map(object => objectCenter(object, measure));
      store.dispatch({ schemaVersion: 1, tool: 'styleObjects', objectId: objects[0]!.id, expectedRevision: 0, arguments: { objectIds: objects.map(object => object.id), style: { strokeMm: 12.35 } } }, source as 'manual' | 'ai-simulation');
      store.document.objects.forEach((object, i) => {
        expect((object as Exclude<SceneObject, { type: 'text' | 'image' }>).strokeMm).toBe(12.35);
        expect(objectCenter(object, measure).xMm).toBeCloseTo(centers[i]!.xMm, 9);
        expect(objectCenter(object, measure).yMm).toBeCloseTo(centers[i]!.yMm, 9);
      });
      const saved = structuredClone(store.document);
      expect(parseGraphicDocument(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
      store.undo(); expect(store.document.objects).toEqual(original.objects);
      store.redo(); expect(store.document.objects).toEqual(saved.objects);
      return store;
    });
    expect(stores[0]!.document).toEqual(stores[1]!.document);
  });

  it('un singolo contorno oltre il limite rifiuta il comando intero e conserva il redo', () => {
    const store = new DocumentStore(document(), measure);
    store.dispatch({ schemaVersion: 1, tool: 'transformObjects', objectId: objects[0]!.id, expectedRevision: 0, arguments: { objectIds: objects.map(object => object.id), scale: 2, rotationDeg: 0, center: { xMm: 400, yMm: 300 } } }, 'manual');
    expect(store.document.objects.every(object => 'strokeMm' in object && object.strokeMm === 18.4)).toBe(true);
    store.undo(); const before = structuredClone(store.document), events = structuredClone(store.events);
    const tooWide = { ...store.document.objects[0]!, strokeMm: 100.01 };
    for (const source of ['manual', 'ai-simulation'] as const) {
      for (const command of [
        { tool: 'updateObject', arguments: { object: tooWide } },
        { tool: 'styleObjects', arguments: { objectIds: objects.map(object => object.id), style: { strokeMm: 100.01 } } },
        { tool: 'transformObjects', arguments: { objectIds: objects.map(object => object.id), scale: 11, rotationDeg: 0, center: { xMm: 400, yMm: 300 } } },
      ]) {
        expect(() => store.dispatch({ schemaVersion: 1, objectId: objects[0]!.id, expectedRevision: before.revision, ...command }, source)).toThrow();
        expect(store.document).toEqual(before); expect(store.events).toEqual(events);
      }
    }
    store.redo(); expect(store.document.objects.every(object => 'strokeMm' in object && object.strokeMm === 18.4)).toBe(true);
  });
});
