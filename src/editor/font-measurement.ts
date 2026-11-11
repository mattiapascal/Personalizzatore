import { canonicalFontFamily, isFontAvailable, registeredFontAsset } from './fonts';
import { peekFontCoverage } from './font-coverage-cache';
import { hasUnicode } from './font-cmap';
import type { TextObject } from './text-style';
import { UnverifiedTextGeometryError } from './unverified-text-geometry';
/** No native metric may authorize a file or glyph through browser fallback. */
export function canMeasureFontText(text: string, family: string, weight?: string | number, style?: string): boolean {
  if(typeof family!=='string')return false;
  const id = canonicalFontFamily(family) ?? family;
  if (weight !== undefined && !['normal', '400'].includes(String(weight)) || style !== undefined && style !== 'normal' || !isFontAvailable(id)) return false;
  const asset = registeredFontAsset(id), ranges = asset && peekFontCoverage(asset);
  if (!ranges) return false;
  return Array.from(text).every(character => /[\n\p{Cf}\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u.test(character) || hasUnicode(ranges, character.codePointAt(0)!) || Array.from(character.normalize('NFD')).every(part => hasUnicode(ranges, part.codePointAt(0)!)));
}
export function textGeometryVerified(object: TextObject): boolean {
  const chars = Array.from(object.text);
  if(!chars.length)return canMeasureFontText('',object.fontFamily,object.fontWeight,object.fontStyle);
  return chars.every((character, index) => {
    const style = object.characterStyles?.find(run => run.start <= index && run.end > index)?.style;
    return canMeasureFontText(character, style?.fontFamily ?? object.fontFamily, style?.fontWeight ?? object.fontWeight, style?.fontStyle ?? object.fontStyle);
  });
}
export function assertTextGeometry(object: TextObject): void {
  if (!textGeometryVerified(object)) throw new UnverifiedTextGeometryError(`${object.id}: ingombro del testo non verificabile. Correggi i font prima di misurare o trasformare la grafica.`);
}
