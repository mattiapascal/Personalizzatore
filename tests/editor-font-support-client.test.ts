import { it, expect } from 'vitest';
import { findSupportingFonts, type FontSupportProgress } from '../src/editor/font-support-client';
import { fontIssueSelectionFixture } from './helpers/font-issue-selection';
import { fontCoverage } from '../scripts/font-coverage';
import { DEFAULT_ADMIN_SETTINGS, type AdminSnapshot } from '../src/editor-admin/schema';
import type { FontSupportRequest } from '../src/editor/font-support';

const assets = fontIssueSelectionFixture().fontAssets!;
const snapshot: AdminSnapshot = { schemaVersion: 1, revision: 4, settings: DEFAULT_ADMIN_SETTINGS, records: [], fonts: [] };
const font = (index: number) => ({ id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`, title: `Font ${index}`, family: 'TEST', archived: false, notes: '', format: 'ttf' as const, createdAt: '2026-11-13T00:00:00.000Z', updatedAt: '2026-11-13T00:00:00.000Z' });
it('font del documento dai byte: pubblicazione progressiva, nessuna richiesta ai file della libreria o modifica degli asset', async () => {
  const before = structuredClone(assets), progress: FontSupportProgress[] = [];
  const result = await findSupportingFonts(assets, ['Ω'], value => progress.push(value), new AbortController().signal, { snapshot: async () => snapshot, coverage: async asset => fontCoverage(Buffer.from(asset.dataBase64, 'base64'), asset.format), batch: async () => { throw Error('Non deve interrogare la libreria vuota'); } });
  expect(result).toMatchObject({ checked: 2, total: 2, unknown: 0, complete: true, candidates: [{ source: 'document', asset: assets[1] }] }); expect(progress.map(value => value.checked)).toEqual([0, 1, 2, 2]); expect(progress[0]!.candidates).toEqual([]); expect(assets).toEqual(before);
});
it('lotti di otto file, esclude archiviati e ID già incorporati; sconosciuto separato da incompatibile', async () => {
  const fonts = Array.from({ length: 11 }, (_, i) => font(i)), calls: FontSupportRequest[] = [];
  fonts.push({ ...font(99), archived: true }, { ...font(98), id: assets[0]!.id.slice(5) });
  const result = await findSupportingFonts(assets.slice(0, 1), ['Ω', 'Ω'], () => {}, new AbortController().signal, { snapshot: async () => ({ ...snapshot, fonts }), coverage: async () => undefined, batch: async request => { calls.push(request); return { schemaVersion: 1, revision: 4, results: request.fontIds.map((id, i) => ({ id, status: i === 0 ? 'unknown' as const : 'supported' as const, missing: [], fileHash: 'a'.repeat(64) })) }; } });
  expect(calls.map(call => call.fontIds.length)).toEqual([8, 3]); expect(calls[0]!.characters).toEqual(['Ω']); expect(result).toMatchObject({ checked: 12, total: 12, unknown: 3, complete: true }); expect(result.candidates).toHaveLength(9);
});
it('interruzione durante una risposta lenta: niente progressi, risultati o richieste successive tardivi', async () => {
  const controller = new AbortController(), progress: FontSupportProgress[] = []; let requests = 0;
  await expect(findSupportingFonts([], ['Ω'], value => progress.push(value), controller.signal, { snapshot: async () => ({ ...snapshot, fonts: [font(1), font(2)] }), coverage: async () => undefined, batch: async request => { requests++; controller.abort(); return { schemaVersion: 1, revision: 4, results: request.fontIds.map(id => ({ id, status: 'supported' as const, missing: [], fileHash: 'a'.repeat(64) })) }; } })).rejects.toThrow();
  expect(requests).toBe(1); expect(progress).toHaveLength(1); expect(progress[0]!.candidates).toEqual([]);
});
it('revisioni e ID incoerenti, risposte senza hash e troppi caratteri non diventano prove utilizzabili', async () => {
  const access = { snapshot: async () => ({ ...snapshot, fonts: [font(1)] }), coverage: async () => undefined };
  for (const result of [{ schemaVersion: 1 as const, revision: 5, results: [] }, { schemaVersion: 1 as const, revision: 4, results: [{ id: font(2).id, status: 'supported' as const, missing: [] }] }, { schemaVersion: 1 as const, revision: 4, results: [{ id: font(1).id, status: 'supported' as const, missing: [] }] }]) await expect(findSupportingFonts([], ['Ω'], () => {}, new AbortController().signal, { ...access, batch: async () => result })).rejects.toThrow();
  await expect(findSupportingFonts([], Array.from({ length: 65 }, (_, i) => String.fromCodePoint(0x400 + i)), () => {}, new AbortController().signal, { ...access, batch: async () => { throw Error('Non richiesto'); } })).rejects.toThrow('64');
});
