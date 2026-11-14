import {QrParametersSchema} from './qr-code';
import {ShopSelectionSchema,assertShopSelection,shopSelectionFor} from './shop-selection';
import type {ShopProductDetail} from '../editor-admin/shop-catalog';
import {PathStrokeFields,ShapeJoinFields,pathStrokeExtras,resizedPathStrokeFrame} from './path-stroke';
import {assertTextPathPolicies} from './text-path-policy';
import {replacementLineStyles,lineAlignments} from './text-lines';
import {LayoutGuidesSchema,assertGuideChange} from './layout-guides';
import {affinePathIntersects} from './affine-intersection';
import {hasObjectAffine,withoutObjectAffine,frameToWorld} from './object-affine';
import {deleteGroupMember,duplicateGroupMember,reorderGroupMember,innermostGroup,placeGroupMember} from './group-member';
import { TextClipMasksSchema,scaleTextClipMasks,textClipExtent } from './text-clip-masks';
import{ClipMasksSchema,maskedCommandCount}from'./clip-masks';
import{isPageCommand,applyPageCommand,graphicPages,graphicPageIds,selectGraphicPage}from'./pages';
import {rasterDocumentUsage,rasterDocumentIssues} from './raster-document-limits';
import { OpacitySchema, PaintOpacityFields } from './paint-opacity';
import {clearBackground,replaceBackgroundObjects,backgroundObjectIds} from './background';
import {coverRasterReplacement} from './raster-replacement';
import { UnverifiedTextGeometryError } from './unverified-text-geometry';
import { StrokeWidthSchema } from './stroke';
import {ColorSchema,PaintSchema,isMonochromePaint} from './paint';
import {ObjectPropertiesSchema,GroupPropertiesSchema,effectiveObjectProperties,assertObjectPolicies,type EditorRole} from './object-properties';
import {visibleDocument} from './scene-visibility';
import {cloneSceneGroup} from './scene-groups';
import {PlaqueMountingSchema,plaqueMountingPoints} from './plaque';
import { FontAssetsSchema, FontIdSchema } from './font-assets';
import { fitComposition } from './format-adaptation';
import { InkColorSchema } from './ink';
import { EDITOR_LIMITS,GRAPHIC_GEOMETRY_LIMITS,MAX_TEXT_SKEW_DEG } from './limits';
import {GraphicAreaSchema as AreaSchema}from'./graphic-area';
import { assertDocumentTextProduction, assertMinimumText, minimumFontForProduct } from './text-production';
import { VectorCommandsSchema, VectorClipSchema, vectorBounds, vectorContours } from './vector-geometry';
import { attachTextPath, detachTextPath, updateTextPath, preserveTextPathGuide } from './text-path-model';
import { TextPathSchema, TextPathOptionsSchema } from './text-path-spec';
import { JustificationSchema } from './justification';
import { z } from 'zod';
import {ProductionProfileSchema} from './production-profile';
import {assertProfileForPage} from './production-profile-link';
import { ShapeSchema, profileKey, type ProductProfile } from '../catalog/schema';
import { applySelectionCommand, isSelectionCommand, selectionUnits } from './selection';
import { ellipseIntersectsArea } from './ellipse-intersection';
import { pathIntersectsArea } from './path-intersection';
import { FONT_FAMILIES } from './fonts';
import { RasterSourceSchema } from './raster-source';
import { RasterParametersSchema } from './raster-processing';
import { RasterCropSchema, checkedRasterCrop } from './raster-geometry';
import { areaAlignmentDelta } from './align-area';
import { BezierNodeSchema, bezierBounds, flattenBezier, MAX_BEZIER_NODES } from './bezier-geometry';

