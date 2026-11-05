import { loadEnv } from 'vite';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { z } from 'zod';
import casesJson from '../fixtures/ai/requirements.TEST.json' with { type: 'json' };
import { RequirementsSchema } from '../src/selection/schema.ts';
import { fixtureCatalog } from '../src/catalog/adapter.ts';
import { executeTool, RequirementFieldSchema } from '../src/ai/contract.ts';
import { newSession } from '../src/selection/session.ts';
import { readConfig } from '../server/config.ts';
import { Meter } from '../server/meter.ts';
import { proposeOpenAi, PROMPT_VERSION } from '../server/openai.ts';
import { writeJson } from '../server/files.ts';

const cases = z.object({ fixture: z.literal(true), cases: z.array(z.object({ id: z.string(), message: z.string(), requirements: RequirementsSchema, lastQuestion: z.string().nullable(), expected: RequirementsSchema, absent: z.array(RequirementFieldSchema).optional(), clarification: z.boolean().optional() })) }).parse(casesJson).cases;
const config = readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env });
if (config.AI_PROVIDER !== 'openai' || !config.OPENAI_API_KEY || config.AI_BUDGET_USD <= 0) throw new Error('Configurare chiave e budget in .env.local prima del collaudo reale');
const meter = new Meter(resolve('.local/ai-meter.json')); await meter.load();
const start = structuredClone(meter.state);
const selected = process.argv[2] ? cases.filter(c => c.id === process.argv[2]) : cases;
if (!selected.length) throw new Error('Caso di collaudo sconosciuto');
const results: { id: string; passed: boolean; mismatches: string[]; actual?: unknown }[] = [];
for (const c of selected) {
  try {
    const session = { ...newSession(fixtureCatalog), requirements: c.requirements };
    const call = await proposeOpenAi({ message: c.message, sessionId: session.sessionId, revision: session.revision, requirements: session.requirements, lastQuestion: c.lastQuestion, recentMessages: [] }, config, meter);
    const next = executeTool(call, session, fixtureCatalog).session.requirements;
    const mismatches = Object.entries(c.expected).filter(([key, value]) => !isDeepStrictEqual(next[key as keyof typeof next], value)).map(([key]) => key);
    for (const field of c.absent ?? []) if (next[field] !== undefined) mismatches.push(`absent:${field}`);
    if (c.clarification && (call.tool !== 'collectRequirements' || !call.clarification)) mismatches.push('clarification');
    const passed = !mismatches.length; results.push({ id: c.id, passed, mismatches, actual: { requirements: next, clarification: call.tool === 'collectRequirements' ? call.clarification : null } });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${c.id}${mismatches.length ? ': ' + mismatches.join(', ') : ''}`);
  } catch (error) {
    // Errori soltanto sanitizzati, nessuna risposta grezza o credenziale.
    const safe = error instanceof Error && /Quota|Configura|rifiutato|incompleta|contraddittor|incomplete/.test(error.message) ? error.message : 'Errore di contratto o trasporto';
    results.push({ id: c.id, passed: false, mismatches: [safe] }); console.log(`FAIL ${c.id}: ${safe}`);
    if (/Quota|Configura|rifiutato/.test(safe)) break;
  }
}
const inputTokens = meter.state.inputTokens - start.inputTokens, outputTokens = meter.state.outputTokens - start.outputTokens;
const report = { executedAt: new Date().toISOString(), model: config.OPENAI_MODEL, promptVersion: PROMPT_VERSION, fixture: true, count: results.length, passed: results.filter(r => r.passed).length, usage: { inputTokens, outputTokens, estimatedStandardUsd: (inputTokens * 0.75 + outputTokens * 4.5) / 1_000_000, reservedUsd: meter.state.reservedUsd - start.reservedUsd }, results };
await writeJson(resolve('.local/evals', `${Date.now()}.json`), report);
console.log(JSON.stringify({ count: report.count, passed: report.passed, usage: report.usage }));
if (report.passed !== selected.length) process.exitCode = 1;
