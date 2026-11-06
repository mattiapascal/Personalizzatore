import type { Env } from './env.ts';
import { json, STORE_ORIGINS } from './security.ts';
export { AssistantStore } from './store.ts';

function stub(env: Env) { return env.ASSISTANT.get(env.ASSISTANT.idFromName('incisoria-stamp-assistant-v1')); }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/public/')) {
      if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return json({ error: 'Assistente temporaneamente non disponibile.' }, 503);
      if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) return json({ error: 'Origine richiesta non valida.' }, 403);
      return stub(env).fetch(request);
    }
    if (url.pathname === '/internal/catalog/refresh' && request.method === 'POST') {
      if (!env.RELEASE_ADMIN_SECRET || request.headers.get('Authorization') !== 'Bearer ' + env.RELEASE_ADMIN_SECRET) return json({ error: 'Non autorizzato.' }, 403);
      return stub(env).fetch(new Request('https://internal/refresh', { method: 'POST' }));
    }
    if (url.pathname === '/internal/status' && request.method === 'GET') {
      if (!env.RELEASE_ADMIN_SECRET || request.headers.get('Authorization') !== 'Bearer ' + env.RELEASE_ADMIN_SECRET) return json({ error: 'Non autorizzato.' }, 403);
      return stub(env).fetch(new Request('https://internal/status'));
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Percorso non disponibile.' }, 404);
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.shopify.com data:; font-src 'self' https://fonts.shopifycdn.com https://www.incisoriasacchetti.it https://cdn.shopify.com; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors ${STORE_ORIGINS.join(' ')} https://admin.shopify.com; base-uri 'none'; form-action 'none'`);
    headers.set('X-Content-Type-Options', 'nosniff'); headers.set('Referrer-Policy', 'no-referrer');
    return new Response(response.body, { status: response.status, headers });
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(stub(env).fetch(new Request('https://internal/refresh', { method: 'POST' })).then(() => {}));
  },
} satisfies ExportedHandler<Env>;