const affineFields = { visible: z.boolean().optional(), skewXDeg: z.number().finite().min(-MAX_TEXT_SKEW_DEG).max(MAX_TEXT_SKEW_DEG).optional(), mirrorX: z.boolean().optional(), mirrorY: z.boolean().optional() };
const position = { xMm: z.number().finite().min(-GRAPHIC_GEOMETRY_LIMITS.coordinateMm).max(GRAPHIC_GEOMETRY_LIMITS.coordinateMm), yMm: z.number().finite().min(-GRAPHIC_GEOMETRY_LIMITS.coordinateMm).max(GRAPHIC_GEOMETRY_LIMITS.coordinateMm) };
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
const textSkew = z.number().finite().min(-MAX_TEXT_SKEW_DEG).max(MAX_TEXT_SKEW_DEG);
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
  textSkewXDeg: textSkew.optional(),
  textClipMasks: TextClipMasksSchema.optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(), fontStyle: z.enum(['normal', 'italic']).optional(), underline: z.boolean().optional(), linethrough: z.boolean().optional(), overline: z.boolean().optional(),
  textAlign: TextAlignmentSchema.optional(), lineHeight: z.number().finite().min(EDITOR_LIMITS.minLineHeight).max(EDITOR_LIMITS.maxLineHeight).optional(),
  letterSpacingPt: z.number().finite().min(EDITOR_LIMITS.minTrackingPt).max(EDITOR_LIMITS.maxTrackingPt).optional(),
};
const shapeAppearance = { ...PaintOpacityFields, fill: paint.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional() };
export const TextBoxSchema = z.strictObject({ widthMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), autoWidth: z.boolean(), autoHeight: z.literal(true) });
const textContent = z.string().max(EDITOR_LIMITS.textCharacters*2).refine(t => !/[\r\u0000-\u0009\u000b-\u001f]/.test(t) && Array.from(t).length<=EDITOR_LIMITS.textCharacters && t.split('\n').length <= EDITOR_LIMITS.textLines, `Massimo ${EDITOR_LIMITS.textCharacters} caratteri Unicode e ${EDITOR_LIMITS.textLines} righe per box nel laboratorio`);
export const SceneObjectSchema = z.discriminatedUnion('type', [
  z.strictObject({ id, type: z.literal('text'), ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), text: textContent, fontSizePt: z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt), fontFamily, fill: color, ...textAppearance, textBox: TextBoxSchema.optional(), characterStyles: characterRuns }),
  z.strictObject({ id, type: z.literal('rect'), ...ShapeJoinFields, ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), strokeMm: StrokeWidthSchema, stroke: paint, ...shapeAppearance, cornerRadiusMm: z.number().finite().min(0).max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2).optional() }),
  z.strictObject({ id, type: z.literal('circle'), ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), radiusMm: z.number().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2), strokeMm: StrokeWidthSchema, stroke: paint, ...shapeAppearance }),
  z.strictObject({ id, type: z.literal('line'), ...PaintOpacityFields, ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), lengthMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), strokeMm: StrokeWidthSchema, stroke: color, fill: z.literal('none').optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional(), strokeLineCap: z.enum(['butt','round','square']).optional() }),
  z.strictObject({ id, type: z.literal('ellipse'), ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), rxMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2), ryMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2), strokeMm: StrokeWidthSchema, stroke: paint, ...shapeAppearance }),
  z.strictObject({ id, type: z.literal('path'), ...PathStrokeFields, ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), points: z.array(z.strictObject({ x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1) })).min(2).max(512), closed: z.boolean(), strokeMm: StrokeWidthSchema, stroke: color, ...shapeAppearance }).refine(object=>object.strokeFrameVersion===1||object.strokeLineCap===undefined&&object.strokeLineJoin===undefined&&object.strokeMiterLimit===undefined,'I nuovi stili del tracciato richiedono la cornice versione 1.'),
  z.strictObject({ id, type: z.literal('image'), opacity:OpacitySchema.optional(), ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), source: RasterSourceSchema, raster: RasterParametersSchema,clipMasks:ClipMasksSchema.optional(), pixelAspectRatio: z.number().finite().min(0.01).max(100).optional(), crop: RasterCropSchema.optional(), flipX: z.boolean().optional(), flipY: z.boolean().optional() }),
  z.strictObject({id,type:z.literal('qr'),...position,...affineFields,editor:ObjectPropertiesSchema.optional(),rotationDeg:rotation.optional(),widthMm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm),heightMm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm),qr:QrParametersSchema,stroke:paint,strokeMm:textStrokeWidth,...shapeAppearance}).refine(o=>Math.abs(o.widthMm-o.heightMm)<=1e-9*Math.max(o.widthMm,o.heightMm),'Il QR deve restare quadrato.').refine(o=>!o.skewXDeg&&!o.mirrorX&&!o.mirrorY&&o.fill==='#000000'&&o.stroke==='none'&&o.strokeMm===0&&(o.fillOpacity??1)===1&&(o.strokeOpacity??1)===1&&(!o.strokeDash||o.strokeDash==='solid'),'Il QR mantiene contrasto bianco/nero e non ammette deformazioni o riflessioni.'),
  z.strictObject({ id, type: z.literal('vector'), ...PaintOpacityFields, ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), commands: VectorCommandsSchema,clipMasks:ClipMasksSchema.optional(), clipRect: VectorClipSchema.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional(), fillRule: z.enum(['evenodd', 'nonzero']), fill: paint, stroke: paint, strokeMm: StrokeWidthSchema, strokeLineCap: z.enum(['butt', 'round', 'square']), strokeLineJoin: z.enum(['miter', 'round', 'bevel']), strokeMiterLimit: z.number().finite().min(1).max(100),strokeFrameVersion:PathStrokeFields.strokeFrameVersion }),
  z.strictObject({ id, type: z.literal('bezier'), ...PathStrokeFields, ...position, ...affineFields, editor:ObjectPropertiesSchema.optional(), rotationDeg: rotation.optional(), widthMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), nodes: z.array(BezierNodeSchema).min(2).max(MAX_BEZIER_NODES), closed: z.boolean(), strokeMm: StrokeWidthSchema, stroke: color, ...shapeAppearance }).refine(object=>object.strokeFrameVersion===1||object.strokeLineCap===undefined&&object.strokeLineJoin===undefined&&object.strokeMiterLimit===undefined,'I nuovi stili del tracciato richiedono la cornice versione 1.'),
]);
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export const SceneGroupSchema = z.strictObject({ id, parentId:id.optional(),visible:z.boolean().optional(),editor:GroupPropertiesSchema.optional(),objectIds: z.array(id).min(1).max(EDITOR_LIMITS.objects) });
export type SceneGroup=z.infer<typeof SceneGroupSchema>;
const documentFields = z.strictObject({
  shopSelection:ShopSelectionSchema.optional(),
  layoutGuides:LayoutGuidesSchema.optional(),
  productionProfile:ProductionProfileSchema.optional(),
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
  if(d.productionProfile?.kind==='stamp-emboss'&&d.inkColor&&d.inkColor!=='black')ctx.addIssue({code:'custom',message:'Il timbro a secco non usa un tampone inchiostrato.'});
  if(d.shopSelection)try{assertShopSelection(d.shopSelection,d.productionProfile,d.productId);}catch(error){ctx.addIssue({code:'custom',message:error instanceof Error?error.message:'Scelta prodotto non valida'});}
  if(d.productionProfile)try{assertProfileForPage(d.productionProfile,d);}catch(error){ctx.addIssue({code:'custom',message:error instanceof Error?error.message:'Profilo tecnico non valido'});}
  // The typed catalog currently contains stamp mounts only. Commercial plaque
  // associations live in the archive adapter, not in these stamp binding fields.
  if (d.colorMode === 'color' && d.productId !== null) ctx.addIssue({ code: 'custom', message: 'Le montature timbro richiedono un documento monocromatico; i colori non vengono convertiti automaticamente.' });
  if(d.colorMode!=='color'&&!isMonochromePaint(d.paperColor))ctx.addIssue({code:'custom',message:'Il documento monocromatico ammette soltanto un fondo nero o bianco.'});
  if (d.colorMode !== 'color') for (const object of d.objects) {
    const paints = object.type === 'image' ? [] : [
      ...('fill' in object ? [object.fill] : []), ...('stroke' in object ? [object.stroke] : []),
      ...(object.type === 'text' ? object.characterStyles?.flatMap(run => [run.style.fill, run.style.stroke]) ?? [] : []),
      ...(object.type==='text'&&object.textPath?[object.textPath.guide.stroke,object.textPath.guide.fill]:[]),
    ];
    if (paints.some(paint => !isMonochromePaint(paint)) || object.type === 'image' && (object.raster.mode === 'original' || object.raster.mode === 'color' || !isMonochromePaint(object.raster.tintColor))) ctx.addIssue({ code: 'custom', message: 'Il documento monocromatico ammette soltanto nero/bianco. Per conservare i colori usa un progetto a colori, senza montatura timbro.' });
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
  for(const object of d.objects)if('clipMasks'in object&&object.clipMasks){if(maskedCommandCount(object)>EDITOR_LIMITS.vectorCommandsPerObject)ctx.addIssue({code:'custom',message:'Oggetto e maschere oltre il budget vettoriale'});if(object.widthMm<=0||object.heightMm<=0)ctx.addIssue({code:'custom',message:'Maschera su frame degenere'});for(const mask of object.clipMasks){const f=mask.frame;if(Math.max(Math.abs(f.left*object.widthMm),Math.abs((f.left+f.width)*object.widthMm),Math.abs(f.top*object.heightMm),Math.abs((f.top+f.height)*object.heightMm))>EDITOR_LIMITS.maxObjectExtentMm)ctx.addIssue({code:'custom',message:'Maschera oltre il limite geometrico locale di 10 m'});}}
  const images = d.objects.filter(o => o.type === 'image'), sources = new Map<string, string>();
  for(const message of rasterDocumentIssues(rasterDocumentUsage(images)))ctx.addIssue({code:'custom',message});
  for (const image of images) {
    const previous = sources.get(image.source.id); if (previous !== undefined && previous !== image.source.dataUrl) ctx.addIssue({ code: 'custom', message: 'ID sorgente immagine associato a dati diversi' }); sources.set(image.source.id, image.source.dataUrl);
    try {
      const crop = checkedRasterCrop(image.source, image.crop), a = image.widthMm * crop.heightPx, b = image.heightMm * crop.widthPx * (image.pixelAspectRatio ?? 1);
      if (Math.abs(a - b) > 1e-7 * Math.max(a, b)) ctx.addIssue({ code: 'custom', message: 'Le proporzioni dei pixel visibili dell’immagine devono essere conservate' });
    } catch (e) { ctx.addIssue({ code: 'custom', message: e instanceof Error ? e.message : 'Ritaglio non valido' }); }
  }
  if (d.objects.reduce((sum, object) => sum + maskedCommandCount(object), 0) > EDITOR_LIMITS.vectorCommands) ctx.addIssue({ code: 'custom', message: `Massimo ${EDITOR_LIMITS.vectorCommands} segmenti vettoriali nel documento TEST` });
  const assetIds = new Set(d.fontAssets?.map(asset => asset.id) ?? []);
  for (const object of d.objects) {
    if(object.type==='circle'&&object.rotationDeg&&!object.skewXDeg)ctx.addIssue({code:'custom',message:'Un cerchio senza inclinazione non richiede rotazione'});
    if (object.type === 'text' && [object.fontFamily,...object.characterStyles?.map(r=>r.style.fontFamily).filter((f):f is string=>!!f)??[]].some(f => f.startsWith('font-') && !assetIds.has(f))) ctx.addIssue({code:'custom',message:'Il documento non contiene la risorsa del font utilizzato'});
    if (object.type === 'vector') {
      const b = vectorBounds(object.commands), near = (a: number, b: number) => Math.abs(a - b) < 1e-7;
      if (!near(b.x, 0) || !near(b.y, 0) || !near(b.width, object.widthMm ? 1 : 0) || !near(b.height, object.heightMm ? 1 : 0) || !object.widthMm && !object.heightMm) ctx.addIssue({ code: 'custom', message: 'Vettore non normalizzato o degenere' });
    }
    if (object.type === 'text') {
      if(textClipExtent(object)>EDITOR_LIMITS.maxObjectExtentMm)ctx.addIssue({code:'custom',message:'Maschera del testo oltre il limite geometrico locale di 10 m'});
      if (object.textPath && (object.text.includes('\n') || object.textBox || object.lineStyles?.length || object.textAlign === 'justify-left' || object.textScaleY !== undefined && object.textScaleY !== 1 || !!object.textSkewXDeg || !!object.textClipMasks)) ctx.addIssue({ code: 'custom', message: 'Il testo su tracciato richiede una sola riga, senza box/giustificazione, scala verticale, inclinazione o maschere del box' });
      if ((object.textAlign === 'justify-left' || object.lineStyles?.some(run => run.alignment === 'justify-left')) && (object.textBox?.autoWidth ?? true) && object.justification?.distribution!=='word-space') ctx.addIssue({ code: 'custom', message: 'Il testo giustificato richiede un box a larghezza fissa' });
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
/** A page stores its scene once. Font files and project revision remain global. */
export const GraphicPageSchema=documentFields.omit({schemaVersion:true,documentId:true,revision:true,fontAssets:true,productProfileVersion:true,fixture:true,validatedForProduction:true}).extend({id,name:z.string().trim().min(1).max(120)});
export type GraphicPage=z.infer<typeof GraphicPageSchema>;
export const MAX_GRAPHIC_PAGES=100;
export const DocumentSchema = documentFields.extend({pageId:id.optional(),pageName:z.string().trim().min(1).max(120).optional(),otherPages:z.array(GraphicPageSchema).min(1).max(MAX_GRAPHIC_PAGES-1).optional(),pageOrder:z.array(id).min(1).max(MAX_GRAPHIC_PAGES).optional(),contentRevision:z.number().int().nonnegative().optional()}).superRefine((d,ctx)=>{
 refineDocument(d,ctx);
 if(d.contentRevision!==undefined&&d.contentRevision>d.revision)ctx.addIssue({code:'custom',message:'Revisione del contenuto oltre la revisione del progetto'});
 const ids=[d.pageId??'page-1',...d.otherPages?.map(page=>page.id)??[]];
 if(d.otherPages?.length&&(!d.pageId||!d.pageName||!d.pageOrder))ctx.addIssue({code:'custom',message:'Il progetto multipagina richiede identità, nomi e ordine delle pagine'});
 if(new Set(ids).size!==ids.length||d.pageOrder&&(d.pageOrder.length!==ids.length||new Set(d.pageOrder).size!==ids.length||d.pageOrder.some(id=>!ids.includes(id))))ctx.addIssue({code:'custom',message:'ID o ordine delle pagine non validi'});
 if(d.pageName&&!d.pageId)ctx.addIssue({code:'custom',message:'Il nome della pagina richiede un ID stabile'});
 for(const page of d.otherPages??[]){const{id:_id,name:_name,...scene}=page;refineDocument({...scene,documentId:d.documentId,revision:d.revision,fontAssets:d.fontAssets,productProfileVersion:d.productProfileVersion,fixture:d.fixture,validatedForProduction:d.validatedForProduction},ctx);}
 if(d.otherPages?.length){
  const objects=[...d.objects,...d.otherPages.flatMap(page=>page.objects)],groups=[...d.groups??[],...d.otherPages.flatMap(page=>page.groups??[])];
  if(objects.length>EDITOR_LIMITS.objects||groups.length>EDITOR_LIMITS.groups||objects.reduce((n,o)=>n+(o.type==='text'?Array.from(o.text).length:0),0)>EDITOR_LIMITS.documentTextCharacters||objects.reduce((n,o)=>n+maskedCommandCount(o),0)>EDITOR_LIMITS.vectorCommands)ctx.addIssue({code:'custom',message:'Il progetto multipagina supera i limiti complessivi di oggetti, gruppi, testi o segmenti'});
  const images=objects.filter(o=>o.type==='image'),resources=new Map<string,string>();for(const message of rasterDocumentIssues(rasterDocumentUsage(images)))ctx.addIssue({code:'custom',message});for(const image of images){const previous=resources.get(image.source.id);if(previous!==undefined&&previous!==image.source.dataUrl)ctx.addIssue({code:'custom',message:'ID immagine associato a originali diversi fra pagine'});resources.set(image.source.id,image.source.dataUrl);}
 }
});
const LegacySceneObjectSchema = z.discriminatedUnion('type', [
  SceneObjectSchema.options[0].omit({ rotationDeg: true, fontWeight: true, fontStyle: true, underline: true, linethrough: true, overline: true, textAlign: true, lineHeight: true, letterSpacingPt: true, textScaleX: true, textScaleY: true, textSkewXDeg: true, textClipMasks: true, lineStyles: true, justification: true, textPath: true, textBox: true, characterStyles: true }).extend({ fontFamily: z.literal('Arial') }),
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
  return object.type === 'image' ? { ...object, ...(object.editor?{editor:{...object.editor}}:{}), source: { ...object.source }, raster: { ...object.raster }, ...(object.crop ? { crop: { ...object.crop } } : {}),...(object.clipMasks?{clipMasks:structuredClone(object.clipMasks)}:{}) } : structuredClone(object);
}
export function cloneGraphicDocument(document: GraphicDocument): GraphicDocument {
  return { ...document, ...(document.shopSelection?{shopSelection:{...document.shopSelection}}:{}), ...(document.layoutGuides?{layoutGuides:structuredClone(document.layoutGuides)}:{}), ...(document.productionProfile?{productionProfile:structuredClone(document.productionProfile)}:{}), ...(document.pageOrder?{pageOrder:[...document.pageOrder]}:{}),...(document.otherPages?{otherPages:document.otherPages.map(page=>{const{objects,groups,areaMm,...rest}=page;return{...structuredClone(rest),areaMm:{...areaMm},objects:objects.map(cloneSceneObject),...(groups?{groups:groups.map(cloneSceneGroup)}:{})};})}:{}), ...(document.plaque?{plaque:{...document.plaque}}:{}), ...(document.templateOrigin?{templateOrigin:{...document.templateOrigin}}:{}), areaMm: { ...document.areaMm }, objects: document.objects.map(cloneSceneObject), ...(document.fontAssets ? { fontAssets: document.fontAssets.map(asset=>({...asset})) } : {}), ...(document.groups ? { groups: document.groups.map(cloneSceneGroup) } : {}) };
}
export const ObjectSizeSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('qr'), widthMm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm),heightMm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm) }),
  z.strictObject({ type: z.literal('vector'), widthMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm) }),
  z.strictObject({ type: z.literal('text'), fontSizePt: z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt), textScaleX: textScale.optional(), textScaleY: textScale.optional(), textSkewXDeg: textSkew.optional(), textBox: TextBoxSchema.optional(), textPath: TextPathSchema.optional() }),
  z.strictObject({ type: z.literal('rect'), widthMm: z.number().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm) }),
  z.strictObject({ type: z.literal('circle'), radiusMm: z.number().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2) }),
  z.strictObject({ type: z.literal('line'), lengthMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm) }),
  z.strictObject({ type: z.literal('ellipse'), rxMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2), ryMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm/2) }),
  z.strictObject({ type: z.literal('path'), widthMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm) }),
  z.strictObject({ type: z.literal('image'), widthMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm),pixelAspectRatio:z.number().finite().min(.01).max(100).optional() }),
  z.strictObject({ type: z.literal('bezier'), widthMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm), heightMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.objectSideMm) }),
]);
export const TransformArgumentsSchema = z.strictObject({ ...position, skewXDeg:textSkew.optional(), rotationDeg: rotation, size: ObjectSizeSchema,strokeFrameScale:z.strictObject({x:z.number().finite().positive().max(1000),y:z.number().finite().positive().max(1000)}).optional() });
export type TransformArguments = z.infer<typeof TransformArgumentsSchema>;
const base = { schemaVersion: z.literal(1), expectedRevision: z.number().int().nonnegative(), objectId: id,pageId:id.optional() };
const objectBase={...base,targetScope:z.literal('object').optional()};
const ids = z.array(id).min(1).max(EDITOR_LIMITS.objects);
const alignment = z.enum(['left', 'centerX', 'right', 'top', 'centerY', 'bottom']);
export const SelectionTransformSchema = z.strictObject({ objectIds: ids.min(2), scale: z.number().finite().min(0.01).max(100), rotationDeg: rotation, center: z.strictObject(position) });
export type SelectionTransformArguments = z.infer<typeof SelectionTransformSchema>;
export const SelectionStyleSchema = z.strictObject({ opacity:OpacitySchema.optional(), ...PaintOpacityFields, ...ShapeJoinFields, strokeLineCap: z.enum(['butt','round','square']).optional(), fill: paint.optional(), stroke: paint.optional(), strokeMm: textStrokeWidth.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional() }).refine(style => Object.values(style).some(value => value !== undefined), 'Scegli almeno una proprietà di stile');
export type SelectionStyle = z.infer<typeof SelectionStyleSchema>;
export const GraphicCommandSchema = z.discriminatedUnion('tool', [
  z.strictObject({...base,tool:z.literal('setProductionProfile'),arguments:z.strictObject({profile:ProductionProfileSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('selectPage'),arguments:z.strictObject({pageId:id})}),
  z.strictObject({...base,tool:z.literal('addPage'),arguments:z.strictObject({page:GraphicPageSchema,fontAssets:FontAssetsSchema.optional()})}),
  z.strictObject({...base,tool:z.literal('duplicatePage'),arguments:z.strictObject({pageId:id,newPageId:id,name:z.string().trim().min(1).max(120)})}),
  z.strictObject({...base,tool:z.literal('removePage'),arguments:z.strictObject({pageId:id})}),
  z.strictObject({...base,tool:z.literal('renamePage'),arguments:z.strictObject({pageId:id,name:z.string().trim().min(1).max(120)})}),
  z.strictObject({...base,tool:z.literal('reorderPage'),arguments:z.strictObject({pageId:id,index:z.number().int().min(0).max(MAX_GRAPHIC_PAGES-1)})}),
  z.strictObject({...objectBase,tool:z.literal('setObjectProperties'),arguments:ObjectPropertiesSchema}),
  z.strictObject({...objectBase,tool:z.literal('setObjectVisibility'),arguments:z.strictObject({visible:z.boolean()})}),
  z.strictObject({...base,tool:z.literal('setGroupVisibility'),arguments:z.strictObject({visible:z.boolean()})}),
  z.strictObject({...base,tool:z.literal('setGroupProperties'),arguments:GroupPropertiesSchema}),
  z.strictObject({...base,tool:z.literal('placeGroupMember'),arguments:z.strictObject({parentGroupId:id.nullable(),targetObjectId:id.optional(),side:z.enum(['above','below'])})}),
  z.strictObject({...base,tool:z.literal('setLayoutGuides'),arguments:z.strictObject({guides:LayoutGuidesSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('setPaperColor'),arguments:z.strictObject({color:ColorSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('setBackgroundImage'),arguments:z.strictObject({object:SceneObjectSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('setBackgroundObjects'),arguments:z.strictObject({objects:z.array(SceneObjectSchema).max(EDITOR_LIMITS.objects),groups:z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups),backgroundGroupId:id.optional(),fontAssets:FontAssetsSchema.optional()})}),
  z.strictObject({...objectBase,tool:z.literal('replaceImageSource'),arguments:z.strictObject({source:RasterSourceSchema,fit:z.enum(['contain','cover']).optional()})}),
  z.strictObject({...base,tool:z.literal('setShopSelection'),arguments:z.strictObject({selection:ShopSelectionSchema.nullable()})}),
  z.strictObject({...base,tool:z.literal('configurePlaque'),arguments:z.strictObject({areaMm:AreaSchema,mounting:PlaqueMountingSchema})}),
  z.strictObject({...base,tool:z.literal('setInkColor'),arguments:z.strictObject({color:InkColorSchema})}),
  z.strictObject({...base,tool:z.literal('changeFormat'),arguments:z.strictObject({profileKey:z.string().min(1).max(200),catalogVersion:z.string().min(1),allowShrink:z.boolean()})}),
  z.strictObject({...base,tool:z.literal('applyTemplate'),arguments:z.strictObject({templateId:z.string().uuid(),templateVersion:z.number().int().positive(),objects:z.array(SceneObjectSchema).min(0).max(EDITOR_LIMITS.objects),groups:z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups),backgroundImageId:id.optional(),backgroundGroupId:id.optional(),paperColor:ColorSchema.optional(),fontAssets:FontAssetsSchema.optional(),inkColor:InkColorSchema.optional()})}),
  z.strictObject({ ...base, tool: z.literal('attachTextToPath'), arguments: z.strictObject({ pathObjectId: id }) }),
  z.strictObject({ ...base, tool: z.literal('detachTextFromPath'), arguments: z.strictObject({ pathObjectId: id }) }),
  z.strictObject({ ...objectBase, tool: z.literal('setTextPath'), arguments: TextPathOptionsSchema }),
  z.strictObject({ ...objectBase, tool: z.literal('moveObject'), arguments: z.strictObject(position) }),
  z.strictObject({ ...objectBase, tool: z.literal('setText'), arguments: z.strictObject({ text: textContent }) }),
  z.strictObject({ ...objectBase, tool: z.literal('setObjectStyle'), arguments: z.strictObject({ fontSizePt: z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt), fill: color }) }),
  z.strictObject({ ...base, tool: z.literal('addObject'), arguments: z.strictObject({ object: SceneObjectSchema, fontAssets: FontAssetsSchema.optional() }) }),
  z.strictObject({ ...base, tool: z.literal('insertObjects'), arguments: z.strictObject({ objects: z.array(SceneObjectSchema).min(1).max(EDITOR_LIMITS.objects), groups: z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups), fontAssets: FontAssetsSchema.optional() }) }),
  z.strictObject({ ...objectBase, tool: z.literal('updateObject'), arguments: z.strictObject({ object: SceneObjectSchema, fontAssets: FontAssetsSchema.optional() }) }),
  z.strictObject({ ...objectBase, tool: z.literal('duplicateObject'), arguments: z.strictObject({ newObjectId: id, ...position }) }),
  z.strictObject({ ...objectBase, tool: z.literal('deleteObject'), arguments: z.strictObject({}) }),
  z.strictObject({ ...objectBase, tool: z.literal('transformObject'), arguments: TransformArgumentsSchema }),
  z.strictObject({ ...objectBase, tool: z.literal('reorderObject'), arguments: z.strictObject({ position: z.enum(['front', 'back', 'forward', 'backward']) }) }),
  z.strictObject({ ...objectBase, tool: z.literal('alignObject'), arguments: z.strictObject({ alignment: z.enum(['left', 'centerX', 'right', 'top', 'centerY', 'bottom']), marginMm: z.number().finite().min(0).max(1000).optional() }) }),
  z.strictObject({ ...base, tool: z.literal('groupObjects'), arguments: z.strictObject({ objectIds: ids.min(2), groupId: id }) }),
  z.strictObject({ ...base, tool: z.literal('ungroupObjects'), arguments: z.strictObject({ groupIds: z.array(id).min(1).max(EDITOR_LIMITS.groups) }) }),
  z.strictObject({ ...base, tool: z.literal('moveObjects'), arguments: z.strictObject({ objectIds: ids, deltaXmm: z.number().finite().min(-2*GRAPHIC_GEOMETRY_LIMITS.coordinateMm).max(2*GRAPHIC_GEOMETRY_LIMITS.coordinateMm), deltaYmm: z.number().finite().min(-2*GRAPHIC_GEOMETRY_LIMITS.coordinateMm).max(2*GRAPHIC_GEOMETRY_LIMITS.coordinateMm) }) }),
  z.strictObject({ ...base, tool: z.literal('transformObjects'), arguments: SelectionTransformSchema }),
  z.strictObject({ ...base, tool: z.literal('styleObjects'), arguments: z.strictObject({ objectIds: ids.min(2), style: SelectionStyleSchema }) }),
  z.strictObject({ ...base, tool: z.literal('reorderObjects'), arguments: z.strictObject({ objectIds: ids.min(2), position: z.enum(['front', 'back', 'forward', 'backward']) }) }),
  z.strictObject({ ...base, tool: z.literal('placeObjects'), arguments: z.strictObject({ objectIds: ids, targetObjectId: id, side: z.enum(['above', 'below']) }) }),
  z.strictObject({ ...base, tool: z.literal('deleteObjects'), arguments: z.strictObject({ objectIds: ids }) }),
  z.strictObject({ ...base, tool: z.literal('duplicateObjects'), arguments: z.strictObject({ copies: z.array(z.strictObject({ objectId: id, newObjectId: id })).min(1).max(EDITOR_LIMITS.objects), groups: z.array(z.strictObject({ groupId: id, newGroupId: id })).max(EDITOR_LIMITS.groups) }) }),
  z.strictObject({ ...base, tool: z.literal('alignObjects'), arguments: z.strictObject({ objectIds: ids.min(2), alignment, referenceObjectId:id.optional() }) }),
  z.strictObject({ ...base, tool: z.literal('alignObjectsToArea'), arguments: z.strictObject({ objectIds: ids, alignment, marginMm:z.number().finite().min(0).max(1000).optional(), individually:z.boolean().optional() }) }),
  z.strictObject({ ...objectBase, tool: z.literal('inclineObjects'), arguments: z.strictObject({objectIds:ids,angleDeg:textSkew}) }),
  z.strictObject({ ...objectBase, tool: z.literal('reflectObjects'), arguments: z.strictObject({objectIds:ids,axis:z.enum(['horizontal','vertical'])}) }),
  z.strictObject({ ...base, tool: z.literal('distributeObjects'), arguments: z.strictObject({ objectIds: ids.min(3), axis: z.enum(['horizontal', 'vertical']) }) }),
  z.strictObject({ ...base, tool: z.literal('spaceObjects'), arguments: z.strictObject({ objectIds: ids.min(2), axis: z.enum(['horizontal', 'vertical']), gapMm: z.number().finite().nonnegative().max(GRAPHIC_GEOMETRY_LIMITS.coordinateMm), referenceObjectId: id.optional() }) }),
]);
export type GraphicCommand = z.infer<typeof GraphicCommandSchema>;
export type Measure = (object: SceneObject) => { widthMm: number; heightMm: number; textLayoutWidthMm?: number; textLayoutHeightMm?: number; pathCenterOffsetMm?: { x: number; y: number }; pathLengthMm?: number; textAdvanceMm?: number };
export const TEST_MARGIN_MM = 1;
export function objectGeometry(object: SceneObject, measure: Measure) {
  const affine=hasObjectAffine(object), box = measure(affine?withoutObjectAffine(object):object);
  if (!Number.isFinite(box.widthMm) || !Number.isFinite(box.heightMm) || box.widthMm <= 0 || box.heightMm <= 0) throw new Error('Misurazione non valida');
  if(Math.max(box.widthMm,box.heightMm)>EDITOR_LIMITS.maxObjectExtentMm)throw new Error('Ingombro dell’oggetto oltre il limite di sicurezza del laboratorio (10 m). Riduci corpo, dilatazione o lunghezza della riga.');
  const angle = (object.rotationDeg ?? 0) * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const local = [[0, 0], [box.widthMm, 0], [box.widthMm, box.heightMm], [0, box.heightMm]].map(([x, y]) => affine ? frameToWorld(object,x!,y!) : ({ x: x! * cos - y! * sin, y: x! * sin + y! * cos }));
  const minX = Math.min(...local.map(p => p.x)), minY = Math.min(...local.map(p => p.y));
  const extentX=Math.max(...local.map(p=>p.x))-minX,extentY=Math.max(...local.map(p=>p.y))-minY;
  if(affine&&Math.max(extentX,extentY)>EDITOR_LIMITS.maxObjectExtentMm)throw new Error('Ingombro trasformato oltre il limite geometrico del laboratorio (10 m)');
  return { widthMm: extentX, heightMm: extentY, corners: local.map(p => ({ x: object.xMm + p.x - minX, y: object.yMm + p.y - minY })) };
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
  if((object.type==='path'||object.type==='bezier'||object.type==='vector')&&object.strokeFrameVersion===1){
    for(const polygon of pathStrokeExtras(object)){
      const world=polygon.map(p=>{const q=frameToWorld(object,p.x-object.widthMm/2,p.y-object.heightMm/2);return{x:q.x+center.xMm,y:q.y+center.yMm};}),xs=world.map(p=>p.x),ys=world.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
      if(width>1e-10&&height>1e-10&&pathIntersectsArea(world.map(p=>({x:(p.x-left)/width,y:(p.y-top)/height})),width,height,{x:left+width/2,y:top+height/2},0,0,true,true,doc.areaMm,doc.shape==='round'))return true;
    }
  }
  if(hasObjectAffine(object)){const hit=affinePathIntersects(doc,object,center);if(hit!==null)return hit;}
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
export function validateLayout(doc: GraphicDocument, measure: Measure, mode: 'strict' | 'edit' = 'strict'): void {for(const page of graphicPages(doc))validateSinglePageLayout(page,measure,mode);}
function validateSinglePageLayout(doc: GraphicDocument, measure: Measure, mode: 'strict' | 'edit'): void {
  // The editing workspace includes the area outside the paper. Only a drag
  // gesture can request deletion; importing/resizing must preserve every object.
  if(mode==='edit'){for(const object of doc.objects)try{objectGeometry(object,measure);}catch(error){if(!(object.type==='text'&&error instanceof UnverifiedTextGeometryError))throw error;}return;}
  doc=visibleDocument(doc);
  const backgrounds=backgroundObjectIds(doc);
  const intersections=new Map<SceneObject,boolean>();
  const intersects = (object: SceneObject): boolean => {const previous=intersections.get(object);if(previous!==undefined)return previous;const visible=objectIntersectsArea(doc, object, measure);intersections.set(object,visible);return visible;};
  const visibleGroups = new Set((doc.groups ?? []).filter(group => group.objectIds.some(id => intersects(doc.objects.find(object => object.id === id)!))).flatMap(group => group.objectIds));
  for (const object of doc.objects) {
    if (backgrounds.has(object.id)) {
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
export interface GraphicCatalogContext {version:string;products:readonly ProductProfile[];shopProducts?:readonly ShopProductDetail[];shopProfiles?:readonly z.infer<typeof ProductionProfileSchema>[];}
export function applyGraphicCommand(doc: GraphicDocument, raw: unknown, measure: Measure, catalog?:GraphicCatalogContext,role:EditorRole='customer'): GraphicDocument {
  DocumentSchema.parse(doc);
  const command = GraphicCommandSchema.parse(raw);
  const direct='targetScope'in command&&command.targetScope==='object';
  if (command.expectedRevision !== doc.revision) throw new Error('Revisione grafica obsoleta: rileggi il documento');
  if(command.pageId!==undefined&&command.pageId!==(doc.pageId??'page-1'))throw Error('Pagina del comando diversa dalla pagina attiva');
  if(isPageCommand(command))return applyPageCommand(doc,command,measure,role);
  const next = cloneGraphicDocument(doc);
  if ('fontAssets' in command.arguments && command.arguments.fontAssets?.length) { const resources = [...next.fontAssets ?? []]; for (const asset of command.arguments.fontAssets) { const old = resources.find(a=>a.id===asset.id); if (old && (old.dataBase64!==asset.dataBase64 || old.format!==asset.format || old.family!==asset.family)) throw new Error('La risorsa originale del font è immutabile'); if (!old) resources.push({...asset}); } next.fontAssets=resources; }
  if(command.tool==='setShopSelection'){
    const selection=command.arguments.selection;
    if(!selection){if(role!=='admin'&&doc.shopSelection)throw Error('Il prodotto si cambia dal percorso guidato.');delete next.shopSelection;}
    else{
      const product=catalog?.shopProducts?.find(item=>item.id===selection.productId),profile=catalog?.shopProfiles?.find(item=>item.id===selection.profileId&&item.version===selection.profileVersion);
      if(!product||!profile||JSON.stringify(ProductionProfileSchema.parse(profile))!==JSON.stringify(doc.productionProfile))throw Error('Prodotto o profilo aggiornato non disponibili nel contesto: ripeti la scelta.');
      const verified=shopSelectionFor(profile,product,selection.variantId);
      if(JSON.stringify(verified)!==JSON.stringify(selection))throw Error('La lettura del prodotto è cambiata: ripeti la scelta della variante.');
      assertShopSelection(verified,doc.productionProfile,doc.productId);next.shopSelection={...verified};
    }
  }
  else if(command.tool==='setProductionProfile'){
    if(role!=='admin')throw Error('Il profilo produttivo si collega in modalità amministrativa.');
    if(command.arguments.profile){assertProfileForPage(command.arguments.profile,doc,catalog,true);next.productionProfile=structuredClone(command.arguments.profile);}else delete next.productionProfile;
  }
  else if(command.tool==='setLayoutGuides'){assertGuideChange(doc.layoutGuides,command.arguments.guides);if(command.arguments.guides)next.layoutGuides=structuredClone(command.arguments.guides);else delete next.layoutGuides;}
  else if(command.tool==='setPaperColor'){if(command.arguments.color===null)delete next.paperColor;else next.paperColor=command.arguments.color;}
  else if(command.tool==='setBackgroundImage'){
    const image=command.arguments.object;if(image&&(image.type!=='image'||image.id!==command.objectId))throw new Error('Lo sfondo richiede un’immagine e un ID coerenti');
    clearBackground(next);
    if(image){if(next.objects.some(o=>o.id===image.id))throw new Error('ID dello sfondo già presente');next.objects.unshift(cloneSceneObject(image));next.backgroundImageId=image.id;}
  }
  else if(command.tool==='setBackgroundObjects')replaceBackgroundObjects(next,command.objectId,command.arguments);
  else if(command.tool==='configurePlaque'){
    if(!doc.plaque)throw new Error('Il documento non è una targa a misura.');
    if(role==='customer'&&(command.arguments.mounting.holeDiameterMm!==doc.plaque.holeDiameterMm||(command.arguments.mounting.clearanceMm??null)!==(doc.plaque.clearanceMm??null)))throw Error('Le misure tecniche dei fissaggi si configurano in modalità amministrativa.');
    next.plaque={...command.arguments.mounting};
    // New hardware must not inherit old measurements. Validate the effective
    // configuration, including legacy glue documents carrying a dormant size.
    if(next.plaque.method!==doc.plaque.method){next.plaque.holeDiameterMm=null;if(next.plaque.clearanceMm!==undefined)next.plaque.clearanceMm=null;}
    plaqueMountingPoints(command.arguments.areaMm,next.plaque);
    const dx=(command.arguments.areaMm.width-doc.areaMm.width)/2,dy=(command.arguments.areaMm.height-doc.areaMm.height)/2;next.areaMm={...command.arguments.areaMm};next.objects=next.objects.map(object=>({...object,xMm:object.xMm+dx,yMm:object.yMm+dy}));
  }
  else if(command.tool==='setInkColor') {
    const product=catalog?.products.find(item=>item.productId===doc.productId&&item.variantIds.includes(doc.variantId??''));
    if((product?.mechanism==='emboss'||doc.productionProfile?.kind==='stamp-emboss')&&command.arguments.color!=='black')throw new Error('Il timbro a secco non usa un tampone inchiostrato.');
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
    // Other pages still refer to the shared font pool. Only a legacy single
    // page replacement can discard the previous files.
    if(!doc.otherPages){if(command.arguments.fontAssets?.length)next.fontAssets=command.arguments.fontAssets.map(asset=>({...asset}));else delete next.fontAssets;}
    if(command.arguments.paperColor)next.paperColor=command.arguments.paperColor;else delete next.paperColor;
    if(command.arguments.backgroundImageId)next.backgroundImageId=command.arguments.backgroundImageId;else delete next.backgroundImageId;
    if(command.arguments.backgroundGroupId)next.backgroundGroupId=command.arguments.backgroundGroupId;else delete next.backgroundGroupId;
    next.templateOrigin={id:command.arguments.templateId,version:command.arguments.templateVersion};
    if(command.arguments.inkColor)next.inkColor=command.arguments.inkColor;
    validateLayout(next,measure);
    assertDocumentTextProduction(next,catalog);
  }
  else if(command.tool==='placeGroupMember')placeGroupMember(next,command.objectId,command.arguments,role);
  else if(command.tool==='setObjectVisibility'){
    const object=next.objects.find(object=>object.id===command.objectId);if(!object)throw Error('ID oggetto sconosciuto');
    if(!direct&&innermostGroup(next,object.id))throw Error('Usa l’ambito oggetto per la visibilità di un membro del gruppo.');
    object.visible=command.arguments.visible;
  }
  else if(command.tool==='setGroupVisibility'){
    const group=next.groups?.find(group=>group.id===command.objectId);if(!group)throw Error('ID gruppo sconosciuto');group.visible=command.arguments.visible;
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
    if (!direct&&!['setText','replaceImageSource','setObjectProperties'].includes(command.tool)&&next.groups?.some(group => group.objectIds.includes(command.objectId))) throw new Error('Separa il gruppo prima di modificare un singolo elemento');
    const found=next.objects.find(o=>o.id===command.objectId);
    if(!found)throw new Error('ID oggetto sconosciuto');
    let object:SceneObject=found;
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
        if (before.type !== 'text') throw new Error('Il comando richiede un testo');
        const text = object.textPath ? command.arguments.text.replace(/\n/g, ' ') : command.arguments.text;
        const lineStyles = replacementLineStyles(before, text);
        object.text = text; delete object.characterStyles; delete object.lineStyles;
        if (lineStyles?.length) object.lineStyles = lineStyles;
        try {
          if (object.textPath) Object.assign(object, preserveTextPathGuide(before, object, measure));
          else if(role==='customer'&&effectiveObjectProperties(doc,before.id).transformLocked) Object.assign(object,placeObjectAtCenter(object,objectCenter(before,measure),measure));
          else {
            const alignment = lineAlignments(before)[0] ?? before.textAlign ?? 'left';
            const factor = alignment === 'center' ? .5 : alignment === 'right' ? 1 : 0;
            const previous = objectGeometry(before, measure).corners, current = objectGeometry(object, measure).corners;
            object.xMm += previous[0]!.x + factor * (previous[1]!.x - previous[0]!.x) - current[0]!.x - factor * (current[1]!.x - current[0]!.x);
            object.yMm += previous[0]!.y + factor * (previous[1]!.y - previous[0]!.y) - current[0]!.y - factor * (current[1]!.y - current[0]!.y);
          }
        } catch(error) {if(!(error instanceof UnverifiedTextGeometryError))throw error;} break;
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
      case 'duplicateObject': {
        const copy={ ...cloneSceneObject(object), id: command.arguments.newObjectId, xMm: command.arguments.xMm, yMm: command.arguments.yMm };
        if(command.targetScope==='object'&&innermostGroup(next,object.id))duplicateGroupMember(next,object.id,copy);else next.objects.push(copy);break;
      }
      case 'deleteObject': next.objects = next.objects.filter(o => o.id !== command.objectId);if(command.targetScope==='object')deleteGroupMember(next,command.objectId);break;
      case 'updateObject': {
        const update = command.arguments.object;
        if (update.id !== object.id || update.type !== object.type) throw new Error('L’ispettore non può cambiare ID o tipo dell’oggetto');
        if (object.type === 'image' && update.type === 'image' && JSON.stringify(object.source) !== JSON.stringify(update.source)) throw new Error('La sorgente originale dell’immagine è immutabile');
        next.objects[next.objects.indexOf(object)] = cloneSceneObject(update); break;
      }
      case 'transformObject': {
        const {size:requestedSize,strokeFrameScale,...transform}=command.arguments;
        let size=requestedSize;
        if(strokeFrameScale){
          if((object.type!=='path'&&object.type!=='bezier'&&object.type!=='vector')||object.strokeFrameVersion!==1||requestedSize.type!==object.type||!('widthMm'in requestedSize)||requestedSize.widthMm!==object.widthMm||requestedSize.heightMm!==object.heightMm)throw Error('La scala della cornice richiede un tracciato aggiornato e le sue dimensioni nominali correnti.');
          size={...requestedSize,...resizedPathStrokeFrame(object,strokeFrameScale.x,strokeFrameScale.y)};
        }
        if(object.type==='circle'&&size.type==='ellipse'){const{radiusMm:_radius,...appearance}=object;const changed:SceneObject={...appearance,type:'ellipse',rxMm:size.rxMm,ryMm:size.ryMm};next.objects[next.objects.indexOf(object)]=changed;object=changed;}
        if (object.type !== size.type) throw new Error('Dimensioni incompatibili con il tipo di oggetto');
        if (object.type === 'text' && size.type === 'text') {
          const factor = size.fontSizePt / object.fontSizePt;
          if(object.textClipMasks)object.textClipMasks=scaleTextClipMasks(object.textClipMasks,factor);
          if (object.strokeMm !== undefined) object.strokeMm *= factor;
          if (object.letterSpacingPt !== undefined) object.letterSpacingPt = Math.round(object.letterSpacingPt * factor * 1e9) / 1e9;
          if (object.characterStyles) object.characterStyles = object.characterStyles.map(run => ({ ...run, style: { ...run.style, ...(run.style.strokeMm === undefined ? {} : { strokeMm: run.style.strokeMm * factor }), ...(run.style.fontSizePt === undefined ? {} : { fontSizePt: Math.round(run.style.fontSizePt * factor * 1e9) / 1e9 }), ...(run.style.kerningPt === undefined ? {} : { kerningPt: Math.round(run.style.kerningPt * factor * 1e9) / 1e9 }) } }));
        }
        Object.assign(object, transform, size); break;
      }
      case 'reorderObject': {
        if(command.targetScope==='object'&&innermostGroup(next,object.id)){reorderGroupMember(next,object.id,command.arguments.position);break;}
        const units = selectionUnits(next, next.objects.map(object => object.id));
        const index = units.findIndex(unit => unit.includes(object)), last = units.length - 1;
        const target = command.arguments.position === 'front' ? last : command.arguments.position === 'back' ? 0
          : command.arguments.position === 'forward' ? Math.min(last, index + 1) : Math.max(0, index - 1);
        const [unit] = units.splice(index, 1); units.splice(target, 0, unit!); next.objects = units.flat(); break;
      }
      case 'alignObject': {
        const bounds = objectGeometry(object, measure), delta = areaAlignmentDelta({ ...bounds, xMm: object.xMm, yMm: object.yMm }, next.areaMm, command.arguments.alignment, command.arguments.marginMm ?? TEST_MARGIN_MM);
        object.xMm += delta.xMm; object.yMm += delta.yMm;
        break;
      }
    }
  }
  if(next.backgroundImageId&&!next.objects.some(o=>o.id===next.backgroundImageId))delete next.backgroundImageId;
  if(next.backgroundGroupId&&!next.groups?.some(g=>g.id===next.backgroundGroupId))delete next.backgroundGroupId;
  next.revision++;if(next.contentRevision!==undefined)next.contentRevision++;
  const parsed = DocumentSchema.parse(next);
  validateLayout(parsed, measure, 'edit');
  const sameGeometry=(a:SceneObject,b:SceneObject)=>{
    if((a.rotationDeg??0)!==(b.rotationDeg??0))return false;
    const keys=['strokeFrameVersion','skewXDeg','mirrorX','mirrorY','widthMm','heightMm','radiusMm','rxMm','ryMm','lengthMm','fontSizePt','textScaleX','textScaleY','textSkewXDeg','textClipMasks','clipMasks','textBox','points','nodes','commands','textPath'];
    if(keys.some(key=>JSON.stringify((a as unknown as Record<string,unknown>)[key])!==JSON.stringify((b as unknown as Record<string,unknown>)[key])))return false;
    if((a.type==='path'||a.type==='bezier'||a.type==='vector')&&a.strokeFrameVersion===1){const ac=objectCenter(a,measure),bc=objectCenter(b,measure);return Math.abs(ac.xMm-bc.xMm)<1e-6&&Math.abs(ac.yMm-bc.yMm)<1e-6;}
    if(a.type==='text'&&b.type==='text'){try{const ac=objectCenter(a,measure),bc=objectCenter(b,measure);return Math.abs(ac.xMm-bc.xMm)<1e-6&&Math.abs(ac.yMm-bc.yMm)<1e-6;}catch(error){if(!(error instanceof UnverifiedTextGeometryError))throw error;return a.xMm===b.xMm&&a.yMm===b.yMm;}}return Math.abs(a.xMm-b.xMm)<1e-6&&Math.abs(a.yMm-b.yMm)<1e-6;
  };
  assertObjectPolicies(doc,parsed,command,role,sameGeometry);
  assertTextPathPolicies(doc,parsed,command,role,measure,sameGeometry);
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
    if(GraphicCommandSchema.parse(raw).tool!=='selectPage'){this.past.push(cloneGraphicDocument(this.document));this.future=[];}
    this.document = next;
    this.events.push({ source, revision: next.revision, objectId: GraphicCommandSchema.parse(raw).objectId });
  }
  clearHistory():void{this.past=[];this.future=[];}
  undo(): void { this.travel(this.past, this.future, 'undo'); }
  redo(): void { this.travel(this.future, this.past, 'redo'); }
  private travel(from: GraphicDocument[], to: GraphicDocument[], source: 'undo' | 'redo'): void {
    const target = from.pop(); if (!target) return;
    const active=target.pageId??'page-1',current=graphicPageIds(this.document).includes(active)?selectGraphicPage(this.document,active):this.document;
    to.push(cloneGraphicDocument(current));
    this.document = { ...target, revision: this.document.revision + 1,...(this.document.contentRevision!==undefined||target.contentRevision!==undefined?{contentRevision:(this.document.contentRevision??this.document.revision)+1}:{}) };
    this.events.push({ source, revision: this.document.revision });
  }
  /** Local workspace recovery: the file supplies its exact format/binding; never infer another product. */
  open(raw:unknown):void {
    const next=parseGraphicDocument(raw);validateLayout(next,this.measure,'edit');
    this.past.push(cloneGraphicDocument(this.document));this.future=[];
    this.document={...next,revision:this.document.revision+1,...(next.contentRevision!==undefined?{contentRevision:this.document.revision+1}:{})};this.events.push({source:'import',revision:this.document.revision});
  }
  import(raw: unknown): void {
    let next = parseGraphicDocument(raw);
    if(this.document.shopSelection&&this.role==='customer'){
      if(next.shopSelection&&JSON.stringify(next.shopSelection)!==JSON.stringify(this.document.shopSelection))throw Error('Il JSON usa un altro prodotto o variante: aprilo come nuovo progetto.');
      next={...next,shopSelection:{...this.document.shopSelection}};
    }
    if(this.document.productionProfile&&this.role==='customer'){
      if(next.productionProfile&&JSON.stringify(next.productionProfile)!==JSON.stringify(this.document.productionProfile))throw Error('Il JSON usa un altro profilo tecnico: aprilo come nuovo progetto.');
      next={...next,productionProfile:structuredClone(this.document.productionProfile)};
    }
    if (this.document.productId) {
      if (next.areaMm.width !== this.document.areaMm.width || next.areaMm.height !== this.document.areaMm.height || next.shape !== this.document.shape) throw new Error('Area del JSON diversa dal prodotto corrente');
      if (next.productId && (next.productId !== this.document.productId || next.variantId !== this.document.variantId || next.catalogVersion !== this.document.catalogVersion || next.catalogProductProfileVersion !== this.document.catalogProductProfileVersion)) throw new Error('JSON associato a un altro prodotto o versione catalogo');
      next = { ...next, productId: this.document.productId, variantId: this.document.variantId, catalogVersion: this.document.catalogVersion, catalogProductProfileVersion: this.document.catalogProductProfileVersion };
    }
    next = DocumentSchema.parse(next);
    validateLayout(next, this.measure, 'edit');
    this.past.push(cloneGraphicDocument(this.document)); this.future = [];
    // Revisione locale monotona: una risposta AI precedente non diventa valida dopo import/undo.
    this.document = { ...next, revision: this.document.revision + 1,...(next.contentRevision!==undefined?{contentRevision:this.document.revision+1}:{}) };
    this.events.push({ source: 'import', revision: this.document.revision });
  }
  changeProduct(product: ProductProfile, catalogVersion: string): void {
    if(this.document.plaque)throw new Error('Il formato di una targa si modifica dal pannello dedicato.');
    const next = DocumentSchema.parse({ ...this.document, ...bindingFor(product, catalogVersion), areaMm: structuredClone(product.nominalAreaMm), shape: product.shape, revision: this.document.revision + 1,...(this.document.contentRevision!==undefined?{contentRevision:this.document.revision+1}:{}) });
    validateLayout(next, this.measure);
    assertMinimumText(next,minimumFontForProduct(product));
    this.document = next;
    this.past = []; this.future = [];
    this.events.push({ source: 'product-change', revision: next.revision });
  }
}
