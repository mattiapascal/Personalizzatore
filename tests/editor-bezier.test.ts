import { describe, expect, it } from 'vitest';
import { normalizedBezier, bezierSegments, cubicPoint } from '../src/editor/bezier-geometry';
import { bezierWorldNodes, moveBezierPart, insertBezierNode, deleteBezierNode, setBezierClosed, openBezierAtNode, setBezierHandle, reverseBezier, reflectBezier, type BezierObject } from '../src/editor/bezier-nodes';
import { createDocument, DocumentStore, cloneGraphicDocument, parseGraphicDocument, objectCenter, type Measure } from '../src/editor/model';
const measure: Measure = object => object.type === 'bezier' ? { widthMm: object.widthMm + object.strokeMm, heightMm: object.heightMm + object.strokeMm } : { widthMm: 4, heightMm: 3 };
const curve = (rotationDeg = 0): BezierObject => ({ id: 'curve', type: 'bezier', ...normalizedBezier([{ x: 0, y: 0, out: { x: 0, y: 4 } }, { x: 4, y: 0, in: { x: 4, y: 4 } }], false), xMm: 10, yMm: 5, rotationDeg, closed: false, strokeMm: 0.25, stroke: '#000000' });
const near = (a: { x: number; y: number }, b: { x: number; y: number }) => { expect(a.x).toBeCloseTo(b.x, 8); expect(a.y).toBeCloseTo(b.y, 8); };
const command = (object: BezierObject, revision: number) => ({ schemaVersion: 1, tool: 'updateObject', objectId: 'curve', expectedRevision: revision, arguments: { object } });
describe('curve cubiche nel documento e nei comandi comuni', () => {
  it('muove un nodo con le sue maniglie lasciando fermi gli altri punti, anche ruotato', () => {
    for (const angle of [0, 30, 90, -135]) {
      const source = curve(angle), before = bezierWorldNodes(source, measure), changed = moveBezierPart(source, 0, 'point', { x: before[0]!.x - 2, y: before[0]!.y + 1 }, measure), after = bezierWorldNodes(changed, measure);
      near(after[0]!, { x: before[0]!.x - 2, y: before[0]!.y + 1 }); near(after[0]!.out!, { x: before[0]!.out!.x - 2, y: before[0]!.out!.y + 1 }); near(after[1]!, before[1]!); near(after[1]!.in!, before[1]!.in!); expect(source).toEqual(curve(angle));
    }
  });
  it('cambia solo una maniglia conservando nodi e altre maniglie nel foglio', () => {
    for (const angle of [0, 30, 90]) { const source = curve(angle), before = bezierWorldNodes(source, measure), changed = moveBezierPart(source, 0, 'out', { x: before[0]!.out!.x - 1, y: before[0]!.out!.y + 2 }, measure), after = bezierWorldNodes(changed, measure); near(after[0]!, before[0]!); near(after[1]!, before[1]!); near(after[1]!.in!, before[1]!.in!); near(after[0]!.out!, { x: before[0]!.out!.x - 1, y: before[0]!.out!.y + 2 }); }
  });
  it('divide esattamente la cubica anche nel segmento di chiusura', () => {
    for (const closed of [false, true]) {
      const source = setBezierClosed(curve(30), closed, measure), index = closed ? 1 : 0, original = bezierSegments(bezierWorldNodes(source, measure), closed)[index]!, changed = insertBezierNode(source, index, measure), segments = bezierSegments(bezierWorldNodes(changed, measure), closed);
      expect(changed.nodes).toHaveLength(3); for (let i = 0; i <= 40; i++) { const t = i / 40, part = t <= 0.5 ? segments[index]! : segments[index + 1]!, local = t <= 0.5 ? t * 2 : t * 2 - 1; near(cubicPoint(...part, local), cubicPoint(...original, t)); }
    }
  });
  it('chiude/apre e abilita/disabilita maniglie, preservando tutti i nodi', () => {
    const source = curve(30), before = bezierWorldNodes(source, measure), closed = setBezierClosed(source, true, measure), opened = setBezierClosed(closed, false, measure); bezierWorldNodes(opened, measure).forEach((node, i) => near(node, before[i]!)); expect(opened.fill).toBe('none');
    const straight = setBezierHandle(source, 0, 'out', false, measure); expect(straight.nodes[0]!.out).toBeUndefined(); const restored = setBezierHandle(straight, 0, 'out', true, measure); expect(restored.nodes[0]!.out).toBeDefined(); expect(() => setBezierHandle(source, 0, 'in', true, measure)).toThrow('capo aperto'); expect(() => deleteBezierNode(source, 0, measure)).toThrow('due nodi'); expect(deleteBezierNode(insertBezierNode(source, 0, measure), 1, measure).nodes).toHaveLength(2);
  });
  it('riflette rispetto al foglio e inverte i nodi senza alterare la curva', () => {
    const source = curve(30), before = bezierWorldNodes(source, measure), center = objectCenter(source, measure), reflected = reflectBezier(source, 'horizontal', measure); bezierWorldNodes(reflected, measure).forEach((node, i) => { near(node, { x: center.xMm * 2 - before[i]!.x, y: before[i]!.y }); if (node.out) near(node.out, { x: center.xMm * 2 - before[i]!.out!.x, y: before[i]!.out!.y }); });
    expect(reverseBezier(reverseBezier(source))).toEqual(source); const reversed = bezierSegments(bezierWorldNodes(reverseBezier(source), measure), false)[0]!, original = bezierSegments(before, false)[0]!; for (let i = 0; i <= 20; i++) near(cubicPoint(...reversed, i / 20), cubicPoint(...original, 1 - i / 20));
  });
  it('aggiunge, modifica, duplica, scala e raggruppa negli stessi comandi UI/AI', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure), source = curve(); store.dispatch({ schemaVersion: 1, tool: 'addObject', objectId: 'curve', expectedRevision: 0, arguments: { object: source } }, 'manual'); const changed = insertBezierNode(source, 0, measure); store.dispatch(command(changed, 1), 'ai-simulation'); store.dispatch({ schemaVersion: 1, tool: 'duplicateObject', objectId: 'curve', expectedRevision: 2, arguments: { newObjectId: 'copy', xMm: 20, yMm: 5 } }, 'manual'); store.dispatch({ schemaVersion: 1, tool: 'groupObjects', objectId: 'curve', expectedRevision: 3, arguments: { objectIds: ['curve', 'copy'], groupId: 'g' } }, 'manual'); store.dispatch({ schemaVersion: 1, tool: 'transformObjects', objectId: 'curve', expectedRevision: 4, arguments: { objectIds: ['curve', 'copy'], scale: 1.5, rotationDeg: 30, center: { xMm: 29, yMm: 11 } } }, 'manual');
    expect(store.document.objects[0]).toMatchObject({ type: 'bezier', widthMm: 6, heightMm: 4.5, strokeMm: 0.375, rotationDeg: 30, nodes: changed.nodes }); const saved = cloneGraphicDocument(store.document); expect(parseGraphicDocument(JSON.parse(JSON.stringify(saved)))).toEqual(saved); store.undo(); store.redo(); expect(store.document.objects).toEqual(saved.objects);
  });
  it('rifiuta curve malformate, stili vietati e revisioni obsolete senza perdere redo', () => {
    const doc = createDocument(); doc.objects = [curve()]; const store = new DocumentStore(doc, measure); store.dispatch(command(insertBezierNode(curve(), 0, measure), 0), 'manual'); store.undo(); const before = cloneGraphicDocument(store.document);
    for (const changed of [{ ...curve(), fill: '#000000' }, { ...curve(), widthMm: 0 }, { ...curve(), nodes: [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.8 }] }, { ...curve(), nodes: Array(65).fill(curve().nodes[0]) }, { ...curve(), stroke: 'none' }]) { expect(() => store.dispatch(command(changed as BezierObject, before.revision), 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); } expect(() => store.dispatch(command(curve(), 0), 'ai-simulation')).toThrow('obsoleta'); store.redo(); expect((store.document.objects[0] as BezierObject).nodes).toHaveLength(3);
  });
});

