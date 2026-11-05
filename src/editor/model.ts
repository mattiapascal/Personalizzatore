import { z } from 'zod';
import { AreaSchema, ShapeSchema, type ProductProfile } from '../catalog/schema';

const position = { xMm: z.number().finite().min(0).max(1000), yMm: z.number().finite().min(0).max(1000) };
const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/);
const color = z.enum(['#000000', '#ffffff']);
const textContent = z.string().min(1).max(480).refine(t => !/[\r\u0000-\u0009\u000b-\u001f]/.test(t) && t.split('\n').length <= 8, 'Massimo 8 righe di testo nel laboratorio');
export const SceneObjectSchema = z.discriminatedUnion('type', [
  z.strictObject({ id, type: z.literal('text'), ...position, text: textContent, fontSizePt: z.number().min(7).max(48), fontFamily: z.literal('Arial'), fill: color }),
  z.strictObject({ id, type: z.literal('rect'), ...position, widthMm: z.number().positive().max(1000), heightMm: z.number().positive().max(1000), strokeMm: z.number().positive().max(2), stroke: color }),
  z.strictObject({ id, type: z.literal('circle'), ...position, radiusMm: z.number().positive().max(500), strokeMm: z.number().positive().max(2), stroke: color }),
]);
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export const DocumentSchema = z.strictObject({
  schemaVersion: z.literal(1), documentId: z.string().uuid(), revision: z.number().int().nonnegative(),
  productId: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/).nullable(),
  variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/).nullable(),
  catalogVersion: z.string().min(1).nullable().default(null),
  catalogProductProfileVersion: z.number().int().positive().nullable().default(null),
  productProfileVersion: z.literal('TEST-stamp-v1'),
  fixture: z.literal(true), validatedForProduction: z.literal(false), areaMm: AreaSchema, shape: ShapeSchema.default('rectangle'),
  objects: z.array(SceneObjectSchema).min(1).max(30),
}).superRefine((d, ctx) => {
  if (new Set(d.objects.map(o => o.id)).size !== d.objects.length) ctx.addIssue({ code: 'custom', message: 'ID duplicati' });
  const binding = [d.productId, d.variantId, d.catalogVersion, d.catalogProductProfileVersion];
  if (binding.some(v => v !== null) && binding.some(v => v === null)) ctx.addIssue({ code: 'custom', message: 'Associazione catalogo incompleta' });
  if (d.shape !== 'rectangle' && d.areaMm.width !== d.areaMm.height) ctx.addIssue({ code: 'custom', message: 'Area tonda o quadrata richiede lati uguali' });
});
export type GraphicDocument = z.infer<typeof DocumentSchema>;
const base = { schemaVersion: z.literal(1), expectedRevision: z.number().int().nonnegative(), objectId: id };
export const GraphicCommandSchema = z.discriminatedUnion('tool', [
  z.strictObject({ ...base, tool: z.literal('moveObject'), arguments: z.strictObject(position) }),
  z.strictObject({ ...base, tool: z.literal('setText'), arguments: z.strictObject({ text: textContent }) }),
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
    if (doc.shape === 'round') {
      const radius = doc.areaMm.width / 2, limit = radius - TEST_MARGIN_MM;
      const outside = object.type === 'circle'
        ? Math.hypot(object.xMm + box.widthMm / 2 - radius, object.yMm + box.heightMm / 2 - radius) + Math.max(box.widthMm, box.heightMm) / 2 > limit
        : [[object.xMm, object.yMm], [object.xMm + box.widthMm, object.yMm], [object.xMm, object.yMm + box.heightMm], [object.xMm + box.widthMm, object.yMm + box.heightMm]].some(([x, y]) => Math.hypot(x! - radius, y! - radius) > limit);
      if (outside) throw new Error('Oggetto fuori dall’area circolare TEST: gli angoli devono entrare nel cerchio');
    }
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
export const createDocument = (product?: ProductProfile, catalogVersion?: string): GraphicDocument => ({
  schemaVersion: 1, documentId: crypto.randomUUID(), revision: 0, productId: null, variantId: null,
  catalogVersion: null, catalogProductProfileVersion: null,
  productProfileVersion: 'TEST-stamp-v1', fixture: true, validatedForProduction: false,
  areaMm: product ? structuredClone(product.nominalAreaMm) : { width: 58, height: 22 }, shape: product?.shape ?? 'rectangle',
  ...(product ? bindingFor(product, catalogVersion!) : {}),
  objects: product?.shape === 'round' ? [
    { id: 'frame-1', type: 'circle', xMm: 2, yMm: 2, radiusMm: product.nominalAreaMm.width / 2 - 2, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: Math.max(2, product.nominalAreaMm.width / 2 - 4), yMm: product.nominalAreaMm.height / 2 - 2, text: 'TEST', fontSizePt: 7, fontFamily: 'Arial', fill: '#000000' },
  ] : product && (product.nominalAreaMm.width < 35 || product.nominalAreaMm.height < 18) ? [
    { id: 'frame-1', type: 'rect', xMm: 2, yMm: 2, widthMm: product.nominalAreaMm.width - 4, heightMm: product.nominalAreaMm.height - 4, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: 2, yMm: Math.max(2, product.nominalAreaMm.height / 2 - 1.5), text: 'IS', fontSizePt: 7, fontFamily: 'Arial', fill: '#000000' },
  ] : [
    { id: 'frame-1', type: 'rect', xMm: 2, yMm: 2, widthMm: (product?.nominalAreaMm.width ?? 58) - 4, heightMm: (product?.nominalAreaMm.height ?? 22) - 4, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: 5, yMm: 7, text: 'TEST · Città', fontSizePt: 9, fontFamily: 'Arial', fill: '#000000' },
  ],
});

function bindingFor(product: ProductProfile, catalogVersion: string) {
  if (product.status !== 'ACTIVE' || !catalogVersion || !product.variantIds[0]) throw new Error('Profilo catalogo non utilizzabile');
  return { productId: product.productId, variantId: product.variantIds[0], catalogVersion, catalogProductProfileVersion: product.profileVersion };
}

export interface HistoryEntry { source: 'manual' | 'ai-simulation' | 'undo' | 'redo' | 'import' | 'product-change'; revision: number; objectId?: string; }
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
    let next = DocumentSchema.parse(raw);
    if (this.document.productId) {
      if (next.areaMm.width !== this.document.areaMm.width || next.areaMm.height !== this.document.areaMm.height || next.shape !== this.document.shape) throw new Error('Area del JSON diversa dal prodotto corrente');
      if (next.productId && (next.productId !== this.document.productId || next.variantId !== this.document.variantId || next.catalogVersion !== this.document.catalogVersion || next.catalogProductProfileVersion !== this.document.catalogProductProfileVersion)) throw new Error('JSON associato a un altro prodotto o versione catalogo');
      next = { ...next, productId: this.document.productId, variantId: this.document.variantId, catalogVersion: this.document.catalogVersion, catalogProductProfileVersion: this.document.catalogProductProfileVersion };
    }
    validateLayout(next, this.measure);
    this.past.push(structuredClone(this.document)); this.future = [];
    // Revisione locale monotona: una risposta AI precedente non diventa valida dopo import/undo.
    this.document = { ...next, revision: this.document.revision + 1 };
    this.events.push({ source: 'import', revision: this.document.revision });
  }
  changeProduct(product: ProductProfile, catalogVersion: string): void {
    const next = DocumentSchema.parse({ ...this.document, ...bindingFor(product, catalogVersion), areaMm: structuredClone(product.nominalAreaMm), shape: product.shape, revision: this.document.revision + 1 });
    validateLayout(next, this.measure);
    this.document = next;
    this.past = []; this.future = [];
    this.events.push({ source: 'product-change', revision: next.revision });
  }
}
