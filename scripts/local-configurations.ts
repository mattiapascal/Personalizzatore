import { MAX_CONFIGURATION_BYTES } from '../src/editor/project-limits';
import type { Plugin } from 'vite';
import { resolve } from 'node:path';
import { cartSummary } from '../src/editor-workflow/schema';
export function localConfigurationsPlugin(): Plugin {
  return { name: 'editor-local-configurations', apply: 'serve', async configureServer(server) {
    const { ConfigurationStore } = await server.ssrLoadModule('/scripts/configuration-store.ts') as typeof import('./configuration-store');
    const store = new ConfigurationStore(resolve('.local/editor-configurations'));
    server.middlewares.use('/__editor-local/configurations', async (req, res) => {
      const json = (status: number, data: unknown) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); };
      if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') || req.headers['x-editor-local'] !== '1' || req.headers.origin && req.headers.origin !== `http://${req.headers.host}` || req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Prova disponibile soltanto in locale' }); return; }
      try {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (req.method === 'GET') {
          const state = await store.read(); if (path === '/') { json(200, cartSummary(state)); return; }
          const match = path.match(/^\/([a-f0-9-]{36})$/), config = match ? state.configurations.find(c => c.id === match[1]) : undefined;
          json(config ? 200 : 404, config ?? { error: 'Configurazione non trovata' }); return;
        }
        if (req.method !== 'POST' || path !== '/' || req.headers['content-type'] !== 'application/json') { json(415, { error: 'Richiesta non valida' }); return; }
        const parts: Buffer[] = []; let length = 0;
        for await (const part of req) { const bytes = Buffer.from(part); length += bytes.length; if (length > MAX_CONFIGURATION_BYTES) throw new Error('Configurazione locale troppo grande'); parts.push(bytes); }
        json(200, await store.dispatch(JSON.parse(Buffer.concat(parts).toString('utf8'))));
      } catch (error) { json(422, { error: error instanceof Error ? error.message : 'Operazione locale non riuscita' }); }
    });
  } };
}
