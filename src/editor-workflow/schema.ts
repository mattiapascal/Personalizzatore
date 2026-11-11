import { MAX_PROJECT_BYTES } from '../editor/project-limits';
import { z } from 'zod';
import { DocumentSchema } from '../editor/model';
import { InkColorSchema } from '../editor/ink';
const uuid = z.string().uuid();
export const ConfigurationOptionsSchema = z.strictObject({
  inkColor: InkColorSchema.default('black'),
});
export const FrozenConfigurationSchema = z.strictObject({
  id: uuid, createdAt: z.string().datetime(), title: z.string().trim().min(1).max(120),
  document: DocumentSchema, options: ConfigurationOptionsSchema,
  svg: z.string().min(1).max(MAX_PROJECT_BYTES),
});
export const LocalCartLineSchema = z.strictObject({
  id: uuid, configurationId: uuid, version: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
});
const receipt = z.strictObject({ id: uuid, fingerprint: z.string().length(64) });
export const ConfigurationStateSchema = z.strictObject({
  schemaVersion: z.literal(1), revision: z.number().int().nonnegative(),
  configurations: z.array(FrozenConfigurationSchema).max(200),
  lines: z.array(LocalCartLineSchema).max(50), receipts: z.array(receipt).max(500),
}).superRefine((state, ctx) => {
  const ids = new Set(state.configurations.map(c => c.id));
  if (ids.size !== state.configurations.length || new Set(state.lines.map(l => l.id)).size !== state.lines.length || state.lines.some(l => !ids.has(l.configurationId))) ctx.addIssue({ code: 'custom', message: 'Archivio configurazioni incoerente' });
  if(state.configurations.some(config=>config.document.inkColor&&config.document.inkColor!==config.options.inkColor))ctx.addIssue({code:'custom',message:'Colore dell’impronta diverso tra progetto e configurazione'});
});
const capture = FrozenConfigurationSchema.pick({ title: true, document: true, options: true, svg: true });
const base = { requestId: uuid };
const target = { lineId: uuid, expectedConfigurationId: uuid, expectedVersion: z.number().int().positive() };
export const ConfigurationCommandSchema = z.discriminatedUnion('tool', [
  z.strictObject({ ...base, tool: z.literal('add'), arguments: capture.extend({ quantity: z.number().int().min(1).max(999) }) }),
  z.strictObject({ ...base, tool: z.literal('replace'), arguments: capture.extend(target) }),
  z.strictObject({ ...base, tool: z.literal('quantity'), arguments: z.strictObject({ ...target, quantity: z.number().int().min(1).max(999) }) }),
  z.strictObject({ ...base, tool: z.literal('remove'), arguments: z.strictObject(target) }),
]).superRefine((command,ctx)=>{if((command.tool==='add'||command.tool==='replace')&&command.arguments.document.inkColor&&command.arguments.document.inkColor!==command.arguments.options.inkColor)ctx.addIssue({code:'custom',message:'Colore dell’impronta diverso tra progetto e configurazione'});});
export type ConfigurationCommand = z.infer<typeof ConfigurationCommandSchema>;
export type FrozenConfiguration = z.infer<typeof FrozenConfigurationSchema>;
export type ConfigurationState = z.infer<typeof ConfigurationStateSchema>;
export type ConfigurationOptions = z.infer<typeof ConfigurationOptionsSchema>;
export interface CartSummary {
  revision: number;
  lines: (z.infer<typeof LocalCartLineSchema> & { title: string; text: string; createdAt: string; widthMm: number; heightMm: number; options: ConfigurationOptions })[];
}
export function cartSummary(state: ConfigurationState): CartSummary {
  return { revision: state.revision, lines: state.lines.map(line => {
    const config = state.configurations.find(c => c.id === line.configurationId)!;
    return { ...line, title: config.title, text: config.document.objects.filter(o => o.type === 'text').map(o => o.text).join(' · '), createdAt: config.createdAt, widthMm: config.document.areaMm.width, heightMm: config.document.areaMm.height, options: { ...config.options } };
  }) };
}
