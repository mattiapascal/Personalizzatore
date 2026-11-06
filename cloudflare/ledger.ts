import type { UsageMeter } from '../server/usage-meter.ts';
import type { SessionUsage } from '../src/ai/usage.ts';

type Counter = { spent: number; held: number; requests: number; activeUntil: number; expiresAt: number };
export type Ledger = { spent: number; held: number; requests: number; sessions: Record<string, Counter> };
export const emptyLedger = (): Ledger => ({ spent: 0, held: 0, requests: 0, sessions: {} });
const micro = (usd: number) => Math.ceil(usd * 1_000_000);
export function reserveLedger(state: Ledger, id: string, usd: number, globalBudget: number, sessionBudget: number, now: number): Ledger {
  if (![usd, globalBudget, sessionBudget].every(n => Number.isFinite(n) && n > 0)) throw new Error('Assistente temporaneamente non disponibile.');
  const next = structuredClone(state);
  for (const [key, value] of Object.entries(next.sessions)) if (value.expiresAt <= now && value.activeUntil <= now) delete next.sessions[key];
  const counter = next.sessions[id] ?? { spent: 0, held: 0, requests: 0, activeUntil: 0, expiresAt: now + 86_400_000 };
  if (counter.activeUntil > now) throw new Error('Sto già elaborando un tuo messaggio. Attendi la risposta.');
  if (Object.values(next.sessions).filter(c => c.activeUntil > now).length >= 4) throw new Error('L’assistente è occupato. Riprova tra poco.');
  if (next.spent + next.held + micro(usd) > micro(globalBudget) || next.requests >= 200) throw new Error('L’assistente ha raggiunto il limite del periodo. Puoi continuare dal catalogo prodotti.');
  if (counter.spent + counter.held + micro(usd) > micro(sessionBudget) || counter.requests >= 20) throw new Error('Hai raggiunto il limite di questa conversazione. Puoi continuare dai prodotti trovati.');
  if (!next.sessions[id] && Object.keys(next.sessions).length >= 500) throw new Error('L’assistente è occupato. Riprova più tardi.');
  counter.held += micro(usd); counter.requests++; counter.activeUntil = now + 30_000;
  next.sessions[id] = counter; next.held += micro(usd); next.requests++;
  return next;
}
export function recordLedger(state: Ledger, id: string, reservedUsd: number, input: number, output: number): Ledger {
  const next = structuredClone(state), counter = next.sessions[id];
  if (!counter || !Number.isFinite(reservedUsd) || reservedUsd <= 0 || ![input, output].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Registro consumi non valido.');
  const released = Math.min(counter.held, micro(reservedUsd));
  const cost = Math.ceil(input * 0.75 + output * 4.5);
  counter.held -= released; counter.spent += cost; counter.activeUntil = 0;
  next.held = Math.max(0, next.held - released); next.spent += cost;
  return next;
}
export class WorkerMeter implements UsageMeter {
  constructor(private id: string, private read: () => Ledger, private write: (value: Ledger) => void, private budget: number) {}
  async reserve(usd: number, _budget: number, _maxRequests: number, _enforce = true, session?: { id: string; budgetUsd: number }) {
    if (!session || session.id !== this.id) throw new Error('Conversazione non valida.');
    this.write(reserveLedger(this.read(), this.id, usd, this.budget, session.budgetUsd, Date.now()));
  }
  async record(input: number, output: number, session?: { id: string; reservedUsd: number }) {
    if (!session || session.id !== this.id) throw new Error('Conversazione non valida.');
    this.write(recordLedger(this.read(), this.id, session.reservedUsd, input, output));
  }
  sessionUsage(_id: string, budgetUsd: number): SessionUsage {
    const c = this.read().sessions[this.id];
    return { estimatedUsd: (c?.spent ?? 0) / 1_000_000, heldUsd: (c?.held ?? 0) / 1_000_000, requests: c?.requests ?? 0, budgetUsd };
  }
}
