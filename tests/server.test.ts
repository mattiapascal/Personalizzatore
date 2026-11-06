import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { snapshot, fixtureCatalog } from '../src/catalog/adapter';
import { initialInteraction, selectionInteraction } from '../src/selection/interaction';
import { newSession, updateRequirements } from '../src/selection/session';
import { readConfig } from '../server/config';
import { Meter } from '../server/meter';
import { AiRequestSchema, makeOpenAiBody, proposalFromArguments, proposeOpenAi } from '../server/openai';
import { CatalogService, fetchCatalog, normalizeCatalog, type RawProduct } from '../server/catalog';
import { LocalApi, allowedRequest } from '../server/api';
import { readJson, writeJson } from '../server/files';

const directories: string[] = [];
async function directory() { const path = await mkdtemp(join(tmpdir(), 'customizer-test-')); directories.push(path); return path; }
afterEach(async () => { for (const path of directories.splice(0)) await rm(path, { recursive: true, force: true }); vi.restoreAllMocks(); });
const config = () => readConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'test-not-a-real-key', AI_BUDGET_USD: '1', SHOPIFY_SHOP_DOMAIN: 'zqu2eg-72.myshopify.com', SHOPIFY_ADMIN_ACCESS_TOKEN: 'test-not-a-real-token' });
const argumentsFor = (patch: Record<string, unknown> = {}) => ({ changeIntent: 'update', clearEvidence: null, dialogueAct: null, contentText: null, contentKind: null, purpose: null, graphicSubject: null, family: null, mechanism: null, material: null, diameterMm: null, shape: null, lines: null, hasLogo: null, widthMm: null, heightMm: null, targetWidthMm: null, targetHeightMm: null, sizeUnknown: null, clearFields: [], clarification: null, ...patch });
const request = () => AiRequestSchema.parse({ message: 'timbro per le fatture', sessionId: crypto.randomUUID(), revision: 3, requirements: { family: 'stamp' }, lastQuestion: 'Preferisci un autoinchiostrante?' });
const answer = (args = argumentsFor({ family: 'stamp' }), extra = {}) => new Response(JSON.stringify({ status: 'completed', output: [{ type: 'function_call', name: 'collect_requirements', arguments: JSON.stringify(args) }], usage: { input_tokens: 100, output_tokens: 50 }, ...extra }), { status: 200 });
const rawProducts = (): RawProduct[] => snapshot.products.map(p => ({ id: p.productId, title: p.title, handle: p.handle, status: p.status, onlineStoreUrl: p.url, updatedAt: '2026-10-26T17:46:07Z', tags: p.tags, descriptionHtml: '<p>Timbro personalizzabile con logo</p>', vendor: '', variants: { nodes: p.variantIds.map(id => ({ id, title: 'Default Title', selectedOptions: [], imprintWidth: { type: 'number_decimal', jsonValue: String(p.nominalAreaMm.width) }, imprintHeight: { type: 'number_decimal', jsonValue: String(p.nominalAreaMm.height) } })), pageInfo: { hasNextPage: false, endCursor: null } } }));
const catalogResponse = (nodes: RawProduct[], hasNextPage = false, endCursor: string | null = null) => new Response(JSON.stringify({ data: { products: { nodes, pageInfo: { hasNextPage, endCursor } } } }));

