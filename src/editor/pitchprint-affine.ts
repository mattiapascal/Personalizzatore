import { MAX_TEXT_SKEW_DEG } from './limits';
import { pitchprintNumber as number } from './pitchprint-units';
import type { PitchprintMatrix } from './pitchprint-tree';

/** Fabric 3's dimensional matrix: S * Kx * Ky, with flips before shearing.
 * Rotation and origin translation are deliberately handled by the caller. */
export function pitchprintLinear(item: Record<string, unknown>, name: string): PitchprintMatrix {
  const sx = number(item.scaleX ?? 1, name), sy = number(item.scaleY ?? 1, name);
  const x = number(item.skewX ?? 0, name), y = number(item.skewY ?? 0, name);
  if (sx <= 0 || sy <= 0) throw Error(`${name}: dimensioni o scala non valide.`);
  if (Math.abs(x) >= 90 || Math.abs(y) >= 90) throw Error(`${name}: angolo skew fuori dall’intervallo non singolare.`);
  const kx = Math.tan(x * Math.PI / 180), ky = Math.tan(y * Math.PI / 180);
  const fx = sx * (item.flipX === true ? -1 : 1), fy = sy * (item.flipY === true ? -1 : 1);
  const matrix: PitchprintMatrix = [fx * (1 + kx * ky), fy * ky, fx * kx, fy, 0, 0];
  if (!matrix.every(Number.isFinite)) throw Error(`${name}: trasformazione non finita.`);
  return matrix;
}

/** Exact orientation-preserving affine decomposition R * Kphysical * S.
 * The second column's norm includes shear and MUST NOT become the font size. */
export function decomposePitchprintText(matrix: PitchprintMatrix, name: string) {
  const [a,b,c,d] = matrix;
  const determinant = a*d-b*c, horizontal = Math.hypot(a,b);
  if (!matrix.every(Number.isFinite) || determinant <= 0 || horizontal <= 0) throw Error(`${name}: testo riflesso o trasformazione degenere non rappresentabile senza alterare i caratteri.`);
  const vertical = determinant / horizontal;
  let skew = Math.atan((a*c+b*d)/determinant) * 180 / Math.PI;
  let stretch = horizontal / vertical;
  // Matrix products can cross an exact schema endpoint by a few ULPs.
  // Clamp only this rounding residue, never expand the canonical capacity.
  const epsilon=1e-12;
  if (![vertical,stretch,skew].every(Number.isFinite) || vertical <= 0 || stretch < .1-epsilon || stretch > 10+epsilon || Math.abs(skew) > MAX_TEXT_SKEW_DEG+epsilon) throw Error(`${name}: trasformazione del testo oltre i limiti di dilatazione/inclinazione del laboratorio.`);
  stretch=Math.max(.1,Math.min(10,stretch));skew=Math.max(-MAX_TEXT_SKEW_DEG,Math.min(MAX_TEXT_SKEW_DEG,skew));
  return { horizontal, vertical, rotationDeg: Math.atan2(b,a)*180/Math.PI, textScaleX: stretch, textSkewXDeg: Math.abs(skew) < 1e-9 ? 0 : skew };
}
