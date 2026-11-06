import { z } from 'zod';
import { AiToolSchema, RequirementFieldSchema, DialogueActSchema, type AiTool } from '../src/ai/contract.ts';
import type { Requirements } from '../src/selection/schema.ts';
import type { Config } from './config.ts';
import type { UsageMeter } from './usage-meter.ts';
import { MechanismSchema, ShapeSchema, MaterialSchema } from '../src/catalog/schema.ts';
import { AiRequestSchema, type AiRequest } from '../src/ai/request.ts';
import { assertProtectedRequest } from '../src/privacy/redaction.ts';
import { interpretationInstructions } from './interpretation-prompt.ts';
import type { CatalogAdapter } from '../src/catalog/adapter.ts';
import { advisoryFacts } from '../src/selection/advisor.ts';
export { PROMPT_VERSION } from './interpretation-prompt.ts';

export { AiRequestSchema, type AiRequest };
export const ArgumentsSchema = z.strictObject({
  dialogueAct: DialogueActSchema.nullable(),
  changeIntent: z.enum(['update', 'withdraw']).nullable(), clearEvidence: z.string().min(1).max(1200).nullable(),
  contentText: z.string().trim().min(1).max(480).nullable(),
  contentKind: z.enum(['text', 'graphic', 'mixed']).nullable(),
  purpose: z.enum(['business', 'exlibris', 'loyalty', 'general']).nullable(),
  graphicSubject: z.string().trim().min(1).max(300).nullable(),
  family: z.enum(['stamp', 'other']).nullable(), mechanism: MechanismSchema.nullable(), material: MaterialSchema.nullable(),
  shape: ShapeSchema.nullable(), diameterMm: z.number().positive().max(1000).nullable(), lines: z.number().int().min(1).max(30).nullable(),
  hasLogo: z.boolean().nullable(), widthMm: z.number().positive().max(1000).nullable().describe('Larghezza minima richiesta in millimetri; convertire i cm moltiplicando per 10, senza chiedere al cliente di convertirli.'), heightMm: z.number().positive().max(1000).nullable().describe('Altezza minima richiesta in millimetri; convertire i cm moltiplicando per 10.'),
  targetWidthMm: z.number().positive().max(1000).nullable(), targetHeightMm: z.number().positive().max(1000).nullable(),
  sizeUnknown: z.boolean().nullable(), clearFields: z.array(RequirementFieldSchema).max(11),
  clarification: z.string().min(1).max(300).nullable(),
});
const instructions = interpretationInstructions;

export function proposalFromArguments(raw: unknown, revision: number, context?: Pick<AiRequest, 'message' | 'requirements' | 'lastQuestion' | 'lastQuestionField' | 'contentBrief'>): AiTool {
  const args = ArgumentsSchema.parse(raw);
  if (args.dialogueAct && args.dialogueAct !== 'answer') return AiToolSchema.parse({ schemaVersion: 1, tool: 'collectRequirements', expectedRevision: revision, arguments: {}, clearFields: [], dialogueAct: args.dialogueAct, clarification: args.clarification });
  const patch: Requirements = {};
  const contentBrief = { ...(args.contentText ? { text: args.contentText } : {}), ...(args.contentKind ? { kind: args.contentKind } : {}), ...(args.purpose ? { purpose: args.purpose } : {}), ...(args.graphicSubject ? { graphicSubject: args.graphicSubject } : {}) };
  for (const field of ['family', 'mechanism', 'material', 'shape', 'lines', 'hasLogo'] as const) {
    if (args[field] !== null) Object.assign(patch, { [field]: args[field] });
  }
  const shape = args.shape ?? context?.requirements.shape;
  let width = args.widthMm, height = args.heightMm, diameter = args.diameterMm, clarification = args.clarification;
  const hasMeasurement = width !== null || height !== null || diameter !== null;
  if (args.sizeUnknown === true && hasMeasurement) {
    width = height = diameter = null;
    clarification = 'Vuoi usare le misure che hai indicato oppure preferisci esplorare i formati senza una misura precisa?';
  } else if (diameter !== null && (width !== null || height !== null || (shape && shape !== 'round'))) {
    const proposedDiameter = diameter;
    width = height = diameter = null;
    clarification = 'Intendi un’impronta rotonda con diametro ' + proposedDiameter + ' mm?';
  } else if ((width === null) !== (height === null)) {
    if (shape === 'square') { width = height = width ?? height; clarification = null; }
    else {
      const value = width ?? height;
      clarification = shape === 'round' ? 'Intendi un diametro di ' + value + ' mm?' : width !== null
        ? 'La larghezza è ' + value + ' mm. Quale altezza vorresti, in mm?'
        : 'L’altezza è ' + value + ' mm. Quale larghezza vorresti, in mm?';
      width = height = null;
    }
  }
  if (width !== null && height !== null) {
    patch.minimumAreaMm = { width, height }; patch.diameterMm = null;
    patch.sizeUnknown = false; patch.sizeIsEstimate = false;
  }
  if (diameter !== null) {
    patch.diameterMm = diameter; patch.shape = 'round'; patch.minimumAreaMm = null;
    patch.sizeUnknown = false; patch.sizeIsEstimate = false;
  }
  if (args.sizeUnknown === true && !hasMeasurement) {
    patch.sizeUnknown = true; patch.minimumAreaMm = null; patch.maximumAreaMm = null; patch.diameterMm = null; patch.sizeIsEstimate = false;
  }
  let targetWidth = args.targetWidthMm, targetHeight = args.targetHeightMm;
  // Risposte alla domanda sulle caselline descrivono un limite massimo,
  // anche se il provider usa i campi generici della misura dell'impronta.
  if (context?.lastQuestionField === 'targetArea' && targetWidth === null && targetHeight === null) {
    targetWidth = args.widthMm; targetHeight = args.heightMm;
  }
  if (context?.lastQuestionField === 'targetArea') { delete patch.minimumAreaMm; delete patch.diameterMm; }
  if ((targetWidth === null) !== (targetHeight === null) && shape === 'square') targetWidth = targetHeight = targetWidth ?? targetHeight;
  if (targetWidth !== null && targetHeight !== null) {
    patch.maximumAreaMm = { width: targetWidth, height: targetHeight }; patch.sizeUnknown = false;
    clarification = null;
  } else if (targetWidth !== null || targetHeight !== null) {
    const value = targetWidth ?? targetHeight;
    clarification = 'Le caselline sono quadrate di ' + value + ' × ' + value + ' mm, oppure hanno un’altra misura sul secondo lato?';
  }
  // Un normale aggiornamento non può ritirare altre scelte. Il ritiro deve avere
  // intento distinto e una citazione presente nel messaggio corrente, mai nello storico.
  const evidence = args.clearEvidence?.normalize('NFKC').toLocaleLowerCase('it').trim();
  const canWithdraw = args.changeIntent === 'withdraw' && evidence && (!context || context.message.normalize('NFKC').toLocaleLowerCase('it').includes(evidence));
  const clearFields = canWithdraw ? args.clearFields.filter(field => !(field in patch) && (!context || context.requirements[field] !== undefined)) : [];
  return AiToolSchema.parse({ schemaVersion: 1, tool: 'collectRequirements', expectedRevision: revision, arguments: patch, clearFields, dialogueAct: args.dialogueAct ?? 'answer', ...(Object.keys(contentBrief).length ? { contentBrief } : {}), clarification });
}

