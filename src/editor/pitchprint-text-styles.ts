import {pitchprintTextStroke} from './pitchprint-text-stroke';
import type { IText } from 'fabric';
import { CharacterStyleSchema, type CharacterStyle } from './model';
import { compressStyles } from './text-style';
import { canonicalPaint } from './paint';
import { pitchprintNumber } from './pitchprint-units';
import { pitchprintFontRequest, type PitchprintFontRequest } from './pitchprint-fonts';
import type { FontAsset } from './font-assets';
import { renderFontFamily } from './fonts';
import { EDITOR_LIMITS } from './limits';
import { inactivePitchprintStylePosition } from './pitchprint-style-position';

type Raw = Record<string, unknown>;
const isRecord = (value: unknown): value is Raw => !!value && typeof value === 'object' && !Array.isArray(value);
const keys = new Set(['fontFamily', 'fontWeight', 'fontStyle', 'fontSize', 'fill', 'underline', 'linethrough', 'overline', 'stroke', 'strokeWidth', 'deltaY', 'textBackgroundColor', 'textAlign']);
function decoration(value: unknown, key: string): boolean {
  if (typeof value === 'boolean') return value;
  if (value === key) return true;
  if (value === '') return false;
  throw Error(`Decorazione «${key}» non riconosciuta.`);
}
function checkAppearance(style: Raw, alignment: unknown): void {
  if (style.deltaY !== undefined && pitchprintNumber(style.deltaY, 'Scostamento carattere') !== 0) throw Error('Scostamento verticale dei caratteri da convertire.');
  if (style.textBackgroundColor != null && canonicalPaint(style.textBackgroundColor) !== 'none') throw Error('Sfondo dei caratteri da convertire.');
  if (style.textAlign !== undefined && style.textAlign !== alignment) throw Error('Allineamento locale dei caratteri differente dal box: richiede revisione.');
}

/** Fabric 3 indices are code points within explicit lines. Validate all entries
 * before resolving fonts, so invalid indices cannot become a partial import. A style at the exact
 * end of a nonempty line is insertion metadata: Fabric 3 never paints/measures it.
 * Bounded detached hard-line rows are likewise inactive in verified 3.4.0 Textboxes. */
export async function pitchprintTextStyles(item: Raw, axisY: number, monochrome: boolean, resolve: (request: PitchprintFontRequest) => Promise<FontAsset>) {
  if (typeof item.text !== 'string' || Array.from(item.text).length > EDITOR_LIMITS.textCharacters) throw Error('Testo PitchPrint oltre i limiti del laboratorio.');
  checkAppearance(item, item.textAlign);
  pitchprintTextStroke(item, axisY, monochrome);
  let ignoredInsertionStyles = 0, ignoredDetachedStyles = 0;
  const nativeStyles: IText['styles'] = {}, characters: CharacterStyle[] = Array.from(item.text, () => ({}));
  const raw = item.styles;
  if (raw == null) return { nativeStyles, characterStyles: compressStyles(characters), ignoredInsertionStyles, ignoredDetachedStyles };
  if (!isRecord(raw)) throw Error('Struttura degli stili dei caratteri non riconosciuta.');
  const lines = item.text.split('\n').map(line => Array.from(line)), entries: { line: number; column: number; index: number; style: Raw }[] = [];
  let offset = 0; const offsets = lines.map(line => { const start = offset; offset += line.length + 1; return start; });
  for (const [row, rawLine] of Object.entries(raw)) {
    if (!/^(0|[1-9]\d*)$/.test(row) || !isRecord(rawLine)) throw Error('Riga degli stili non valida.');
    const line = Number(row);
    for (const [col, style] of Object.entries(rawLine)) {
      if (!isRecord(style)) throw Error('Stile del carattere non valido.');
      if (!Object.keys(style).length) continue;
      const inactive=inactivePitchprintStylePosition(item,lines,row,col);
      if (!inactive&&(!/^(0|[1-9]\d*)$/.test(col) || !lines[line] || Number(col) > lines[line]!.length || !lines[line]!.length)) throw Error('Indice degli stili fuori dal testo sorgente.');
      for (const key of Object.keys(style)) if (!keys.has(key)) throw Error(`Proprietà del carattere «${key}» da convertire.`);
      if (inactive==='detached') { ignoredDetachedStyles++; continue; }
      if (inactive==='insertion') { ignoredInsertionStyles++; continue; }
      checkAppearance(style, item.textAlign ?? 'left');
      pitchprintTextStroke({...item,...style},axisY,monochrome);
      entries.push({ line, column: Number(col), index: offsets[line]! + Number(col), style });
    }
  }
  // Fabric 7 combines graphemes; the canonical editor currently indexes code
  // points. Refuse ambiguous styled clusters rather than moving a style.
  if (entries.length && typeof Intl.Segmenter !== 'undefined') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    if (lines.some(line => [...segmenter.segment(line.join(''))].length !== line.length)) throw Error('Stili su sequenze Unicode composte: indici da convertire senza spostare i caratteri.');
  }
  for (const { line, column, index, style } of entries) {
    const canonical: CharacterStyle = {}, native: IText['styles'][number][number] = {};
    if (['fontFamily', 'fontWeight', 'fontStyle'].some(key => style[key] !== undefined)) {
      const asset = await resolve(pitchprintFontRequest({ ...item, ...style }));
      canonical.fontFamily = asset.id; canonical.fontWeight = canonical.fontStyle = 'normal';
      native.fontFamily = renderFontFamily(asset.id); native.fontWeight = native.fontStyle = 'normal';
    }
    if (style.fontSize !== undefined) { native.fontSize = pitchprintNumber(style.fontSize, 'Corpo carattere'); canonical.fontSizePt = native.fontSize * axisY * 72 / 25.4; }
    if (style.fill !== undefined) {
      const fill = canonicalPaint(style.fill, monochrome); if (fill === 'none') throw Error('Carattere senza riempimento non convertibile.');
      canonical.fill = native.fill = fill;
    }
    if (style.stroke !== undefined || style.strokeWidth !== undefined) {
      const outline=pitchprintTextStroke({...item,...style},axisY,monochrome);
      if(style.stroke!==undefined){canonical.stroke=outline.stroke;canonical.strokeOpacity=outline.opacity;native.stroke=outline.native.stroke;}
      if(style.strokeWidth!==undefined){canonical.strokeMm=outline.width*axisY;native.strokeWidth=outline.width;}
    }
    for (const key of ['underline', 'linethrough', 'overline'] as const) if (style[key] !== undefined) canonical[key] = native[key] = decoration(style[key], key);
    characters[index] = CharacterStyleSchema.parse(canonical); (nativeStyles[line] ??= {})[column] = native;
  }
  return { nativeStyles, characterStyles: compressStyles(characters), ignoredInsertionStyles, ignoredDetachedStyles };
}
