import { z } from 'zod';
import { AreaSchema } from '../catalog/schema';

const position = { xMm: z.number().finite().min(0).max(1000), yMm: z.number().finite().min(0).max(1000) };
const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/);
const color = z.enum(['#000000', '#ffffff']);
export const SceneObjectSchema = z.discriminatedUnion('type', [
  z.strictObject({ id, type: z.literal('text'), ...position, text: z.string().min(1).max(120).refine(t => !/[\r\n\u0000-\u001f]/.test(t), 'Solo una riga nel laboratorio'), fontSizePt: z.number().min(7).max(48), fontFamily: z.literal('Arial'), fill: color }),
  z.strictObject({ id, type: z.literal('rect'), ...position, widthMm: z.number().positive().max(1000), heightMm: z.number().positive().max(1000), strokeMm: z.number().positive().max(2), stroke: color }),
]);
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export const DocumentSchema = z.strictObject({
  schemaVersion: z.literal(1), documentId: z.string().uuid(), revision: z.number().int().nonnegative(),
  productId: z.null(), variantId: z.null(), productProfileVersion: z.literal('TEST-stamp-v1'),
  fixture: z.literal(true), validatedForProduction: z.literal(false), areaMm: AreaSchema,
  objects: z.array(SceneObjectSchema).min(1).max(30),
}).superRefine((d, ctx) => {
  if (new Set(d.objects.map(o => o.id)).size !== d.objects.length) ctx.addIssue({ code: 'custom', message: 'ID duplicati' });
});
export type GraphicDocument = z.infer<typeof DocumentSchema>;
const base = { schemaVersion: z.literal(1), expectedRevision: z.number().int().nonnegative(), objectId: id };
export const GraphicCommandSchema = z.discriminatedUnion('tool', [
  z.strictObject({ ...base, tool: z.literal('moveObject'), arguments: z.strictObject(position) }),
  z.strictObject({ ...base, tool: z.literal('setText'), arguments: z.strictObject({ text: z.string().min(1).max(120) }) }),
  z.strictObject({ ...base, tool: z.literal('setObjectStyle'), arguments: z.strictObject({ fontSizePt: z.number().min(7).max(48), fill: color }) }),
]);
export type GraphicCommand = z.infer<typeof GraphicCommandSchema>;
export type Measure = (object: SceneObject) => { widthMm: number; heightMm: number };
export const TEST_MARGIN_MM = 1;
export function validateLayout(doc: GraphicDocument, measure: Measure): void {
  for (const object of doc.objects) {
    const box = measure(object);
    if (!Number.isFinite(box.widthMm) || !Number.isFinite(box.heightMm) || box.widthMm <= 0 || box.heightMm <= 0) throw new Error('Misurazione non valida');
    if (object.xMm < TEST_MARGIN_MM || object.yMm < TEST_MARGIN_MM || object.xMm + box.widthMm > doc.areaMm.width - TEST_MARGIN_MM || object.yMm + box.heightMm > doc.areaMm.height - TEST_MARGIN_MM) throw new Error('Oggetto fuori dall’area TEST o dal margine di 1 mm');
  }
}
export function applyGraphicCommand(doc: GraphicDocument, raw: unknown, measure: Measure): GraphicDocument {
  DocumentSchema.parse(doc);
  const command = GraphicCommandSchema.parse(raw);
  if (command.expectedRevision !== doc.revision) throw new Error('Revisione grafica obsoleta: rileggi il documento');
  const next = structuredClone(doc);
  const object = next.objects.find(o => o.id === command.objectId);
  if (!object) throw new Error('ID oggetto sconosciuto');
  switch (command.tool) {
    case 'moveObject': Object.assign(object, command.arguments); break;
    case 'setText':
      if (object.type !== 'text') throw new Error('Il comando richiede un testo');
      object.text = command.arguments.text; break;
    case 'setObjectStyle':
      if (object.type !== 'text') throw new Error('Il comando richiede un testo');
      Object.assign(object, command.arguments); break;
  }
  next.revision++;
  const parsed = DocumentSchema.parse(next);
  validateLayout(parsed, measure);
  return parsed;
}
export const createDocument = (): GraphicDocument => ({
  schemaVersion: 1, documentId: crypto.randomUUID(), revision: 0, productId: null, variantId: null,
  productProfileVersion: 'TEST-stamp-v1', fixture: true, validatedForProduction: false,
  areaMm: { width: 58, height: 22 },
  objects: [
    { id: 'frame-1', type: 'rect', xMm: 2, yMm: 2, widthMm: 54, heightMm: 18, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: 5, yMm: 7, text: 'TEST · Città', fontSizePt: 9, fontFamily: 'Arial', fill: '#000000' },
  ],
});

export interface HistoryEntry { source: 'manual' | 'ai-simulation' | 'undo' | 'redo' | 'import'; revision: number; objectId?: string; }
export class DocumentStore {
  document: GraphicDocument;
  readonly events: HistoryEntry[] = [];
  private past: GraphicDocument[] = [];
  private future: GraphicDocument[] = [];
  constructor(document: GraphicDocument, private readonly measure: Measure) {
    this.document = DocumentSchema.parse(document); validateLayout(this.document, measure);
  }
  dispatch(raw: unknown, source: 'manual' | 'ai-simulation'): void {
    const next = applyGraphicCommand(this.document, raw, this.measure);
    this.past.push(structuredClone(this.document)); this.future = [];
    this.document = next;
    this.events.push({ source, revision: next.revision, objectId: GraphicCommandSchema.parse(raw).objectId });
  }
  undo(): void { this.travel(this.past, this.future, 'undo'); }
  redo(): void { this.travel(this.future, this.past, 'redo'); }
  private travel(from: GraphicDocument[], to: GraphicDocument[], source: 'undo' | 'redo'): void {
    const target = from.pop(); if (!target) return;
    to.push(structuredClone(this.document));
    this.document = { ...target, revision: this.document.revision + 1 };
    this.events.push({ source, revision: this.document.revision });
  }
  import(raw: unknown): void {
    const next = DocumentSchema.parse(raw); validateLayout(next, this.measure);
    this.past.push(structuredClone(this.document)); this.future = [];
    // Revisione locale monotona: una risposta AI precedente non diventa valida dopo import/undo.
    this.document = { ...next, revision: this.document.revision + 1 };
    this.events.push({ source: 'import', revision: this.document.revision });
  }
}
