import type { SceneObject } from './model';

/** Physical frame transform: rotation * shear * reflection. Layout, fonts and
 * source pixels remain editable; no outlines or raster copies are generated. */
export function objectInclination(object: SceneObject): number {
  return Math.atan(Math.tan((object.skewXDeg ?? 0) * Math.PI / 180) + (object.type === 'text' ? Math.tan((object.textSkewXDeg ?? 0) * Math.PI / 180) : 0)) * 180 / Math.PI;
}
export function hasObjectAffine(object: SceneObject): boolean {
  return object.skewXDeg !== undefined || !!object.mirrorX || !!object.mirrorY;
}
export function frameToWorld(object: SceneObject, x: number, y: number): { x: number; y: number } {
  const a = (object.rotationDeg ?? 0) * Math.PI / 180, k = Math.tan(objectInclination(object) * Math.PI / 180);
  x *= object.mirrorX ? -1 : 1; y *= object.mirrorY ? -1 : 1; x += k * y;
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
}
export function worldToFrame(object: SceneObject, x: number, y: number): { x: number; y: number } {
  const a = (object.rotationDeg ?? 0) * Math.PI / 180, k = Math.tan(objectInclination(object) * Math.PI / 180);
  const v = -x * Math.sin(a) + y * Math.cos(a), u = x * Math.cos(a) + y * Math.sin(a) - k * v;
  return { x: u * (object.mirrorX ? -1 : 1), y: v * (object.mirrorY ? -1 : 1) };
}
export function withoutObjectAffine<T extends SceneObject>(object: T): T {
  const next = { ...object }; delete next.skewXDeg; delete next.mirrorX; delete next.mirrorY;
  if (hasObjectAffine(object) && next.type === 'text') delete next.textSkewXDeg;
  return next;
}
