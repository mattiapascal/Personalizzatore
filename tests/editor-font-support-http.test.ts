import { it, expect } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer, type ViteDevServer } from 'vite';
import { localEditorAdminPlugin } from '../scripts/local-editor-admin';
import { localStorageTrialGuard } from '../scripts/local-storage-trial';
import { EditorAdminSqlite } from '../scripts/editor-admin-sqlite';
import { DEFAULT_ADMIN_SETTINGS, type AdminState } from '../src/editor-admin/schema';
import { fontIssueSelectionFixture } from './helpers/font-issue-selection';

it('API HTTP reale: analisi autorizzata nella copia SQLite in sola lettura, limiti, conflitti e scritture bloccate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'font-support-http-')), file = join(root, 'archive.sqlite'); let server: ViteDevServer | undefined;
  try {
    const date = '2026-11-13T00:00:00.000Z', fonts = fontIssueSelectionFixture().fontAssets!.map(({ label, ...asset }) => ({ ...asset, id: asset.id.slice(5), title: asset.family, notes: '', archived: false, createdAt: date, updatedAt: date }));
    const state: AdminState = { schemaVersion: 1, revision: 4, settings: DEFAULT_ADMIN_SETTINGS, records: [], fonts };
    const database = await EditorAdminSqlite.create(file, state); database.close(); const original = await readFile(file);
    server = await createServer({ configFile: false, cacheDir: join(root, 'vite'), server: { host: '127.0.0.1', port: 0, watch: null }, plugins: [localStorageTrialGuard(), localEditorAdminPlugin(root, { kind: 'sqlite-copy', file, readOnly: true })] });
    await server.listen(); const address = server.httpServer!.address(); if (!address || typeof address === 'string') throw Error('Porta TEST'); const origin = `http://127.0.0.1:${address.port}`;
    const body = { schemaVersion: 1, expectedRevision: 4, fontIds: fonts.map(font => font.id), characters: ['Ω'] }, headers = { 'Content-Type': 'application/json', 'X-Editor-Local': '1' };
    const post = (value: unknown, extra:Record<string,string> = headers) => fetch(origin + '/__editor-local/admin/font-support', { method: 'POST', headers: extra, body: JSON.stringify(value) });
    expect((await post(body, { 'Content-Type': 'application/json' } as typeof headers)).status).toBe(403);
    expect((await post(body, { ...headers, Origin: 'https://external.invalid' })).status).toBe(403);
    expect((await post(body, { ...headers, 'X-Editor-Archive-Id': 'wrong' })).status).toBe(409);
    const response = await post(body); expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).results.map((row: { status: string }) => row.status)).toEqual(['unsupported', 'supported']);
    expect((await post({ ...body, expectedRevision: 3 })).status).toBe(409);
    expect((await post({ ...body, characters: ['Ω', 'Ω'] })).status).toBe(422);
    expect((await post({ ...body, extra: 'a'.repeat(9000) })).status).toBe(422);
    const write = await fetch(origin + '/__editor-local/admin/', { method: 'POST', headers, body: JSON.stringify({ tool: 'settings', expectedRevision: 4, arguments: { ...DEFAULT_ADMIN_SETTINGS, editorName: 'Non salvare' } }) }); expect(write.status).toBe(403);
    const snapshot = await fetch(origin + '/__editor-local/admin/', { headers: { 'X-Editor-Local': '1' } }); expect((await snapshot.json()).revision).toBe(4); expect(await readFile(file)).toEqual(original);
  } finally { await server?.close(); await rm(root, { recursive: true, force: true }); }
}, 20000);
