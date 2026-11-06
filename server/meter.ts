import { z } from 'zod';
import { readJson, writeJson, missingFile } from './files.ts';
import { mkdir, rmdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const MeterSchema = z.strictObject({ schemaVersion: z.literal(1), reservedUsd: z.number().nonnegative(), requests: z.number().int().nonnegative(), inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() });
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
  reserve(usd: number, budget: number, maxRequests: number, enforce = true) {
    return this.serialize(async () => {
      if (enforce && this.state.requests >= maxRequests) throw new Error('Limite locale di richieste raggiunto: non è un limite di fatturazione OpenAI');
      if (enforce && this.state.reservedUsd + usd > budget) throw new Error('Riserva prudenziale locale insufficiente: non equivale alla spesa OpenAI effettiva');
      const next = { ...this.state, reservedUsd: this.state.reservedUsd + usd, requests: this.state.requests + 1 };
      await writeJson(this.path, next); this.state = next;
    });
  }
  record(inputTokens: number, outputTokens: number) {
    return this.serialize(async () => {
      const next = { ...this.state, inputTokens: this.state.inputTokens + inputTokens, outputTokens: this.state.outputTokens + outputTokens };
      await writeJson(this.path, next); this.state = next;
    });
  }
}
