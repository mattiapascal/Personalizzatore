import { it, expect } from 'vitest';
import { fontProblemSegments } from '../src/editor/font-problem-text';
import type { TextObject } from '../src/editor/text-style';
import type { FontIssue } from '../src/editor/font-preflight';

const object: TextObject = { id: 'text', type: 'text', text: 'ABC Ω · Ω', xMm: 1, yMm: 1, fontSizePt: 12, fontFamily: 'problem-font', fill: '#000000', characterStyles: [{ start: 8, end: 9, style: { fontFamily: 'correct-font' } }] };
const issue: FontIssue = { objectId: 'text', fontId: 'problem-font', fontLabel: 'TEST', kind: 'missing-characters', characters: ['Ω'] };
const selected = (source: TextObject, issues = [issue]) => fontProblemSegments(source, issues).filter(segment => segment.problem);
it('segna solo il carattere assente nel file interessato; lo stesso simbolo in un font corretto resta intatto', () => {
  const before = structuredClone(object), segments = fontProblemSegments(object, [issue]);
  expect(selected(object)).toEqual([{ text: 'Ω', start: 4, end: 5, problem: true }]); expect(segments.map(segment => segment.text).join('')).toBe(object.text); expect(object).toEqual(before);
});
it('non BMP, righe e indici per codepoint conservati; nessuna segmentazione UTF16 della coppia', () => {
  const source = { ...object, text: 'A😀\nΩ', characterStyles: undefined };
  expect(selected(source, [{ ...issue, characters: ['😀'] }])).toEqual([{ text: '😀', start: 1, end: 2, problem: true }]); expect(fontProblemSegments(source, [issue]).map(segment => segment.text).join('')).toBe(source.text);
});
it('accento decomposto: evidenzia il carattere originale completo con il medesimo NFC del preflight', () => {
  const source = { ...object, text: 'e\u0301 OK', characterStyles: undefined };
  expect(selected(source, [{ ...issue, characters: ['é'] }])).toEqual([{ text: 'e\u0301', start: 0, end: 2, problem: true }]);
});
it('i confini tra file differenti impediscono di attribuire un accento composto al font sbagliato', () => {
  const source = { ...object, text: 'e\u0301', characterStyles: [{ start: 1, end: 2, style: { fontFamily: 'other-font' } }] };
  expect(selected(source, [{ ...issue, characters: ['é'] }])).toEqual([]);
  expect(selected(source, [{ ...issue, fontId: 'other-font', characters: ['\u0301'] }])).toEqual([{ text: '\u0301', start: 1, end: 2, problem: true }]);
});
it('stile simulato: rosso solo dove grassetto/corsivo sono davvero impostati, senza colpire gli altri caratteri della famiglia', () => {
  const source = { ...object, text: 'ABCD', characterStyles: [{ start: 1, end: 2, style: { fontWeight: 'bold' as const } }, { start: 2, end: 3, style: { fontStyle: 'italic' as const } }] };
  expect(selected(source, [{ ...issue, kind: 'synthetic-style' }])).toEqual([{ text: 'BC', start: 1, end: 3, problem: true }]);
});
it('copertura sconosciuta o file non incorporato: si indica il tratto da verificare, soltanto nel file interessato', () => {
  for (const kind of ['unknown-coverage', 'unembedded-font'] as const) expect(selected(object, [{ ...issue, kind }])).toEqual([{ text: 'ABC Ω · ', start: 0, end: 8, problem: true }]);
});
it('nessun problema o altro oggetto: niente evidenziazione; più segnalazioni si uniscono senza duplicare contenuti', () => {
  expect(selected(object, [])).toEqual([]); expect(selected(object, [{ ...issue, objectId: 'other' }])).toEqual([]);
  expect(selected(object, [issue, issue])).toEqual(selected(object)); expect(fontProblemSegments({ ...object, text: '' }, [issue])).toEqual([]);
});
