import { loadEnv } from 'vite';
import { resolve } from 'node:path';
import { readConfig } from '../server/config.ts';
import { CatalogService } from '../server/catalog.ts';
import { createCatalog } from '../src/catalog/live-adapter.ts';
import { LocalKnowledge } from '../server/knowledge/local.ts';
import { Meter, tokenCost } from '../server/meter.ts';
import type { UsageMeter } from '../server/usage-meter.ts';
import { AiRequestSchema } from '../src/ai/request.ts';
import { PrivacyVault } from '../src/privacy/redaction.ts';
import { proposeOpenAi, PROMPT_VERSION } from '../server/openai.ts';
import { writeJson } from '../server/files.ts';
const config = readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env, AI_SHARE_CATALOG_CONTEXT: 'true', AI_ENFORCE_LOCAL_LIMITS: 'false' });
if (!config.OPENAI_API_KEY || config.AI_PROVIDER !== 'openai') throw new Error('Configurare OpenAI prima del collaudo reale');
const catalogService = new CatalogService(config, resolve('.local/catalog.json'));
await catalogService.load(); await catalogService.refresh();
const catalog = createCatalog(catalogService.state.snapshot, catalogService.state.version);
const knowledge = new LocalKnowledge(config, process.cwd(), () => catalog); await knowledge.load(); await knowledge.refresh();
const meter = new Meter(resolve('.local/ai-meter.json')); await meter.load(); const before = structuredClone(meter.state);
let reserved = 0;
const guarded: UsageMeter = {
  async reserve(usd, budget, maxRequests, _enforce, session) {
    const held = Object.values(meter.state.sessions).reduce((sum, value) => sum + value.heldUsd, 0);
    if (reserved + usd > 0.25 || tokenCost(before.inputTokens, before.outputTokens) + held + reserved + usd > 1) throw new Error('Tetto del collaudo raggiunto');
    reserved += usd; await meter.reserve(usd, budget, maxRequests, false, session);
  },
  record: (i, o, session) => meter.record(i, o, session), sessionUsage: (id, budget) => meter.sessionUsage(id, budget),
};
let sourceUrls: string[] = [];
const results: { id: string; passed: boolean; status: string; sources: (string | null)[] }[] = [];
const cases = [
  { id: 'faq-file', message: 'Posso inviarvi un file grafico già pronto per un timbro?' },
  { id: 'prodotto-targa', message: 'Di che materiale sono le targhe Crystal Sign?' },
  { id: 'seguito-prodotto', message: 'E posso applicarla all’esterno?' },
  { id: 'sito-spedizione', message: 'La spedizione è gratuita?' },
  { id: 'documento-locale', message: 'Potete controllare da questa chat lo stato del mio ordine?' },
  { id: 'fuori-tema', message: 'Scrivimi una ricetta per una torta al limone' },
];
for (const c of cases) {
  const vault = new PrivacyVault(catalog.list().map(p => p.title));
  let prepared = vault.prepare(AiRequestSchema.parse({ supportsStoreAnswers: true, message: c.message, sessionId: crypto.randomUUID(), revision: 0, requirements: {}, lastQuestion: null, ...(c.id === 'seguito-prodotto' ? { sourceUrls } : {}) }));
  if (prepared.needsReview) prepared = vault.review(prepared, Object.fromEntries(prepared.parts.map(part => [part.token, 'generic'])));
  const call = await proposeOpenAi(prepared.request, config, guarded, fetch, undefined, catalog, knowledge.provider);
  let passed = false; let status: string = call.tool; let urls: (string | null)[] = [];
  if (call.tool === 'answerStoreQuestion') {
    status = call.arguments.status; urls = call.arguments.blocks.map(b => b.url);
    const text = call.arguments.blocks.map(b => b.text).join('\n');
    if (c.id === 'faq-file') passed = status === 'answered' && /vettorial|alta risoluzione/i.test(text);
    if (c.id === 'prodotto-targa') { passed = status === 'answered' && /acril|plexiglas/i.test(text); sourceUrls = urls.filter((u): u is string => !!u); }
    if (c.id === 'seguito-prodotto') passed = (status === 'not_found' || status === 'answered' && /intern|estern/i.test(text)) && urls.every(u => u !== null && sourceUrls.includes(u));
    if (c.id === 'sito-spedizione') passed = status === 'answered' && /100/.test(text) && /gratuit/i.test(text);
    if (c.id === 'documento-locale') passed = status === 'answered' && urls.includes(null) && /non accede agli ordini/i.test(text);
  } else if (c.id === 'fuori-tema' && call.tool === 'collectRequirements') passed = call.dialogueAct === 'off_topic' && !Object.keys(call.arguments).length;
  results.push({ id: c.id, passed, status, sources: urls }); console.log(JSON.stringify(results.at(-1)));
}
const usage = { inputTokens: meter.state.inputTokens - before.inputTokens, outputTokens: meter.state.outputTokens - before.outputTokens };
const report = { executedAt: new Date().toISOString(), synthetic: true, model: config.OPENAI_MODEL, promptVersion: PROMPT_VERSION, results, reservedRunUsd: reserved, estimatedStandardUsd: tokenCost(usage.inputTokens, usage.outputTokens), usage };
await writeJson(resolve('.local/evals', `knowledge-${Date.now()}.json`), report); console.log(JSON.stringify({ passed: results.filter(r => r.passed).length, total: results.length, estimatedStandardUsd: report.estimatedStandardUsd }));
if (results.some(r => !r.passed)) process.exitCode = 1;
