import { EDITOR_LIMITS,TEST_MIN_FONT_SIZE_PT } from './limits';
import { objectCenter, placeObjectAtCenter, type Measure } from './model';
import type { TextObject } from './text-style';
export function textHeightLimits(object: TextObject, heightMm: number) {
  const fonts = [object.fontSizePt, ...(object.characterStyles ?? []).map(run => run.style.fontSizePt ?? object.fontSizePt)], scaleX = object.textScaleX ?? 1, naturalHeight = heightMm / (object.textScaleY ?? 1);
  const spacings = [object.letterSpacingPt ?? 0, ...(object.characterStyles ?? []).map(run => run.style.kerningPt ?? 0)], spacingScale = Math.min(Infinity, ...spacings.filter(value => value !== 0).map(value => value > 0 ? EDITOR_LIMITS.maxTrackingPt / value : EDITOR_LIMITS.minTrackingPt / value));
  return { min: naturalHeight * Math.max(TEST_MIN_FONT_SIZE_PT / Math.min(...fonts), scaleX / 10), max: naturalHeight * Math.min(EDITOR_LIMITS.maxFontSizePt / Math.max(...fonts), scaleX / .1, spacingScale) };
}
/** Change font sizes, preserving horizontal width, line breaks and all text. */
export function resizeTextHeight(object: TextObject, heightMm: number, measure: Measure): TextObject {
  const size = measure(object), limits = textHeightLimits(object, size.heightMm);
  if (!Number.isFinite(heightMm) || heightMm < limits.min - 1e-8 || heightMm > limits.max + 1e-8) throw new Error('Altezza fuori dai limiti di corpo/dilatazione del profilo TEST');
  const factor = heightMm / size.heightMm * (object.textScaleY ?? 1), next = { ...object, fontSizePt: object.fontSizePt * factor, textScaleX: (object.textScaleX ?? 1) / factor, textScaleY: 1,
    ...(object.letterSpacingPt === undefined ? {} : { letterSpacingPt: object.letterSpacingPt * factor }),
    ...(object.textBox ? { textBox: { ...object.textBox, heightMm } } : {}),
    ...(object.characterStyles ? { characterStyles: object.characterStyles.map(run => ({ ...run, style: { ...run.style, ...(run.style.fontSizePt === undefined ? {} : { fontSizePt: run.style.fontSizePt * factor }), ...(run.style.kerningPt === undefined ? {} : { kerningPt: run.style.kerningPt * factor }) } })) } : {}) };
  return placeObjectAtCenter(next, objectCenter(object, measure), measure) as TextObject;
}