export function makeOpenAiBody(input: AiRequest, config: Config, catalog?: CatalogAdapter) {
  assertProtectedRequest(input, catalog?.list().map(p => p.title));
  return {
    model: config.OPENAI_MODEL, store: false, instructions,
    input: [{ role: 'user', content: JSON.stringify({ message: input.message, requirements: input.requirements, contentBrief: input.contentBrief ?? {}, lastQuestion: input.lastQuestion, lastQuestionField: input.lastQuestionField ?? null, recentMessages: input.recentMessages, ...(catalog && config.AI_SHARE_CATALOG_CONTEXT ? { catalogFacts: advisoryFacts(catalog, input.requirements, input.contentBrief).map(({ title, mechanism, shape, nominalAreaMm, uses }) => ({ title: title.slice(0, 160), mechanism, shape, nominalAreaMm, uses: uses?.slice(0, 2).map(u => ({ purpose: u.purpose, evidence: u.evidence.slice(0, 120) })) })) } : {}) }) }],
    tools: [{ type: 'function', name: 'collect_requirements', description: 'Raccoglie gli attributi espressi e chiede chiarimenti senza selezionare prodotti.', strict: true, parameters: z.toJSONSchema(ArgumentsSchema) }],
    tool_choice: { type: 'function', name: 'collect_requirements' }, parallel_tool_calls: false,
    reasoning: { effort: 'low' }, max_output_tokens: 1600,
  };
}

export async function proposeOpenAi(input: AiRequest, config: Config, meter: UsageMeter, fetcher: typeof fetch = fetch, signal?: AbortSignal, catalog?: CatalogAdapter): Promise<AiTool> {
  if (config.AI_PROVIDER !== 'openai' || !config.OPENAI_API_KEY || (config.AI_ENFORCE_LOCAL_LIMITS && config.AI_BUDGET_USD <= 0)) throw new Error('Configura AI_PROVIDER, OPENAI_API_KEY e AI_BUDGET_USD nel file .env.local');
  const body = makeOpenAiBody(input, config, catalog);
  const serialized = JSON.stringify(body);
  // Riserva conservativa: nessun rimborso su timeout/errori. Listino standard USD verificato 05/11/2026.
  const reserved = ((new TextEncoder().encode(serialized).length + 2048) * 0.75 + body.max_output_tokens * 4.5) / 1_000_000;
  await meter.reserve(reserved, config.AI_BUDGET_USD, config.AI_MAX_REQUESTS, config.AI_ENFORCE_LOCAL_LIMITS, { id: input.sessionId, budgetUsd: config.AI_SESSION_BUDGET_USD });
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: serialized, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
    redirect: 'manual',
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'Limite del provider AI raggiunto. Riprova più tardi.' : 'Il provider AI ha rifiutato la richiesta. Controlla configurazione e accesso al modello.');
  const rawText = await response.text();
  if (rawText.length > 100_000) throw new Error('Risposta AI troppo grande');
  const result = z.object({
    status: z.string(), output: z.array(z.object({ type: z.string(), name: z.string().optional(), arguments: z.string().optional() }).passthrough()),
    usage: z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() }),
  }).parse(JSON.parse(rawText));
  await meter.record(result.usage.input_tokens, result.usage.output_tokens, { id: input.sessionId, reservedUsd: reserved });
  const calls = result.output.filter(item => item.type === 'function_call');
  if (result.status !== 'completed' || calls.length !== 1 || calls[0]!.name !== 'collect_requirements' || !calls[0]!.arguments) throw new Error('Risposta AI incompleta o non valida. Puoi riprovare: i requisiti sono conservati.');
  return AiToolSchema.parse({ ...proposalFromArguments(JSON.parse(calls[0]!.arguments!), input.revision, input), expectedSessionId: input.sessionId, sessionUsage: meter.sessionUsage(input.sessionId, config.AI_SESSION_BUDGET_USD) });
}
