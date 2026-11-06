import { z } from 'zod';
import { readJson, writeJson, missingFile } from './files.ts';
import { mkdir, rmdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { SessionUsage } from '../src/ai/usage.ts';

const SessionCounterSchema = z.strictObject({ estimatedUsd: z.number().nonnegative(), heldUsd: z.number().nonnegative(), requests: z.number().int().nonnegative(), expiresAt: z.number() });
const MeterSchema = z.strictObject({ schemaVersion: z.literal(1), reservedUsd: z.number().nonnegative(), requests: z.number().int().nonnegative(), inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative(), sessions: z.record(z.string().uuid(), SessionCounterSchema).default({}) });
const SESSION_TTL = 24 * 60 * 60 * 1000;
export const tokenCost = (input: number, output: number) => (input * 0.75 + output * 4.5) / 1_000_000;
export class Meter {
  state = MeterSchema.parse({ schemaVersion: 1, reservedUsd: 0, requests: 0, inputTokens: 0, outputTokens: 0 });
  private queue: Promise<void> = Promise.resolve();
  constructor(private path: string) {}
  async load() {
    try { this.state = MeterSchema.parse(await readJson(this.path)); }
    catch (error) { if (!missingFile(error)) throw new Error('Registro consumi illeggibile: AI bloccata, ripristinare il registro'); }
  }
  private serialize(action: () => Promise<void>) {
    const task = this.queue.then(async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const lock = `${this.path}.lock`;
      try { await mkdir(lock); } catch { throw new Error('Registro consumi occupato: riprova dopo il collaudo in corso'); }
      try { await this.load(); await action(); }
      finally { await rmdir(lock); }
    });
    this.queue = task.catch(() => {}); return task;
  }
  sessionUsage(id: string, budgetUsd: number): SessionUsage {
    const counter = this.state.sessions[id];
    return { estimatedUsd: counter?.estimatedUsd ?? 0, heldUsd: counter?.heldUsd ?? 0, requests: counter?.requests ?? 0, budgetUsd };
  }
  reserve(usd: number, budget: number, maxRequests: number, enforce = true, session?: { id: string; budgetUsd: number }) {
    return this.serialize(async () => {
      if (enforce && this.state.requests >= maxRequests) throw new Error('Limite locale di richieste raggiunto: non è un limite di fatturazione OpenAI');
      if (enforce && this.state.reservedUsd + usd > budget) throw new Error('Riserva prudenziale locale insufficiente: non equivale alla spesa OpenAI effettiva');
      const sessions = { ...this.state.sessions };
      for (const [id, counter] of Object.entries(sessions)) if (counter.expiresAt <= Date.now()) delete sessions[id];
      if (session) {
        z.string().uuid().parse(session.id);
        const counter = sessions[session.id] ?? { estimatedUsd: 0, heldUsd: 0, requests: 0, expiresAt: 0 };
        if (counter.estimatedUsd + counter.heldUsd + usd > session.budgetUsd) throw new Error('Tetto AI della conversazione raggiunto. Puoi continuare dai prodotti già trovati o dalla pagina prodotto.');
        if (!sessions[session.id] && Object.keys(sessions).length >= 500) throw new Error('Registro sessioni AI pieno: riprova più tardi');
        sessions[session.id] = { ...counter, heldUsd: counter.heldUsd + usd, requests: counter.requests + 1, expiresAt: Date.now() + SESSION_TTL };
      }
      const next = { ...this.state, sessions, reservedUsd: this.state.reservedUsd + usd, requests: this.state.requests + 1 };
      await writeJson(this.path, next); this.state = next;
    });
  }
  record(inputTokens: number, outputTokens: number, session?: { id: string; reservedUsd: number }) {
    return this.serialize(async () => {
      const sessions = { ...this.state.sessions }, counter = session && sessions[session.id];
      if (session && counter) sessions[session.id] = { ...counter, estimatedUsd: counter.estimatedUsd + tokenCost(inputTokens, outputTokens), heldUsd: Math.max(0, counter.heldUsd - session.reservedUsd) };
      const next = { ...this.state, sessions, inputTokens: this.state.inputTokens + inputTokens, outputTokens: this.state.outputTokens + outputTokens };
      await writeJson(this.path, next); this.state = next;
    });
  }
}
