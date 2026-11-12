import { OpacitySchema, PaintOpacityFields } from './paint-opacity';
import {clearBackground,replaceBackgroundObjects,backgroundObjectIds} from './background';
import {coverRasterReplacement} from './raster-replacement';
import { UnverifiedTextGeometryError } from './unverified-text-geometry';
import { StrokeWidthSchema } from './stroke';
import {ColorSchema,PaintSchema,isMonochromePaint} from './paint';
import {ObjectPropertiesSchema,GroupPropertiesSchema,effectiveObjectProperties,assertObjectPolicies,type EditorRole} from './object-properties';
import {cloneSceneGroup} from './scene-groups';
import {PlaqueMountingSchema,plaqueMountingPoints} from './plaque';
import { FontAssetsSchema, FontIdSchema } from './font-assets';
import { fitComposition } from './format-adaptation';
import { InkColorSchema } from './ink';
import { EDITOR_LIMITS } from './limits';
import { assertDocumentTextProduction, assertMinimumText, minimumFontForProduct } from './text-production';
import { VectorCommandsSchema, VectorClipSchema, vectorBounds, vectorContours } from './vector-geometry';
import { attachTextPath, detachTextPath, updateTextPath, preserveTextPathGuide } from './text-path-model';
import { TextPathSchema, TextPathOptionsSchema } from './text-path-spec';
import { JustificationSchema } from './justification';
import { z } from 'zod';
import { AreaSchema, ShapeSchema, profileKey, type ProductProfile } from '../catalog/schema';
import { applySelectionCommand, isSelectionCommand, selectionUnits } from './selection';
import { ellipseIntersectsArea } from './ellipse-intersection';
import { pathIntersectsArea } from './path-intersection';
import { FONT_FAMILIES } from './fonts';
import { RasterSourceSchema } from './raster-source';
import { RasterParametersSchema } from './raster-processing';
import { RasterCropSchema, checkedRasterCrop } from './raster-geometry';
import { areaAlignmentDelta } from './align-area';
import { BezierNodeSchema, bezierBounds, flattenBezier, MAX_BEZIER_NODES } from './bezier-geometry';

