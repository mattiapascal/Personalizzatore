import { DurableObject } from 'cloudflare:workers';
import { readConfig } from '../server/config.ts';
import { AiRequestSchema, proposeOpenAi } from '../server/openai.ts';
import { createCatalog } from '../src/catalog/live-adapter.ts';
import type { CatalogState } from '../src/runtime/schema.ts';
import { publicProduct } from '../src/public/schema.ts';
import { WorkerMeter, emptyLedger, type Ledger } from './ledger.ts';
import { refreshWorkerCatalog } from './catalog.ts';
import { json, readBody, sha256, verifyTurnstile } from './security.ts';
import type { Env } from './env.ts';

type Capability = { id: string; expiresAt: number };
export class AssistantStore extends DurableObject<Env> {
  private refreshRunning: Promise<Response> | null = null;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS capabilities (digest TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS visitors (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)');
  }
  private read<T>(key: string): T | undefined {
    const rows = this.ctx.storage.sql.exec<{ value: string }>('SELECT value FROM state WHERE key = ?', key).toArray();
    return rows[0] ? JSON.parse(rows[0].value) as T : undefined;
  }
  private write(key: string, value: unknown) {
    this.ctx.storage.sql.exec('INSERT INTO state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
  }
  private get config() {
    return readConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: this.env.OPENAI_API_KEY, AI_SHARE_CATALOG_CONTEXT: 'true', AI_ENFORCE_LOCAL_LIMITS: 'true',
      AI_BUDGET_USD: this.env.AI_GLOBAL_BUDGET_USD || '1', SHOPIFY_SHOP_DOMAIN: 'zqu2eg-72.myshopify.com', SHOPIFY_ADMIN_ACCESS_TOKEN: this.env.SHOPIFY_ADMIN_ACCESS_TOKEN });
  }
  private get current() { return this.read<CatalogState>('catalog'); }
  private stale(catalog: CatalogState | undefined) { return !catalog?.checkedAt || Date.now() - Date.parse(catalog.checkedAt) > 600_000; }
  private get ready() { return !!this.env.OPENAI_API_KEY && !!this.env.TURNSTILE_SECRET && !!this.env.TURNSTILE_SITE_KEY && this.env.SESSION_SECRET?.length >= 32; }
  private cleanExpired() {
    const now = Date.now();
    this.ctx.storage.sql.exec('DELETE FROM capabilities WHERE expires <= ?', now);
    this.ctx.storage.sql.exec('DELETE FROM visitors WHERE expires <= ?', now);
    const ledger = this.read<Ledger>('meter');
    if (ledger) {
      const expired = Object.keys(ledger.sessions).filter(id => ledger.sessions[id]!.expiresAt <= now && ledger.sessions[id]!.activeUntil <= now);
      if (expired.length) { for (const id of expired) delete ledger.sessions[id]; this.write('meter', ledger); }
    }
  }
  private async refresh(): Promise<Response> {
    if (this.refreshRunning) return this.refreshRunning;
    this.refreshRunning = (async () => {
      try {
        this.cleanExpired();
        const next = await refreshWorkerCatalog(this.config);
        this.write('catalog', next); this.write('catalog-health', { success: true, checkedAt: next.checkedAt });
        return json({ success: true, version: next.version, checkedAt: next.checkedAt, profiles: next.snapshot.products.length });
      } catch (error) {
        const category = error instanceof Error ? error.name : 'Unknown';
        this.write('catalog-health', { success: false, checkedAt: new Date().toISOString(), category });
        return json({ error: 'Aggiornamento catalogo non riuscito; copia precedente conservata.', category }, 503);
      }
    })().finally(() => { this.refreshRunning = null; });
    return this.refreshRunning;
  }
  private async session(request: Request): Promise<Response> {
    if (!this.ready || this.stale(this.current)) return json({ error: 'Assistente non disponibile. Puoi scegliere dal catalogo prodotti.' }, 503);
    const body = await readBody(request, 4096) as { token?: unknown };
    if (typeof body.token !== 'string' || !await verifyTurnstile(body.token, this.env.TURNSTILE_SECRET, new URL(request.url).hostname)) return json({ error: 'Verifica di sicurezza non riuscita. Riprova.' }, 403);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
    const digest = await sha256(token), expiresAt = (Math.floor(Date.now() / 86_400_000) + 1) * 86_400_000;
    let full = false;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec('DELETE FROM capabilities WHERE expires <= ?', Date.now());
      this.ctx.storage.sql.exec('DELETE FROM visitors WHERE expires <= ?', Date.now());
      const active = this.ctx.storage.sql.exec<{ count: number }>('SELECT COUNT(*) AS count FROM capabilities').one().count;
      if (active >= 500) { full = true; return; }
      const capability: Capability = { id: crypto.randomUUID(), expiresAt };
      this.ctx.storage.sql.exec('INSERT INTO capabilities (digest, value, expires) VALUES (?, ?, ?)', digest, JSON.stringify(capability), expiresAt);
    });
    return full ? json({ error: 'L’assistente è occupato. Riprova tra poco o continua dal catalogo.' }, 503) : json({ token, expiresAt });
  }
  private async interpret(request: Request): Promise<Response> {
    const bearer = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!bearer) return json({ error: 'Avvia la conversazione prima di inviare.' }, 401);
    const capability = this.ctx.storage.sql.exec<{ value: string }>('SELECT value FROM capabilities WHERE digest = ? AND expires > ?', await sha256(bearer), Date.now()).toArray()[0];
    const session = capability ? JSON.parse(capability.value) as Capability : null;
    // La capacità opaca identifica la sessione: un cambio Wi-Fi/rete mobile non azzera il credito.
    if (!session) return json({ error: 'Conversazione scaduta. Ricarica la pagina per continuare.' }, 401);
    const current = this.current;
    if (this.stale(current) || !current || !this.ready) return json({ error: 'Sto aggiornando i modelli. Riprova tra poco o continua dal catalogo.' }, 503);
    const input = AiRequestSchema.parse(await readBody(request));
    const config = this.config, clientId = input.sessionId;
    const meter = new WorkerMeter(session.id, () => this.read<Ledger>('meter') ?? emptyLedger(), value => this.write('meter', value), config.AI_BUDGET_USD);
    const result = await proposeOpenAi({ ...input, sessionId: session.id }, config, meter, fetch, request.signal, createCatalog(current.snapshot, current.version));
    // L'UUID del browser non controlla il credito: un reset non azzera la quota server.
    return json({ ...result, expectedSessionId: clientId });
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.hostname === 'internal' && url.pathname === '/refresh' && request.method === 'POST') return this.refresh();
      if (url.hostname === 'internal' && url.pathname === '/status' && request.method === 'GET') {
        const current = this.current, ledger = this.read<Ledger>('meter') ?? emptyLedger();
        return json({ catalogVersion: current?.version, checkedAt: current?.checkedAt, profiles: current?.snapshot.products.length ?? 0, stale: this.stale(current),
          aiReady: this.ready, globalBudgetUsd: this.config.AI_BUDGET_USD, estimatedUsd: ledger.spent / 1_000_000, heldUsd: ledger.held / 1_000_000, requests: ledger.requests });
      }
      if (url.pathname === '/api/public/bootstrap' && request.method === 'GET') {
        const current = this.current;
        return json({ apiVersion: 1, catalogVersion: current?.version ?? 'unavailable', checkedAt: current?.checkedAt ?? null,
          stale: this.stale(current), products: current?.snapshot.products.map(publicProduct) ?? [], aiReady: this.ready && !this.stale(current), siteKey: this.env.TURNSTILE_SITE_KEY ?? '' });
      }
      if (url.pathname === '/api/public/session' && request.method === 'POST') return await this.session(request);
      if (url.pathname === '/api/public/interpret' && request.method === 'POST') return await this.interpret(request);
      return json({ error: 'Percorso non disponibile.' }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const allowed = /^(Sto già elaborando|L’assistente è occupato|L’assistente ha raggiunto|Hai raggiunto il limite|Limite del provider|Il provider AI ha rifiutato|Risposta AI incompleta)/.test(message);
      return json({ error: allowed ? message : 'Non riesco a elaborare il messaggio. Controlla il testo protetto e riprova.' }, allowed ? 429 : 400);
    }
  }
}