it('apre la curva dal nodo senza perdere alcuna cubica, anche ruotata, con estremità indipendenti', () => {
  for (const angle of [0, 30, -90]) for (const index of [0, 1]) {
    const source = { ...setBezierClosed(curve(angle), true, measure), fill: '#000000' as const }, original = bezierSegments(bezierWorldNodes(source, measure), true), opened = openBezierAtNode(source, index, measure), segments = bezierSegments(bezierWorldNodes(opened, measure), false);
    expect(opened).toMatchObject({ id: source.id, closed: false, fill: 'none', rotationDeg: angle }); expect(opened.nodes).toHaveLength(3);
    segments.forEach((segment, i) => { for (let sample = 0; sample <= 20; sample++) near(cubicPoint(...segment, sample / 20), cubicPoint(...original[(i + index) % original.length]!, sample / 20)); });
    const world = bezierWorldNodes(opened, measure); near(world[0]!, world.at(-1)!); const moved = bezierWorldNodes(moveBezierPart(opened, 0, 'point', { x: world[0]!.x + 1, y: world[0]!.y }, measure), measure); near(moved.at(-1)!, world.at(-1)!);
  }
  expect(() => openBezierAtNode(curve(), 0, measure)).toThrow('già aperta'); const closed = setBezierClosed(curve(), true, measure); expect(() => openBezierAtNode({ ...closed, nodes: Array.from({ length: 64 }, (_, i) => closed.nodes[i % 2]!) }, 0, measure)).toThrow('64 nodi');
});
