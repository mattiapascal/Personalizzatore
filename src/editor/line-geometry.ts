import { objectGeometry, type SceneObject } from './model';
export interface PointMm { xMm: number; yMm: number; }
export function lineFromEndpoints(id: string, start: PointMm, end: PointMm): Extract<SceneObject, { type: 'line' }> {
  const dx = end.xMm - start.xMm, dy = end.yMm - start.yMm, lengthMm = Math.hypot(dx, dy);
  if (![start.xMm, start.yMm, end.xMm, end.yMm, lengthMm].every(Number.isFinite) || lengthMm <= 0) throw new Error('La linea richiede due punti distinti e finiti');
  const object: Extract<SceneObject, { type: 'line' }> = { id, type: 'line', xMm: 0, yMm: 0, lengthMm, rotationDeg: Math.atan2(dy, dx) * 180 / Math.PI, strokeMm: 0.25, stroke: '#000000' };
  const bounds = objectGeometry(object, () => ({ widthMm: lengthMm + object.strokeMm, heightMm: object.strokeMm }));
  return { ...object, xMm: (start.xMm + end.xMm - bounds.widthMm) / 2, yMm: (start.yMm + end.yMm - bounds.heightMm) / 2 };
}
export function constrainedLineEnd(start: PointMm, end: PointMm): PointMm {
  const length = Math.hypot(end.xMm - start.xMm, end.yMm - start.yMm), angle = Math.round(Math.atan2(end.yMm - start.yMm, end.xMm - start.xMm) / (Math.PI / 4)) * Math.PI / 4;
  return { xMm: start.xMm + length * Math.cos(angle), yMm: start.yMm + length * Math.sin(angle) };
}
