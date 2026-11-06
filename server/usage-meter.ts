import type { SessionUsage } from '../src/ai/usage.ts';

export interface UsageMeter {
  reserve(usd: number, budget: number, maxRequests: number, enforce?: boolean, session?: { id: string; budgetUsd: number }): Promise<void>;
  record(inputTokens: number, outputTokens: number, session?: { id: string; reservedUsd: number }): Promise<void>;
  sessionUsage(id: string, budgetUsd: number): SessionUsage;
}
