import { z } from 'zod';

// Solo memoria della conversazione: mai localStorage o cache catalogo.
export const ContentBriefSchema = z.strictObject({
  text: z.string().trim().min(1).max(480).optional(),
  kind: z.enum(['text', 'graphic', 'mixed']).optional(),
  purpose: z.enum(['business', 'exlibris', 'loyalty', 'general']).optional(),
  graphicSubject: z.string().trim().min(1).max(300).optional(),
});
export type ContentBrief = z.infer<typeof ContentBriefSchema>;
export function estimateTextArea(text: string, measureWidthMm: (line: string, fontPt: number) => number) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length || lines.length > 30) return null;
  const at = (pt: number) => ({ width: Math.ceil((Math.max(...lines.map(line => measureWidthMm(line, pt))) + 2) * 2) / 2, height: Math.ceil((lines.length * pt * 25.4 / 72 * 1.2 + 2) * 2) / 2 });
  const small = at(7), large = at(9);
  if (![small.width, small.height, large.width, large.height].every(n => Number.isFinite(n) && n > 0 && n <= 1000)) return null;
  return { lines: lines.length, small, large };
}
