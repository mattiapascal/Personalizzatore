import type { FontIssue } from './font-preflight';
import { characterStyles, type TextObject } from './text-style';

export interface FontProblemSegment { text: string; start: number; end: number; problem: boolean; }
/** Source character positions only. Never derives positions or metrics on canvas. */
export function fontProblemSegments(object: TextObject, issues: readonly FontIssue[]): FontProblemSegment[] {
  const characters = Array.from(object.text), styles = characterStyles(object), marked = characters.map(() => false);
  const font = (index: number) => styles[index]?.fontFamily ?? object.fontFamily;
  const synthetic = (index: number) => (styles[index]?.fontWeight ?? object.fontWeight) === 'bold' || (styles[index]?.fontStyle ?? object.fontStyle) === 'italic';
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const issue of issues) {
    if (issue.objectId !== object.id) continue;
    if (issue.kind !== 'missing-characters') {
      characters.forEach((_character, index) => { if (font(index) === issue.fontId && (issue.kind !== 'synthetic-style' || synthetic(index))) marked[index] = true; });
      continue;
    }
    const missing = new Set(issue.characters);
    // Match the normalization of preflight without splitting an accented
    // character or a surrogate pair in the original text.
    for (let start = 0; start < characters.length;) {
      let end = start + 1;
      while (end < characters.length && font(end) === font(start) && synthetic(end) === synthetic(start)) end++;
      if (font(start) === issue.fontId) {
        let offset = start;
        for (const { segment } of segmenter.segment(characters.slice(start, end).join(''))) {
          const length = Array.from(segment).length;
          if (Array.from(segment.normalize('NFC')).some(character => missing.has(character))) for (let index = offset; index < offset + length; index++) marked[index] = true;
          offset += length;
        }
      }
      start = end;
    }
  }
  const result: FontProblemSegment[] = [];
  characters.forEach((text, index) => {
    const previous = result.at(-1), problem = marked[index]!;
    if (previous?.problem === problem) { previous.text += text; previous.end++; }
    else result.push({ text, start: index, end: index + 1, problem });
  });
  return result;
}
