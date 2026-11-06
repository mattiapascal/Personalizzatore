import { loadEnv } from 'vite';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { z } from 'zod';
import casesJson from '../fixtures/ai/requirements.TEST.json' with { type: 'json' };
import mountsJson from '../fixtures/ai/mounts.TEST.json' with { type: 'json' };
import dialogueJson from '../fixtures/ai/dialogue.TEST.json' with { type: 'json' };
import domainJson from '../fixtures/ai/domain.TEST.json' with { type: 'json' };
import { ContentBriefSchema } from '../src/selection/content.ts';
import { DialogueActSchema } from '../src/ai/contract.ts';
import { RequirementsSchema } from '../src/selection/schema.ts';
import { fixtureCatalog } from '../src/catalog/adapter.ts';
import { executeTool, RequirementFieldSchema } from '../src/ai/contract.ts';
import { newSession } from '../src/selection/session.ts';
import { readConfig } from '../server/config.ts';
import { Meter } from '../server/meter.ts';
import { makeOpenAiBody, proposeOpenAi, PROMPT_VERSION } from '../server/openai.ts';
import { writeJson } from '../server/files.ts';
import { PrivacyVault } from '../src/privacy/redaction.ts';
import { AiRequestSchema } from '../src/ai/request.ts';

const mounts = process.argv[2] === '--mounts', dialogue = process.argv[2] === '--dialogue', domain = process.argv[2] === '--domain';
const cases = z.object({ fixture: z.literal(true), cases: z.array(z.object({ id: z.string(), message: z.string(), requirements: RequirementsSchema, lastQuestion: z.string().nullable(), expected: RequirementsSchema, absent: z.array(RequirementFieldSchema).optional(), clarification: z.boolean().optional(), expectedBrief: ContentBriefSchema.optional(), dialogueAct: DialogueActSchema.optional() })) }).parse(domain ? domainJson : dialogue ? dialogueJson : mounts ? mountsJson : casesJson).cases;
// I collaudi dell'agente mantengono il tetto autorizzato anche se la chat usa i limiti dell'account.
const config = { ...readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env }), AI_ENFORCE_LOCAL_LIMITS: !domain };
if (config.AI_PROVIDER !== 'openai' || !config.OPENAI_API_KEY || config.AI_BUDGET_USD <= 0) throw new Error('Configurare chiave e budget in .env.local prima del collaudo reale');
const meter = new Meter(resolve('.local/ai-meter.json')); await meter.load();
const start = structuredClone(meter.state);
let domainReserve = 0;
const id = process.argv[mounts || dialogue || domain ? 3 : 2];
const selected = id ? cases.filter(c => c.id === id) : cases;
if (!selected.length) throw new Error('Caso di collaudo sconosciuto');
const results: { id: string; passed: boolean; mismatches: string[]; actual?: unknown }[] = [];
for (const c of selected) {
  try {
    const session = { ...newSession(fixtureCatalog), requirements: c.requirements };
    const vault = new PrivacyVault();
    const prepared = vault.prepare(AiRequestSchema.parse({ message: c.message, sessionId: session.sessionId, revision: session.revision, requirements: session.requirements, lastQuestion: c.lastQuestion, recentMessages: [] }));
    if (domain) {
      // Registro storico conservato; tetti aggiuntivi di 0,12 USD per esecuzione e 1 USD aggregato.
      const body = makeOpenAiBody({ ...prepared.request, privacyReviewed: true }, config);
      const bound = ((Buffer.byteLength(JSON.stringify(body), 'utf8') + 2048) * 0.75 + body.max_output_tokens * 4.5) / 1_000_000;
      const held = Object.values(meter.state.sessions).reduce((sum, counter) => sum + counter.heldUsd, 0);
      if (domainReserve + bound > 0.12 || (start.inputTokens * 0.75 + start.outputTokens * 4.5) / 1_000_000 + held + domainReserve + bound > 1) throw new Error('Limite locale del collaudo raggiunto');
      domainReserve += bound;
    }
    const call = vault.restoreCall(await proposeOpenAi({ ...prepared.request, privacyReviewed: true }, config, meter), prepared.localText);
    const next = executeTool(call, session, fixtureCatalog).session.requirements;
    const mismatches = Object.entries(c.expected).filter(([key, value]) => !isDeepStrictEqual(next[key as keyof typeof next], value)).map(([key]) => key);
    for (const field of c.absent ?? []) if (next[field] !== undefined) mismatches.push(`absent:${field}`);
    if (c.clarification && (call.tool !== 'collectRequirements' || !call.clarification)) mismatches.push('clarification');
    if (c.dialogueAct && (call.tool !== 'collectRequirements' || call.dialogueAct !== c.dialogueAct)) mismatches.push('dialogueAct');
    for (const [key, value] of Object.entries(c.expectedBrief ?? {})) if (call.tool !== 'collectRequirements' || !isDeepStrictEqual(call.contentBrief?.[key as keyof NonNullable<typeof call.contentBrief>], value)) mismatches.push('brief:' + key);
    const passed = !mismatches.length; results.push({ id: c.id, passed, mismatches, actual: { requirements: next, clarification: call.tool === 'collectRequirements' ? call.clarification : null, ...(call.tool === 'collectRequirements' ? { dialogueAct: call.dialogueAct, contentBrief: call.contentBrief } : {}) } });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${c.id}${mismatches.length ? ': ' + mismatches.join(', ') : ''}`);
  } catch (error) {
    // Errori soltanto sanitizzati, nessuna risposta grezza o credenziale.
    const safe = error instanceof Error && /Quota|Riserva prudenziale|Limite locale|Configura|rifiutato|incompleta|contraddittor|incomplete/.test(error.message) ? error.message : 'Errore di contratto o trasporto';
    results.push({ id: c.id, passed: false, mismatches: [safe] }); console.log(`FAIL ${c.id}: ${safe}`);
    if (/Quota|Riserva prudenziale|Limite locale|Configura|rifiutato/.test(safe)) break;
  }
}
const inputTokens = meter.state.inputTokens - start.inputTokens, outputTokens = meter.state.outputTokens - start.outputTokens;
const report = { executedAt: new Date().toISOString(), model: config.OPENAI_MODEL, promptVersion: PROMPT_VERSION, fixture: true, count: results.length, passed: results.filter(r => r.passed).length, usage: { inputTokens, outputTokens, estimatedStandardUsd: (inputTokens * 0.75 + outputTokens * 4.5) / 1_000_000, reservedUsd: meter.state.reservedUsd - start.reservedUsd }, results };
await writeJson(resolve('.local/evals', `${Date.now()}.json`), report);
console.log(JSON.stringify({ count: report.count, passed: report.passed, usage: report.usage }));
if (report.passed !== selected.length) process.exitCode = 1;
