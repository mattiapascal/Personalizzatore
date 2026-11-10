import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, parseGraphicDocument, objectCenter, placeObjectAtCenter, type SceneObject, type Measure } from '../src/editor/model';

// Metriche deterministiche di dominio; le metriche Fabric effettive sono nei browser.
const measure: Measure = object => {
  if (object.type === 'image') return { widthMm: object.widthMm, heightMm: object.heightMm };
  if (object.type === 'text') return { widthMm: Math.max(...object.text.split('\n').map(line => line.length)) * object.fontSizePt * 0.2, heightMm: object.fontSizePt * 0.4 * object.text.split('\n').length * (object.lineHeight ?? 1.16) };
  if (object.type === 'line') return { widthMm: object.lengthMm + object.strokeMm, heightMm: object.strokeMm };
  const stroke = object.stroke === 'none' ? 0 : object.strokeMm;
  if (object.type === 'path' || object.type === 'bezier' || object.type === 'vector') return { widthMm: object.widthMm + stroke, heightMm: object.heightMm + stroke };
  if (object.type === 'ellipse') return { widthMm: object.rxMm * 2 + stroke, heightMm: object.ryMm * 2 + stroke };
  return object.type === 'rect' ? { widthMm: object.widthMm + stroke, heightMm: object.heightMm + stroke } : { widthMm: object.radiusMm * 2 + stroke, heightMm: object.radiusMm * 2 + stroke };
};
const update = (revision: number, object: unknown, objectId = (object as { id: string }).id) => ({ schemaVersion: 1, tool: 'updateObject', objectId, expectedRevision: revision, arguments: { object } });
const text = (): Extract<SceneObject, { type: 'text' }> => ({ id: 'text-1', type: 'text', xMm: 5, yMm: 5, text: 'Città\nTEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', fontWeight: 'bold', fontStyle: 'italic', underline: true, textAlign: 'center', lineHeight: 1.3, letterSpacingPt: 0.25 });

