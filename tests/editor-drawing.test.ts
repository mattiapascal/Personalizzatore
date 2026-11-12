import { describe, expect, it } from 'vitest';
import { constrainedPrimitiveEnd, primitiveFromEndpoints } from '../src/editor/primitive-geometry';
import { createDocument, DocumentStore, objectCenter, type Measure } from '../src/editor/model';

const measure: Measure = o => o.type === 'rect' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : o.type === 'circle' ? { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm } : { widthMm: 4, heightMm: 4 };
describe('primitive costruite con un gesto', () => {
  it('il rettangolo conserva gli angoli del centro del tratto in tutti i quadranti', () => {
    const start = { xMm: 20, yMm: 10 };
    for (const end of [{ xMm: 30, yMm: 15 }, { xMm: 10, yMm: 15 }, { xMm: 10, yMm: 5 }, { xMm: 30, yMm: 5 }]) {
      const shape = primitiveFromEndpoints('rect', 'r', start, end); expect(shape.type).toBe('rect');
      expect(shape.xMm + 0.125).toBe(Math.min(start.xMm, end.xMm)); expect(shape.yMm + 0.125).toBe(Math.min(start.yMm, end.yMm));
      expect(objectCenter(shape, measure)).toEqual({ xMm: (start.xMm + end.xMm) / 2, yMm: (start.yMm + end.yMm) / 2 });
    }
  });
  it('Maiusc rende quadrati i rettangoli senza invertire la direzione del gesto', () => {
    const start = { xMm: 20, yMm: 10 }, end = constrainedPrimitiveEnd('rect', start, { xMm: 15, yMm: 13 });
    expect(end).toEqual({ xMm: 15, yMm: 15 });
    expect(primitiveFromEndpoints('rect', 'square', start, end)).toMatchObject({ widthMm: 5, heightMm: 5 });
  });
  it('il cerchio usa il punto iniziale come centro e la distanza come raggio', () => {
    const start = { xMm: 20, yMm: 10 }, end = { xMm: 23, yMm: 14 }, circle = primitiveFromEndpoints('circle', 'c', start, end);
    expect(circle).toMatchObject({ radiusMm: 5 }); expect(objectCenter(circle, measure)).toEqual(start);
    expect(constrainedPrimitiveEnd('circle', start, end)).toEqual(end);
  });
  it('rifiuta geometrie degeneri e punti non finiti', () => {
    const start = { xMm: 20, yMm: 10 };
    for (const kind of ['line', 'rect', 'circle'] as const) {
      expect(() => primitiveFromEndpoints(kind, 'x', start, start)).toThrow();
      expect(() => primitiveFromEndpoints(kind, 'x', start, { xMm: Infinity, yMm: 1 })).toThrow();
    }
    expect(() => primitiveFromEndpoints('rect', 'x', start, { ...start, xMm: 25 })).toThrow();
  });
  it('UI e simulazione AI aggiungono la stessa geometria con uno storico comune e rifiuto atomico', () => {
    const doc = createDocument(); doc.objects = [];
    const manual = new DocumentStore(doc, measure), ai = new DocumentStore(doc, measure);
    const object = primitiveFromEndpoints('rect', 'r', { xMm: 10, yMm: 5 }, { xMm: 16, yMm: 9 });
    const command = { schemaVersion: 1, tool: 'addObject', objectId: 'r', expectedRevision: 0, arguments: { object } };
    manual.dispatch(command, 'manual'); ai.dispatch(command, 'ai-simulation'); expect(manual.document).toEqual(ai.document);
    manual.undo(); expect(manual.document.objects).toEqual([]); const before = structuredClone(manual.document);
    expect(() => manual.dispatch({ ...command, expectedRevision: before.revision, arguments: { object: { ...object, xMm: 10001 } } }, 'manual')).toThrow();
    expect(manual.document).toEqual(before); manual.redo(); expect(manual.document.objects).toEqual([object]);
  });
});
