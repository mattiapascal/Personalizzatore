import { loadEnv } from 'vite';
import { resolve } from 'node:path';
import { readConfig } from '../server/config.ts';
import { Meter } from '../server/meter.ts';
import { makeOpenAiBody, proposeOpenAi, PROMPT_VERSION, type AiRequest } from '../server/openai.ts';
import { mountFixtureCatalog } from '../src/catalog/adapter.ts';
import { newSession } from '../src/selection/session.ts';
import { initialInteraction, selectionInteraction } from '../src/selection/interaction.ts';
import { nextSelectionPrompt, modelQuestion } from '../src/selection/dialogue.ts';
import { writeJson } from '../server/files.ts';
import { adviseProducts } from '../src/selection/advisor.ts';
import { PrivacyVault } from '../src/privacy/redaction.ts';

// Solo la sequenza TEST indicata dall'utente; nessun catalogo inviato al modello.
// Tetto aggiuntivo per esecuzione, indipendente dal contatore informativo della chat.
const ceilingUsd = 0.15;
const config = { ...readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env }), AI_SHARE_CATALOG_CONTEXT: false };
if (!config.OPENAI_API_KEY || config.AI_PROVIDER !== 'openai') throw new Error('Configurare il provider prima del collaudo');
const meter = new Meter(resolve('.local/ai-meter.json')); await meter.load();
const start = structuredClone(meter.state);
let reservedRun = 0, state = initialInteraction(newSession(mountFixtureCatalog));
const history: { role: 'user' | 'assistant'; text: string }[] = [];
const vault = new PrivacyVault();
const results: { turn: number; passed: boolean; call?: unknown; requirements?: unknown; brief?: unknown; error?: string }[] = [];
const messages = ['Voglio fare un timbro per le tessere abbonamento del mio bar', 'un piccolo logo', 'un logo', 'un timbro automatico', 'quadrata', 'automatico', '10 mm'];
for (const [index, message] of messages.entries()) {
  const prompt = nextSelectionPrompt(state.session, state.contentBrief, mountFixtureCatalog);
  const question = state.clarification ?? modelQuestion(prompt);
  const prepared = vault.prepare({ message, sessionId: state.session.sessionId, revision: state.session.revision, requirements: state.session.requirements, contentBrief: state.contentBrief, lastQuestionField: prompt.field, lastQuestion: question.slice(0, 300), recentMessages: history.slice(-6).map(m => ({ ...m, text: m.text.slice(-400) })), privacyReviewed: false });
  const input: AiRequest = { ...prepared.request, privacyReviewed: true };
  const body = JSON.stringify(makeOpenAiBody(input, config, mountFixtureCatalog));
  const payload = JSON.parse(makeOpenAiBody(input, config, mountFixtureCatalog).input[0]!.content);
  if ('catalogFacts' in payload || JSON.stringify(payload).includes('gid://shopify') || mountFixtureCatalog.list().some(p => JSON.stringify(payload).includes(p.title))) throw new Error('Il collaudo non deve inviare dati di catalogo');
  const reserve = ((Buffer.byteLength(body, 'utf8') + 2048) * 0.75 + 1600 * 4.5) / 1_000_000;
  if (reservedRun + reserve > ceilingUsd) throw new Error('Tetto del singolo collaudo raggiunto');
  reservedRun += reserve;
  try {
    const call = vault.restoreCall(await proposeOpenAi(input, config, meter, fetch, undefined, mountFixtureCatalog), prepared.localText);
    state = selectionInteraction(state, { type: 'tool', call }, mountFixtureCatalog);
    const requirements = state.session.requirements;
    const passed = (call.tool !== 'collectRequirements' || !call.clearFields?.length) && requirements.family === 'stamp' && state.contentBrief?.purpose === 'loyalty' && (index < 1 || (requirements.hasLogo === true && state.contentBrief?.kind === 'graphic')) && (index < 3 || requirements.mechanism === 'automatic') && (index < 4 || requirements.shape === 'square') && (index < 6 || (requirements.maximumAreaMm?.width === 10 && requirements.maximumAreaMm.height === 10 && !adviseProducts(mountFixtureCatalog, requirements, state.contentBrief).some(c => c.productId.endsWith('/15106215805308'))));
    results.push({ turn: index + 1, passed, call, requirements, brief: state.contentBrief });
    console.log(JSON.stringify({ turn: index + 1, passed, requirements, brief: state.contentBrief, clearFields: call.tool === 'collectRequirements' ? call.clearFields : [] }));
    history.push({ role: 'assistant', text: question }, { role: 'user', text: message });
  } catch (error) {
    const safe = error instanceof Error && /Misure AI|Diametro AI|Riserva prudenziale|Limite locale|provider/.test(error.message) ? error.message : 'Errore di trasporto o contratto';
    results.push({ turn: index + 1, passed: false, error: safe }); console.log(JSON.stringify({ turn: index + 1, passed: false, error: safe }));
    break;
  }
}
const report = { executedAt: new Date().toISOString(), fixture: true, promptVersion: PROMPT_VERSION, model: config.OPENAI_MODEL, ceilingUsd, reservedRun, usage: { inputTokens: meter.state.inputTokens - start.inputTokens, outputTokens: meter.state.outputTokens - start.outputTokens }, results };
await writeJson(resolve('.local/evals', `loyalty-${Date.now()}.json`), report);
console.log(JSON.stringify({ turns: results.length, passed: results.filter(r => r.passed).length, usage: report.usage, reservedRun }));
if (results.length !== messages.length || results.some(r => !r.passed)) process.exitCode = 1;
