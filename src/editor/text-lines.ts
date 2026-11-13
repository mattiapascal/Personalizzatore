import type { TextAlignment } from './model';
import type { TextObject } from './text-style';
export interface VisualTextLine { start: number; end: number; }
export interface LineSelection { lines: VisualTextLine[]; indices: number[]; value: TextAlignment; mixed: boolean; }
export function lineAlignments(object: TextObject): (TextAlignment | undefined)[] {
  const values: (TextAlignment | undefined)[] = Array(Array.from(object.text).length + 1);
  for (const run of object.lineStyles ?? []) { if (run.start === run.end) values[run.start] = run.alignment; else for (let i = run.start; i < run.end; i++) values[i] = run.alignment; }
  return values;
}
export function compressLineAlignments(values: readonly (TextAlignment | undefined)[], length: number, emptyLastLine = false): NonNullable<TextObject['lineStyles']> {
  const runs: NonNullable<TextObject['lineStyles']> = [];
  for (let start = 0; start < length;) { const alignment = values[start]; let end = start + 1; while (end < length && values[end] === alignment) end++; if (alignment) runs.push({ start, end, alignment }); start = end; }
  if (emptyLastLine && values[length]) runs.push({ start: length, end: length, alignment: values[length]! }); return runs;
}
export function lineSelection(object: TextObject, lines: VisualTextLine[], start: number, end: number): LineSelection {
  const values = lineAlignments(object), last = Math.max(start, end - 1), indices = lines.flatMap((line, index) => (start === end ? start >= line.start && (start < line.end || index === lines.length - 1 && start <= line.end) : line.start <= last && line.end > start) ? [index] : []);
  const alignments = indices.map(index => values[lines[index]!.start] ?? object.textAlign ?? 'left');
  return { lines, indices, value: alignments[0] ?? object.textAlign ?? 'left', mixed: new Set(alignments).size > 1 };
}
export function applyLineAlignment(object: TextObject, alignment: TextAlignment, scope: LineSelection, frame: { widthMm: number; heightMm: number }): TextObject {
  if (!scope.indices.length) throw new Error('Seleziona una riga del testo');
  const values = lineAlignments(object);
  for (const index of scope.indices) { const line = scope.lines[index]; if (!line || line.start < 0 || line.end > Array.from(object.text).length || line.end < line.start) throw new Error('Riga non valida'); if (line.start === line.end) values[line.start] = alignment; else for (let i = line.start; i < line.end; i++) values[i] = alignment; }
  const next = { ...object, lineStyles: compressLineAlignments(values, Array.from(object.text).length, object.text.endsWith('\n')) };
  if (alignment === 'justify-left' && (object.textBox?.autoWidth ?? true) && object.justification?.distribution!=='word-space') next.textBox = { ...frame, autoWidth: false, autoHeight: true }; return next;
}

/** Replacing a form field keeps paragraph alignment without carrying stale character offsets. */
export function replacementLineStyles(object: TextObject, text: string): TextObject['lineStyles'] {
  if (!object.lineStyles?.length) return undefined;
  const old = lineAlignments(object), alignments: (TextAlignment | undefined)[] = [];
  let offset = 0;
  for (const line of object.text.split('\n')) { alignments.push(old[offset]); offset += Array.from(line).length + 1; }
  const values: (TextAlignment | undefined)[] = []; offset = 0;
  text.split('\n').forEach((line, index) => { const length = Array.from(line).length; for (let i = 0; i <= length; i++) values[offset + i] = alignments[index]; offset += length + 1; });
  return compressLineAlignments(values, Array.from(text).length, text.endsWith('\n'));
}