describe('ispettore atomico sul documento comune', () => {
  it('modifica manuale completa in una revisione, poi modifica simulata e undo/redo', () => {
    const store = new DocumentStore(createDocument(), measure), before = structuredClone(store.document);
    const object = text(); store.dispatch(update(0, object), 'manual');
    expect(store.document.objects[1]).toEqual(object); expect(store.document.revision).toBe(1); expect(store.events).toHaveLength(1);
    store.dispatch({ schemaVersion: 1, tool: 'setText', objectId: 'text-1', expectedRevision: 1, arguments: { text: 'AI TEST' } }, 'ai-simulation');
    expect(store.document.objects[1]).toEqual({ ...object, text: 'AI TEST' });
    store.undo(); expect(store.document.objects[1]).toEqual(object);
    store.undo(); expect(store.document).toEqual({ ...before, revision: 4 });
    store.redo(); expect(store.document.objects[1]).toEqual(object);
    expect(() => store.dispatch(update(1, object), 'ai-simulation')).toThrow('obsoleta');
  });
  it('rifiuta cambi di identità/tipo, stili non ammessi e raggio angoli impossibile senza perdere redo', () => {
    const store = new DocumentStore(createDocument(), measure);
    store.dispatch(update(0, text()), 'manual'); store.undo();
    const original = structuredClone(store.document), events = structuredClone(store.events);
    const originalRect = original.objects[0]!;
    const invalid = [
      update(0, text()), update(2, { ...text(), id: 'other' }, 'text-1'), update(2, text(), 'frame-1'),
      update(2, { ...text(), fill: '#888888' } as unknown as SceneObject), update(2, { ...text(), fontFamily: 'Unknown' } as unknown as SceneObject),
      update(2, { ...text(), lineHeight: 0.1 } as SceneObject), update(2, { ...text(), letterSpacingPt: 101 } as SceneObject),
      update(2, { ...text(), script: 'fetch()' } as SceneObject), update(2, { ...text(), text: 'x\n'.repeat(100) } as SceneObject),
      update(2, { ...originalRect, cornerRadiusMm: 30 } as SceneObject),
    ];
    for (const command of invalid) {
      expect(() => store.dispatch(command, 'ai-simulation')).toThrow(); expect(store.document).toEqual(original); expect(store.events).toEqual(events);
    }
    store.redo(); expect(store.document.objects[1]).toEqual(text());
  });
  it('riempimento, contorno e arrotondamento persistono e una riduzione incompatibile è rifiutata', () => {
    const store = new DocumentStore(createDocument(), measure);
    const rect: SceneObject = { id: 'frame-1', type: 'rect', xMm: 5, yMm: 5, widthMm: 10, heightMm: 6, cornerRadiusMm: 2, fill: '#000000', stroke: '#ffffff', strokeMm: 0.5, strokeDash: 'dashed' };
    store.dispatch(update(0, rect), 'ai-simulation');
    const saved = JSON.parse(JSON.stringify(store.document)); store.import(saved);
    expect(store.document.objects[0]).toEqual(rect);
    expect(() => store.dispatch({ schemaVersion: 1, tool: 'transformObject', objectId: 'frame-1', expectedRevision: 2, arguments: { xMm: 5, yMm: 5, rotationDeg: 0, size: { type: 'rect', widthMm: 3, heightMm: 6 } } }, 'manual')).toThrow('Raggio');
    expect(store.document.objects[0]).toEqual(rect); expect(store.document.revision).toBe(2);
  });
  it('contorno parzialmente esterno ammesso; spostamento interamente esterno rifiutato', () => {
    const doc = createDocument(); const rect: SceneObject = { id: 'r', type: 'rect', xMm: 48, yMm: 5, widthMm: 8, heightMm: 4, stroke: 'none', strokeMm: 2, fill: '#000000' }; doc.objects = [rect];
    const store = new DocumentStore(doc, measure);
    store.dispatch(update(0, { ...rect, xMm: 49, stroke: '#000000' }), 'manual');
    const before = structuredClone(store.document);
    expect(() => store.dispatch(update(1, { ...rect, xMm: 60 }), 'manual')).toThrow('completamente fuori');
    expect(store.document).toEqual(before); expect(store.events).toHaveLength(1);
  });
  it('copia conserva tutti gli attributi e il payload non può mutare il documento dopo il commit', () => {
    const store = new DocumentStore(createDocument(), measure), object = text();
    store.dispatch(update(0, object), 'manual'); object.text = 'MUTATO';
    expect(store.document.objects[1]).toEqual(text());
    store.dispatch({ schemaVersion: 1, tool: 'duplicateObject', objectId: 'text-1', expectedRevision: 1, arguments: { newObjectId: 'copy', xMm: 15, yMm: 5 } }, 'manual');
    expect(store.document.objects.at(-1)).toEqual({ ...text(), id: 'copy', xMm: 15 });
  });
  it('v1 rimane stretto e i v2 precedenti rimangono leggibili senza nuovi attributi', () => {
    const original = createDocument(); for (const object of original.objects) if (object.type === 'text') delete object.textAlign;
    expect(parseGraphicDocument(original)).toEqual(original);
    const legacy = { ...original, schemaVersion: 1 }; expect(parseGraphicDocument(legacy)).toEqual(original);
    expect(() => parseGraphicDocument({ ...legacy, objects: [text()] })).toThrow();
    const styled = { ...original, objects: [text()] }; expect(parseGraphicDocument(styled)).toEqual(styled);
  });
  it('la conversione centrale mantiene il centro cambiando dimensioni, testo, contorno e angolo', () => {
    const rect: SceneObject = { id: 'r', type: 'rect', xMm: 5, yMm: 5, widthMm: 10, heightMm: 4, strokeMm: 0.25, stroke: '#000000' };
    const center = objectCenter(rect, measure);
    for (const changed of [{ ...rect, widthMm: 15, heightMm: 8 }, { ...rect, rotationDeg: 45 }, { ...rect, strokeMm: 1 }, { ...rect, stroke: 'none' as const }]) {
      const positioned = placeObjectAtCenter(changed, center, measure);
      expect(objectCenter(positioned, measure)).toEqual(center);
    }
    const originalText = text(), textCenter = objectCenter(originalText, measure);
    expect(objectCenter(placeObjectAtCenter({ ...originalText, text: 'PIÙ LUNGO', fontSizePt: 12 }, textCenter, measure), measure)).toEqual(textCenter);
    expect(placeObjectAtCenter(rect, center, measure)).toEqual(rect);
  });
});
