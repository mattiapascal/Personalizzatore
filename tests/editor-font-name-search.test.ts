import { expect, it } from 'vitest';
import { fontNameMatches } from '../src/editor/font-name-search';
it('ricerca per parole del nome, senza dipendere da maiuscole, ordine e accenti', () => {
  expect(fontNameMatches('Crème Sans 2', 'SANS creme')).toBe(true);
  expect(fontNameMatches('Crème Sans 2', 'sans 3')).toBe(false);
  expect(fontNameMatches('Times New Roman', 'roman times')).toBe(true);
  expect(fontNameMatches('Arimo', 'rim')).toBe(true);
  expect(fontNameMatches('Arimo', 'tinos')).toBe(false);
});
it('ricerca vuota e separatori non escludono nomi e le query non sono espressioni regolari', () => {
  for (const query of ['', '   ', '.*']) expect(fontNameMatches('Cousine', query)).toBe(true);
  expect(fontNameMatches('Font-Nome TEST 12', 'nome/test 12')).toBe(true);
  expect(fontNameMatches('Font TEST 12', '12 13')).toBe(false);
});
