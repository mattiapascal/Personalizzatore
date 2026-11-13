/** Canonical text shear is applied AFTER layout scaling: R * K * S.
 * Its angle is the inclination of the frame's vertical edges, independent of
 * horizontal stretch. Fabric composes R * S * K, so its parameter differs. */
export function fabricTextSkew(angleDeg: number, scaleX: number, scaleY: number): number {
  return Math.atan(Math.tan(angleDeg * Math.PI / 180) * scaleY / scaleX) * 180 / Math.PI;
}
export function physicalTextSkew(fabricDeg: number, scaleX: number, scaleY: number): number {
  return Math.atan(Math.tan(fabricDeg * Math.PI / 180) * scaleX / scaleY) * 180 / Math.PI;
}