const position = { xMm: z.number().finite().min(-1000).max(1000), yMm: z.number().finite().min(-1000).max(1000) };
const rotation = z.number().finite().min(-180).max(180);
const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/);
const color = ColorSchema;
const paint = PaintSchema;
const fontFamily = z.union([z.enum(FONT_FAMILIES), FontIdSchema]);
const textStrokeWidth = z.number().finite().min(0).max(EDITOR_LIMITS.maxStrokeMm);
const textStrokeFields = { stroke: paint.optional(), strokeMm: textStrokeWidth.optional(), strokeOpacity: OpacitySchema.optional() };
export const CharacterStyleSchema = z.strictObject({
  ...textStrokeFields,
  fontSizePt: z.number().finite().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt).optional(), fontFamily: fontFamily.optional(), fill: color.optional(), fillOpacity: OpacitySchema.optional(),
  kerningPt: z.number().finite().min(EDITOR_LIMITS.minTrackingPt).max(EDITOR_LIMITS.maxTrackingPt).optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(), fontStyle: z.enum(['normal', 'italic']).optional(), underline: z.boolean().optional(), linethrough: z.boolean().optional(), overline: z.boolean().optional(),
});
export type CharacterStyle = z.infer<typeof CharacterStyleSchema>;
const characterRuns = z.array(z.strictObject({ start: z.number().int().nonnegative(), end: z.number().int().positive(), style: CharacterStyleSchema })).max(EDITOR_LIMITS.textCharacters).optional();
const textScale = z.number().finite().min(0.1).max(10);
export const TextAlignmentSchema = z.enum(['left', 'center', 'right', 'justify-left']);
export type TextAlignment = z.infer<typeof TextAlignmentSchema>;
const lineStyles = z.array(z.strictObject({ start: z.number().int().nonnegative(), end: z.number().int().nonnegative(), alignment: TextAlignmentSchema })).max(EDITOR_LIMITS.textCharacters+1).optional();
const textAppearance = {
  ...textStrokeFields,
  strokeLineCap: z.enum(['butt', 'round', 'square']).optional(), strokeLineJoin: z.enum(['miter', 'round', 'bevel']).optional(), strokeMiterLimit: z.number().finite().min(1).max(100).optional(), paintFirst: z.enum(['fill', 'stroke']).optional(),
  fillOpacity: OpacitySchema.optional(),
  lineStyles, justification: JustificationSchema.optional(), textPath: TextPathSchema.optional(),
  textScaleX: textScale.optional(),
  textScaleY: textScale.optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(), fontStyle: z.enum(['normal', 'italic']).optional(), underline: z.boolean().optional(), linethrough: z.boolean().optional(), overline: z.boolean().optional(),
  textAlign: TextAlignmentSchema.optional(), lineHeight: z.number().finite().min(EDITOR_LIMITS.minLineHeight).max(EDITOR_LIMITS.maxLineHeight).optional(),
  letterSpacingPt: z.number().finite().min(EDITOR_LIMITS.minTrackingPt).max(EDITOR_LIMITS.maxTrackingPt).optional(),
};
const shapeAppearance = { ...PaintOpacityFields, fill: paint.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional() };
export const TextBoxSchema = z.strictObject({ widthMm: z.number().finite().positive().max(1000), heightMm: z.number().finite().positive().max(1000), autoWidth: z.boolean(), autoHeight: z.literal(true) });
const textContent = z.string().min(1).max(EDITOR_LIMITS.textCharacters*2).refine(t => !/[\r\u0000-\u0009\u000b-\u001f]/.test(t) && Array.from(t).length<=EDITOR_LIMITS.textCharacters && t.split('\n').length <= EDITOR_LIMITS.textLines, `Massimo ${EDITOR_LIMITS.textCharacters} caratteri Unicode e ${EDITOR_LIMITS.textLines} righe per box nel laboratorio`);
export const SceneObjectSchema = z.discriminatedUnion('type', [
  z.strictObject({ id, type: z.literal('text'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), text: textContent, fontSizePt: z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt), fontFamily, fill: color, ...textAppearance, textBox: TextBoxSchema.optional(), characterStyles: characterRuns }),
  z.strictObject({ id, type: z.literal('rect'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().positive().max(1000), heightMm: z.number().positive().max(1000), strokeMm: StrokeWidthSchema, stroke: paint, ...shapeAppearance, cornerRadiusMm: z.number().finite().min(0).max(500).optional() }),
  z.strictObject({ id, type: z.literal('circle'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: z.literal(0).optional(), radiusMm: z.number().positive().max(500), strokeMm: StrokeWidthSchema, stroke: paint, ...shapeAppearance }),
  z.strictObject({ id, type: z.literal('line'), ...PaintOpacityFields, ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), lengthMm: z.number().finite().positive().max(1000), strokeMm: StrokeWidthSchema, stroke: color, fill: z.literal('none').optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional() }),
  z.strictObject({ id, type: z.literal('ellipse'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), rxMm: z.number().finite().positive().max(500), ryMm: z.number().finite().positive().max(500), strokeMm: StrokeWidthSchema, stroke: paint, ...shapeAppearance }),
  z.strictObject({ id, type: z.literal('path'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().nonnegative().max(1000), heightMm: z.number().finite().nonnegative().max(1000), points: z.array(z.strictObject({ x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1) })).min(2).max(512), closed: z.boolean(), strokeMm: StrokeWidthSchema, stroke: color, ...shapeAppearance }),
  z.strictObject({ id, type: z.literal('image'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().positive().max(1000), heightMm: z.number().finite().positive().max(1000), source: RasterSourceSchema, raster: RasterParametersSchema, pixelAspectRatio: z.number().finite().min(0.01).max(100).optional(), crop: RasterCropSchema.optional(), flipX: z.boolean().optional(), flipY: z.boolean().optional() }),
  z.strictObject({ id, type: z.literal('vector'), ...PaintOpacityFields, ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().nonnegative().max(1000), heightMm: z.number().finite().nonnegative().max(1000), commands: VectorCommandsSchema, clipRect: VectorClipSchema.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional(), fillRule: z.enum(['evenodd', 'nonzero']), fill: paint, stroke: paint, strokeMm: StrokeWidthSchema, strokeLineCap: z.enum(['butt', 'round', 'square']), strokeLineJoin: z.enum(['miter', 'round', 'bevel']), strokeMiterLimit: z.number().finite().min(1).max(100) }),
  z.strictObject({ id, type: z.literal('bezier'), ...position, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().nonnegative().max(1000), heightMm: z.number().finite().nonnegative().max(1000), nodes: z.array(BezierNodeSchema).min(2).max(MAX_BEZIER_NODES), closed: z.boolean(), strokeMm: StrokeWidthSchema, stroke: color, ...shapeAppearance }),
]);
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export const SceneGroupSchema = z.strictObject({ id, parentId:id.optional(),editor:GroupPropertiesSchema.optional(),objectIds: z.array(id).min(1).max(EDITOR_LIMITS.objects) });
export type SceneGroup=z.infer<typeof SceneGroupSchema>;
const documentFields = z.strictObject({
  plaque:PlaqueMountingSchema.optional(),
  inkColor:InkColorSchema.optional(),
  colorMode:z.enum(['monochrome','color']).optional(),
  templateOrigin: z.strictObject({id:z.string().uuid(),version:z.number().int().positive()}).optional(),
  fontAssets: FontAssetsSchema.optional(),
  backgroundImageId:id.optional(),
  backgroundGroupId:id.optional(),
  paperColor:ColorSchema.optional(),
  schemaVersion: z.literal(2), documentId: z.string().uuid(), revision: z.number().int().nonnegative(),
  productId: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/).nullable(),
  variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/).nullable(),
  catalogVersion: z.string().min(1).nullable().default(null),
  catalogProductProfileVersion: z.number().int().positive().nullable().default(null),
  productProfileVersion: z.literal('TEST-stamp-v1'),
  fixture: z.literal(true), validatedForProduction: z.literal(false), areaMm: AreaSchema, shape: ShapeSchema.default('rectangle'),
  objects: z.array(SceneObjectSchema).max(EDITOR_LIMITS.objects),
  groups: z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups).optional(),
});
function refineDocument(d: Omit<z.infer<typeof documentFields>, 'schemaVersion'>, ctx: z.RefinementCtx) {
  // The typed catalog currently contains stamp mounts only. Commercial plaque
  // associations live in the archive adapter, not in these stamp binding fields.
  if (d.colorMode === 'color' && d.productId !== null) ctx.addIssue({ code: 'custom', message: 'Le montature timbro richiedono un documento monocromatico; i colori non vengono convertiti automaticamente.' });
  if(d.colorMode!=='color'&&!isMonochromePaint(d.paperColor))ctx.addIssue({code:'custom',message:'Il documento monocromatico ammette soltanto un fondo nero o bianco.'});
  if (d.colorMode !== 'color') for (const object of d.objects) {
    const paints = object.type === 'image' ? [] : [
      ...('fill' in object ? [object.fill] : []), ...('stroke' in object ? [object.stroke] : []),
      ...(object.type === 'text' ? object.characterStyles?.flatMap(run => [run.style.fill, run.style.stroke]) ?? [] : []),
    ];
    if (paints.some(paint => !isMonochromePaint(paint)) || object.type === 'image' && (object.raster.mode === 'original' || !isMonochromePaint(object.raster.tintColor))) ctx.addIssue({ code: 'custom', message: 'Il documento monocromatico ammette soltanto nero/bianco. Per conservare i colori usa un progetto a colori, senza montatura timbro.' });
  }
  if(d.plaque){if(d.shape!=='rectangle')ctx.addIssue({code:'custom',message:'La targa a misura richiede una sagoma rettangolare'});try{plaqueMountingPoints(d.areaMm,d.plaque);}catch(cause){ctx.addIssue({code:'custom',message:cause instanceof Error?cause.message:'Fissaggi non validi'});}}
  if(d.objects.reduce((count,object)=>count+(object.type==='text'?Array.from(object.text).length:0),0)>EDITOR_LIMITS.documentTextCharacters)ctx.addIssue({code:'custom',message:`Massimo ${EDITOR_LIMITS.documentTextCharacters} caratteri Unicode nell’intero documento`});
  if (new Set(d.objects.map(o => o.id)).size !== d.objects.length) ctx.addIssue({ code: 'custom', message: 'ID duplicati' });
  if(d.backgroundImageId&&!d.objects.some(o=>o.id===d.backgroundImageId&&o.type==='image'))ctx.addIssue({code:'custom',message:'Sfondo collegato a un’immagine inesistente'});
  if(d.backgroundGroupId&&!d.groups?.some(g=>g.id===d.backgroundGroupId))ctx.addIssue({code:'custom',message:'Sfondo collegato a un gruppo inesistente'});
  if(d.backgroundGroupId&&d.backgroundImageId)ctx.addIssue({code:'custom',message:'Lo sfondo deve riferirsi a un’immagine oppure a un gruppo'});
  const grouped = new Map<string,Set<string>>(), groupIds = new Set<string>();
  for (const group of d.groups ?? []) {
    const indices = group.objectIds.map(id => d.objects.findIndex(o => o.id === id)).sort((a, b) => a - b);
    if (groupIds.has(group.id) || d.objects.some(o => o.id === group.id) || indices.some((value, index) => value < 0 || index > 0 && value !== indices[index - 1]! + 1)) ctx.addIssue({ code: 'custom', message: 'Gruppo non valido: ID, membri o ordine dei livelli' });
    if(group.parentId){const parent=d.groups?.find(item=>item.id===group.parentId);if(!groupIds.has(group.parentId)||!parent||group.objectIds.some(id=>!parent.objectIds.includes(id)))ctx.addIssue({code:'custom',message:'Gerarchia dei gruppi non valida: il padre deve precedere i figli e contenerne tutti i membri'});}
    groupIds.add(group.id);const siblings=grouped.get(group.parentId??'')??new Set<string>();grouped.set(group.parentId??'',siblings);
    for (const id of group.objectIds) {
      if (siblings.has(id)) ctx.addIssue({ code: 'custom', message: 'Oggetto presente in più gruppi indipendenti' });
      siblings.add(id);
    }
  }
  const binding = [d.productId, d.variantId, d.catalogVersion, d.catalogProductProfileVersion];
  if (binding.some(v => v !== null) && binding.some(v => v === null)) ctx.addIssue({ code: 'custom', message: 'Associazione catalogo incompleta' });
  if (d.shape !== 'rectangle' && d.areaMm.width !== d.areaMm.height) ctx.addIssue({ code: 'custom', message: 'Area tonda o quadrata richiede lati uguali' });
  const images = d.objects.filter(o => o.type === 'image'), sources = new Map<string, string>();
  if (images.length > 4) ctx.addIssue({ code: 'custom', message: 'Massimo quattro immagini nel laboratorio TEST' });
  for (const image of images) {
    const previous = sources.get(image.source.id); if (previous !== undefined && previous !== image.source.dataUrl) ctx.addIssue({ code: 'custom', message: 'ID sorgente immagine associato a dati diversi' }); sources.set(image.source.id, image.source.dataUrl);
    try {
      const crop = checkedRasterCrop(image.source, image.crop), a = image.widthMm * crop.heightPx, b = image.heightMm * crop.widthPx * (image.pixelAspectRatio ?? 1);
      if (Math.abs(a - b) > 1e-7 * Math.max(a, b)) ctx.addIssue({ code: 'custom', message: 'Le proporzioni dei pixel visibili dell’immagine devono essere conservate' });
    } catch (e) { ctx.addIssue({ code: 'custom', message: e instanceof Error ? e.message : 'Ritaglio non valido' }); }
  }
  if (d.objects.reduce((sum, object) => sum + (object.type === 'vector' ? object.commands.length : 0), 0) > EDITOR_LIMITS.vectorCommands) ctx.addIssue({ code: 'custom', message: `Massimo ${EDITOR_LIMITS.vectorCommands} segmenti vettoriali nel documento TEST` });
  const assetIds = new Set(d.fontAssets?.map(asset => asset.id) ?? []);
  for (const object of d.objects) {
    if (object.type === 'text' && [object.fontFamily,...object.characterStyles?.map(r=>r.style.fontFamily).filter((f):f is string=>!!f)??[]].some(f => f.startsWith('font-') && !assetIds.has(f))) ctx.addIssue({code:'custom',message:'Il documento non contiene la risorsa del font utilizzato'});
    if (object.type === 'vector') {
      const b = vectorBounds(object.commands), near = (a: number, b: number) => Math.abs(a - b) < 1e-7;
      if (!near(b.x, 0) || !near(b.y, 0) || !near(b.width, object.widthMm ? 1 : 0) || !near(b.height, object.heightMm ? 1 : 0) || !object.widthMm && !object.heightMm || object.fill === 'none' && object.stroke === 'none') ctx.addIssue({ code: 'custom', message: 'Vettore non normalizzato, degenere o invisibile' });
    }
    if (object.type === 'text') {
      if (object.textPath && (object.text.includes('\n') || object.textBox || object.lineStyles?.length || object.textAlign === 'justify-left' || object.textScaleY !== undefined && object.textScaleY !== 1)) ctx.addIssue({ code: 'custom', message: 'Il testo su tracciato richiede una sola riga, senza box/giustificazione o scala verticale' });
      if ((object.textAlign === 'justify-left' || object.lineStyles?.some(run => run.alignment === 'justify-left')) && (object.textBox?.autoWidth ?? true)) ctx.addIssue({ code: 'custom', message: 'Il testo giustificato richiede un box a larghezza fissa' });
      let lineEnd = -1, emptyEnd = -1;
      for (const run of object.lineStyles ?? []) {
        if (run.start < lineEnd || run.start === emptyEnd || run.end < run.start || run.end > Array.from(object.text).length || run.end === run.start && (run.end !== Array.from(object.text).length || !object.text.endsWith('\n'))) ctx.addIssue({ code: 'custom', message: 'Intervalli delle righe non validi' });
        lineEnd = run.end; if (run.start === run.end) emptyEnd = run.end;
      }
      let end = 0;
      for (const run of object.characterStyles ?? []) {
        if (run.start < end || run.end <= run.start || run.end > Array.from(object.text).length || !Object.keys(run.style).length) ctx.addIssue({ code: 'custom', message: 'Intervalli dei caratteri non validi' });
        end = run.end;
      }
    }
    if (object.type === 'rect' && (object.cornerRadiusMm ?? 0) > Math.min(object.widthMm, object.heightMm) / 2) ctx.addIssue({ code: 'custom', message: 'Raggio degli angoli superiore a metà del lato minore' });
    if (object.type === 'bezier') {
      const box = bezierBounds(object.nodes, object.closed), near = (a: number, b: number) => Math.abs(a - b) < 1e-8;
      const flatCoordinates = (axis: 'x' | 'y') => object.nodes.every(node => [node, node.in, node.out].every(point => !point || point[axis] === 0));
      if (object.widthMm === 0 && object.heightMm === 0 || !near(box.x, 0) || !near(box.y, 0) || !near(box.width, object.widthMm === 0 ? 0 : 1) || !near(box.height, object.heightMm === 0 ? 0 : 1) || object.widthMm === 0 && !flatCoordinates('x') || object.heightMm === 0 && !flatCoordinates('y') || object.closed && (object.widthMm === 0 || object.heightMm === 0) || !object.closed && object.fill && object.fill !== 'none') ctx.addIssue({ code: 'custom', message: 'Curva degenere, ingombro non normalizzato o riempimento su curva aperta' });
    }
    if (object.type === 'path') {
      const xs = object.points.map(p => p.x), ys = object.points.map(p => p.y);
      const normalized = (values: number[], dimension: number) => Math.min(...values) === 0 && Math.max(...values) === (dimension === 0 ? 0 : 1);
      if (object.widthMm === 0 && object.heightMm === 0 || !normalized(xs, object.widthMm) || !normalized(ys, object.heightMm) || object.closed && (object.points.length < 3 || object.widthMm === 0 || object.heightMm === 0) || !object.closed && object.fill && object.fill !== 'none') ctx.addIssue({ code: 'custom', message: 'Tracciato degenere, punti non normalizzati o riempimento su tracciato aperto' });
    }
  }
}
export const DocumentSchema = documentFields.superRefine(refineDocument);
const LegacySceneObjectSchema = z.discriminatedUnion('type', [
  SceneObjectSchema.options[0].omit({ rotationDeg: true, fontWeight: true, fontStyle: true, underline: true, linethrough: true, overline: true, textAlign: true, lineHeight: true, letterSpacingPt: true, textScaleX: true, textScaleY: true, lineStyles: true, justification: true, textPath: true, textBox: true, characterStyles: true }).extend({ fontFamily: z.literal('Arial') }),
  SceneObjectSchema.options[1].omit({ rotationDeg: true, fill: true, strokeDash: true, cornerRadiusMm: true }).extend({ stroke: color, strokeMm: z.number().positive().max(2) }),
  SceneObjectSchema.options[2].omit({ rotationDeg: true, fill: true, strokeDash: true }).extend({ stroke: color, strokeMm: z.number().positive().max(2) }),
]);
const LegacyDocumentSchema = z.strictObject({ ...documentFields.omit({ groups: true }).shape, schemaVersion: z.literal(1), objects: z.array(LegacySceneObjectSchema).max(30) }).superRefine(refineDocument);
export function parseGraphicDocument(raw: unknown): GraphicDocument {
  const legacy = LegacyDocumentSchema.safeParse(raw);
  let candidate: unknown = legacy.success ? { ...legacy.data, schemaVersion: 2 } : raw;
  // Compatibilità dei primi box v2: l'altezza fissa è sospesa su richiesta
  // del titolare. Conservare testo, stili e posizione, lasciando crescere il box.
  if (candidate && typeof candidate === 'object' && 'objects' in candidate && Array.isArray(candidate.objects)) {
    candidate = { ...candidate, objects: candidate.objects.map((object: unknown) => {
      if (!object || typeof object !== 'object' || !('type' in object) || object.type !== 'text' || !('textBox' in object)) return object;
      const frame = object.textBox;
      return frame && typeof frame === 'object' && 'autoHeight' in frame && frame.autoHeight === false ? { ...object, textBox: { ...frame, autoHeight: true } } : object;
    }) };
  }
  return DocumentSchema.parse(candidate);
}
export type GraphicDocument = z.infer<typeof DocumentSchema>;
/** Le stringhe delle sorgenti sono immutabili; copiare i metadati senza ricodificarle. */
export function cloneSceneObject<T extends SceneObject>(object: T): T {
  return object.type === 'image' ? { ...object, ...(object.editor?{editor:{...object.editor}}:{}), source: { ...object.source }, raster: { ...object.raster }, ...(object.crop ? { crop: { ...object.crop } } : {}) } : structuredClone(object);
}
export function cloneGraphicDocument(document: GraphicDocument): GraphicDocument {
  return { ...document, ...(document.plaque?{plaque:{...document.plaque}}:{}), ...(document.templateOrigin?{templateOrigin:{...document.templateOrigin}}:{}), areaMm: { ...document.areaMm }, objects: document.objects.map(cloneSceneObject), ...(document.fontAssets ? { fontAssets: document.fontAssets.map(asset=>({...asset})) } : {}), ...(document.groups ? { groups: document.groups.map(cloneSceneGroup) } : {}) };
}
export const ObjectSizeSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('vector'), widthMm: z.number().finite().nonnegative().max(1000), heightMm: z.number().finite().nonnegative().max(1000) }),
  z.strictObject({ type: z.literal('text'), fontSizePt: z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt), textScaleX: textScale.optional(), textScaleY: textScale.optional(), textBox: TextBoxSchema.optional(), textPath: TextPathSchema.optional() }),
  z.strictObject({ type: z.literal('rect'), widthMm: z.number().positive().max(1000), heightMm: z.number().positive().max(1000) }),
  z.strictObject({ type: z.literal('circle'), radiusMm: z.number().positive().max(500) }),
  z.strictObject({ type: z.literal('line'), lengthMm: z.number().finite().positive().max(1000) }),
  z.strictObject({ type: z.literal('ellipse'), rxMm: z.number().finite().positive().max(500), ryMm: z.number().finite().positive().max(500) }),
  z.strictObject({ type: z.literal('path'), widthMm: z.number().finite().nonnegative().max(1000), heightMm: z.number().finite().nonnegative().max(1000) }),
  z.strictObject({ type: z.literal('image'), widthMm: z.number().finite().positive().max(1000), heightMm: z.number().finite().positive().max(1000) }),
  z.strictObject({ type: z.literal('bezier'), widthMm: z.number().finite().nonnegative().max(1000), heightMm: z.number().finite().nonnegative().max(1000) }),
]);
export const TransformArgumentsSchema = z.strictObject({ ...position, rotationDeg: rotation, size: ObjectSizeSchema });
export type TransformArguments = z.infer<typeof TransformArgumentsSchema>;
const base = { schemaVersion: z.literal(1), expectedRevision: z.number().int().nonnegative(), objectId: id };
const ids = z.array(id).min(1).max(EDITOR_LIMITS.objects);
const alignment = z.enum(['left', 'centerX', 'right', 'top', 'centerY', 'bottom']);
export const SelectionTransformSchema = z.strictObject({ objectIds: ids.min(2), scale: z.number().finite().min(0.01).max(100), rotationDeg: rotation, center: z.strictObject(position) });
export type SelectionTransformArguments = z.infer<typeof SelectionTransformSchema>;
export const SelectionStyleSchema = z.strictObject({ ...PaintOpacityFields, fill: paint.optional(), stroke: paint.optional(), strokeMm: textStrokeWidth.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional() }).refine(style => Object.values(style).some(value => value !== undefined), 'Scegli almeno una proprietà di stile');
export type SelectionStyle = z.infer<typeof SelectionStyleSchema>;
export const GraphicCommandSchema = z.discriminatedUnion('tool', [
  z.strictObject({...base,tool:z.literal('setObjectProperties'),arguments:ObjectPropertiesSchema}),
  z.strictObject({...base,tool:z.literal('setGroupProperties'),arguments:GroupPropertiesSchema}),
  z.strictObject({...base,tool:z.literal('setPaperColor'),arguments:z.strictObject({color:ColorSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('setBackgroundImage'),arguments:z.strictObject({object:SceneObjectSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('setBackgroundObjects'),arguments:z.strictObject({objects:z.array(SceneObjectSchema).max(EDITOR_LIMITS.objects),groups:z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups),backgroundGroupId:id.optional(),fontAssets:FontAssetsSchema.optional()})}),
  z.strictObject({...base,tool:z.literal('replaceImageSource'),arguments:z.strictObject({source:RasterSourceSchema,fit:z.enum(['contain','cover']).optional()})}),
  z.strictObject({...base,tool:z.literal('configurePlaque'),arguments:z.strictObject({areaMm:AreaSchema,mounting:PlaqueMountingSchema})}),
  z.strictObject({...base,tool:z.literal('setInkColor'),arguments:z.strictObject({color:InkColorSchema})}),
  z.strictObject({...base,tool:z.literal('changeFormat'),arguments:z.strictObject({profileKey:z.string().min(1).max(200),catalogVersion:z.string().min(1),allowShrink:z.boolean()})}),
  z.strictObject({...base,tool:z.literal('applyTemplate'),arguments:z.strictObject({templateId:z.string().uuid(),templateVersion:z.number().int().positive(),objects:z.array(SceneObjectSchema).min(0).max(EDITOR_LIMITS.objects),groups:z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups),backgroundImageId:id.optional(),backgroundGroupId:id.optional(),paperColor:ColorSchema.optional(),fontAssets:FontAssetsSchema.optional(),inkColor:InkColorSchema.optional()})}),
  z.strictObject({ ...base, tool: z.literal('attachTextToPath'), arguments: z.strictObject({ pathObjectId: id }) }),
  z.strictObject({ ...base, tool: z.literal('detachTextFromPath'), arguments: z.strictObject({ pathObjectId: id }) }),
  z.strictObject({ ...base, tool: z.literal('setTextPath'), arguments: TextPathOptionsSchema }),
  z.strictObject({ ...base, tool: z.literal('moveObject'), arguments: z.strictObject(position) }),
  z.strictObject({ ...base, tool: z.literal('setText'), arguments: z.strictObject({ text: textContent }) }),
  z.strictObject({ ...base, tool: z.literal('setObjectStyle'), arguments: z.strictObject({ fontSizePt: z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt), fill: color }) }),
  z.strictObject({ ...base, tool: z.literal('addObject'), arguments: z.strictObject({ object: SceneObjectSchema, fontAssets: FontAssetsSchema.optional() }) }),
  z.strictObject({ ...base, tool: z.literal('insertObjects'), arguments: z.strictObject({ objects: z.array(SceneObjectSchema).min(1).max(EDITOR_LIMITS.objects), groups: z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups), fontAssets: FontAssetsSchema.optional() }) }),
  z.strictObject({ ...base, tool: z.literal('updateObject'), arguments: z.strictObject({ object: SceneObjectSchema, fontAssets: FontAssetsSchema.optional() }) }),
  z.strictObject({ ...base, tool: z.literal('duplicateObject'), arguments: z.strictObject({ newObjectId: id, ...position }) }),
  z.strictObject({ ...base, tool: z.literal('deleteObject'), arguments: z.strictObject({}) }),
  z.strictObject({ ...base, tool: z.literal('transformObject'), arguments: TransformArgumentsSchema }),
  z.strictObject({ ...base, tool: z.literal('reorderObject'), arguments: z.strictObject({ position: z.enum(['front', 'back', 'forward', 'backward']) }) }),
  z.strictObject({ ...base, tool: z.literal('alignObject'), arguments: z.strictObject({ alignment: z.enum(['left', 'centerX', 'right', 'top', 'centerY', 'bottom']) }) }),
  z.strictObject({ ...base, tool: z.literal('groupObjects'), arguments: z.strictObject({ objectIds: ids.min(2), groupId: id }) }),
  z.strictObject({ ...base, tool: z.literal('ungroupObjects'), arguments: z.strictObject({ groupIds: z.array(id).min(1).max(EDITOR_LIMITS.groups) }) }),
  z.strictObject({ ...base, tool: z.literal('moveObjects'), arguments: z.strictObject({ objectIds: ids, deltaXmm: z.number().finite().min(-2000).max(2000), deltaYmm: z.number().finite().min(-2000).max(2000) }) }),
  z.strictObject({ ...base, tool: z.literal('transformObjects'), arguments: SelectionTransformSchema }),
  z.strictObject({ ...base, tool: z.literal('styleObjects'), arguments: z.strictObject({ objectIds: ids.min(2), style: SelectionStyleSchema }) }),
  z.strictObject({ ...base, tool: z.literal('reorderObjects'), arguments: z.strictObject({ objectIds: ids.min(2), position: z.enum(['front', 'back', 'forward', 'backward']) }) }),
  z.strictObject({ ...base, tool: z.literal('placeObjects'), arguments: z.strictObject({ objectIds: ids, targetObjectId: id, side: z.enum(['above', 'below']) }) }),
  z.strictObject({ ...base, tool: z.literal('deleteObjects'), arguments: z.strictObject({ objectIds: ids }) }),
  z.strictObject({ ...base, tool: z.literal('duplicateObjects'), arguments: z.strictObject({ copies: z.array(z.strictObject({ objectId: id, newObjectId: id })).min(1).max(EDITOR_LIMITS.objects), groups: z.array(z.strictObject({ groupId: id, newGroupId: id })).max(EDITOR_LIMITS.groups) }) }),
  z.strictObject({ ...base, tool: z.literal('alignObjects'), arguments: z.strictObject({ objectIds: ids.min(2), alignment }) }),
  z.strictObject({ ...base, tool: z.literal('alignObjectsToArea'), arguments: z.strictObject({ objectIds: ids.min(2), alignment }) }),
  z.strictObject({ ...base, tool: z.literal('distributeObjects'), arguments: z.strictObject({ objectIds: ids.min(3), axis: z.enum(['horizontal', 'vertical']) }) }),
]);
export type GraphicCommand = z.infer<typeof GraphicCommandSchema>;
export type Measure = (object: SceneObject) => { widthMm: number; heightMm: number; textLayoutWidthMm?: number; textLayoutHeightMm?: number; pathCenterOffsetMm?: { x: number; y: number }; pathLengthMm?: number; textAdvanceMm?: number };
export const TEST_MARGIN_MM = 1;
export function objectGeometry(object: SceneObject, measure: Measure) {
  const box = measure(object);
  if (!Number.isFinite(box.widthMm) || !Number.isFinite(box.heightMm) || box.widthMm <= 0 || box.heightMm <= 0) throw new Error('Misurazione non valida');
  if(Math.max(box.widthMm,box.heightMm)>EDITOR_LIMITS.maxObjectExtentMm)throw new Error('Ingombro dell’oggetto oltre il limite di sicurezza del laboratorio (10 m). Riduci corpo, dilatazione o lunghezza della riga.');
  const angle = (object.rotationDeg ?? 0) * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const local = [[0, 0], [box.widthMm, 0], [box.widthMm, box.heightMm], [0, box.heightMm]].map(([x, y]) => ({ x: x! * cos - y! * sin, y: x! * sin + y! * cos }));
  const minX = Math.min(...local.map(p => p.x)), minY = Math.min(...local.map(p => p.y));
  return { widthMm: Math.max(...local.map(p => p.x)) - minX, heightMm: Math.max(...local.map(p => p.y)) - minY, corners: local.map(p => ({ x: object.xMm + p.x - minX, y: object.yMm + p.y - minY })) };
}
export function objectCenter(object: SceneObject, measure: Measure) {
  const bounds = objectGeometry(object, measure);
  return { xMm: object.xMm + bounds.widthMm / 2, yMm: object.yMm + bounds.heightMm / 2 };
}
export function placeObjectAtCenter(object: SceneObject, center: { xMm: number; yMm: number }, measure: Measure): SceneObject {
  const bounds = objectGeometry(object, measure);
  return { ...object, xMm: center.xMm - bounds.widthMm / 2, yMm: center.yMm - bounds.heightMm / 2 };
}
export function objectIntersectsArea(doc: Pick<GraphicDocument, 'areaMm' | 'shape'>, object: SceneObject, measure: Measure): boolean {
  const bounds = objectGeometry(object, measure), center = objectCenter(object, measure), epsilon = 1e-8;
  if (object.xMm + bounds.widthMm <= epsilon || object.yMm + bounds.heightMm <= epsilon || object.xMm >= doc.areaMm.width - epsilon || object.yMm >= doc.areaMm.height - epsilon) return false;
  if (object.type === 'vector') {
    if (object.clipRect) { const c = object.clipRect; if (!pathIntersectsArea([{x:c.left,y:c.top},{x:c.right,y:c.top},{x:c.right,y:c.bottom},{x:c.left,y:c.bottom}], object.widthMm, object.heightMm, {x:center.xMm,y:center.yMm}, object.rotationDeg ?? 0, 0, true, true, doc.areaMm, doc.shape === 'round')) return false; }
    const contours = vectorContours(object.commands), filled = object.fill !== 'none', stroke = object.stroke === 'none' ? 0 : object.strokeMm;
    if (contours.some(contour => pathIntersectsArea(contour.points, object.widthMm, object.heightMm, { x: center.xMm, y: center.yMm }, object.rotationDeg ?? 0, stroke, false, contour.closed || filled, doc.areaMm, doc.shape === 'round'))) return true;
    if (!filled) return false; const a = -(object.rotationDeg ?? 0) * Math.PI / 180, dx = doc.areaMm.width / 2 - center.xMm, dy = doc.areaMm.height / 2 - center.yMm, p = { x: object.widthMm ? (dx * Math.cos(a) - dy * Math.sin(a)) / object.widthMm + .5 : 0, y: object.heightMm ? (dx * Math.sin(a) + dy * Math.cos(a)) / object.heightMm + .5 : 0 }; let winding = 0;
    for (const { points } of contours) for (let i = 0; i < points.length; i++) { const a = points[i]!, b = points[(i + 1) % points.length]!, cross = (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y); if (a.y <= p.y && b.y > p.y && cross > 0) winding++; else if (a.y > p.y && b.y <= p.y && cross < 0) winding--; }
    return object.fillRule === 'evenodd' ? Math.abs(winding) % 2 === 1 : winding !== 0;
  }
  if (object.type === 'ellipse') return ellipseIntersectsArea({ x: center.xMm, y: center.yMm }, object.rxMm, object.ryMm, object.rotationDeg ?? 0, object.stroke === 'none' ? 0 : object.strokeMm, doc.areaMm, doc.shape === 'round');
  if (object.type === 'bezier') return pathIntersectsArea(flattenBezier(object.nodes, object.closed, object.widthMm, object.heightMm), object.widthMm, object.heightMm, { x: center.xMm, y: center.yMm }, object.rotationDeg ?? 0, object.strokeMm + 0.002, !!object.fill && object.fill !== 'none', object.closed, doc.areaMm, doc.shape === 'round');
  if (object.type === 'path') return pathIntersectsArea(object.points, object.widthMm, object.heightMm, { x: center.xMm, y: center.yMm }, object.rotationDeg ?? 0, object.strokeMm, !!object.fill && object.fill !== 'none', object.closed, doc.areaMm, doc.shape === 'round');
  if (object.type === 'circle') {
    if (doc.shape === 'round') return Math.hypot(center.xMm - doc.areaMm.width / 2, center.yMm - doc.areaMm.height / 2) < bounds.widthMm / 2 + doc.areaMm.width / 2 - epsilon;
    const nearestX = Math.max(0, Math.min(doc.areaMm.width, center.xMm)), nearestY = Math.max(0, Math.min(doc.areaMm.height, center.yMm));
    return Math.hypot(center.xMm - nearestX, center.yMm - nearestY) < bounds.widthMm / 2 - epsilon;
  }
  const polygon = bounds.corners;
  if (doc.shape === 'round') {
    const cx = doc.areaMm.width / 2, cy = doc.areaMm.height / 2, radius = cx;
    let positive = false, negative = false, nearest = Infinity;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i]!, b = polygon[(i + 1) % polygon.length]!, dx = b.x - a.x, dy = b.y - a.y;
      const cross = dx * (cy - a.y) - dy * (cx - a.x); positive ||= cross > epsilon; negative ||= cross < -epsilon;
      const t = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy) / (dx * dx + dy * dy)));
      nearest = Math.min(nearest, Math.hypot(cx - a.x - t * dx, cy - a.y - t * dy));
    }
    return !(positive && negative) || nearest < radius - epsilon;
  }
  const area = [{ x: 0, y: 0 }, { x: doc.areaMm.width, y: 0 }, { x: doc.areaMm.width, y: doc.areaMm.height }, { x: 0, y: doc.areaMm.height }];
  const axes = [{ x: 1, y: 0 }, { x: 0, y: 1 }, ...polygon.map((p, index) => { const next = polygon[(index + 1) % polygon.length]!; return { x: next.y - p.y, y: p.x - next.x }; })];
  return axes.every(axis => {
    const a = polygon.map(p => p.x * axis.x + p.y * axis.y), b = area.map(p => p.x * axis.x + p.y * axis.y);
    return Math.max(...a) > Math.min(...b) + epsilon && Math.max(...b) > Math.min(...a) + epsilon;
  });
}
export function validateLayout(doc: GraphicDocument, measure: Measure, mode: 'strict' | 'edit' = 'strict'): void {
  const backgrounds=backgroundObjectIds(doc);
  const intersections=new Map<SceneObject,boolean>();
  const intersects = (object: SceneObject): boolean => {const previous=intersections.get(object);if(previous!==undefined)return previous;let visible:boolean;try { visible=objectIntersectsArea(doc, object, measure); } catch(error) { if(mode==='edit'&&object.type==='text'&&error instanceof UnverifiedTextGeometryError)visible=true;else throw error; }intersections.set(object,visible);return visible;};
  const visibleGroups = new Set((doc.groups ?? []).filter(group => group.objectIds.some(id => intersects(doc.objects.find(object => object.id === id)!))).flatMap(group => group.objectIds));
  for (const object of doc.objects) {
    if (mode === 'edit'||backgrounds.has(object.id)) {
      const visible=intersects(object); // Every member is checked, even when a sibling already makes its group visible.
      if (!visibleGroups.has(object.id) && !visible) throw new Error('Oggetto completamente fuori dall’area di disegno');
      continue;
    }
    const box = objectGeometry(object, measure), epsilon = 1e-8;
    if (object.xMm < TEST_MARGIN_MM - epsilon || object.yMm < TEST_MARGIN_MM - epsilon || object.xMm + box.widthMm > doc.areaMm.width - TEST_MARGIN_MM + epsilon || object.yMm + box.heightMm > doc.areaMm.height - TEST_MARGIN_MM + epsilon) throw new Error('Oggetto fuori dall’area TEST o dal margine di 1 mm');
    if (doc.shape === 'round') {
      const radius = doc.areaMm.width / 2, limit = radius - TEST_MARGIN_MM;
      const outside = object.type === 'circle'
        ? Math.hypot(object.xMm + box.widthMm / 2 - radius, object.yMm + box.heightMm / 2 - radius) + Math.max(box.widthMm, box.heightMm) / 2 > limit + epsilon
        : box.corners.some(({ x, y }) => Math.hypot(x - radius, y - radius) > limit + epsilon);
      if (outside) throw new Error('Oggetto fuori dall’area circolare TEST: gli angoli devono entrare nel cerchio');
    }
  }
}
export interface GraphicCatalogContext {version:string;products:readonly ProductProfile[];}
export function applyGraphicCommand(doc: GraphicDocument, raw: unknown, measure: Measure, catalog?:GraphicCatalogContext,role:EditorRole='customer'): GraphicDocument {
  DocumentSchema.parse(doc);
  const command = GraphicCommandSchema.parse(raw);
  if (command.expectedRevision !== doc.revision) throw new Error('Revisione grafica obsoleta: rileggi il documento');
  const next = cloneGraphicDocument(doc);
  if ('fontAssets' in command.arguments && command.arguments.fontAssets?.length) { const resources = [...next.fontAssets ?? []]; for (const asset of command.arguments.fontAssets) { const old = resources.find(a=>a.id===asset.id); if (old && (old.dataBase64!==asset.dataBase64 || old.format!==asset.format || old.family!==asset.family)) throw new Error('La risorsa originale del font è immutabile'); if (!old) resources.push({...asset}); } next.fontAssets=resources; }
  if(command.tool==='setPaperColor'){if(command.arguments.color===null)delete next.paperColor;else next.paperColor=command.arguments.color;}
  else if(command.tool==='setBackgroundImage'){
    const image=command.arguments.object;if(image&&(image.type!=='image'||image.id!==command.objectId))throw new Error('Lo sfondo richiede un’immagine e un ID coerenti');
    clearBackground(next);
    if(image){if(next.objects.some(o=>o.id===image.id))throw new Error('ID dello sfondo già presente');next.objects.unshift(cloneSceneObject(image));next.backgroundImageId=image.id;}
  }
  else if(command.tool==='setBackgroundObjects')replaceBackgroundObjects(next,command.objectId,command.arguments);
  else if(command.tool==='configurePlaque'){if(!doc.plaque)throw new Error('Il documento non è una targa a misura.');plaqueMountingPoints(command.arguments.areaMm,command.arguments.mounting);const dx=(command.arguments.areaMm.width-doc.areaMm.width)/2,dy=(command.arguments.areaMm.height-doc.areaMm.height)/2;next.areaMm={...command.arguments.areaMm};next.plaque={...command.arguments.mounting};next.objects=next.objects.map(object=>({...object,xMm:object.xMm+dx,yMm:object.yMm+dy}));}
  else if(command.tool==='setInkColor') {
    const product=catalog?.products.find(item=>item.productId===doc.productId&&item.variantIds.includes(doc.variantId??''));
    if(product?.mechanism==='emboss'&&command.arguments.color!=='black')throw new Error('Il timbro a secco non usa un tampone inchiostrato.');
    next.inkColor=command.arguments.color;
  }
  else if(command.tool==='changeFormat') {
    if(doc.plaque)throw new Error('Modifica le misure della targa nel pannello Misure e fissaggio.');
    if(!catalog||catalog.version!==command.arguments.catalogVersion||doc.catalogVersion!==catalog.version)throw new Error('Catalogo grafico non disponibile o cambiato: riapri il progetto aggiornato.');
    const product=catalog.products.find(item=>profileKey(item)===command.arguments.profileKey);
    if(!product)throw new Error('Modello non presente nel catalogo grafico disponibile');
    Object.assign(next,fitComposition(doc,product,catalog.version,measure,command.arguments.allowShrink).document);
  }
  else if (command.tool === 'applyTemplate') {
    if(!command.arguments.objects.length&&!command.arguments.paperColor)throw new Error('Il template è vuoto e non ha un colore del foglio.');
    if(command.objectId!==(command.arguments.objects[0]?.id??'canvas'))throw new Error('ID del comando diverso dal primo oggetto del template');
    next.objects=command.arguments.objects.map(cloneSceneObject);
    if(command.arguments.groups.length)next.groups=command.arguments.groups.map(cloneSceneGroup);else delete next.groups;
    if(command.arguments.fontAssets?.length)next.fontAssets=command.arguments.fontAssets.map(asset=>({...asset}));else delete next.fontAssets;
    if(command.arguments.paperColor)next.paperColor=command.arguments.paperColor;else delete next.paperColor;
    if(command.arguments.backgroundImageId)next.backgroundImageId=command.arguments.backgroundImageId;else delete next.backgroundImageId;
    if(command.arguments.backgroundGroupId)next.backgroundGroupId=command.arguments.backgroundGroupId;else delete next.backgroundGroupId;
    next.templateOrigin={id:command.arguments.templateId,version:command.arguments.templateVersion};
    if(command.arguments.inkColor)next.inkColor=command.arguments.inkColor;
    validateLayout(next,measure);
    assertDocumentTextProduction(next,catalog);
  }
  else if(command.tool==='setGroupProperties'){
    if(role!=='admin')throw new Error('Le proprietà del template si configurano in modalità amministrativa.');
    const group=next.groups?.find(group=>group.id===command.objectId);if(!group)throw new Error('ID gruppo sconosciuto');group.editor={...command.arguments};
  }
  else if (isSelectionCommand(command)) applySelectionCommand(next, command, measure);
  else if (command.tool === 'insertObjects') {
    const { objects, groups } = command.arguments;
    if (command.objectId !== objects[0]!.id) throw new Error('ID del comando diverso dal primo oggetto inserito');
    const inserted = new Set(objects.map(object => object.id));
    if (groups.some(group => group.objectIds.some(id => !inserted.has(id)))) throw new Error('Un nuovo gruppo può comprendere solo gli oggetti inseriti');
    next.objects.push(...objects.map(cloneSceneObject));
    if(groups.some(group=>group.parentId&&!groups.some(parent=>parent.id===group.parentId)))throw new Error('Un nuovo gruppo può dipendere solo dai gruppi inseriti');
    if (groups.length) next.groups = [...next.groups ?? [], ...groups.map(cloneSceneGroup)];
  } else if (command.tool === 'addObject') {
    if (command.objectId !== command.arguments.object.id) throw new Error('ID del comando e del nuovo oggetto diversi');
    next.objects.push(cloneSceneObject(command.arguments.object));
  } else {
    if (!['setText','replaceImageSource','setObjectProperties'].includes(command.tool)&&next.groups?.some(group => group.objectIds.includes(command.objectId))) throw new Error('Separa il gruppo prima di modificare un singolo elemento');
    const object = next.objects.find(o => o.id === command.objectId);
    if (!object) throw new Error('ID oggetto sconosciuto');
    switch (command.tool) {
      case 'setObjectProperties': if(role!=='admin')throw new Error('Le proprietà del template si configurano in modalità amministrativa.'); object.editor={...command.arguments};break;
      case 'replaceImageSource': {
        if(object.type!=='image')throw new Error('Scegli un’immagine da sostituire.');
        if(command.arguments.fit==='cover'){Object.assign(object,coverRasterReplacement(object,command.arguments.source));delete object.pixelAspectRatio;break;}
        const source=command.arguments.source,center=objectCenter(object,measure),scale=Math.min(object.widthMm/source.pixelWidth,object.heightMm/source.pixelHeight);object.source={...source};object.widthMm=source.pixelWidth*scale;object.heightMm=source.pixelHeight*scale;delete object.pixelAspectRatio;delete object.crop;delete object.flipX;delete object.flipY;Object.assign(object,placeObjectAtCenter(object,center,measure));break;
      }
      case 'attachTextToPath': next.objects = attachTextPath(next, command.objectId, command.arguments.pathObjectId, measure); break;
      case 'detachTextFromPath': next.objects = detachTextPath(next, command.objectId, command.arguments.pathObjectId, measure); break;
      case 'setTextPath':
        if (object.type !== 'text') throw new Error('Seleziona il testo su tracciato');
        next.objects[next.objects.indexOf(object)] = updateTextPath(object, command.arguments, measure); break;
      case 'moveObject': Object.assign(object, command.arguments); break;
      case 'setText': {
        const before = cloneSceneObject(object);
        if (object.type !== 'text') throw new Error('Il comando richiede un testo');
        object.text = object.textPath ? command.arguments.text.replace(/\n/g, ' ') : command.arguments.text; delete object.characterStyles; delete object.lineStyles;
        try { if (object.textPath && before.type === 'text') Object.assign(object, preserveTextPathGuide(before, object, measure)); else if(role==='customer'&&effectiveObjectProperties(doc,before.id).transformLocked)Object.assign(object,placeObjectAtCenter(object,objectCenter(before,measure),measure)); } catch(error) {if(!(error instanceof UnverifiedTextGeometryError))throw error;} break;
      }
      case 'setObjectStyle': {
        const before = cloneSceneObject(object);
        if (object.type !== 'text') throw new Error('Il comando richiede un testo');
        Object.assign(object, command.arguments);
        if (object.characterStyles) {
          object.characterStyles = object.characterStyles.map(run => {
            const style = { ...run.style }; delete style.fontSizePt; delete style.fill; return { ...run, style };
          }).filter(run => Object.keys(run.style).length > 0);
          if (!object.characterStyles.length) delete object.characterStyles;
        }
        try { if (object.textPath && before.type === 'text') Object.assign(object, preserveTextPathGuide(before, object, measure)); } catch(error) {if(!(error instanceof UnverifiedTextGeometryError))throw error;}
        break;
      }
      case 'duplicateObject':
        next.objects.push({ ...cloneSceneObject(object), id: command.arguments.newObjectId, xMm: command.arguments.xMm, yMm: command.arguments.yMm }); break;
      case 'deleteObject': next.objects = next.objects.filter(o => o.id !== command.objectId); break;
      case 'updateObject': {
        const update = command.arguments.object;
        if (update.id !== object.id || update.type !== object.type) throw new Error('L’ispettore non può cambiare ID o tipo dell’oggetto');
        if (object.type === 'image' && update.type === 'image' && JSON.stringify(object.source) !== JSON.stringify(update.source)) throw new Error('La sorgente originale dell’immagine è immutabile');
        next.objects[next.objects.indexOf(object)] = cloneSceneObject(update); break;
      }
      case 'transformObject': {
        const { size, ...transform } = command.arguments;
        if (object.type !== size.type) throw new Error('Dimensioni incompatibili con il tipo di oggetto');
        if (object.type === 'text' && size.type === 'text') {
          const factor = size.fontSizePt / object.fontSizePt;
          if (object.strokeMm !== undefined) object.strokeMm *= factor;
          if (object.letterSpacingPt !== undefined) object.letterSpacingPt = Math.round(object.letterSpacingPt * factor * 1e9) / 1e9;
          if (object.characterStyles) object.characterStyles = object.characterStyles.map(run => ({ ...run, style: { ...run.style, ...(run.style.strokeMm === undefined ? {} : { strokeMm: run.style.strokeMm * factor }), ...(run.style.fontSizePt === undefined ? {} : { fontSizePt: Math.round(run.style.fontSizePt * factor * 1e9) / 1e9 }), ...(run.style.kerningPt === undefined ? {} : { kerningPt: Math.round(run.style.kerningPt * factor * 1e9) / 1e9 }) } }));
        }
        Object.assign(object, transform, size); break;
      }
      case 'reorderObject': {
        const units = selectionUnits(next, next.objects.map(object => object.id));
        const index = units.findIndex(unit => unit.includes(object)), last = units.length - 1;
        const target = command.arguments.position === 'front' ? last : command.arguments.position === 'back' ? 0
          : command.arguments.position === 'forward' ? Math.min(last, index + 1) : Math.max(0, index - 1);
        const [unit] = units.splice(index, 1); units.splice(target, 0, unit!); next.objects = units.flat(); break;
      }
      case 'alignObject': {
        const bounds = objectGeometry(object, measure), delta = areaAlignmentDelta({ ...bounds, xMm: object.xMm, yMm: object.yMm }, next.areaMm, command.arguments.alignment, TEST_MARGIN_MM);
        object.xMm += delta.xMm; object.yMm += delta.yMm;
        break;
      }
    }
  }
  if(next.backgroundImageId&&!next.objects.some(o=>o.id===next.backgroundImageId))delete next.backgroundImageId;
  if(next.backgroundGroupId&&!next.groups?.some(g=>g.id===next.backgroundGroupId))delete next.backgroundGroupId;
  next.revision++;
  const parsed = DocumentSchema.parse(next);
  validateLayout(parsed, measure, 'edit');
  assertObjectPolicies(doc,parsed,command,role,(a,b)=>{
    const keys=['rotationDeg','widthMm','heightMm','radiusMm','rxMm','ryMm','lengthMm','fontSizePt','textScaleX','textScaleY','textBox','points','nodes','commands','textPath'];
    if(keys.some(key=>JSON.stringify((a as unknown as Record<string,unknown>)[key])!==JSON.stringify((b as unknown as Record<string,unknown>)[key])))return false;
    if(a.type==='text'&&b.type==='text'){try{const ac=objectCenter(a,measure),bc=objectCenter(b,measure);return Math.abs(ac.xMm-bc.xMm)<1e-6&&Math.abs(ac.yMm-bc.yMm)<1e-6;}catch(error){if(!(error instanceof UnverifiedTextGeometryError))throw error;return a.xMm===b.xMm&&a.yMm===b.yMm;}}return Math.abs(a.xMm-b.xMm)<1e-6&&Math.abs(a.yMm-b.yMm)<1e-6;
  });
  return parsed;
}
export const createDocument = (product?: ProductProfile, catalogVersion?: string): GraphicDocument => ({
  schemaVersion: 2, documentId: crypto.randomUUID(), revision: 0, productId: null, variantId: null,
  catalogVersion: null, catalogProductProfileVersion: null,
  productProfileVersion: 'TEST-stamp-v1', fixture: true, validatedForProduction: false,
  areaMm: product ? structuredClone(product.nominalAreaMm) : { width: 58, height: 22 }, shape: product?.shape ?? 'rectangle',
  ...(product ? bindingFor(product, catalogVersion!) : {}),
  objects: product?.shape === 'round' ? [
    { id: 'frame-1', type: 'circle', xMm: 2, yMm: 2, radiusMm: product.nominalAreaMm.width / 2 - 2, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: Math.max(2, product.nominalAreaMm.width / 2 - 4), yMm: product.nominalAreaMm.height / 2 - 2, text: 'TEST', fontSizePt: 7, fontFamily: 'Arial', fill: '#000000', textAlign: 'center' },
  ] : product && (product.nominalAreaMm.width < 35 || product.nominalAreaMm.height < 18) ? [
    { id: 'frame-1', type: 'rect', xMm: 2, yMm: 2, widthMm: product.nominalAreaMm.width - 4, heightMm: product.nominalAreaMm.height - 4, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: 2, yMm: Math.max(2, product.nominalAreaMm.height / 2 - 1.5), text: 'IS', fontSizePt: 7, fontFamily: 'Arial', fill: '#000000', textAlign: 'center' },
  ] : [
    { id: 'frame-1', type: 'rect', xMm: 2, yMm: 2, widthMm: (product?.nominalAreaMm.width ?? 58) - 4, heightMm: (product?.nominalAreaMm.height ?? 22) - 4, strokeMm: 0.25, stroke: '#000000' },
    { id: 'text-1', type: 'text', xMm: 5, yMm: 7, text: 'TEST · Città', fontSizePt: 9, fontFamily: 'Arial', fill: '#000000', textAlign: 'center' },
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
  constructor(document: GraphicDocument, private readonly measure: Measure, private readonly catalog?:GraphicCatalogContext,private readonly role:EditorRole='customer') {
    this.document = parseGraphicDocument(document); validateLayout(this.document, measure, 'edit');
  }
  dispatch(raw: unknown, source: 'manual' | 'ai-simulation'): void {
    const next = applyGraphicCommand(this.document, raw, this.measure, this.catalog,this.role);
    this.past.push(cloneGraphicDocument(this.document)); this.future = [];
    this.document = next;
    this.events.push({ source, revision: next.revision, objectId: GraphicCommandSchema.parse(raw).objectId });
  }
  clearHistory():void{this.past=[];this.future=[];}
  undo(): void { this.travel(this.past, this.future, 'undo'); }
  redo(): void { this.travel(this.future, this.past, 'redo'); }
  private travel(from: GraphicDocument[], to: GraphicDocument[], source: 'undo' | 'redo'): void {
    const target = from.pop(); if (!target) return;
    to.push(cloneGraphicDocument(this.document));
    this.document = { ...target, revision: this.document.revision + 1 };
    this.events.push({ source, revision: this.document.revision });
  }
  /** Local workspace recovery: the file supplies its exact format/binding; never infer another product. */
  open(raw:unknown):void {
    const next=parseGraphicDocument(raw);validateLayout(next,this.measure,'edit');
    this.past.push(cloneGraphicDocument(this.document));this.future=[];
    this.document={...next,revision:this.document.revision+1};this.events.push({source:'import',revision:this.document.revision});
  }
  import(raw: unknown): void {
    let next = parseGraphicDocument(raw);
    if (this.document.productId) {
      if (next.areaMm.width !== this.document.areaMm.width || next.areaMm.height !== this.document.areaMm.height || next.shape !== this.document.shape) throw new Error('Area del JSON diversa dal prodotto corrente');
      if (next.productId && (next.productId !== this.document.productId || next.variantId !== this.document.variantId || next.catalogVersion !== this.document.catalogVersion || next.catalogProductProfileVersion !== this.document.catalogProductProfileVersion)) throw new Error('JSON associato a un altro prodotto o versione catalogo');
      next = { ...next, productId: this.document.productId, variantId: this.document.variantId, catalogVersion: this.document.catalogVersion, catalogProductProfileVersion: this.document.catalogProductProfileVersion };
    }
    next = DocumentSchema.parse(next);
    validateLayout(next, this.measure, 'edit');
    this.past.push(cloneGraphicDocument(this.document)); this.future = [];
    // Revisione locale monotona: una risposta AI precedente non diventa valida dopo import/undo.
    this.document = { ...next, revision: this.document.revision + 1 };
    this.events.push({ source: 'import', revision: this.document.revision });
  }
  changeProduct(product: ProductProfile, catalogVersion: string): void {
    if(this.document.plaque)throw new Error('Il formato di una targa si modifica dal pannello dedicato.');
    const next = DocumentSchema.parse({ ...this.document, ...bindingFor(product, catalogVersion), areaMm: structuredClone(product.nominalAreaMm), shape: product.shape, revision: this.document.revision + 1 });
    validateLayout(next, this.measure);
    assertMinimumText(next,minimumFontForProduct(product));
    this.document = next;
    this.past = []; this.future = [];
    this.events.push({ source: 'product-change', revision: next.revision });
  }
}
