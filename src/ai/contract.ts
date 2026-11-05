import { z } from 'zod';
import { RequirementsSchema, MissingFieldSchema, type SelectionSession } from '../selection/schema.ts';
import { missingInformation, recommendProducts, questions } from '../selection/rules.ts';
import type { CatalogAdapter } from '../catalog/adapter.ts';
import { updateRequirements } from '../selection/session.ts';

const envelope = { schemaVersion: z.literal(1), expectedRevision: z.number().int().nonnegative(), expectedSessionId: z.string().uuid().optional() };
export const RequirementFieldSchema = z.enum(['family', 'mechanism', 'material', 'shape', 'diameterMm', 'lines', 'hasLogo', 'minimumAreaMm', 'sizeUnknown']);
export const AiToolSchema = z.discriminatedUnion('tool', [
  z.strictObject({ ...envelope, tool: z.literal('collectRequirements'), arguments: RequirementsSchema,
    clearFields: z.array(RequirementFieldSchema).max(9).optional(), clarification: z.string().min(1).max(300).nullable().optional() }),
  z.strictObject({ ...envelope, tool: z.literal('searchProducts'), arguments: RequirementsSchema }),
  z.strictObject({ ...envelope, tool: z.literal('recommendProducts'), arguments: z.strictObject({}) }),
  z.strictObject({ ...envelope, tool: z.literal('getProductProfile'), arguments: z.strictObject({ productId: z.string() }) }),
  z.strictObject({ ...envelope, tool: z.literal('askMissingInformation'), arguments: z.strictObject({ fields: z.array(MissingFieldSchema).max(3) }) }),
]);
export type AiTool = z.infer<typeof AiToolSchema>;
export interface AiProvider {
  readonly mode: 'mock' | 'server';
  propose(message: string, session: Readonly<SelectionSession>, signal: AbortSignal): Promise<unknown>;
}
export function executeTool(raw: unknown, session: SelectionSession, catalog: CatalogAdapter): { session: SelectionSession; result: unknown } {
  const call = AiToolSchema.parse(raw);
  if (call.expectedRevision !== session.revision) throw new Error('Revisione sessione obsoleta');
  if (call.expectedSessionId && call.expectedSessionId !== session.sessionId) throw new Error('Risposta appartenente a un’altra sessione');
  switch (call.tool) {
    case 'collectRequirements': return { session: updateRequirements(session, call.arguments, catalog, call.clearFields), result: null };
    case 'searchProducts': return { session, result: recommendProducts(catalog, call.arguments) };
    case 'recommendProducts': return { session, result: recommendProducts(catalog, session.requirements) };
    case 'getProductProfile': return { session, result: catalog.get(call.arguments.productId) };
    case 'askMissingInformation': {
      const missing = missingInformation(session.requirements);
      if (call.arguments.fields.some(f => !missing.includes(f))) throw new Error('Domanda non pertinente');
      return { session, result: call.arguments.fields.map(f => questions[f]) };
    }
  }
}
export async function interpret(provider: AiProvider, message: string, session: SelectionSession, timeoutMs = 25_000): Promise<AiTool> {
  if (!message.trim() || message.length > 1200) throw new Error('Scrivi da 1 a 1200 caratteri');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const raw = await Promise.race([
      provider.propose(message, structuredClone(session), controller.signal),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Provider non disponibile')); }, timeoutMs); }),
    ]);
    try { return AiToolSchema.parse(raw); } catch { throw new Error('Risposta AI non valida'); }
  } finally { clearTimeout(timer); controller.abort(); }
}
