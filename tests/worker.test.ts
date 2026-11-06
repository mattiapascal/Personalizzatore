import { describe, expect, it, vi } from 'vitest';
import { emptyLedger, reserveLedger, recordLedger, WorkerMeter } from '../cloudflare/ledger.ts';
import { hmac, readBody, verifyTurnstile } from '../cloudflare/security.ts';
import { workerCatalog } from '../cloudflare/catalog.ts';
import { normalizeCatalog, RawProductSchema } from '../server/catalog.ts';
import { mountFixtureCatalog } from '../src/catalog/adapter.ts';
import { publicProduct, publicSnapshot, PublicBootstrapSchema } from '../src/public/schema.ts';
import { createCatalog } from '../src/catalog/live-adapter.ts';
import raw from '../fixtures/products/mount-sources.TEST.json';

describe('Budget persistente pubblico: riserve prima della rete', () => {
  it('impedisce richieste simultanee sulla stessa conversazione e conserva lo stato rifiutato', () => {
    const before = reserveLedger(emptyLedger(), 'server-credit', 0.02, 1, 0.05, 1000);
    const copy = structuredClone(before);
    expect(() => reserveLedger(before, 'server-credit', 0.02, 1, 0.05, 2000)).toThrow('già elaborando');
    expect(before).toEqual(copy);
  });
  it('sostituisce la riserva con uso noto e applica il tetto globale anche a nuove chat', () => {
    const before = reserveLedger(emptyLedger(), 'a', 0.04, 0.05, 0.05, 1000);
    expect(() => reserveLedger(before, 'b', 0.02, 0.05, 0.05, 1001)).toThrow('limite del periodo');
    const settled = recordLedger(before, 'a', 0.04, 1000, 200);
    expect(settled.held).toBe(0); expect(settled.spent).toBe(1650);
    expect(reserveLedger(settled, 'b', 0.02, 0.05, 0.05, 1002).requests).toBe(2);
  });
  it('un timeout mantiene la riserva dopo la scadenza del lease; il reset browser non azzera il credito server', () => {
    let stored = emptyLedger();
    const meter = new WorkerMeter('credit', () => stored, value => { stored = value; }, 1);
    return meter.reserve(0.03, 10, 200, false, { id: 'credit', budgetUsd: 0.05 }).then(async () => {
      stored.sessions.credit!.activeUntil = 0;
      const restored = new WorkerMeter('credit', () => structuredClone(stored), value => { stored = value; }, 1);
      await expect(restored.reserve(0.03, 10, 200, false, { id: 'credit', budgetUsd: 0.05 })).rejects.toThrow('questa conversazione');
      expect(restored.sessionUsage('browser-id', 0.05).heldUsd).toBe(0.03);
      await expect(restored.reserve(0.01, 10, 200, false, { id: 'nuovo-browser-id', budgetUsd: 0.05 })).rejects.toThrow('non valida');
    });
  });
  it('la pulizia delle sessioni scadute non libera riserve globali senza esito', () => {
    const state = reserveLedger(emptyLedger(), 'expired', 0.04, 0.05, 0.05, 0);
    expect(() => reserveLedger(state, 'new', 0.02, 0.05, 0.05, 86_400_001)).toThrow('limite del periodo');
  });
  it('limita concorrenza globale e rifiuta numeri non validi', () => {
    let state = emptyLedger();
    for (let i = 0; i < 4; i++) state = reserveLedger(state, String(i), 0.01, 1, 0.05, 1000);
    expect(() => reserveLedger(state, 'fifth', 0.01, 1, 0.05, 1001)).toThrow('occupato');
    for (const value of [NaN, Infinity, -1, 0]) expect(() => reserveLedger(emptyLedger(), 'a', value, 1, 0.05, 0)).toThrow();
  });
});
describe('Catalogo e dati pubblici', () => {
  it('profilazione Workers identica alla locale per catalogo, versione e metafield', async () => {
    const source = raw.products.map(p => RawProductSchema.parse(p)), date = new Date('2026-11-06T12:00:00.000Z');
    const local = normalizeCatalog(source, date), worker = await workerCatalog(source, date);
    expect(worker.version).toBe(local.version); expect(worker.snapshot.products).toEqual(local.snapshot.products); expect(worker.pending).toEqual(local.pending);
    await expect(workerCatalog([source[0]!, source[0]!], date)).rejects.toThrow('duplicato');
  });
  it('il bootstrap pubblico omette tag, diagnostica, profili TEST, regole e consumi globali', () => {
    const products = mountFixtureCatalog.list().map(publicProduct);
    const bootstrap = PublicBootstrapSchema.parse({ apiVersion: 1, catalogVersion: 'test-version', checkedAt: new Date().toISOString(), stale: false, aiReady: true, siteKey: 'TEST', products });
    const payload = JSON.stringify(bootstrap);
    for (const internal of ['No-AI', 'validatedForProduction', 'mechanismSource', 'areaSource', 'dataWarnings', 'pending', 'reservedUsd', 'OPENAI_API_KEY']) expect(payload).not.toContain(internal);
    expect(createCatalog(publicSnapshot(bootstrap), bootstrap.catalogVersion).list()).toHaveLength(products.length);
  });
});
describe('Confini HTTP e antiautomazione', () => {
  it('valida successo, hostname e azione Turnstile lato server', async () => {
    for (const result of [{ success: false }, { success: true, hostname: 'altro.test', action: 'assistant-start' }, { success: true, hostname: 'store.test', action: 'altro' }]) {
      expect(await verifyTurnstile('TEST-token', 'TEST-secret', 'store.test', vi.fn().mockResolvedValue(Response.json(result)))).toBe(false);
    }
    expect(await verifyTurnstile('TEST-token', 'TEST-secret', 'store.test', vi.fn().mockResolvedValue(Response.json({ success: true, hostname: 'store.test', action: 'assistant-start' })))).toBe(true);
  });
  it('limita anche un body in streaming senza Content-Length', async () => {
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(17_000)); controller.close(); } });
    const req = new Request('https://test.invalid', { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half' } as RequestInit);
    await expect(readBody(req)).rejects.toThrow('troppo lungo');
  });
  it('il bucket visitatore dipende da giorno e segreto e non contiene l’IP', async () => {
    const one = await hmac('2026-11-06:192.0.2.1', 'TEST-secret');
    expect(one).not.toContain('192.0.2.1');
    expect(one).not.toBe(await hmac('2026-11-07:192.0.2.1', 'TEST-secret'));
  });
});
