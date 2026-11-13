import { z } from 'zod';
import { hasUnicode, type UnicodeRange } from './font-cmap';

export const FONT_SUPPORT_BATCH_SIZE = 8;
export const FONT_SUPPORT_MAX_CHARACTERS = 64;
const character = z.string().refine(value => Array.from(value).length === 1 && !/\p{Cs}/u.test(value), 'Scegli un singolo carattere Unicode valido');
export const FontSupportCharactersSchema = z.array(character).min(1).max(FONT_SUPPORT_MAX_CHARACTERS);
export const FontSupportRequestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  expectedRevision: z.number().int().nonnegative(),
  fontIds: z.array(z.string().uuid()).min(1).max(FONT_SUPPORT_BATCH_SIZE),
  characters: FontSupportCharactersSchema,
}).refine(value => new Set(value.fontIds).size === value.fontIds.length && new Set(value.characters).size === value.characters.length, 'ID e caratteri devono essere unici');
export const FontSupportResultSchema = z.strictObject({
  schemaVersion: z.literal(1), revision: z.number().int().nonnegative(),
  results: z.array(z.strictObject({
    id: z.string().uuid(), status: z.enum(['supported', 'unsupported', 'unknown']),
    fileHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    missing: z.array(character).max(FONT_SUPPORT_MAX_CHARACTERS),
  })).max(FONT_SUPPORT_BATCH_SIZE),
});
export type FontSupportRequest = z.infer<typeof FontSupportRequestSchema>;
export type FontSupportResult = z.infer<typeof FontSupportResultSchema>;
/** Same exact-file Unicode rule as preflight, including decomposed accents. */
export function fontSupportsCharacter(ranges: readonly UnicodeRange[], value: string): boolean {
  return hasUnicode(ranges, value.codePointAt(0)!) || Array.from(value.normalize('NFD')).every(part => hasUnicode(ranges, part.codePointAt(0)!));
}
