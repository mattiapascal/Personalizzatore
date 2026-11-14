import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { ZodError } from 'zod';
import { readConfig, type Config } from './config.ts';
import { AiRequestSchema, proposeOpenAi } from './openai.ts';
import {proposeGraphical} from './editor-assistant';
import {GraphicalRequestSchema} from '../src/editor-assistant/contract';
import { CatalogService } from './catalog.ts';
import { Meter } from './meter.ts';
import type { RuntimeState } from '../src/runtime/schema.ts';
import { createCatalog } from '../src/catalog/adapter.ts';
import { LocalKnowledge } from './knowledge/local.ts';

export class LocalApi {
  readonly token = randomBytes(32).toString('hex');
  readonly catalog: CatalogService;
  readonly meter: Meter;
  readonly knowledge: LocalKnowledge;
  private calls: number[] = [];
  private activeAi = false;
  private meterError: string | null = null;
  constructor(readonly config: Config, root: string, private fetcher: typeof fetch = fetch) {
    this.catalog = new CatalogService(config, resolve(root, '.local/catalog.json'), fetcher);
    this.meter = new Meter(resolve(root, '.local/ai-meter.json'));
    this.knowledge = new LocalKnowledge(config, root, () => createCatalog(this.catalog.state.snapshot, this.catalog.state.version), fetcher);
  }
  async init() {
    await this.catalog.load();
    await this.knowledge.load();
    try { await this.meter.load(); } catch (error) { this.meterError = (error as Error).message; }
  }
  status(): RuntimeState {
    const reason = this.meterError ?? (this.config.AI_PROVIDER !== 'openai' ? 'Modalità demo: interpretazione a parole chiave.'
      : !this.config.OPENAI_API_KEY ? 'Manca OPENAI_API_KEY in .env.local.'
      : this.config.AI_ENFORCE_LOCAL_LIMITS && this.config.AI_BUDGET_USD <= 0 ? 'Manca un budget AI_BUDGET_USD positivo in .env.local.'
      : this.config.AI_ENFORCE_LOCAL_LIMITS && this.meter.state.requests >= this.config.AI_MAX_REQUESTS ? 'Limite locale di richieste raggiunto.'
      : this.config.AI_ENFORCE_LOCAL_LIMITS && this.meter.state.reservedUsd >= this.config.AI_BUDGET_USD ? 'Riserva prudenziale locale esaurita; non è la spesa OpenAI effettiva.' : null);
    return {
      csrfToken: this.token,
      ai: { mode: this.config.AI_PROVIDER, ready: !reason, reason, model: this.config.OPENAI_MODEL, budgetUsd: this.config.AI_BUDGET_USD, reservedUsd: this.meter.state.reservedUsd, requests: this.meter.state.requests, localLimitsEnforced: this.config.AI_ENFORCE_LOCAL_LIMITS, estimatedStandardUsd: (this.meter.state.inputTokens * 0.75 + this.meter.state.outputTokens * 4.5) / 1_000_000, sessionBudgetUsd: this.config.AI_SESSION_BUDGET_USD, catalogContextEnabled: this.config.AI_SHARE_CATALOG_CONTEXT },
      catalog: this.catalog.state,
      sync: { configured: this.catalog.configured, intervalSeconds: this.config.CATALOG_POLL_SECONDS, lastError: this.catalog.lastError, refreshing: this.catalog.refreshing, stale: this.catalog.configured && (!this.catalog.state.checkedAt || Date.now() - Date.parse(this.catalog.state.checkedAt) > Math.max(600, this.config.CATALOG_POLL_SECONDS * 2) * 1000) },
    };
  }
  async request(method: string, path: string, body: unknown,signal?:AbortSignal): Promise<unknown> {
    if (method === 'GET' && path === '/api/bootstrap') {
      try { await this.meter.load(); } catch (error) { this.meterError = (error as Error).message; }
      return this.status();
    }
    if (method === 'POST' && path === '/api/catalog/refresh') {
      await this.catalog.refresh(); await this.knowledge.refresh().catch(() => {}); return this.status();
    }
    if (method === 'POST' && (path === '/api/ai/interpret'||path==='/api/editor/propose')) {
      if(path==='/api/editor/propose')GraphicalRequestSchema.parse(body);else AiRequestSchema.parse(body);
      if (this.meterError) throw new Error(this.meterError);
      const now = Date.now(); this.calls = this.calls.filter(time => now - time < 60_000);
      if (this.calls.length >= 10) throw new Error('Troppe richieste AI: attendi un minuto');
      if (this.activeAi) throw new Error('Una richiesta AI è già in corso');
      this.calls.push(now); this.activeAi = true;
      try { return path==='/api/editor/propose'?await proposeGraphical(body,this.config,this.meter,this.fetcher,signal):await proposeOpenAi(AiRequestSchema.parse(body), this.config, this.meter, this.fetcher, undefined, createCatalog(this.catalog.state.snapshot, this.catalog.state.version), this.knowledge.provider); }
      finally { this.activeAi = false; }
    }
    throw new Error('Endpoint non disponibile');
  }
}

