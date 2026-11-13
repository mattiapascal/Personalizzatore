import { objectCenter, placeObjectAtCenter, type Measure } from './model';
import type { PathObject } from './path-nodes';
/** Riflette rispetto agli assi del foglio, anche se il tracciato è ruotato. */
export function reflectPath(object: PathObject, axis: 'horizontal' | 'vertical', measure: Measure): PathObject {
  const center = objectCenter(object, measure);
  const next: PathObject = {
    ...object,...(object.skewXDeg===undefined?{}:{skewXDeg:-object.skewXDeg||0}),
    ...(object.rotationDeg === undefined ? {} : { rotationDeg: -(object.rotationDeg || 0) }),
    points: object.points.map(point => ({
      x: axis === 'horizontal' && object.widthMm > 0 ? 1 - point.x : point.x,
      y: axis === 'vertical' && object.heightMm > 0 ? 1 - point.y : point.y,
    })),
  };
  return placeObjectAtCenter(next, center, measure) as PathObject;
}
export function reversePath(object: PathObject): PathObject {
  return { ...object, points: [...object.points].reverse().map(point => ({ ...point })) };
}
/** Due estremità coincidenti: tutti i segmenti del contorno sono conservati. */
export function openPathAtNode(object: PathObject, index: number): PathObject {
  if (!object.closed) throw new Error('Il tracciato è già aperto');
  if (!Number.isInteger(index) || index < 0 || index >= object.points.length) throw new Error('Nodo non presente nel tracciato');
  if (object.points.length >= 512) throw new Error('Servono meno di 512 nodi per duplicare l’estremità di apertura');
  const points = [...object.points.slice(index), ...object.points.slice(0, index), object.points[index]!].map(point => ({ ...point }));
  return { ...object, points, closed: false, fill: 'none' };
}
