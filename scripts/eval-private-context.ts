import { loadEnv } from 'vite';
import { resolve } from 'node:path';
import { readConfig } from '../server/config.ts';
import { Meter, tokenCost } from '../server/meter.ts';
import { makeOpenAiBody, proposeOpenAi, PROMPT_VERSION } from '../server/openai.ts';
import { AiRequestSchema } from '../src/ai/request.ts';
import { PrivacyVault } from '../src/privacy/redaction.ts';
import { mountFixtureCatalog } from '../src/catalog/adapter.ts';
import { initialInteraction, selectionInteraction } from '../src/selection/interaction.ts';
import { newSession } from '../src/selection/session.ts';
import { nextSelectionPrompt, modelQuestion } from '../src/selection/dialogue.ts';
import { adviseProducts } from '../src/selection/advisor.ts';
import { writeJson } from '../server/files.ts';

// Collaudo a pagamento autorizzato, solo frasi inventate e dati TEST oscurati.
// La mappa privata e il contenuto originale non entrano nel report o nel trasporto.
const config = readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env, AI_SHARE_CATALOG_CONTEXT: 'true' });
if (!config.OPENAI_API_KEY || config.AI_PROVIDER !== 'openai') throw new Error('Configura il provider prima della prova');
const meter = new Meter(resolve('.local/ai-meter.json')); await meter.load();
const start = structuredClone(meter.state), ceilingUsd = 0.12;
let reserveRun = 0, state = initialInteraction(newSession(mountFixtureCatalog));
const vault = new PrivacyVault(), history: { role: 'user' | 'assistant'; text: string }[] = [];
const results: { id: string; passed: boolean; facts: number; sessionUsd: number; diagnostic?: { requirements: unknown; purpose?: string; kind?: string; advice: string[]; clarification: boolean }; error?: string }[] = [];
const messages = ['Voglio fare un timbro per le tessere abbonamento del mio bar', 'un piccolo logo', 'caselline quadrate 15 x 15 mm'];
const synthetic = 'Persona Esempio\nAzienda Fittizia Srl\ncliente@example.test';
for (const [index, message] of [...messages, 'Testo: ' + synthetic].entries()) {
  if (index === 3) { state = initialInteraction(newSession(mountFixtureCatalog)); history.length = 0; vault.clear(); }
  const prompt = nextSelectionPrompt(state.session, state.contentBrief, mountFixtureCatalog);
  const prepared = vault.prepare(AiRequestSchema.parse({ message, sessionId: state.session.sessionId, revision: state.session.revision, requirements: state.session.requirements, contentBrief: state.contentBrief, lastQuestion: modelQuestion(prompt).slice(0, 300), lastQuestionField: prompt.field, recentMessages: history.slice(-6) }));
  const input = { ...prepared.request, privacyReviewed: true };
  const body = makeOpenAiBody(input, config, mountFixtureCatalog), serialized = JSON.stringify(body), payload = JSON.parse(body.input[0]!.content);
  for (const forbidden of ['Persona Esempio', 'Azienda Fittizia', 'cliente@example.test', input.sessionId]) if (serialized.includes(forbidden)) throw new Error('Preflight privacy non superato');
  if (!payload.catalogFacts?.length || payload.catalogFacts.length > 6 || serialized.includes('gid://')) throw new Error('Preflight catalogo non superato');
  const reserved = ((Buffer.byteLength(serialized, 'utf8') + 2048) * 0.75 + body.max_output_tokens * 4.5) / 1_000_000;
  if (reserveRun + reserved > ceilingUsd) throw new Error('Tetto del collaudo raggiunto');
  reserveRun += reserved;
  try {
    const response = await proposeOpenAi(input, config, meter, fetch, undefined, mountFixtureCatalog);
    const call = vault.restoreCall(response, prepared.localText);
    state = selectionInteraction(state, { type: 'tool', call }, mountFixtureCatalog);
    const passed = index === 0 ? state.contentBrief?.purpose === 'loyalty' && adviseProducts(mountFixtureCatalog, state.session.requirements, state.contentBrief)[0]?.productId.endsWith('/15106215805308') === true
      : index === 1 ? state.session.requirements.hasLogo === true && state.contentBrief?.purpose === 'loyalty'
        : index === 2 ? state.session.requirements.maximumAreaMm?.width === 15 && state.session.requirements.maximumAreaMm.height === 15
          : state.contentBrief?.text === synthetic && response.tool === 'collectRequirements' && !!response.contentBrief?.text?.includes('[RISERVATO_');
    results.push({ id: index < 3 ? 'loyalty-' + (index + 1) : 'opaque-content', passed, facts: payload.catalogFacts.length, sessionUsd: response.sessionUsage?.estimatedUsd ?? 0,
      ...(!passed ? { diagnostic: { requirements: state.session.requirements, purpose: state.contentBrief?.purpose, kind: state.contentBrief?.kind, advice: adviseProducts(mountFixtureCatalog, state.session.requirements, state.contentBrief).map(c => c.productId), clarification: !!state.clarification } } : {}) });
    history.push({ role: 'assistant', text: modelQuestion(prompt).slice(0, 300) }, { role: 'user', text: message });
  } catch { results.push({ id: 'turn-' + index, passed: false, facts: payload.catalogFacts.length, sessionUsd: 0, error: 'Errore provider/contratto; nessuna risposta grezza salvata' }); break; }
}
const usage = { inputTokens: meter.state.inputTokens - start.inputTokens, outputTokens: meter.state.outputTokens - start.outputTokens };
const report = { executedAt: new Date().toISOString(), fixture: true, model: config.OPENAI_MODEL, promptVersion: PROMPT_VERSION, ceilingUsd, reserveRun, usage: { ...usage, estimatedStandardUsd: tokenCost(usage.inputTokens, usage.outputTokens) }, results };
await writeJson(resolve('.local/evals', `private-context-${Date.now()}.json`), report);
console.log(JSON.stringify(report));
if (results.length !== 4 || results.some(r => !r.passed)) process.exitCode = 1;
