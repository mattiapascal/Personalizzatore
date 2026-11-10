import { z } from 'zod';
const word = z.strictObject({ min: z.number().finite().min(0).max(1000), desired: z.number().finite().min(0).max(1000), max: z.number().finite().min(0).max(1000) }).refine(v => v.min <= v.desired && v.desired <= v.max, 'Minimo ≤ desiderato ≤ massimo per gli spazi tra parole');
const letter = z.strictObject({ min: z.number().finite().min(-100).max(500), desired: z.number().finite().min(-100).max(500), max: z.number().finite().min(-100).max(500) }).refine(v => v.min <= v.desired && v.desired <= v.max, 'Minimo ≤ desiderato ≤ massimo per gli spazi tra lettere');
export const JustificationSchema = z.strictObject({ word, letter });
export type JustificationSettings = z.infer<typeof JustificationSchema>;
export const DEFAULT_JUSTIFICATION: JustificationSettings = { word: { min: 80, desired: 100, max: 133 }, letter: { min: 0, desired: 15, max: 30 } };
/** Percentages use the font's normal space width. Existing tracking/kerning remain in baseWidth. */
export function justifySpacing(baseWidth: number, targetWidth: number, wordUnits: number, letterUnits: number, settings: JustificationSettings = DEFAULT_JUSTIFICATION) {
  if ([baseWidth, targetWidth, wordUnits, letterUnits].some(value => !Number.isFinite(value)) || targetWidth < 0 || wordUnits < 0 || letterUnits < 0) throw new Error('Misure di giustificazione non valide');
  const checked = JustificationSchema.parse(settings), widthAt = (key: 'min' | 'desired' | 'max') => baseWidth + wordUnits * (checked.word[key] - 100) / 100 + letterUnits * checked.letter[key] / 100;
  const minimum = widthAt('min'), desired = widthAt('desired'), maximum = widthAt('max'), target = Math.max(minimum, Math.min(maximum, targetWidth));
  const lower = target <= desired ? 'min' : 'desired', upper = target <= desired ? 'desired' : 'max', lowWidth = widthAt(lower), highWidth = widthAt(upper), fraction = highWidth > lowWidth + 1e-12 ? Math.max(0, Math.min(1, (target - lowWidth) / (highWidth - lowWidth))) : 0;
  const interpolate = (values: JustificationSettings['word']) => values[lower] + (values[upper] - values[lower]) * fraction;
  const wordPercent = interpolate(checked.word), letterPercent = interpolate(checked.letter), width = baseWidth + wordUnits * (wordPercent - 100) / 100 + letterUnits * letterPercent / 100;
  return { wordPercent, letterPercent, width, minimum, desired, maximum, underfull: width < targetWidth - 1e-6, overfull: width > targetWidth + 1e-6 };
}