function send(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(value));
}
export function allowedRequest(request: Pick<IncomingMessage, 'headers'>, port: number): boolean {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  const host = request.headers.host;
  const origin = request.headers.origin;
  const site = request.headers['sec-fetch-site'];
  return !!host && hosts.includes(host) && (!origin || origin === `http://${host}`) && (!site || site === 'same-origin' || site === 'none');
}
async function jsonBody(request: IncomingMessage,maxBytes=16_384): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw new Error('È richiesto application/json');
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error(maxBytes===16_384?'Richiesta oltre 16 KB':'Richiesta oltre 128 KB');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function localApiPlugin(): Plugin {
  return {
    name: 'customizer-local-api',
    apply: (_config, environment) => environment.command === 'serve' && environment.mode !== 'test',
    async configureServer(server) {
      const env = { ...loadEnv(server.config.mode, server.config.root, ''), ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined)) };
      let config: Config;
      try { config = readConfig(env); } catch { throw new Error('Configurazione locale non valida. Controlla .env.local rispetto a .env.example.'); }
      const api = new LocalApi(config, server.config.root);
      await api.init();
      const port = server.config.server.port ?? 5173;
      server.middlewares.use(async (request, response, next) => {
        const path = request.url?.split('?')[0] ?? '';
        if (!path.startsWith('/api/')) { next(); return; }
        if (!allowedRequest(request, port)) { send(response, 403, { error: 'Origine locale non valida' }); return; }
        if (request.method !== 'GET' && request.method !== 'POST') { send(response, 405, { error: 'Metodo non consentito' }); return; }
        if (request.method === 'POST' && request.headers['x-lab-token'] !== api.token) { send(response, 403, { error: 'Sessione locale scaduta. Ricarica la pagina.' }); return; }
        const cancellation=path==='/api/editor/propose'?new AbortController():null;
        const disconnected=()=>{if(!response.writableEnded)cancellation?.abort();};
        if(cancellation)response.once('close',disconnected);
        try {
          const body = request.method === 'POST' ? await jsonBody(request,path==='/api/editor/propose'?131072:16_384) : null;
          const result=await api.request(request.method, path, body,cancellation?.signal);
          if(!response.destroyed)send(response,200,result);
        } catch (error) {
          const message = error instanceof ZodError || error instanceof SyntaxError ? 'Dati della richiesta o del provider non validi' : error instanceof Error ? error.message : 'Servizio locale non disponibile';
          // Non stampare errori del trasporto: possono contenere header o contenuti privati.
          if(!response.destroyed)send(response, 400, { error: /fetch|abort|timeout/i.test(message) ? 'Servizio esterno non raggiungibile entro il tempo previsto. Puoi riprovare: i requisiti sono conservati.' : message });
        }finally{if(cancellation)response.off('close',disconnected);}
      });
      let timer: ReturnType<typeof setInterval> | undefined;
      if (api.catalog.configured) {
        const refresh = () => api.catalog.refresh().then(() => api.knowledge.refresh()).catch(() => {});
        void refresh();
        timer = setInterval(() => { void refresh(); }, config.CATALOG_POLL_SECONDS * 1000);
        timer.unref();
      }
      server.httpServer?.once('close', () => { if (timer) clearInterval(timer); });
    },
  };
}
