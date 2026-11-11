import { z } from 'zod';
import { Color } from 'fabric';
/** Canonical opaque sRGB; gradients and partial paint opacity require a separate model. */
export const ColorSchema = z.string().regex(/^#[0-9a-f]{6}$/, 'Usa un colore RGB nel formato #rrggbb');
export const PaintSchema = z.union([ColorSchema, z.literal('none')]);
export function canonicalPaint(raw: unknown, monochrome = false): string {
  if (raw == null || raw === '' || raw === 'none' || raw === 'transparent') return 'none';
  if (typeof raw !== 'string') throw new Error('Gradienti e riempimenti complessi richiedono una conversione dedicata.');
  const parsed = new Color(raw), [r, g, b, a] = parsed.getSource();
  if (parsed.isUnrecognised) throw new Error('Colore non riconosciuto');
  if (a === 0) return 'none';
  if (a !== 1) throw new Error('Opacità parziale non ancora convertibile.');
  if (monochrome) return r === 255 && g === 255 && b === 255 ? '#ffffff' : '#000000';
  return `#${parsed.toHex().toLowerCase()}`;
}
export const isMonochromePaint = (value: string | undefined): boolean => value === undefined || value === 'none' || value === '#000000' || value === '#ffffff';
