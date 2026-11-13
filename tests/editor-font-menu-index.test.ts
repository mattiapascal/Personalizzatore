import { it, expect, afterEach } from 'vitest';
import { setFontMenuEntries, setFontVisibility, fontMenuFamilyChoices, fontMenuLabel, isFontAvailable, fontChoices, defaultLibraryFont, assertFontAvailable, fontCatalogVersion } from '../src/editor/fonts';
const normal = 'font-11111111-1111-4111-8111-111111111111', bold = 'font-22222222-2222-4222-8222-222222222222', second = 'font-33333333-3333-4333-8333-333333333333';
afterEach(() => { setFontMenuEntries([]); setFontVisibility([]); });
it('indice dei soli nomi completo e ordinato, una famiglia per voce, senza caricare o rendere disponibili file', () => {
  setFontVisibility([normal, bold, second]); setFontMenuEntries([{ id: bold, family: 'Zulu', weight: 700, italic: false }, { id: normal, family: 'Zulu', weight: 400, italic: false }, { id: second, family: 'Arimo', weight: 400, italic: false }]);
  expect(fontMenuFamilyChoices()).toEqual([second, normal]); expect(fontMenuLabel(normal)).toBe('Zulu'); expect(fontChoices()).toEqual([]); expect(defaultLibraryFont()).toBeUndefined(); expect(isFontAvailable(normal)).toBe(false); expect(() => assertFontAvailable(normal)).toThrow('non incorporato');
});
it('metadati di un file fuori dallo scope non rientrano nel menu; eliminazione e archivio possono togliere una voce', () => {
  setFontVisibility([normal]); setFontMenuEntries([{ id: normal, family: 'Arimo', weight: 400, italic: false }, { id: second, family: 'Altra', weight: 400, italic: false }]);
  expect(fontMenuFamilyChoices()).toEqual([normal]); setFontVisibility([]); expect(fontMenuFamilyChoices()).toEqual([]);
});
it('copia dei metadati e aggiornamenti identici non producono notifiche continue o mutazioni indirette', () => {
  const entries = [{ id: normal, family: 'Arimo', weight: 400, italic: false }]; setFontVisibility([normal]); setFontMenuEntries(entries); const version = fontCatalogVersion();
  setFontMenuEntries(structuredClone(entries)); expect(fontCatalogVersion()).toBe(version); entries[0]!.family = 'Mutato fuori'; expect(fontMenuLabel(normal)).toBe('Arimo');
});
