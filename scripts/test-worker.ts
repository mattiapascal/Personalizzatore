import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { Miniflare, Response as MFResponse, convertV4MiniflareOptions, type V4FetchHandler } from 'miniflare';
import sources from '../fixtures/products/mount-sources.TEST.json' with { type: 'json' };
import { ArgumentsSchema } from '../server/openai.ts';

// Solo runtime locale e trasporti simulati. Nessuna chiave reale caricata, rete esterna vietata.
const statePath = await mkdtemp(join(tmpdir(), 'assistant-worker-test-'));
const args = Object.fromEntries(Object.keys(ArgumentsSchema.shape).map(key => [key, key === 'clearFields' ? [] : null]));
let calls = 0, catalogCalls = 0, failCatalog = false;
const outbound: V4FetchHandler = async request => {
  const url = new URL(request.url);
  if (url.hostname === 'zqu2eg-72.myshopify.com') {
    catalogCalls++;
    if (failCatalog) return new MFResponse('TEST upstream failure', { status: 503 });
    const input = await request.json() as { variables: { after: string | null } };
    const first = !input.variables.after;
    return MFResponse.json({ data: { products: { nodes: first ? sources.products.slice(0, 5) : sources.products.slice(5), pageInfo: { hasNextPage: first, endCursor: first ? 'TEST-next' : null } } } });
  }
  if (['www.incisoriasacchetti.it', 'incisoriasacchetti.it'].includes(url.hostname)) return new MFResponse('<main><h1>Pagina TEST</h1><details class="cc-accordion-item"><summary>File TEST</summary><div class="cc-accordion-item__content">Informazione TEST sul timbro e sul file.</div></details></main>', { headers: { 'Content-Type': 'text/html' } });
  if (url.hostname === 'challenges.cloudflare.com') return MFResponse.json({ success: (await request.formData()).get('response') !== 'TEST-invalid', hostname: 'assistant.test', action: 'assistant-start' });
  if (url.hostname === 'api.openai.com') {
    calls++;
    const body = await request.text(); assert(!body.includes('cliente@example.test'));
    const payload = JSON.parse(body), user = JSON.parse(payload.input[0].content);
    const offTopic = user.message === 'TEST domanda estranea';
    if (payload.tool_choice.name === 'select_store_evidence') return MFResponse.json({ status: 'completed', output: [{ type: 'function_call', name: 'select_store_evidence', arguments: JSON.stringify({ status: 'answered', passageIds: [user.sources[0].passageId] }) }], usage: { input_tokens: 100, output_tokens: 20 } });
    const info = user.message === 'TEST informazioni prodotti';
    await new Promise(resolve => setTimeout(resolve, 40));
    return MFResponse.json({ status: 'completed', output: [{ type: 'function_call', name: 'collect_requirements', arguments: JSON.stringify({ ...args, family: 'stamp', dialogueAct: info ? 'information' : offTopic ? 'off_topic' : 'answer', storeQuery: info ? 'timbro file' : null, clarification: offTopic ? 'RISPOSTA_GENERALE_TEST' : null, changeIntent: 'update', mechanism: 'automatic', shape: 'square', widthMm: 10, heightMm: 10 }) }], usage: { input_tokens: 100, output_tokens: 20 } });
  }
  throw new Error('Rete esterna non prevista dal collaudo: ' + url.hostname);
};
const make = (budget = '1') => new Miniflare(convertV4MiniflareOptions({
  name: 'assistant-local-test', modules: true, scriptPath: resolve('.local/worker-package/index.js'), compatibilityDate: '2026-11-06',
  cf: false, telemetry: { enabled: false }, resourcePersistencePath: statePath,
  bindings: { OPENAI_API_KEY: 'TEST-not-a-key', SHOPIFY_ADMIN_ACCESS_TOKEN: 'TEST-read-only', SESSION_SECRET: 'TEST-session-secret-with-at-least-32-characters', RELEASE_ADMIN_SECRET: 'TEST-owner-only', TURNSTILE_SECRET: 'TEST-turnstile', TURNSTILE_SITE_KEY: 'TEST-public', AI_GLOBAL_BUDGET_USD: budget },
  durableObjects: { ASSISTANT: { className: 'AssistantStore', useSQLite: true } },
  assets: { directory: resolve('.local/storefront-dist'), binding: 'ASSETS', run_worker_first: true, routerConfig: { has_user_worker: true, invoke_user_worker_ahead_of_assets: true } }, outboundService: outbound,
}));
let mf = make();
const headers = { Origin: 'https://assistant.test', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' };
const request = (path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) => mf.dispatchFetch('https://assistant.test' + path, { method, headers: { ...headers, ...extra }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
try {
  const unauthorized = await request('/internal/catalog/refresh', 'POST'); assert.equal(unauthorized.status, 403, await unauthorized.text());
  const refresh = await request('/internal/catalog/refresh', 'POST', {}, { Authorization: 'Bearer TEST-owner-only' }); assert.equal(refresh.status, 200, (await refresh.text()) + ' TEST calls=' + catalogCalls);
  const initial = await (await request('/api/public/bootstrap')).json() as { products: unknown[]; stale: boolean; catalogVersion: string };
  assert(initial.products.length > 0); assert.equal(initial.stale, false);
  assert(!JSON.stringify(initial).includes('pending')); assert(!JSON.stringify(initial).includes('TEST-read-only'));
  const denied = await mf.dispatchFetch('https://assistant.test/api/public/session', { method: 'POST', headers: { ...headers, Origin: 'https://wrong.test' }, body: '{}' }); assert.equal(denied.status, 403);
  const session = await (await request('/api/public/session', 'POST', { token: 'TEST-proof' })).json() as { token: string };
  assert.match(session.token, /^[a-f0-9]{64}$/);
  const authorization = { Authorization: 'Bearer ' + session.token };
  const input = { sessionId: crypto.randomUUID(), revision: 0, message: 'automatico quadrato 10 mm', requirements: {}, lastQuestion: null };
  const privateResponse = await request('/api/public/interpret', 'POST', { ...input, message: 'cliente@example.test', privacyReviewed: true }, authorization);
  assert.equal(privateResponse.status, 400); assert.equal(calls, 0);
  const pair = await Promise.all([request('/api/public/interpret', 'POST', input, authorization), request('/api/public/interpret', 'POST', input, authorization)]);
  assert.deepEqual(pair.map(r => r.status).sort(), [200, 429]); assert.equal(calls, 1);
  const success = await pair.find(r => r.status === 200)!.json() as { expectedSessionId: string; arguments: unknown };
  assert.equal(success.expectedSessionId, input.sessionId);
  const before = await (await request('/internal/status', 'GET', undefined, { Authorization: 'Bearer TEST-owner-only' })).json() as { requests: number; estimatedUsd: number };
  assert.equal(before.requests, 1); assert(before.estimatedUsd > 0);
  failCatalog = true;
  assert.equal((await request('/internal/catalog/refresh', 'POST', {}, { Authorization: 'Bearer TEST-owner-only' })).status, 503);
  assert.equal(((await (await request('/api/public/bootstrap')).json()) as { catalogVersion: string }).catalogVersion, initial.catalogVersion);
  const html = await request('/'); assert.equal(html.status, 200); assert(html.headers.get('Content-Security-Policy')?.includes('frame-ancestors https://www.incisoriasacchetti.it'));
  await mf.dispose(); mf = make();
  const after = await (await request('/internal/status', 'GET', undefined, { Authorization: 'Bearer TEST-owner-only' })).json(); assert.deepEqual(after, { ...after as object, ...before });
  const changedUuid = { ...input, sessionId: crypto.randomUUID() };
  assert.equal((await request('/api/public/interpret', 'POST', changedUuid, authorization)).status, 200); assert.equal(calls, 2);
  // Rete condivisa: altri telefoni/aperture con prova valida non sono trattati come bot.
  for (let i = 0; i < 12; i++) assert.equal((await request('/api/public/session', 'POST', { token: 'TEST-proof-' + i })).status, 200);
  assert.equal((await request('/api/public/session', 'POST', { token: 'TEST-invalid' })).status, 403);
  const roaming = await request('/api/public/interpret', 'POST', changedUuid, { ...authorization, 'CF-Connecting-IP': '198.51.100.2' });
  assert.equal(roaming.status, 200); assert.equal(calls, 3);
  const roamingData = await roaming.json() as { sessionUsage: { requests: number } };
  assert.equal(roamingData.sessionUsage.requests, 3); // Stesso credito, anche con altro IP/UUID.
  for (let i = 0; i < 22; i++) assert.equal((await request('/api/public/interpret', 'POST', changedUuid, authorization)).status, 200);
  const scoped = await request('/api/public/interpret', 'POST', { ...input, message: 'TEST domanda estranea' }, authorization);
  assert.equal(scoped.status, 200); const scopedBody = await scoped.text();
  assert(!scopedBody.includes('RISPOSTA_GENERALE_TEST')); assert(scopedBody.includes('off_topic'));
  const infoReply = await request('/api/public/interpret', 'POST', { ...input, supportsStoreAnswers: true, message: 'TEST informazioni prodotti' }, authorization);
  assert.equal(infoReply.status, 200); const infoBody = await infoReply.json() as { tool: string; arguments: { blocks: unknown[] } }; assert.equal(infoBody.tool, 'answerStoreQuestion'); assert(infoBody.arguments.blocks.length > 0);
  const callsBeforeDenied = calls;
  assert.equal((await request('/api/public/interpret', 'POST', input, { Authorization: 'Bearer ' + '0'.repeat(64) })).status, 401);
  await mf.dispose(); mf = make('0.0004');
  assert.equal((await request('/api/public/interpret', 'POST', changedUuid, authorization)).status, 429); assert.equal(calls, callsBeforeDenied);
  console.log('PASS runtime Workers/SQLite: catalogo atomico, privacy, origine, Turnstile obbligatorio, reti condivise e cambio rete, concorrenza, contatori persistenti e budget non azzerati. Nessuna rete reale.');
} finally { await mf.dispose(); }
