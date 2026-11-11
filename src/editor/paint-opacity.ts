import { z } from 'zod';
import { Color } from 'fabric';
export const OpacitySchema = z.number().finite().min(0).max(1);
export const PaintOpacityFields = { fillOpacity: OpacitySchema.optional(), strokeOpacity: OpacitySchema.optional() };
/** Canonical paints stay RGB; alpha is independent and defaults to opaque. */
export function paintWithOpacity(paint: string | undefined, opacity = 1): string {
  if (!paint || paint === 'none') return 'transparent';
  if (opacity === 1) return paint;
  const [r, g, b] = new Color(paint).getSource();
  return `rgba(${r},${g},${b},${opacity})`;
}
/** Fabric stores character paints as CSS colors while editing. */
export function textPaintFromFabric(fill: unknown, baseOpacity = 1): { fill?: string; fillOpacity?: number } {
  if (typeof fill !== 'string') return {};
  const color = new Color(fill);
  if (color.isUnrecognised) throw new Error('Colore del testo non riconosciuto');
  const alpha = color.getAlpha();
  return { fill: `#${color.toHex().toLowerCase()}`, ...(alpha !== 1 || baseOpacity !== 1 ? { fillOpacity: alpha } : {}) };
}
