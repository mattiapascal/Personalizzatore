import { CharacterStyleSchema, type CharacterStyle, type SceneObject } from './model';

export type TextObject = Extract<SceneObject, { type: 'text' }>;
export interface CharacterSelection { start: number; end: number; style: CharacterStyle; mixed: (keyof CharacterStyle)[]; object?: TextObject; spacing?: TextSpacingScope; line?: import('./text-lines').LineSelection; }
export const characterKeys = ['fontSizePt', 'fontFamily', 'fill', 'fillOpacity', 'stroke', 'strokeMm', 'strokeOpacity', 'fontWeight', 'fontStyle', 'underline', 'linethrough', 'overline', 'kerningPt'] as const;
export function baseCharacterStyle(object: TextObject): Required<CharacterStyle> {
  return { stroke: object.stroke ?? 'none', strokeMm: object.strokeMm ?? .25, strokeOpacity: object.strokeOpacity ?? 1, kerningPt: 0, fontSizePt: object.fontSizePt, fontFamily: object.fontFamily, fill: object.fill, fillOpacity: object.fillOpacity ?? 1, fontWeight: object.fontWeight ?? 'normal', fontStyle: object.fontStyle ?? 'normal', underline: object.underline ?? false, linethrough: object.linethrough ?? false, overline: object.overline ?? false };
}
export function characterStyles(object: TextObject): CharacterStyle[] {
  const styles: CharacterStyle[] = Array.from(object.text, () => ({}));
  for (const run of object.characterStyles ?? []) for (let i = run.start; i < Math.min(run.end, styles.length); i++) styles[i] = { ...run.style };
  return styles;
}
export function compressStyles(styles: CharacterStyle[]): NonNullable<TextObject['characterStyles']> {
  const runs: NonNullable<TextObject['characterStyles']> = [];
  styles.forEach((style, index) => {
    const normalized = Object.fromEntries(characterKeys.filter(key => style[key] !== undefined).map(key => [key, style[key]])) as CharacterStyle;
    if (!Object.keys(normalized).length) return;
    const previous = runs.at(-1);
    if (previous?.end === index && JSON.stringify(previous.style) === JSON.stringify(normalized)) previous.end++;
    else runs.push({ start: index, end: index + 1, style: normalized });
  });
  return runs;
}
/** Gli indici contano punti di codice Unicode, inclusi gli a capo, come IText. */
export function applyCharacterStyle(object: TextObject, raw: CharacterStyle, range?: { start: number; end: number }): TextObject {
  const style = CharacterStyleSchema.parse(raw), next = structuredClone(object), styles = characterStyles(next);
  if (range) {
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end <= range.start || range.end > styles.length) throw new Error('Selezione di testo non valida');
    for (let i = range.start; i < range.end; i++) styles[i] = { ...styles[i], ...style };
  } else {
    if (style.kerningPt !== undefined) throw new Error('La crenatura richiede una coppia o una selezione di testo');
    Object.assign(next, style);
    for (const item of styles) for (const key of characterKeys) if (style[key] !== undefined) delete item[key];
  }
  const runs = compressStyles(styles);
  if (runs.length) next.characterStyles = runs; else delete next.characterStyles;
  return next;
}
export interface TextSpacingScope { mode: 'pair' | 'selection'; indices: number[]; value: number; mixed: boolean; base: number; }
export function textSpacingScope(object: TextObject, range: { start: number; end: number }): TextSpacingScope {
  const text = Array.from(object.text), indices: number[] = [], caret = range.start === range.end;
  if (Number.isInteger(range.start) && Number.isInteger(range.end) && range.start >= 0 && range.end >= range.start && range.end <= text.length) {
    for (let i = caret ? range.start - 1 : range.start; i < (caret ? range.end : range.end - 1); i++) if (i >= 0 && i + 1 < text.length && text[i] !== '\n' && text[i + 1] !== '\n') indices.push(i);
  }
  const styles = characterStyles(object), values = indices.map(index => styles[index]?.kerningPt ?? 0);
  return { mode: caret ? 'pair' : 'selection', indices, value: values[0] ?? 0, mixed: values.some(value => value !== values[0]), base: object.letterSpacingPt ?? 0 };
}
export function applyTextKerning(object: TextObject, value: number, range: { start: number; end: number }): TextObject {
  CharacterStyleSchema.parse({ kerningPt: value }); const scope = textSpacingScope(object, range);
  if (!scope.indices.length) throw new Error('Posiziona il cursore tra due caratteri sulla stessa riga o seleziona almeno due caratteri');
  const next = structuredClone(object), styles = characterStyles(next);
  for (const index of scope.indices) { styles[index] = { ...styles[index], kerningPt: value }; if (value === 0) delete styles[index]!.kerningPt; }
  const runs = compressStyles(styles); if (runs.length) next.characterStyles = runs; else delete next.characterStyles;
  return next;
}
export function selectionStyle(object: TextObject, start: number, end: number): CharacterSelection {
  const styles = characterStyles(object), base = baseCharacterStyle(object);
  const effective = styles.slice(start, Math.max(start + 1, end)).map(style => ({ ...base, ...style }));
  const first = effective[0] ?? base;
  const mixed = characterKeys.filter(key => effective.some(style => style[key] !== first[key]));
  return { start, end, style: Object.fromEntries(characterKeys.filter(key => !mixed.includes(key)).map(key => [key, first[key]])), mixed };
}
