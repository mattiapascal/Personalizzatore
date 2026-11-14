import { canonicalPaint } from './paint';
import { pitchprintNumber as number } from './pitchprint-units';

/** A single fill has no overlapping paints: native object opacity is exactly
 * its fill alpha. Do not flatten isolated groups or fill+stroke into this. */
export function singleFillPitchprintOpacity(item: Record<string, unknown>): number | null {
  const opacity = item.opacity === undefined ? 1 : item.opacity;
  if (typeof opacity !== 'number' || !Number.isFinite(opacity) || opacity < 0 || opacity > 1) return null;
  if (opacity === 1) return 1;
  if (!['rect', 'circle', 'ellipse'].includes(String(item.type))) return null;
  if (canonicalPaint(item.backgroundColor) !== 'none') return null;
  if (number(item.strokeWidth ?? 0, 'Contorno') > 0 && canonicalPaint(item.stroke) !== 'none') return null;
  if (item.type === 'rect' && (number(item.rx ?? 0, 'Raggio X') !== 0 || number(item.ry ?? 0, 'Raggio Y') !== 0)) return null;
  // Reject complex/partial paints here; their compositing is a separate import capability.
  canonicalPaint(item.fill);
  return opacity;
}

/** Raster alpha is applied once to the complete image. A separate painted
 * background or stroke still needs composite object support. SVG sources are
 * checked after loading: their overlapping children must never be flattened. */
export function rasterPitchprintOpacity(item:Record<string,unknown>):number|null{
 if(item.type!=='image')return null;
 const value=item.opacity===undefined?1:item.opacity;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)return null;
 if(value!==1&&(canonicalPaint(item.backgroundColor)!=='none'||number(item.strokeWidth??0,'Contorno')>0&&canonicalPaint(item.stroke)!=='none'))return null;
 return value;
}