describe('OpenAI server: output tipizzato, contesto e quote', () => {
  it('manda solo dati della richiesta, una funzione strict, nessun catalogo o session ID', () => {
    const input = request(), body = makeOpenAiBody(input, config());
    expect(body).toMatchObject({ store: false, parallel_tool_calls: false, max_output_tokens: 1600, tool_choice: { name: 'collect_requirements' } });
    const parameters = body.tools[0]!.parameters as { properties: Record<string, unknown>; required: string[]; additionalProperties: boolean };
    expect(parameters.additionalProperties).toBe(false);
    expect(parameters.required.sort()).toEqual(Object.keys(parameters.properties).sort());
    const userInput = body.input[0]!.content;
    expect(userInput).not.toContain(input.sessionId);
    for (const product of snapshot.products) expect(userInput).not.toContain(product.productId);
    expect(userInput).toContain('Preferisci');
  });
  it('gestisce negazioni/cancellazioni strutturate senza cancellare requisiti estranei', () => {
    const session = updateRequirements(newSession(fixtureCatalog), { family: 'stamp', mechanism: 'automatic', hasLogo: true, lines: 6, sizeUnknown: true }, fixtureCatalog);
    const call = proposalFromArguments(argumentsFor({ changeIntent: 'withdraw', clearEvidence: 'togli la montatura', hasLogo: false, clearFields: ['mechanism'] }), session.revision);
    const next = selectionInteraction(initialInteraction(session), { type: 'tool', call }, fixtureCatalog);
    expect(next.session.requirements).toMatchObject({ family: 'stamp', hasLogo: false, lines: 6 });
    expect(next.session.requirements.mechanism).toBeUndefined();
  });
  it('unknown cancella vecchie misure, coppie ambigue o contraddittorie sono rifiutate', () => {
    const call = proposalFromArguments(argumentsFor({ sizeUnknown: true }), 2);
    expect(call).toMatchObject({ expectedRevision: 2, arguments: { minimumAreaMm: null, sizeUnknown: true } });
    for (const patch of [{ widthMm: 50 }, { widthMm: 50, heightMm: 20, sizeUnknown: true }]) expect(proposalFromArguments(argumentsFor(patch), 2)).toMatchObject({ arguments: {}, clarification: expect.any(String) });
    expect(() => proposalFromArguments(argumentsFor({ clearFields: ['price'] }), 2)).toThrow();
    expect(proposalFromArguments(argumentsFor({ hasLogo: false, clearFields: ['hasLogo'] }), 2)).toMatchObject({ arguments: { hasLogo: false }, clearFields: [] });
  });
  it('registra consumo prima della rete e non logga prompt nel registro', async () => {
    const path = join(await directory(), 'meter.json'), meter = new Meter(path); await meter.load();
    const transport = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => { expect((await readJson(path) as { requests: number }).requests).toBe(1); return answer(); });
    const result = await proposeOpenAi(request(), config(), meter, transport);
    expect(result).toMatchObject({ tool: 'collectRequirements', expectedRevision: 3, arguments: { family: 'stamp' } });
    expect(meter.state).toMatchObject({ requests: 1, inputTokens: 100, outputTokens: 50 });
    expect(JSON.stringify(await readJson(path))).not.toContain('fatture');
    const restored = new Meter(path); await restored.load(); expect(restored.state).toEqual(meter.state);
  });
  it('budget e richieste sono atomici, anche con chiamate concorrenti', async () => {
    const meter = new Meter(join(await directory(), 'meter.json')); await meter.load();
    const results = await Promise.allSettled([meter.reserve(0.6, 1, 10), meter.reserve(0.6, 1, 10)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(meter.state.requests).toBe(1); expect(meter.state.reservedUsd).toBe(0.6);
    const transport = vi.fn();
    await expect(proposeOpenAi(request(), { ...config(), AI_BUDGET_USD: 0.001 }, meter, transport)).rejects.toThrow('Riserva prudenziale');
    expect(transport).not.toHaveBeenCalled();
  });
  it('limiti cumulativi locali disattivati: il registro informa senza bloccare la chat', async () => {
    const meter = new Meter(join(await directory(), 'meter.json')); await meter.load();
    await meter.reserve(1, 1, 1);
    const transport = vi.fn(async () => answer());
    await expect(proposeOpenAi(request(), { ...config(), AI_ENFORCE_LOCAL_LIMITS: false, AI_BUDGET_USD: 0, AI_MAX_REQUESTS: 1 }, meter, transport)).resolves.toMatchObject({ tool: 'collectRequirements' });
    expect(transport).toHaveBeenCalledOnce(); expect(meter.state.requests).toBe(2);
  });
  it('niente chiave/demo/budget: nessuna richiesta di rete; registro corrotto blocca', async () => {
    const path = join(await directory(), 'meter.json'), meter = new Meter(path); await meter.load();
    const transport = vi.fn();
    for (const cfg of [readConfig({}), { ...config(), OPENAI_API_KEY: '' }, { ...config(), AI_BUDGET_USD: 0 }]) await expect(proposeOpenAi(request(), cfg, meter, transport)).rejects.toThrow('Configura');
    expect(transport).not.toHaveBeenCalled();
    await writeJson(path, { invalid: true });
    await expect(new Meter(path).load()).rejects.toThrow('Registro');
  });
  it('due processi/istanze non possono sovrascrivere o azzerare la quota', async () => {
    const path = join(await directory(), 'meter.json');
    const first = new Meter(path), second = new Meter(path); await first.load(); await second.load();
    const results = await Promise.allSettled([first.reserve(0.6, 1, 10), second.reserve(0.6, 1, 10)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    await expect(second.reserve(0.6, 1, 10)).rejects.toThrow('Riserva prudenziale');
    await second.load(); expect(second.state.reservedUsd).toBe(0.6); expect(second.state.requests).toBe(1);
  });
  it('errore, rifiuto e tool amministrativo non diventano comandi; riserva non rimborsata', async () => {
    const meter = new Meter(join(await directory(), 'meter.json')); await meter.load();
    const responses = [new Response('private error', { status: 401 }), answer(undefined, { status: 'incomplete' }), answer(undefined, { output: [{ type: 'function_call', name: 'set_price', arguments: '{}' }] }), answer(undefined, { output: [] })];
    for (const response of responses) await expect(proposeOpenAi(request(), config(), meter, async () => response)).rejects.toThrow();
    expect(meter.state.requests).toBe(4); expect(meter.state.reservedUsd).toBeGreaterThan(0);
  });
});

describe('Catalogo server: import atomico e aggiornamenti in sola lettura', () => {
  it('stessa sostanza ha stessa versione, anche invertendo ordine o cambiando data', () => {
    const raw = rawProducts();
    const a = normalizeCatalog(raw, new Date('2026-11-05T12:00:00Z'));
    const b = normalizeCatalog(raw.reverse(), new Date('2026-11-06T12:00:00Z'));
    expect(a.version).toBe(b.version); expect(a.snapshot.fixture).toBe(false); expect(a.snapshot.products).toHaveLength(3);
  });
  it('archiviazione, eliminazione e mancata pubblicazione rimuovono candidati', () => {
    const raw = rawProducts(); raw[0]!.status = 'ARCHIVED'; raw[1]!.onlineStoreUrl = null;
    expect(normalizeCatalog(raw, new Date()).snapshot.products.map(p => p.productId)).toEqual([raw[2]!.id]);
    expect(normalizeCatalog([], new Date()).snapshot.products).toHaveLength(0);
  });
  it('dati dimensionali mancanti, descrizioni vuote e varianti incomplete restano in revisione', () => {
    const raw = rawProducts(); raw[0]!.variants.nodes[0]!.imprintWidth = null; raw[1]!.descriptionHtml = ''; raw[2]!.variants.pageInfo.hasNextPage = true;
    const state = normalizeCatalog(raw, new Date());
    expect(state.snapshot.products).toHaveLength(0); expect(state.pending).toHaveLength(3);
    expect(state.pending.every(p => p.reason.startsWith('Da verificare'))).toBe(true);
    expect(() => normalizeCatalog([raw[0]!, raw[0]!], new Date())).toThrow('duplicato');
  });
  it('aggiorna handle/URL e tag ma non prezzi, e rifiuta URL esterni', () => {
    const raw = rawProducts(); raw[0]!.tags = ['aggiornato']; raw[0]!.handle = 'nuovo-handle'; raw[0]!.onlineStoreUrl = 'https://www.incisoriasacchetti.it/products/nuovo-handle';
    const state = normalizeCatalog(raw, new Date());
    expect(state.snapshot.products.find(p => p.productId === raw[0]!.id)).toMatchObject({ handle: 'nuovo-handle', tags: ['aggiornato'], price: null });
    raw[0]!.onlineStoreUrl = 'https://evil.example/products/timbro';
    expect(() => normalizeCatalog(raw, new Date())).toThrow();
  });
  it('paginate prodotti, niente mutazioni o campi prezzo, cursori controllati', async () => {
    const raw = rawProducts();
    const transport = vi.fn().mockResolvedValueOnce(catalogResponse(raw.slice(0, 2), true, 'cursor2')).mockResolvedValueOnce(catalogResponse(raw.slice(2)));
    expect(await fetchCatalog(config(), transport)).toHaveLength(3);
    const second = JSON.parse(transport.mock.calls[1]![1].body as string);
    expect(second.variables.after).toBe('cursor2'); expect(second.query).not.toMatch(/mutation|price|inventory/i);
    const loop = vi.fn(async () => catalogResponse([], true, 'same'));
    await expect(fetchCatalog(config(), loop)).rejects.toThrow('Paginazione');
  });
  it('errore a metà import conserva versione/cache; richieste simultanee sono aggregate', async () => {
    const path = join(await directory(), 'catalog.json');
    const transport = vi.fn().mockResolvedValueOnce(catalogResponse(rawProducts())).mockResolvedValueOnce(catalogResponse([], true, 'next')).mockResolvedValueOnce(new Response('error', { status: 429 }));
    const service = new CatalogService(config(), path, transport); await service.load();
    const [a, b] = await Promise.all([service.refresh(), service.refresh()]); expect(a).toEqual(b); expect(transport).toHaveBeenCalledTimes(1);
    const before = structuredClone(service.state), cached = await readJson(path);
    await expect(service.refresh()).rejects.toThrow('Lettura Shopify');
    expect(service.state).toEqual(before); expect(await readJson(path)).toEqual(cached);
    const restored = new CatalogService(readConfig({}), path); await restored.load(); expect(restored.state).toEqual(before); expect(restored.configured).toBe(false);
  });
  it('cache di un altro ambito o versione regole non viene riutilizzata', async () => {
    const path = join(await directory(), 'catalog.json');
    const service = new CatalogService(config(), path, vi.fn(async () => catalogResponse(rawProducts())));
    await service.refresh();
    const original = await readJson(path) as Record<string, unknown>;
    for (const patch of [{ scopeQuery: 'tag:altro' }, { profileRulesVersion: 'obsolete' }]) {
      await writeJson(path, { ...original, ...patch });
      const restored = new CatalogService(config(), path); await restored.load();
      expect(restored.state.snapshot.fixture).toBe(true); expect(restored.state.checkedAt).toBeNull();
    }
  });
});

describe('API locale e confini di accesso', () => {
  it('distingue catalogo iniziale, fresco e obsoleto senza perdere i dati precedenti', async () => {
    const api = new LocalApi(config(), await directory()); await api.init();
    expect(api.status().sync.stale).toBe(true);
    api.catalog.state = normalizeCatalog(rawProducts(), new Date());
    expect(api.status().sync.stale).toBe(false);
    api.catalog.state.checkedAt = new Date(Date.now() - 601_000).toISOString();
    expect(api.status().sync.stale).toBe(true);
    expect(api.status().catalog.snapshot.products).toHaveLength(3);
  });
  it('rifiuta cross-origin, rebinding e porte diverse', () => {
    expect(allowedRequest({ headers: { host: '127.0.0.1:5173', origin: 'http://127.0.0.1:5173', 'sec-fetch-site': 'same-origin' } }, 5173)).toBe(true);
    for (const headers of [{ host: 'evil.example:5173' }, { host: 'localhost:5173', origin: 'https://evil.example' }, { host: '127.0.0.1:5173', 'sec-fetch-site': 'cross-site' }, { host: '127.0.0.1:5174' }]) expect(allowedRequest({ headers }, 5173)).toBe(false);
  });
  it('bootstrap non contiene segreti; provider mancante è esplicito e scelte guidate indipendenti', async () => {
    const api = new LocalApi({ ...config(), OPENAI_API_KEY: '' }, await directory()); await api.init();
    const status = api.status(); expect(status.ai.ready).toBe(false); expect(status.ai.reason).toContain('OPENAI_API_KEY');
    expect(JSON.stringify(status)).not.toContain('test-not-a-real-token');
    await expect(api.request('POST', '/api/ai/interpret', { ...request(), admin: true })).rejects.toThrow();
    await expect(api.request('POST', '/api/orders', {})).rejects.toThrow('Endpoint');
  });
  it('limita richieste e ne impedisce sovrapposizioni', async () => {
    let release!: (response: Response) => void;
    const transport = vi.fn(() => new Promise<Response>(resolve => { release = resolve; }));
    const api = new LocalApi(config(), await directory(), transport); await api.init();
    const pending = api.request('POST', '/api/ai/interpret', request());
    await expect(api.request('POST', '/api/ai/interpret', request())).rejects.toThrow('già in corso');
    await vi.waitFor(() => expect(transport).toHaveBeenCalledOnce()); release(answer()); await pending;
    for (let i = 0; i < 9; i++) { const result = api.request('POST', '/api/ai/interpret', request()); await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(i + 2)); release(answer()); await result; }
    await expect(api.request('POST', '/api/ai/interpret', request())).rejects.toThrow('Troppe richieste');
  });
});
