import {frameToWorld,worldToFrame} from './object-affine';
import { objectCenter, placeObjectAtCenter, type SceneObject, type Measure } from './model';
import type { PointMm } from './line-geometry';
import { strokeGeometry } from './path-geometry';
export type PathObject = Extract<SceneObject, { type: 'path' }>;
export function pathWorldPoints(object: PathObject, measure: Measure): PointMm[] {
  const center = objectCenter(object, measure);
  return object.points.map(point => { const x = (point.x - 0.5) * object.widthMm, y = (point.y - 0.5) * object.heightMm; const p=frameToWorld(object,x,y);return {xMm:center.xMm+p.x,yMm:center.yMm+p.y}; });
}
function rebuild(object: PathObject, points: PointMm[], measure: Measure): PathObject {
  const center = objectCenter(object, measure);
  const clean = (value: number) => Math.round(value * 1e9) / 1e9;
  const local = points.map(point => { const x = point.xMm - center.xMm, y = point.yMm - center.yMm; const p=worldToFrame(object,x,y);return {xMm:clean(p.x),yMm:clean(p.y)}; });
  const geometry = strokeGeometry(local, object.strokeMm), x = geometry.xMm + (geometry.widthMm + object.strokeMm) / 2, y = geometry.yMm + (geometry.heightMm + object.strokeMm) / 2;
  if (object.closed && (geometry.widthMm < 1e-9 || geometry.heightMm < 1e-9)) throw new Error('Un tracciato chiuso richiede una larghezza e un’altezza non nulle');
  return placeObjectAtCenter({ ...object, ...geometry }, {xMm:center.xMm+frameToWorld(object,x,y).x,yMm:center.yMm+frameToWorld(object,x,y).y}, measure) as PathObject;
}
function assertIndex(object: PathObject, index: number): void { if (!Number.isInteger(index) || index < 0 || index >= object.points.length) throw new Error('Nodo non presente nel tracciato'); }
export function movePathNode(object: PathObject, index: number, point: PointMm, measure: Measure): PathObject {
  assertIndex(object, index); const points = pathWorldPoints(object, measure); points[index] = point; return rebuild(object, points, measure);
}
export function insertPathNode(object: PathObject, index: number, measure: Measure): PathObject {
  assertIndex(object, index); if (object.points.length >= 512) throw new Error('Limite di 512 nodi raggiunto');
  if (!object.closed && index === object.points.length - 1) throw new Error('Il nodo finale non ha un segmento successivo');
  const points = pathWorldPoints(object, measure), a = points[index]!, b = points[(index + 1) % points.length]!;
  points.splice(index + 1, 0, { xMm: (a.xMm + b.xMm) / 2, yMm: (a.yMm + b.yMm) / 2 }); return rebuild(object, points, measure);
}
export function deletePathNode(object: PathObject, index: number, measure: Measure): PathObject {
  assertIndex(object, index); if (object.points.length <= (object.closed ? 3 : 2)) throw new Error(object.closed ? 'Un tracciato chiuso richiede almeno tre nodi' : 'Un tracciato aperto richiede almeno due nodi');
  const points = pathWorldPoints(object, measure); points.splice(index, 1); return rebuild(object, points, measure);
}
