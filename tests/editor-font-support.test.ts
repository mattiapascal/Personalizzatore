import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FontSupportRequestSchema, fontSupportsCharacter } from '../src/editor/font-support';
import { FontSupportSearch, type FontSupportAccess } from '../scripts/editor-font-support';
import { fontCoverage } from '../scripts/font-coverage';
import { fontIssueSelectionFixture } from './helpers/font-issue-selection';
import { EditorAdminStore } from '../scripts/editor-admin-store';
import { EditorAdminSqlite } from '../scripts/editor-admin-sqlite';
import { DEFAULT_ADMIN_SETTINGS, type AdminState } from '../src/editor-admin/schema';

const assets = fontIssueSelectionFixture().fontAssets!, ids = assets.map(asset => asset.id.slice(5));
const request = { schemaVersion: 1, expectedRevision: 4, fontIds: ids, characters: ['Ω'] };
function fixture() {
  let revision = 4;
  const reads: string[] = [], index = assets.map((asset, i) => ({ id: ids[i]!, archived: false, format: asset.format }));
  const access: FontSupportAccess = { readFontSearchIndex: async () => ({ revision, fonts: structuredClone(index) }), readFont: async id => { reads.push(id); return assets[ids.indexOf(id)]; } };
  return { access, reads, index, change: () => revision++ };
}
it('file reali: subset WOFF2 senza Ω e TTF con Ω distinti, solo ID richiesti e nessun dato modificato', async () => {
  const f = fixture(), before = structuredClone(assets), search = new FontSupportSearch(), result = await search.batch(f.access, request);
  expect(result.results.map(row => [row.id, row.status, row.missing])).toEqual([[ids[0], 'unsupported', ['Ω']], [ids[1], 'supported', []]]);
  expect(result.results.every(row => /^[a-f0-9]{64}$/.test(row.fileHash!))).toBe(true); expect(f.reads).toEqual(ids); expect(assets).toEqual(before);
});
it('stesso criterio Unicode del preflight: codepoint non BMP e accenti decomposti, senza dichiarare coperto un componente assente', () => {
  expect(fontSupportsCharacter([[0x1f600, 0x1f600]], '😀')).toBe(true);
  expect(fontSupportsCharacter([[0x65, 0x65], [0x301, 0x301]], 'é')).toBe(true);
  expect(fontSupportsCharacter([[0x65, 0x65]], 'é')).toBe(false);
  expect(fontSupportsCharacter([], 'Ω')).toBe(false);
});
it('limiti, surrogate isolate, duplicati e campi extra rifiutati prima di leggere file', async () => {
  const f = fixture(), search = new FontSupportSearch();
  for (const raw of [{ ...request, fontIds: [...ids, ids[0]] }, { ...request, characters: ['Ω', 'Ω'] }, { ...request, characters: ['ab'] }, { ...request, characters: ['\ud800'] }, { ...request, characters: Array.from({ length: 65 }, (_, i) => String.fromCodePoint(0x400 + i)) }, { ...request, fontIds: Array.from({ length: 9 }, (_, i) => `11111111-1111-4111-8111-${String(i).padStart(12, '0')}`) }, { ...request, extra: true }]) await expect(search.batch(f.access, raw)).rejects.toThrow();
  expect(f.reads).toEqual([]); expect(FontSupportRequestSchema.parse({ ...request, characters: ['😀'] }).characters).toEqual(['😀']);
});
it('font archiviati/assenti e revisione obsoleta non diventano risultati parziali verificati', async () => {
  const f = fixture(), search = new FontSupportSearch(); f.index[0]!.archived = true;
  await expect(search.batch(f.access, request)).rejects.toThrow('archiviati'); expect(f.reads).toEqual([]);
  f.index[0]!.archived = false; f.change(); await expect(search.batch(f.access, request)).rejects.toMatchObject({ code: 'revision_conflict' }); expect(f.reads).toEqual([]);
});
it('cambio di archivio durante la lettura invalida l’intero lotto, anche se i byte erano validi', async () => {
  const f = fixture(), read = f.access.readFont; f.access.readFont = async id => { const file = await read(id); f.change(); return file; };
  await expect(new FontSupportSearch().batch(f.access, request)).rejects.toMatchObject({ code: 'revision_conflict' });
});
it('interruzione tra file: nessuna lettura successiva o risultato dichiarato completo', async () => {
  const f = fixture(), controller = new AbortController(), read = f.access.readFont; f.access.readFont = async id => { const file = await read(id); controller.abort(); return file; };
  await expect(new FontSupportSearch().batch(f.access, request, controller.signal)).rejects.toThrow(); expect(f.reads).toEqual([ids[0]]);
});
it('copertura sconosciuta ritentabile; non si conserva un errore come prova universale', async () => {
  const f = fixture(); let attempts = 0;
  const search = new FontSupportSearch((bytes, format) => ++attempts === 1 ? undefined : fontCoverage(bytes, format));
  const raw = { ...request, fontIds: [ids[1]] };
  expect((await search.batch(f.access, raw)).results[0]!.status).toBe('unknown');
  expect((await search.batch(f.access, raw)).results[0]!.status).toBe('supported'); expect(attempts).toBe(2);
});
it('cache dai byte e formato, non da ID/nome; rilegge i file e verifica comunque la revisione', async () => {
  const f = fixture(); let calls = 0;
  const search = new FontSupportSearch((bytes, format) => { calls++; return fontCoverage(bytes, format); });
  await search.batch(f.access, request); await search.batch(f.access, { ...request, characters: ['A'] });
  expect(calls).toBe(2); expect(f.reads).toEqual([...ids, ...ids]);
  const read = f.access.readFont; f.access.readFont = async id => id === ids[0] ? assets[1] : read(id); f.index[0]!.format = assets[1]!.format;
  expect((await search.batch(f.access, { ...request, fontIds: [ids[0]] })).results[0]!.status).toBe('supported'); expect(calls).toBe(2);
});
it('cache limitata: i file espulsi vengono rianalizzati e il risultato non cambia', async () => {
  const f = fixture(); let calls = 0; const search = new FontSupportSearch((bytes, format) => { calls++; return fontCoverage(bytes, format); }, 1);
  const before = await search.batch(f.access, request), after = await search.batch(f.access, request); expect(after).toEqual(before); expect(calls).toBe(4);
});
for (const backend of ['json', 'sqlite'] as const) it(`indice leggero e ricerca ${backend}: archivi separati, soli file richiesti e nessuna scrittura`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'font-support-')), file = join(root, backend === 'json' ? 'state.json' : 'archive.sqlite'); let database: EditorAdminSqlite | undefined;
  try {
    const date = '2026-11-13T00:00:00.000Z', state: AdminState = { schemaVersion: 1, revision: 4, settings: DEFAULT_ADMIN_SETTINGS, records: [], fonts: assets.map(({label,...asset}, i) => ({ ...asset, id: ids[i]!, title: asset.family, notes: '', archived: false, createdAt: date, updatedAt: date })) };
    if (backend === 'json') { await mkdir(root, { recursive: true }); await writeFile(file, JSON.stringify(state)); } else { const db = await EditorAdminSqlite.create(file, state); db.close(); database = EditorAdminSqlite.open(file, true); }
    const original = await readFile(file), store = new EditorAdminStore(root, undefined, undefined, database); database?.resetDiagnostics();
    expect(await store.readFontSearchIndex()).toEqual({ revision: 4, fonts: assets.map((asset, i) => ({ id: ids[i], archived: false, format: asset.format })) });
    if (database) expect(database.diagnostics()).toMatchObject({ resourcesRead: 0, recordsDecoded: 0, fontsDecoded: 0 });
    expect((await new FontSupportSearch().batch(store, { ...request, fontIds: [ids[1]] })).results[0]!.status).toBe('supported');
    if (database) expect(database.diagnostics()).toMatchObject({ resourcesRead: 1, recordsDecoded: 0, fontsDecoded: 1, resourcesWritten: 0 });
    expect(await readFile(file)).toEqual(original); expect((await store.readFontSearchIndex()).revision).toBe(4); store.releaseReadCaches();
  } finally { database?.close(); await rm(root, { recursive: true, force: true }); }
});
