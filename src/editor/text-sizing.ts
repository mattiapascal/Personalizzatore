import { scaleTextClipMasks } from './text-clip-masks';
import { EDITOR_LIMITS } from './limits';
import { objectCenter, placeObjectAtCenter, type Measure } from './model';
import type { TextObject } from './text-style';
export function textHeightLimits(object: TextObject, heightMm: number) {
  const fonts = [object.fontSizePt, ...(object.characterStyles ?? []).map(run => run.style.fontSizePt ?? object.fontSizePt)], scaleX = object.textScaleX ?? 1, naturalHeight = heightMm / (object.textScaleY ?? 1);
  const strokes = [object.strokeMm ?? 0, ...(object.characterStyles ?? []).map(run => run.style.strokeMm ?? 0)], strokeScale = Math.min(Infinity, ...strokes.filter(value => value > 0).map(value => EDITOR_LIMITS.maxStrokeMm / value));
  const spacings = [object.letterSpacingPt ?? 0, ...(object.characterStyles ?? []).map(run => run.style.kerningPt ?? 0)], spacingScale = Math.min(Infinity, ...spacings.filter(value => value !== 0).map(value => value > 0 ? EDITOR_LIMITS.maxTrackingPt / value : EDITOR_LIMITS.minTrackingPt / value));
  return { min: naturalHeight * Math.max(EDITOR_LIMITS.minFontSizePt / Math.min(...fonts), scaleX / 10), max: naturalHeight * Math.min(EDITOR_LIMITS.maxFontSizePt / Math.max(...fonts), scaleX / .1, spacingScale, strokeScale) };
}
/** Change font sizes, preserving horizontal width, line breaks and all text. */
export function resizeTextHeight(object: TextObject, heightMm: number, measure: Measure): TextObject {
  const size = measure(object), layoutHeight = size.textLayoutHeightMm ?? size.heightMm, limits = textHeightLimits(object, layoutHeight);
  if (!Number.isFinite(heightMm) || heightMm < limits.min - 1e-8 || heightMm > limits.max + 1e-8) throw new Error('Altezza fuori dai limiti di corpo/dilatazione del laboratorio');
  const factor = heightMm / layoutHeight * (object.textScaleY ?? 1), next = { ...object, fontSizePt: object.fontSizePt * factor, textScaleX: (object.textScaleX ?? 1) / factor, textScaleY: 1,
    ...(object.textClipMasks?{textClipMasks:scaleTextClipMasks(object.textClipMasks,factor)}:{}),
    ...(object.strokeMm === undefined ? {} : { strokeMm: object.strokeMm * factor }),
    ...(object.letterSpacingPt === undefined ? {} : { letterSpacingPt: object.letterSpacingPt * factor }),
    ...(object.textBox ? { textBox: { ...object.textBox, heightMm } } : {}),
    ...(object.characterStyles ? { characterStyles: object.characterStyles.map(run => ({ ...run, style: { ...run.style, ...(run.style.strokeMm === undefined ? {} : { strokeMm: run.style.strokeMm * factor }), ...(run.style.fontSizePt === undefined ? {} : { fontSizePt: run.style.fontSizePt * factor }), ...(run.style.kerningPt === undefined ? {} : { kerningPt: run.style.kerningPt * factor }) } })) } : {}) };
  return placeObjectAtCenter(next, objectCenter(object, measure), measure) as TextObject;
}
