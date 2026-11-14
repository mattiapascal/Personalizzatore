import {qrView} from './qr-view';
import {WindowCanvas} from './window-canvas';
import {canvasWindow,canvasWindowContains,boundedBackingDensity,sameCanvasWindow,type CanvasWindow} from './canvas-window';
import {pathStrokeFrame,effectiveStrokeJoin,effectiveMiterLimit} from './path-stroke';
import {pathStrokeFrameView} from './path-stroke-view';
import {effectiveStrokeCap,scaledLineLength} from './stroke-cap';
import {EditorLine} from './line-view';
import {affineFrameView} from './affine-frame-view';
import {GeometryPointMarker} from './geometry-point-marker';
import type {GeometryFocus} from './geometry-focus';
import type {GeometryTile} from './production-geometry';
import {hasObjectAffine,withoutObjectAffine,objectInclination} from './object-affine';
import { fabricTextSkew,physicalTextSkew } from './text-skew';
import{boxSampleRgba}from'./pixel-sampling';
import{applyClipMasks}from'./clip-mask-view';
import{ExternalCanvasControls}from'./external-controls';
import{graphicPages,activeGraphicPageId}from'./pages';
import {textStrokeFromFabric} from './paint-opacity';
import { paintWithOpacity, textPaintFromFabric } from './paint-opacity';
import {preciseIntermediateSvg} from './svg-precision';
import { assertTextGeometry, textGeometryVerified } from './font-measurement';
import { originalRasterSvg } from './raster-svg';
import {productionDocument,selectableObjectIds,effectiveObjectProperties,type EditorRole} from './object-properties';
import {objectIsVisible} from './scene-visibility';
import {rootGroupFor} from './scene-groups';
import {plaqueMountingPoints} from './plaque';
import { mapVector } from './vector-geometry';
import { TextPathControls } from './text-path-controls';
import { EditorPathText } from './text-path-view';
import { preserveTextPathGuide, textPathStyleChanged } from './text-path-model';
import { scaledTextPath } from './text-path-spec';
import { prepareRasterSource } from './raster-cache';
export { prepareRasterSource } from './raster-cache';
import { RasterCropControls } from './raster-crop-controls';
import { checkedRasterCrop, type ImageObject } from './raster-geometry';
import { StaticCanvas, IText, Rect, Path as FabricPath, Circle, Ellipse, Polyline, Polygon, FabricImage, Control, Group, ActiveSelection, controlsUtils, util, type FabricObject, type TPointerEvent } from 'fabric';
import type { GraphicDocument, Measure, SceneObject, TransformArguments, SelectionTransformArguments } from './model';
import {profileForPage} from './production-profile-link';
import { DocumentSchema, validateLayout, objectGeometry, objectIntersectsArea, objectCenter, placeObjectAtCenter, type CharacterStyle } from './model';
import { lineAlignments, compressLineAlignments, lineSelection, applyLineAlignment } from './text-lines';
import { EditorTextBox, textBoxControls } from './text-box';
import { characterStyles, compressStyles, applyCharacterStyle, selectionStyle, applyTextKerning, textSpacingScope, type TextObject, type CharacterSelection } from './text-style';
import { expandSelection,selectionUnits,selectionBounds } from './selection';
import { DEFAULT_GUIDES, snapTranslation, snapPoint, type GuideSettings, type SnapResult } from './guides';
import { PrimitiveDrawingController, type PrimitiveDrawingCallbacks } from './primitive-drawing';
import { primitiveFromEndpoints, type DrawingPrimitive } from './primitive-geometry';
import { FreehandDrawingController, type FreehandCallbacks } from './freehand-drawing';
import { strokeGeometry } from './path-geometry';
import { assertFontAvailable, renderFontFamily, canonicalFontFamily, embedSvgFonts, loadFontAssets } from './fonts';
import { assertOutputFonts } from './font-preflight';
import { TextRenderGuard } from './text-render-guard';
import { subscribeFontCoverage } from './font-coverage-cache';
import { tintImprintPixels } from './ink';
import { pathWorldPoints, type PathObject } from './path-nodes';
import { PathNodeControls, polyNodeScenePoint } from './path-node-controls';
import type { PointMm } from './line-geometry';
import { PolylineDrawingController, type PolylineCallbacks } from './polyline-drawing';
import { assertRasterParameters, rasterCanvas, originalRasterImage } from './raster-cache';
import { bezierCommands, normalizedBezier } from './bezier-geometry';
import { BezierDrawingController, type BezierDrawingCallbacks } from './bezier-drawing';
import { BezierNodeControls } from './bezier-controls';
import { bezierWorldNodes, type BezierObject } from './bezier-nodes';
import { pngExportSize, pngWithDpi, type PngDpi } from './png-export';

import{PX_PER_MM,canvasZoomLimit,CANVAS_BITMAP_LIMITS}from'./canvas-size';
export{PX_PER_MM}from'./canvas-size';
export const PT_TO_MM = 25.4 / 72;
const fontPoints = (pixels: number) => Math.round(pixels / (PT_TO_MM * PX_PER_MM) * 1e9) / 1e9;
function transformedImageSize(source:ImageObject,object:FabricObject):Extract<TransformArguments['size'],{type:'image'}>{
 const crop=checkedRasterCrop(source.source,source.crop),widthMm=object.width*object.scaleX/PX_PER_MM,heightMm=object.height*object.scaleY/PX_PER_MM,aspect=widthMm*crop.heightPx/(heightMm*crop.widthPx);
 return{type:'image',widthMm,heightMm,...(Math.abs(aspect-(source.pixelAspectRatio??1))>1e-9?{pixelAspectRatio:aspect}:{})};
}
function keepRotationHandleInCanvas(object: FabricObject): void {
  const rotation = object.controls.mtr;
  if (!rotation) return;
  object.controls.mtr = new Control({ ...rotation, positionHandler(dimensions, matrix, target, control) {
    const point = rotation.positionHandler.call(this, dimensions, matrix, target, control), canvas = target.canvas;
    if (canvas) { point.x = Math.max(8, Math.min(canvas.getWidth() - 8, point.x)); point.y = Math.max(8, Math.min(canvas.getHeight() - 8, point.y)); }
    return point;
  } });
}
const configuredSelections = new WeakSet<FabricObject>();
function selectionControls(object: FabricObject): void {
  object.set({ borderColor: '#0088cc', cornerColor: '#0088cc', hasControls: true, lockScalingX: false, lockScalingY: false, lockRotation: false, lockScalingFlip: true, lockSkewingX: true, lockSkewingY: true, centeredScaling: false, centeredRotation: true });
  object.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false, mtr: true });
  if (configuredSelections.has(object)) return;
  keepRotationHandleInCanvas(object);
  for (const name of ['tl', 'tr', 'bl', 'br']) {
    const control = object.controls[name]!, handler = control.actionHandler;
    if (handler) object.controls[name] = new Control({ ...control, actionHandler: (event, transform, x, y) => handler({ ...event, shiftKey: false }, transform, x, y) });
  }
  configuredSelections.add(object);
}
/** Corners scale proportionally unless Shift is held; edges affect only their axis. */
function objectDimensionControls(object:FabricObject):void{
 object.controls={...object.controls};
 for(const name of ['tl','tr','bl','br']){const control=object.controls[name]!;object.controls[name]=new Control({...control,actionName:'scale',getActionName:()=> 'scale',actionHandler:(event,transform,x,y)=>controlsUtils.scalingEqually(event,transform,x,y)});}
 for(const[name,handler]of[['ml',controlsUtils.scalingX],['mr',controlsUtils.scalingX],['mt',controlsUtils.scalingY],['mb',controlsUtils.scalingY]]as const){const control=object.controls[name]!;object.controls[name]=new Control({...control,actionName:name==='ml'||name==='mr'?'scaleX':'scaleY',getActionName:()=>name==='ml'||name==='mr'?'scaleX':'scaleY',actionHandler:handler,cursorStyleHandler:controlsUtils.scaleCursorStyleHandler});}
 object.setControlsVisibility({ml:true,mr:true,mt:true,mb:true});
}
class UnverifiedTextMarker extends Rect {
  override _render(context: CanvasRenderingContext2D): void {
    super._render(context);context.save();context.strokeStyle='#a34b00';context.lineWidth=1;context.setLineDash([]);context.beginPath();context.moveTo(-this.width/2,-this.height/2);context.lineTo(this.width/2,this.height/2);context.moveTo(this.width/2,-this.height/2);context.lineTo(-this.width/2,this.height/2);context.stroke();context.restore();
  }
}
function unverifiedTextMarker(o: TextObject): FabricObject {
  return new UnverifiedTextMarker({ left: o.xMm * PX_PER_MM, top: o.yMm * PX_PER_MM, width: Math.max(8, (o.textBox?.widthMm ?? 10) * PX_PER_MM), height: Math.max(8, (o.textBox?.heightMm ?? 5) * PX_PER_MM), originX: 'left', originY: 'top', fill: '#fff0dc', stroke: '#a34b00', strokeWidth: 1, strokeDashArray: [4, 3], lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false, objectCaching: false });
}
function renderObject(o: SceneObject, editable = false): FabricObject {
  const common = { flipX:o.mirrorX??false,flipY:o.mirrorY??false, borderColor: '#0088cc', cornerColor: '#0088cc', left: o.xMm * PX_PER_MM, top: o.yMm * PX_PER_MM, angle: o.rotationDeg ?? 0, originX: 'center' as const, originY: 'center' as const, lockScalingFlip: true, lockSkewingX: true, lockSkewingY: true, lockRotation: o.type === 'circle'&&!o.skewXDeg, hasControls: editable, objectCaching: false };
  let object: FabricObject;
  if(o.type==='qr'){object=qrView(o,common);}
  else if (o.type === 'text') {
    assertFontAvailable(o.fontFamily);
    for (const run of o.characterStyles ?? []) if (run.style.fontFamily) assertFontAvailable(run.style.fontFamily);
    assertTextGeometry(o);
    const options = { ...common, scaleX: o.textScaleX ?? 1, scaleY: o.textScaleY ?? 1, skewX: fabricTextSkew(objectInclination(o), (o.textPath?1:o.textScaleX ?? 1)*(o.mirrorX?-1:1), (o.textPath?1:o.textScaleY ?? 1)*(o.mirrorY?-1:1)), fontSize: o.fontSizePt * PT_TO_MM * PX_PER_MM, fontFamily: renderFontFamily(o.fontFamily), fill: paintWithOpacity(o.fill, o.fillOpacity), stroke: o.stroke && o.stroke !== 'none' ? paintWithOpacity(o.stroke, o.strokeOpacity) : null, strokeWidth: o.stroke && o.stroke !== 'none' ? (o.strokeMm ?? .25) * PX_PER_MM : 0, strokeLineCap: o.strokeLineCap ?? 'butt', strokeLineJoin: o.strokeLineJoin ?? 'miter', strokeMiterLimit: o.strokeMiterLimit ?? 4, paintFirst: o.paintFirst ?? 'fill',
      fontWeight: o.fontWeight ?? 'normal', fontStyle: o.fontStyle ?? 'normal', underline: o.underline ?? false, linethrough: o.linethrough ?? false, overline: o.overline ?? false,
      textAlign: o.textAlign ?? 'left', lineHeight: o.lineHeight ?? 1, charSpacing: (o.letterSpacingPt ?? 0) / o.fontSizePt * 1000 };
    const styles: IText['styles'] = {}, characters = characterStyles(o), alignments = lineAlignments(o);
    let line = 0, column = 0;
    Array.from(o.text).forEach((character, index) => {
      const { fontSizePt, kerningPt, fillOpacity, strokeMm, strokeOpacity, ...style } = characters[index]!; if (style.stroke !== undefined || strokeOpacity !== undefined) style.stroke = paintWithOpacity(style.stroke ?? o.stroke, strokeOpacity ?? o.strokeOpacity); if (style.fill !== undefined || fillOpacity !== undefined) style.fill = paintWithOpacity(style.fill ?? o.fill, fillOpacity ?? o.fillOpacity); if (style.fontFamily) style.fontFamily = renderFontFamily(style.fontFamily);
      const editorLineAlign = alignments[index];
      // Equal no-stroke paints must not split a glyph run. On a painted box,
      // keep the transparent override: SVG span styles omit a null paint.
      if (Object.keys(style).length || strokeMm !== undefined || fontSizePt !== undefined || kerningPt !== undefined || editorLineAlign !== undefined) (styles[line] ??= {})[column] = { ...style, ...(style.stroke === 'transparent' && options.stroke === null ? { stroke: null } : {}), ...(editorLineAlign === undefined ? {} : { editorLineAlign }), ...(kerningPt === undefined ? {} : { editorKerningPt: kerningPt }), ...(strokeMm === undefined ? {} : { strokeWidth: strokeMm * PX_PER_MM }), ...(fontSizePt === undefined ? {} : { fontSize: fontSizePt * PT_TO_MM * PX_PER_MM }) };
      if (character === '\n') { line++; column = 0; } else column++;
    });
    if (alignments[Array.from(o.text).length]) (styles[line] ??= {})[column] = { ...styles[line]?.[column], editorLineAlign: alignments[Array.from(o.text).length] } as IText['styles'][number][number];
    const box = o.textPath ? new EditorPathText(o.text, { ...options, styles }, o.textPath, o.textScaleX ?? 1) : new EditorTextBox(o.text, { ...options, styles }, o.textBox && { width: o.textBox.widthMm * PX_PER_MM / (o.textScaleX ?? 1), height: o.textBox.heightMm * PX_PER_MM / (o.textScaleY ?? 1), autoWidth: o.textBox.autoWidth, autoHeight: o.textBox.autoHeight }, o.justification, o.textClipMasks);
    if (editable) { if (box instanceof EditorPathText) selectionControls(box); else textBoxControls(box); }
    object = box;
  } else if (o.type === 'image') {
    assertRasterParameters(o.source,o.raster);
    const crop=checkedRasterCrop(o.source,o.crop),original=o.raster.mode==='original',bitmap=original?originalRasterImage(o.source):rasterCanvas(o.source,o.raster),width=crop.widthPx,height=crop.heightPx;
    const image = new FabricImage(bitmap, {opacity:o.opacity??1,width,height,cropX:crop.leftPx,cropY:crop.topPx, ...common, strokeWidth: 0, perPixelTargetFind: true, flipX: !!o.flipX !== !!o.mirrorX, flipY: !!o.flipY !== !!o.mirrorY, scaleX: o.widthMm * PX_PER_MM / width, scaleY: o.heightMm * PX_PER_MM / height });
    if(o.raster.mode==='original')originalRasterSvg(image,o.source,o.crop);object=image;
  } else {
    const strokeWidth = o.stroke === 'none' ? 0 : o.strokeMm * PX_PER_MM;
    const appearance = { fill: paintWithOpacity(o.fill, o.fillOpacity), perPixelTargetFind: !o.fill || o.fill === 'none' || o.fillOpacity === 0, stroke: o.stroke === 'none' ? undefined : paintWithOpacity(o.stroke, o.strokeOpacity), strokeWidth,
      strokeDashArray: o.strokeDash === 'dashed' ? [strokeWidth * 4, strokeWidth * 2] : o.strokeDash === 'dotted' ? [0, strokeWidth * 2] : undefined,
      strokeLineCap: o.strokeDash === 'dotted' ? 'round' as const : 'butt' as const };
    object = o.type === 'circle'
      ? new Circle({ ...common, ...appearance, radius: o.radiusMm * PX_PER_MM })
      : o.type === 'ellipse' ? new Ellipse({ ...common, ...appearance, rx: o.rxMm * PX_PER_MM, ry: o.ryMm * PX_PER_MM })
      : o.type === 'vector' ? new FabricPath(mapVector(o.commands, (x, y) => ({ x: x * o.widthMm * PX_PER_MM, y: y * o.heightMm * PX_PER_MM })), { ...common, ...appearance, fillRule: o.fillRule, perPixelTargetFind: true, strokeLineCap: o.strokeDash === 'dotted' ? 'round' : o.strokeLineCap, strokeLineJoin: o.strokeLineJoin, strokeMiterLimit: o.strokeMiterLimit, lockScalingX: o.widthMm === 0, lockScalingY: o.heightMm === 0 })
      : o.type === 'bezier' ? new FabricPath(bezierCommands(o.nodes, o.closed, o.widthMm * PX_PER_MM, o.heightMm * PX_PER_MM), { ...common, ...appearance, fillRule: 'evenodd', strokeLineCap: effectiveStrokeCap(o), strokeLineJoin: effectiveStrokeJoin(o), strokeMiterLimit:effectiveMiterLimit(o), lockScalingX: o.widthMm === 0, lockScalingY: o.heightMm === 0 })
      : o.type === 'path' ? new (o.closed ? Polygon : Polyline)(o.points.map(p => ({ x: p.x * o.widthMm * PX_PER_MM, y: p.y * o.heightMm * PX_PER_MM })), { ...common, ...appearance, fillRule: 'evenodd', strokeLineCap: effectiveStrokeCap(o), strokeLineJoin: effectiveStrokeJoin(o), strokeMiterLimit:effectiveMiterLimit(o), lockScalingX: o.widthMm === 0, lockScalingY: o.heightMm === 0 })
      : o.type === 'line' ? new EditorLine([0, 0, o.lengthMm * PX_PER_MM, 0], { ...common, ...appearance, strokeLineCap: effectiveStrokeCap(o), lockScalingY: true })
      : new Rect({ ...common, ...appearance, width: o.widthMm * PX_PER_MM, height: o.heightMm * PX_PER_MM, rx: (o.cornerRadiusMm ?? 0) * PX_PER_MM, ry: (o.cornerRadiusMm ?? 0) * PX_PER_MM,strokeLineJoin:effectiveStrokeJoin(o),strokeMiterLimit:effectiveMiterLimit(o) });
  }
  if((o.type==='path'||o.type==='bezier'||o.type==='vector')&&o.strokeFrameVersion===1)pathStrokeFrameView(object,pathStrokeFrame(o));
  if(o.type!=='text')object.set('skewX',fabricTextSkew(o.skewXDeg??0,object.scaleX*(object.flipX?-1:1),object.scaleY*(object.flipY?-1:1)));
  if (o.type === 'vector' && o.clipRect) { const c = o.clipRect; object.clipPath = new Rect({ left: ((c.left + c.right) / 2 - .5) * o.widthMm * PX_PER_MM, top: ((c.top + c.bottom) / 2 - .5) * o.heightMm * PX_PER_MM, width: (c.right - c.left) * o.widthMm * PX_PER_MM, height: (c.bottom - c.top) * o.heightMm * PX_PER_MM, originX: 'center', originY: 'center', strokeWidth: 0, fill: '#000000' }); }
  if((o.type==='image'||o.type==='vector')&&o.clipMasks)applyClipMasks(object,o.clipMasks);
  if(editable&&o.type!=='text'&&o.type!=='line'&&o.type!=='qr')objectDimensionControls(object);if(editable&&o.type==='qr')selectionControls(object);
  if (o.type === 'line') {
    object.setControlsVisibility({ tl: false, tr: false, bl: false, br: false, mt: false, mb: false, ml: true, mr: true, mtr: true });
    for (const name of ['ml', 'mr']) { const original = object.controls[name]!; object.controls[name] = new Control({ ...original, actionName: 'scaleX', getActionName: () => 'scaleX', actionHandler: controlsUtils.scalingX, cursorStyleHandler: controlsUtils.scaleCursorStyleHandler }); }
  }
  if ((o.type === 'path' || o.type === 'bezier') && (o.widthMm === 0 || o.heightMm === 0)) {
    object.setControlsVisibility({ tl: false, tr: false, bl: false, br: false, ml: o.widthMm > 0, mr: o.widthMm > 0, mt: o.heightMm > 0, mb: o.heightMm > 0 });
  }
  if(o.type==='circle'&&!o.skewXDeg)object.setControlsVisibility({mtr:false});
  if (editable && (o.type !== 'circle'||!!o.skewXDeg)) keepRotationHandleInCanvas(object);
  if(hasObjectAffine(o))affineFrameView(object,o.type!=='text');
  // L’origine Fabric è centrale; il formato JSON conserva le coordinate esterne
  // storiche. La conversione non sposta i progetti salvati né cambia lo SVG.
  object.setCoords();
  const bounds = object.getBoundingRect();
  object.set({ left: object.left + o.xMm * PX_PER_MM - bounds.left, top: object.top + o.yMm * PX_PER_MM - bounds.top });
  object.setCoords();
  return object;
}
/** Technical layer projection only; layout and canonical data stay intact. */
export interface GraphicRenderOptions{guideOnlyIds?:readonly string[];}
function outputParts(view:FabricObject,id:string,options:GraphicRenderOptions):FabricObject{
 if(view instanceof EditorPathText)view.renderPart=options.guideOnlyIds?.includes(id)?'guide-only':'artwork';return view;
}
function assertRenderOptions(document:GraphicDocument,options:GraphicRenderOptions){
 const ids=options.guideOnlyIds??[];
 if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>{const object=document.objects.find(object=>object.id===id);return !object||object.type!=='text'||!object.textPath?.showGuide||!object.textPath.originalPathMetadata?.editor?.reference;}))throw Error('Proiezione tecnica delle guide non valida');
}
export const measureFabric: Measure = object => {
  if(hasObjectAffine(object))return measureFabric(withoutObjectAffine(object));
  if (object.type === 'image') { assertRasterParameters(object.source, object.raster); return { widthMm: object.widthMm, heightMm: object.heightMm }; }
  // A local text mask never defines layout. Avoid rebuilding its curves for
  // every inspector, cursor and validation measurement.
  const f = renderObject(object.type==='text'&&object.textClipMasks?{...object,textClipMasks:undefined}:object);
  return { widthMm: f.getScaledWidth() / PX_PER_MM, heightMm: f.getScaledHeight() / PX_PER_MM, ...(f instanceof EditorTextBox && (f.strokeBoundsWidth() > 0 || f.skewX !== 0) ? { textLayoutWidthMm: f.width * f.scaleX / PX_PER_MM, textLayoutHeightMm: f.height * f.scaleY / PX_PER_MM } : {}), ...(f instanceof EditorPathText ? { pathCenterOffsetMm: { x: f.pathCenterOffset.x / PX_PER_MM, y: f.pathCenterOffset.y / PX_PER_MM }, pathLengthMm: f.pathLength / PX_PER_MM, textAdvanceMm: f.textAdvance / PX_PER_MM } : {}) };
};
export function measureTextFrame(object: TextObject) {
  const box = renderObject(object.textClipMasks?{...object,textClipMasks:undefined}:object) as EditorTextBox;
  return { widthMm: box.width * box.scaleX / PX_PER_MM, heightMm: box.height * box.scaleY / PX_PER_MM, overflow: box.overflow, justificationLimited: box.justificationResults.some(line => line.underfull || line.overfull), lines: box.textLines.length };
}
/** Local glyph plane for a bounded read-only mask inspection. Same styles,
 * font/layout and wrapping clip as the editor, without the user masks. */
export function textMaskInspectionView(object:TextObject):EditorTextBox{
 if(object.textPath)throw Error('Il testo su tracciato non ha una maschera del box');
 const view=renderObject({...object,textClipMasks:undefined}) as EditorTextBox;
 view.set({left:0,top:0,angle:0,scaleX:1,scaleY:1,skewX:0,skewY:0,flipX:false,flipY:false,objectCaching:false});
 return view;
}
/** The canonical project stays untouched. Only its productive objects and used
 * files are prepared, after the nominal glyph check and before Fabric renders. */
async function prepareGraphicOutput(document: GraphicDocument): Promise<GraphicDocument> {
  DocumentSchema.parse(document);
  const scene=graphicPages(document).find(page=>activeGraphicPageId(page)===activeGraphicPageId(document))!;
  const visible = productionDocument(scene), ids = new Set(visible.objects.flatMap(object => object.type === 'text' ? [object.fontFamily, ...object.characterStyles?.flatMap(run => run.style.fontFamily ? [run.style.fontFamily] : []) ?? []] : []));
  const output = { ...visible, ...(visible.fontAssets ? { fontAssets: visible.fontAssets.filter(asset => ids.has(asset.id)) } : {}) };
  await assertOutputFonts(output);
  await Promise.all([loadFontAssets(output.fontAssets), ...output.objects.filter(object => object.type === 'image').map(object => prepareRasterSource(object.source))]);
  return output;
}
/** Checked public SVG output. The adapter's synchronous serializer is only for
 * already prepared scenes and internal geometry/reference tests. */
export async function exportDocumentSvg(document: GraphicDocument, transparentPaper=false,options:GraphicRenderOptions={}): Promise<string> {
  assertRenderOptions(document,options);
  const output = await prepareGraphicOutput(structuredClone(document)), adapter = new FabricAdapter(window.document.createElement('canvas'), () => 0, () => {});
  try { return adapter.exportSvg(output,transparentPaper,options); } finally { adapter.dispose(); }
}
/** Canvas temporaneo: né overlay della vista né selezione entrano nel PNG. */
export async function exportDocumentPng(document: GraphicDocument, dpi: PngDpi, transparent: boolean): Promise<Blob> {
  const size = pngExportSize(document.areaMm, dpi), blob = await renderDocumentPng(document, size, transparent);
  return new Blob([pngWithDpi(new Uint8Array(await blob.arrayBuffer()), dpi)], { type: 'image/png' });
}
/** Browser cache image: bounded resolution independent of paper size and editor zoom. */
export async function exportDocumentThumbnail(document: GraphicDocument, side = 512,options:GraphicRenderOptions={}): Promise<Blob> {
  if (!Number.isInteger(side) || side < 32 || side > 1024) throw new Error('Dimensione miniatura non valida');
  const pixelsPerMm = side / Math.max(document.areaMm.width, document.areaMm.height);
  return renderDocumentPng(document, { width: Math.max(1, Math.round(document.areaMm.width * pixelsPerMm)), height: Math.max(1, Math.round(document.areaMm.height * pixelsPerMm)), pixelsPerMm }, true,options);
}
/** Read-only bounded tile renderer, using the very same objects, exact fonts,
 * clips and raster filters as the editor. Never allocate the full page at the
 * inspection resolution, or add guides/selection/reference objects to it. */
export async function createGraphicTileRenderer(source:GraphicDocument){
 const document=await prepareGraphicOutput(structuredClone(source)),element=window.document.createElement('canvas'),output=new StaticCanvas(element,{width:1,height:1,enableRetinaScaling:false,renderOnAddRemove:false,skipOffscreen:false});
 try{
  output.backgroundColor=document.paperColor??'';
  const objects=document.objects.map(object=>({id:object.id,view:outputParts(renderObject(object),object.id,{})}));for(const object of objects)output.add(object.view);
  let disposed=false;
  return{
   read(tile:GeometryTile):Uint8ClampedArray{
    if(disposed||!Number.isInteger(tile.width)||!Number.isInteger(tile.height)||tile.width<1||tile.height<1||tile.width>2048||tile.height>2048||!Number.isFinite(tile.pixelsPerMm)||tile.pixelsPerMm<=0||!Number.isFinite(tile.x)||!Number.isFinite(tile.y))throw Error('Riquadro di controllo non valido');
    output.setDimensions({width:tile.width,height:tile.height});const scale=tile.pixelsPerMm/PX_PER_MM;output.setViewportTransform([scale,0,0,scale,-tile.x,-tile.y]);
    const context=element.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Lettura della grafica non disponibile');
    // Native tile clipping avoids rasterizing a 3000 mm page/circle into a
    // full-page Fabric clip cache at a lower, implicit physical resolution.
    context.save();context.setTransform(scale,0,0,scale,-tile.x,-tile.y);context.beginPath();
    if(document.shape==='round')context.arc(document.areaMm.width*PX_PER_MM/2,document.areaMm.height*PX_PER_MM/2,document.areaMm.width*PX_PER_MM/2,0,Math.PI*2);else context.rect(0,0,document.areaMm.width*PX_PER_MM,document.areaMm.height*PX_PER_MM);
    context.clip();context.setTransform(1,0,0,1,0,0);try{output.renderAll();}finally{context.restore();}return context.getImageData(0,0,tile.width,tile.height).data;
   },
   candidates(xMm:number,yMm:number):string[]{const x=xMm*PX_PER_MM,y=yMm*PX_PER_MM;return objects.filter(({view})=>{const box=view.getBoundingRect();return x>=box.left&&y>=box.top&&x<=box.left+box.width&&y<=box.top+box.height;}).map(object=>object.id);},
   async dispose(){if(!disposed){disposed=true;await output.dispose();}},
  };
 }catch(error){await output.dispose();throw error;}
}
async function renderDocumentPng(document: GraphicDocument, size: {width:number;height:number;pixelsPerMm:number}, transparent: boolean,options:GraphicRenderOptions={}): Promise<Blob> {
  assertRenderOptions(document,options);
  document = await prepareGraphicOutput(structuredClone(document)); validateLayout(document, measureFabric, 'edit');
  const element = window.document.createElement('canvas'),masked=document.objects.some(object=>'clipMasks'in object&&object.clipMasks?.length||object.type==='text'&&object.textClipMasks?.length);
  // Intersecting bitmap masks otherwise multiply edge coverage at the output
  // pixel grid. Sample them together before reducing, within the same bitmap
  // ceilings as the visible canvas. Large outputs keep the bounded base scale.
  const samples=masked?[8,4,2,1].find(n=>size.width*n<=CANVAS_BITMAP_LIMITS.side&&size.height*n<=CANVAS_BITMAP_LIMITS.side&&size.width*size.height*n*n<=CANVAS_BITMAP_LIMITS.pixels)!:1;
  const width=size.width*samples,height=size.height*samples;
  const output = new StaticCanvas(element, { width, height, enableRetinaScaling: false, renderOnAddRemove: false });
  try {
    const scale = size.pixelsPerMm / PX_PER_MM*samples;
    output.setViewportTransform([scale, 0, 0, scale, 0, 0]);
    if(document.paperColor)output.backgroundColor=document.paperColor;
    if (document.shape === 'round') output.clipPath = new Circle({ radius: document.areaMm.width * PX_PER_MM / 2, left: 0, top: 0, originX: 'left', originY: 'top', strokeWidth: 0, absolutePositioned: true });
    for (const object of productionDocument(document).objects) output.add(outputParts(renderObject(object),object.id,options));
    output.renderAll();
    if (!transparent) {
      const context = element.getContext('2d'); if (!context) throw new Error('Esportazione PNG non disponibile');
      context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.globalCompositeOperation = 'destination-over'; context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); context.restore();
    }
    if(document.colorMode!=='color'&&document.inkColor&&document.inkColor!=='black'){const context=element.getContext('2d');if(!context)throw new Error('Anteprima colore non disponibile');const pixels=context.getImageData(0,0,width,height);tintImprintPixels(pixels.data,document.inkColor);context.putImageData(pixels,0,0);}
    let target=element;if(samples>1){target=window.document.createElement('canvas');target.width=size.width;target.height=size.height;const context=target.getContext('2d'),high=element.getContext('2d');if(!context||!high)throw Error('Riduzione PNG non disponibile');context.putImageData(new ImageData(boxSampleRgba(high.getImageData(0,0,width,height).data,width,height,samples),size.width,size.height),0,0);}
    const blob = await new Promise<Blob>((resolve, reject) => target.toBlob(value => value ? resolve(value) : reject(new Error('Il browser non ha generato il PNG')), 'image/png'));
    return blob;
  } finally { await output.dispose(); }
}
export class FabricAdapter {
  private readonly externalControls:ExternalCanvasControls;
  private readonly geometryPointMarker:GeometryPointMarker;
  private geometryFocus:GeometryFocus|null=null;
  readonly canvas: WindowCanvas;
  private idByObject = new WeakMap<FabricObject, string>();
  private sourceByObject = new WeakMap<FabricObject, SceneObject>();
  private membersByObject = new WeakMap<FabricObject, string[]>();
  private displayWindow:CanvasWindow|null=null;
  private viewportSize={width:0,height:0};
  private viewportCleanup:(()=>void)|null=null;
  private viewportFrame=0;
  private scheduleViewport=()=>{if(!this.viewportFrame&&!this.disposed)this.viewportFrame=requestAnimationFrame(()=>{this.viewportFrame=0;this.syncViewport();});};
  private observeViewport():void{
    const wrapper=this.canvas.wrapperEl,area=wrapper.closest<HTMLElement>('.canvas-scroll');if(!area)return;
    const resize=new ResizeObserver(this.scheduleViewport);resize.observe(area);
    const mutation=new MutationObserver(this.scheduleViewport);mutation.observe(wrapper,{attributes:true,attributeFilter:['style']});
    window.addEventListener('resize',this.scheduleViewport);window.addEventListener('scroll',this.scheduleViewport,true);
    this.viewportCleanup=()=>{resize.disconnect();mutation.disconnect();window.removeEventListener('resize',this.scheduleViewport);window.removeEventListener('scroll',this.scheduleViewport,true);cancelAnimationFrame(this.viewportFrame);};
  }
  /** DOM camera only: retain all Fabric objects, selection and editing state. */
  syncViewport():void{
    if(this.disposed||this.rendering||this.dragging||!this.document)return;
    if(this.configureDisplaySurface(this.document)){
      this.canvas.calcOffset();this.canvas.getActiveObject()?.setCoords();this.canvas.requestRenderAll();
      const active=this.canvas.getActiveObject();if(active instanceof IText&&active.isEditing)active.updateTextareaPosition();
    }
  }
  private configureDisplaySurface(document:GraphicDocument):boolean{
    const wrapper=this.canvas.wrapperEl,area=wrapper.closest<HTMLElement>('.canvas-scroll');
    if(!area)this.zoom=Math.min(this.zoom,canvasZoomLimit(document.areaMm,this.canvas.requestedRetina()));
    const width=document.areaMm.width*PX_PER_MM*this.zoom,height=document.areaMm.height*PX_PER_MM*this.zoom;
    // Establish the logical page before reading flex centering or the camera.
    if(!Number.isFinite(parseFloat(wrapper.style.width))||Math.abs(parseFloat(wrapper.style.width)-width)>1e-6)wrapper.style.width=`${width}px`;
    if(!Number.isFinite(parseFloat(wrapper.style.height))||Math.abs(parseFloat(wrapper.style.height)-height)>1e-6)wrapper.style.height=`${height}px`;
    const paper=wrapper.getBoundingClientRect(),host=area?.getBoundingClientRect(),left=host?Math.max(host.left+area!.clientLeft,0):paper.left,top=host?Math.max(host.top+area!.clientTop,0):paper.top;
    const visible={x:left-paper.left,y:top-paper.top,width:Math.max(1,host?Math.min(host.left+area!.clientLeft+area!.clientWidth,innerWidth)-left:width),height:Math.max(1,host?Math.min(host.top+area!.clientTop+area!.clientHeight,innerHeight)-top:height)};
    const candidate=canvasWindow({width,height},visible,this.canvas.requestedRetina()),previous=this.displayWindow;
    const retain=previous&&candidate.windowed&&previous.paperWidth===width&&previous.paperHeight===height&&Math.abs(this.viewportSize.width-visible.width)<.5&&Math.abs(this.viewportSize.height-visible.height)<.5&&canvasWindowContains(previous,visible);
    const plan=retain?previous:candidate,density=boundedBackingDensity(plan.width,plan.height,this.canvas.requestedRetina()),resize=this.canvas.width!==plan.width||this.canvas.height!==plan.height||Math.abs(this.canvas.getRetinaScaling()-density)>1e-9,changed=!sameCanvasWindow(previous,plan)||resize;
    this.viewportSize={width:visible.width,height:visible.height};
    this.canvas.windowPaper=plan.windowed?{width:document.areaMm.width*PX_PER_MM,height:document.areaMm.height*PX_PER_MM,round:document.shape==='round'}:null;
    if(plan.windowed)this.canvas.clipPath=undefined;else if(document.shape==='round'&&!this.canvas.clipPath)this.canvas.clipPath=new Circle({radius:document.areaMm.width*PX_PER_MM/2,left:0,top:0,originX:'left',originY:'top',strokeWidth:0,absolutePositioned:true});
    if(!changed)return false;
    this.displayWindow=plan;
    if(resize)this.canvas.setDimensions({width:plan.width,height:plan.height});
    wrapper.style.width=`${width}px`;wrapper.style.height=`${height}px`;wrapper.dataset.canvasWindowed=String(plan.windowed);wrapper.dataset.canvasOriginX=String(plan.x);wrapper.dataset.canvasOriginY=String(plan.y);
    if(area)area.dataset.canvasWindowed=String(plan.windowed);
    for(const element of[this.canvas.lowerCanvasEl,this.canvas.upperCanvasEl]){element.style.position='absolute';element.style.left=`${plan.x}px`;element.style.top=`${plan.y}px`;}
    this.canvas.setViewportTransform([this.zoom,0,0,this.zoom,-plan.x,-plan.y]);return true;
  }
  private overlayTransform(context:CanvasRenderingContext2D):void{
    const retina=this.canvas.getRetinaScaling(),v=this.canvas.viewportTransform;context.setTransform(retina*v[0],retina*v[1],retina*v[2],retina*v[3],retina*v[4],retina*v[5]);
  }
  private disposed = false;
  private editingRevision = 0;
  private editingText = '';
  private rendering = false;
  private selectedId: string | null = null;
  private selectedIds: string[] = [];
  private zoom = 1;
  private document: GraphicDocument | null = null;
  private dragging = false;
  private cancelled = false;
  private beforeInteraction?:()=>boolean;
  private onInteractionRetarget?:()=>void;
  setInteractionGuard(before:()=>boolean,onRetarget:()=>void):void{this.beforeInteraction=before;this.onInteractionRetarget=onRetarget;}
  private interactionTarget(event:TPointerEvent):string{
    this.canvas.calcOffset();
    if(this.canvas.skipTargetFind)return 'drawing';
    if(event.altKey)return JSON.stringify({direct:this.directHit(event)});
    const active=this.canvas.getActiveObject(),control=active?.findControl(this.canvas.getViewportPoint(event),event.type==='touchstart');
    const {target}=this.canvas.findTarget(event);
    return JSON.stringify({ids:target?[...this.objectIds(target)].sort():[],control:control?.key??null});
  }
  private guardInteraction=(event:MouseEvent|TouchEvent)=>{
    const active=this.canvas.getActiveObject();
    if(!this.beforeInteraction||this.disposed||!this.document||this.dragging||this.nodeDragging||active instanceof IText&&active.isEditing||'button'in event&&event.button!==0||'touches'in event&&event.touches.length!==1)return;
    const document=this.document,target=this.interactionTarget(event);
    let ready=this.beforeInteraction();
    if(ready&&this.document!==document&&target!==this.interactionTarget(event)){ready=false;this.onInteractionRetarget?.();}
    if(!ready){event.preventDefault();event.stopImmediatePropagation();}
  };
  private guides: GuideSettings = { ...DEFAULT_GUIDES };
  private activeGuides: Pick<SnapResult, 'guideXmm' | 'guideYmm'> = {};
  private guideMeasurements = new WeakMap<SceneObject, ReturnType<Measure>>();
  private primitiveDrawing: PrimitiveDrawingController | null = null;
  private freehandDrawing: FreehandDrawingController | null = null;
  private polylineDrawing: PolylineDrawingController | null = null;
  private bezierDrawing: BezierDrawingController | null = null;
  private nodeFocus: { objectId: string; index: number } | null = null;
  private nodeControls = new PathNodeControls();
  private textPathControls = new TextPathControls();
  private onTextPathChange?: (object: TextObject, revision: number) => void;
  private cropControls = new RasterCropControls();
  private cropFocus: string | null = null;
  private moveCropContents = false;
  private onCropChange?: (object: ImageObject, revision: number) => void;
  private bezierControls = new BezierNodeControls();
  private onBezierChange?: (object: BezierObject, revision: number) => void;
  private nodeDragging = false;
  private onNodeMove?: (object: PathObject, index: number, point: PointMm, revision: number) => void;
  private onNodeActive?: (active: boolean) => void;
  private readonly cancelDrag: (event: KeyboardEvent) => void;
  private masterObjectId:string|null=null;
  private onMasterSelection?: (id:string)=>void;
  private masterCandidate:{id:string;x:number;y:number;selection:string}|null=null;
  setMasterSelectionHandler(handler:(id:string)=>void):void{this.onMasterSelection=handler;}
  setMasterObject(id:string|null):void{this.masterObjectId=id;this.canvas.requestRenderAll();}
  private drawMasterObject():void{
    if(!this.masterObjectId||!this.document||this.dragging)return;
    const unit=selectionUnits(this.document,this.selectedIds).find(unit=>unit.some(object=>object.id===this.masterObjectId));if(!unit)return;
    const box=selectionBounds(unit,measureFabric),context=this.canvas.getContext();
    context.save();this.overlayTransform(context);context.strokeStyle='#005580';context.lineWidth=3/this.zoom;context.setLineDash([]);context.strokeRect(box.xMm*PX_PER_MM,box.yMm*PX_PER_MM,box.widthMm*PX_PER_MM,box.heightMm*PX_PER_MM);context.restore();
  }
  private directObjectId:string|null=null;
  private onDirectSelection?: (id:string|null)=>void;
  private directHit(event:TPointerEvent):string|null{
    const groups=this.canvas.getObjects().filter((object):object is Group=>object instanceof Group),saved=groups.map(group=>({group,subTargetCheck:group.subTargetCheck,interactive:group.interactive,evented:group.evented}));
    try{
      for(const group of groups){group.set({subTargetCheck:true,interactive:true,evented:true});group.setCoords();}
      const {target}=this.canvas.searchPossibleTargets(this.canvas.getObjects(),this.canvas.getScenePoint(event));
      const id=target?this.idByObject.get(target):undefined;
      return id&&this.document&&selectableObjectIds(this.document,[id],this.role,true).includes(id)?id:null;
    }finally{for(const {group,...values}of saved)group.set(values);}
  }
  private directMouseDown=(event:MouseEvent)=>{
    if(event.button!==0||this.canvas.skipTargetFind||!this.document)return;
    this.masterCandidate=null;
    if(!event.altKey&&!event.shiftKey&&!event.metaKey&&!event.ctrlKey&&this.canvas.getActiveObject() instanceof ActiveSelection){const id=this.directHit(event);if(id&&this.selectedIds.includes(id))this.masterCandidate={id,x:event.clientX,y:event.clientY,selection:this.selectedIds.join('\0')};}
    if(event.altKey){
      const id=this.directHit(event);event.preventDefault();this.finishEditing();this.onDirectSelection?.(id);return;
    }
    if(this.directObjectId){
      const active=this.canvas.getActiveObject();if(active?.findControl(this.canvas.getViewportPoint(event)))return;
      if(this.directHit(event)!==this.directObjectId)this.onDirectSelection?.(null);
    }
  };
  setDirectObject(id:string|null):boolean{const changed=id!==this.directObjectId;this.directObjectId=id;return changed;}
  private publishSelection: () => void;
  private publishObjectSelection: () => void;
  private textRenderGuard?: TextRenderGuard;
  private unsubscribeFontCoverage?: () => void;
  private fontRenderStatus?: (blocked: readonly string[], pending: readonly string[]) => void;
  /** Interactive scenes opt in; output uses the separate strict preflight. */
  protectTextRendering(onStatus?: (blocked: readonly string[], pending: readonly string[]) => void): void {
    this.unsubscribeFontCoverage?.();
    this.textRenderGuard?.dispose(); this.fontRenderStatus = onStatus;
    this.textRenderGuard = new TextRenderGuard(() => {
      if (this.disposed) return;
      this.refreshFontView();
    });
    this.unsubscribeFontCoverage=subscribeFontCoverage(()=>{if(!this.disposed&&this.textRenderGuard?.retryAvailableCoverage())this.refreshFontView();});
  }
  private refreshFontView(): void {
    const active=this.canvas.getActiveObject();
    if(this.document&&!this.rendering&&!(active instanceof EditorTextBox&&active.isEditing))this.render(this.document,this.selectedIds);else{this.publishFontRenderStatus();this.canvas.requestRenderAll();}
  }
  retryTextRendering(): void { this.textRenderGuard?.retry(); this.refreshFontView(); }
  private textFontProbe(target: EditorTextBox, source: TextObject): TextObject {
    let line = 0, column = 0;
    const styles = Array.from(target.text, character => {
      if (character === '\n') { line++; column = 0; return {}; }
      const style = target.styles[line]?.[column++];
      return { ...(style?.fontFamily ? { fontFamily: canonicalFontFamily(style.fontFamily) } : {}), ...(style?.fontWeight ? { fontWeight: style.fontWeight as 'normal' | 'bold' } : {}), ...(style?.fontStyle ? { fontStyle: style.fontStyle as 'normal' | 'italic' } : {}) };
    });
    return { ...source, text: target.text, fontFamily: canonicalFontFamily(target.fontFamily)!, fontWeight: target.fontWeight as 'normal' | 'bold', fontStyle: target.fontStyle as 'normal' | 'italic', characterStyles: compressStyles(styles) };
  }
  private publishFontRenderStatus(): void {
    if (!this.fontRenderStatus || !this.document || !this.textRenderGuard) return;
    const blocked: string[] = [], pending: string[] = [];
    const visit = (objects: readonly FabricObject[]) => { for (const object of objects) {
      if(!object.visible)continue;
      if (object instanceof Group) visit(object.getObjects());
      else {
        const source = this.sourceByObject.get(object); if (source?.type !== 'text') continue;
        const status = this.textRenderGuard!.status(object instanceof EditorTextBox ? this.textFontProbe(object, source) : source, this.document!.fontAssets);
        if (status === 'blocked') blocked.push(source.id); else if (status === 'pending') pending.push(source.id);
      }
    } };
    visit(this.canvas.getObjects()); this.fontRenderStatus(blocked, pending);
  }
  constructor(element: HTMLCanvasElement, revision: () => number, onMove: (id: string, xMm: number, yMm: number, expectedRevision: number) => void, onText?: (id: string, object: TextObject, expectedRevision: number) => void, onEditing?: (editing: boolean) => void, onSelect?: (id: string | null) => void, onTransform?: (id: string, args: TransformArguments, expectedRevision: number) => void, onDeleteDrag?: (id: string, expectedRevision: number) => void, onTrash?: (visible: boolean) => void, onCharacterSelection?: (selection: CharacterSelection | null) => void, onSelection?: (ids: string[]) => void, onMoveSelection?: (ids: string[], deltaXmm: number, deltaYmm: number, revision: number) => void, onDeleteSelection?: (ids: string[], revision: number) => void, onTransformSelection?: (ids: string[], args: Omit<SelectionTransformArguments, 'objectIds'>, revision: number) => void, onDirectSelection?:(id:string|null)=>void) {
    this.canvas = new WindowCanvas(element, { stopContextMenu:false,selection: true, selectionFullyContained: true, selectionKey: 'shiftKey', preserveObjectStacking: true, backgroundColor: '#ffffff', selectionColor: '#0088cc22', selectionBorderColor: '#0088cc', enableRetinaScaling: true, uniformScaling: true, centeredScaling: false, centeredRotation: true, centeredKey: null });
    this.canvas.wrapperEl.addEventListener('mousedown',this.guardInteraction,true);
    this.canvas.wrapperEl.addEventListener('touchstart',this.guardInteraction,{capture:true,passive:false});
    this.observeViewport();
    this.externalControls=new ExternalCanvasControls(this.canvas);
    this.geometryPointMarker=new GeometryPointMarker(this.canvas.wrapperEl);
    this.onDirectSelection=onDirectSelection;this.canvas.upperCanvasEl.addEventListener('mousedown',this.directMouseDown,true);
    this.canvas.upperCanvasEl.tabIndex = 0; this.canvas.upperCanvasEl.setAttribute('aria-label', 'Area grafica interattiva');
    this.publishObjectSelection = () => {
      if (this.rendering || this.disposed) return;
      const active = this.canvas.getActiveObject();
      if (active instanceof ActiveSelection) { active.set({ strokeWidth: 0, perPixelTargetFind: true }); selectionControls(active);this.applyLocks(active,this.objectIds(active)); }
      this.selectedIds = active ? this.objectIds(active) : [];
      this.selectedId = this.selectedIds.length === 1 ? this.selectedIds[0]! : null;
      onSelect?.(this.selectedId);
      onSelection?.([...this.selectedIds]);
    };
    this.canvas.on('selection:created', this.publishObjectSelection);
    this.canvas.on('selection:updated', this.publishObjectSelection);
    this.canvas.on('selection:cleared', this.publishObjectSelection);
    this.publishSelection = () => {
      if (this.rendering) return;
      const active = this.canvas.getActiveObject();
      const snapshot = active instanceof EditorTextBox && active.isEditing ? this.textSnapshot(active) : null;
      onCharacterSelection?.(snapshot && active instanceof EditorTextBox ? { ...selectionStyle(snapshot, active.selectionStart, active.selectionEnd), object: snapshot, spacing: textSpacingScope(snapshot, { start: active.selectionStart, end: active.selectionEnd }), line: lineSelection(snapshot, active.visualLineRanges(), active.selectionStart, active.selectionEnd) } : null);
    };
    this.canvas.on('text:selection:changed', this.publishSelection);
    this.canvas.on('text:changed', () => { this.publishFontRenderStatus(); this.publishSelection(); });
    this.canvas.on('after:render', () => { this.drawGuides(); this.drawProductionProfileGuides(); this.drawPlaqueMounting(); this.drawNodeFocus(); this.drawRasterCropFocus(); this.drawTextPathGuide();this.drawMasterObject();this.externalControls.render();this.geometryPointMarker.update(this.geometryFocus,this.document); });
    let gestureRevision = revision(), gestureBounds = { left: 0, top: 0 }, gestureAngle = 0, gestureScale = 1;
    this.canvas.on('before:transform', ({ transform }) => {this.dragging=true;const area=this.canvas.wrapperEl.closest<HTMLElement>('.canvas-scroll');if(area)area.dataset.canvasGesture='true'; gestureRevision = revision(); gestureBounds = transform.target.getBoundingRect(); gestureAngle = transform.target.angle; gestureScale = transform.target.scaleX; this.cancelled = false; });
    const delta = (object: FabricObject) => {
      const bounds = object.getBoundingRect();
      return { x: Math.round((bounds.left - gestureBounds.left) / PX_PER_MM * 1e9) / 1e9, y: Math.round((bounds.top - gestureBounds.top) / PX_PER_MM * 1e9) / 1e9 };
    };
    const outside = (object: FabricObject) => {
      const ids = this.objectIds(object);
      if (this.document&&(ids.length>1||rootGroupFor(this.document,ids[0]!)&&ids[0]!==this.directObjectId)) {
        const offset = delta(object), document = this.document;
        return ids.every(id => { const source = document.objects.find(object => object.id === id)!; return !objectIntersectsArea(document, { ...source, xMm: source.xMm + offset.x, yMm: source.yMm + offset.y }, measureFabric); });
      }
      const source = this.sourceByObject.get(object), bounds = object.getBoundingRect();
      return !!source && !!this.document && !objectIntersectsArea(this.document, { ...source, xMm: bounds.left / PX_PER_MM, yMm: bounds.top / PX_PER_MM }, measureFabric);
    };
    this.canvas.on('object:moving', ({ target, e }) => {
      if(this.unverifiedViewGeometry(target)){target.set({lockMovementX:true,lockMovementY:true});return;}
      this.dragging = true; this.activeGuides = {};
      // L'evento Fabric precede l'aggiornamento degli aCoords: leggere i limiti
      // dopo averli ricalcolati, altrimenti l'aggancio usa il frame precedente.
      target.setCoords();
      if (this.guides.snapEnabled && !e.altKey && this.document) {
        const raw = delta(target), measure: Measure = object => {
          const cached = this.guideMeasurements.get(object); if (cached) return cached;
          const size = measureFabric(object); this.guideMeasurements.set(object, size); return size;
        };
        const snapped = snapTranslation(this.document, this.objectIds(target), raw.x, raw.y, this.guides.gridMm, 6 / (PX_PER_MM * this.zoom), measure);
        target.set({ left: target.left + (snapped.deltaXmm - raw.x) * PX_PER_MM, top: target.top + (snapped.deltaYmm - raw.y) * PX_PER_MM }); target.setCoords();
        this.activeGuides = snapped;
      }
      onTrash?.(outside(target));
    });
    this.canvas.on('object:scaling', () => { this.dragging = true; });
    this.canvas.on('object:rotating', () => { this.dragging = true; });
    this.canvas.on('object:modifyPoly', () => { this.dragging = true; if (!this.nodeDragging) { this.nodeDragging = true; this.onNodeActive?.(true); } });
    this.canvas.on('mouse:up', ({e}) => {const candidate=this.masterCandidate;this.masterCandidate=null;if(candidate&&'clientX'in e&&Math.hypot(e.clientX-candidate.x,e.clientY-candidate.y)<=3&&candidate.selection===this.selectedIds.join('\0'))this.onMasterSelection?.(candidate.id); this.dragging = false;const area=this.canvas.wrapperEl.closest<HTMLElement>('.canvas-scroll');if(area)delete area.dataset.canvasGesture;this.scheduleViewport(); if (this.nodeDragging) { this.nodeDragging = false; this.onNodeActive?.(false); } this.activeGuides = {}; this.canvas.requestRenderAll(); onTrash?.(false); });
    this.cancelDrag = event => {
      if (event.key !== 'Escape' || !this.dragging) return;
      event.preventDefault(); event.stopImmediatePropagation(); this.cancelled = true; this.canvas.endCurrentTransform(); this.dragging = false;const area=this.canvas.wrapperEl.closest<HTMLElement>('.canvas-scroll');if(area)delete area.dataset.canvasGesture;this.scheduleViewport(); onTrash?.(false);
      if (this.nodeDragging) { this.nodeDragging = false; this.onNodeActive?.(false); }
      if (this.document) this.render(this.document);
    };
    window.addEventListener('keydown', this.cancelDrag, true);
    this.canvas.on('object:modified', event => {
      if (this.cancelled) return;
      const object = event.target;
      if(this.unverifiedViewGeometry(object)){if(object instanceof EditorTextBox&&object.isEditing)object.exitEditing();queueMicrotask(()=>{if(!this.disposed&&this.document)this.render(this.document,this.selectedIds);});return;}
      const id = this.idByObject.get(object);
      const bounds = object.getBoundingRect();
      const xMm = bounds.left / PX_PER_MM;
      const yMm = bounds.top / PX_PER_MM;
      const expectedRevision = gestureRevision;
      const ids = this.objectIds(object);
      const grouped=!!this.document&&!!rootGroupFor(this.document,ids[0]!)&&ids[0]!==this.directObjectId;
      if ((ids.length > 1||grouped) && event.action === 'drag') {
        const offset = delta(object), remove = outside(object);
        queueMicrotask(() => { if (!this.disposed) { if (remove) onDeleteSelection?.(ids, expectedRevision); else onMoveSelection?.(ids, offset.x, offset.y, expectedRevision); } }); return;
      }
      if ((ids.length > 1||grouped) && event.action) {
        const point = object.getCenterPoint(), scale = object.scaleX / gestureScale;
        const rotationDeg = ((object.angle - gestureAngle + 180) % 360 + 360) % 360 - 180;
        const args = { scale, rotationDeg, center: { xMm: point.x / PX_PER_MM, yMm: point.y / PX_PER_MM } };
        queueMicrotask(() => { if (!this.disposed) onTransformSelection?.(ids, args, expectedRevision); }); return;
      }
      if (id && event.action === 'drag' && outside(object)) {
        queueMicrotask(() => { if (!this.disposed) onDeleteDrag?.(id, expectedRevision); }); return;
      }
      const source = this.sourceByObject.get(object);
      if (id && source?.type === 'text' && source.textPath && event.action === 'slideTextPath') {
        const next = this.textPathControls.preview; queueMicrotask(() => { if (!this.disposed) { if (next && this.onTextPathChange) this.onTextPathChange(next, expectedRevision); else if (this.document) this.render(this.document); } }); return;
      }
      if (id && source?.type === 'image' && (event.action === 'cropRaster'||event.action === 'panRasterContents')) {
        const preview = this.cropControls.preview,before=checkedRasterCrop(source.source,source.crop),after=preview?checkedRasterCrop(preview.source,preview.crop):null;
        const next=after&&(['leftPx','topPx','widthPx','heightPx']as const).some(key=>after[key]!==before[key])?preview:null;
        queueMicrotask(() => { if (!this.disposed) { if (next && this.onCropChange) this.onCropChange(next, expectedRevision); else if (this.document) this.render(this.document); } }); return;
      }
      if (id && source?.type === 'bezier' && event.action === 'modifyBezier') {
        const next = this.bezierControls.preview;
        queueMicrotask(() => { if (!this.disposed) { if (next && this.onBezierChange) this.onBezierChange(next, expectedRevision); else if (this.document) this.render(this.document); } }); return;
      }
      if (id && source?.type === 'path' && object instanceof Polyline && event.action === 'modifyPoly') {
        const corner = event.transform?.corner, index = typeof corner === 'string' && /^p\d+$/.test(corner) ? Number(corner.slice(1)) : this.nodeFocus?.index ?? -1;
        const point = polyNodeScenePoint(object, index);
        queueMicrotask(() => { if (!this.disposed) { if (this.onNodeMove) this.onNodeMove(source, index, { xMm: point.x / PX_PER_MM, yMm: point.y / PX_PER_MM }, expectedRevision); else if (this.document) this.render(this.document); } }); return;
      }
      if (id && source && event.action && event.action !== 'drag') {
        const strokeMm = source.type !== 'text' && source.type !== 'image' && source.stroke !== 'none' ? source.strokeMm : 0;
        const size: TransformArguments['size'] = source.type === 'text'
          ? source.textPath ? { type: 'text', textScaleX: source.textScaleX, textScaleY: 1, fontSizePt: object instanceof IText ? fontPoints(object.fontSize * object.scaleX) : source.fontSizePt * object.scaleX, textPath: scaledTextPath(source.textPath, object.scaleX) } : { type: 'text', textScaleX: object.scaleX, textScaleY: object.scaleY, fontSizePt: object instanceof EditorTextBox ? fontPoints(object.fontSize) : source.fontSizePt,
            ...(object instanceof EditorTextBox && object.frame ? { textBox: { widthMm: object.width * object.scaleX / PX_PER_MM, heightMm: object.height * object.scaleY / PX_PER_MM, autoWidth: object.frame.autoWidth, autoHeight: object.frame.autoHeight } } : {}) }
          : source.type==='qr'?{type:'qr',widthMm:source.widthMm*object.scaleX,heightMm:source.heightMm*object.scaleX}
          : source.type === 'image' ? transformedImageSize(source,object)
          : source.type === 'circle'
            ? Math.abs(object.scaleX-object.scaleY)>1e-9 ? {type:'ellipse',rxMm:((source.radiusMm*2+strokeMm)*object.scaleX-strokeMm)/2,ryMm:((source.radiusMm*2+strokeMm)*object.scaleY-strokeMm)/2} : { type: 'circle', radiusMm: ((source.radiusMm * 2 + strokeMm) * object.scaleX - strokeMm) / 2 }
            : source.type === 'line' ? { type: 'line', lengthMm: scaledLineLength(source,object.scaleX) }
            : source.type === 'ellipse' ? { type: 'ellipse', rxMm: ((source.rxMm * 2 + strokeMm) * object.scaleX - strokeMm) / 2, ryMm: ((source.ryMm * 2 + strokeMm) * object.scaleY - strokeMm) / 2 }
            : source.type === 'path' || source.type === 'bezier' || source.type === 'vector' ? { type: source.type, ...(source.strokeFrameVersion===1?{widthMm:source.widthMm,heightMm:source.heightMm}:{widthMm: source.widthMm === 0 ? 0 : (source.widthMm + strokeMm) * object.scaleX - strokeMm, heightMm: source.heightMm === 0 ? 0 : (source.heightMm + strokeMm) * object.scaleY - strokeMm}) }
            : { type: 'rect', widthMm: (source.widthMm + strokeMm) * object.scaleX - strokeMm, heightMm: (source.heightMm + strokeMm) * object.scaleY - strokeMm };
        const rotationDeg = source.type === 'circle'&&!source.skewXDeg ? 0 : ((object.angle + 180) % 360 + 360) % 360 - 180;
        queueMicrotask(() => { if (!this.disposed) onTransform?.(id, { xMm, yMm, rotationDeg, size,...((source.type==='path'||source.type==='bezier'||source.type==='vector')&&source.strokeFrameVersion===1?{strokeFrameScale:{x:object.scaleX,y:object.scaleY}}:{}),...(hasObjectAffine(source)&&source.type!=='text'?{skewXDeg:physicalTextSkew(object.skewX,object.scaleX*(object.flipX?-1:1),object.scaleY*(object.flipY?-1:1))}:{}) }, expectedRevision); });
        return;
      }
      // Fabric deve terminare il gesto prima del render canonico: clear() durante
      // object:modified rientra nel completamento della trasformazione attiva.
      if (id && !(object instanceof IText)) queueMicrotask(() => { if (!this.disposed) onMove(id, xMm, yMm, expectedRevision); });
      // IText emette object:modified anche all'uscita dalla scrittura: distinguere il trascinamento.
      if (id && object instanceof IText && event.action) queueMicrotask(() => { if (!this.disposed) onMove(id, xMm, yMm, expectedRevision); });
    });
    this.canvas.on('mouse:dblclick', event => {
      const target = this.canvas.getActiveObject(); if (!(target instanceof EditorTextBox) || target.isEditing) return;
      const control = target.findControl(this.canvas.getViewportPoint(event.e)); if (!control || !['ml', 'mr'].includes(control.key)) return;
      const source = this.sourceByObject.get(target); if (source?.type !== 'text' || (source.textBox?.autoWidth ?? true) || source.justification?.distribution!=='word-space'&&(source.textAlign === 'justify-left' || source.lineStyles?.some(run => run.alignment === 'justify-left'))) return;
      const object = placeObjectAtCenter({ ...source, textBox: { widthMm: target.width * target.scaleX / PX_PER_MM, heightMm: target.height * target.scaleY / PX_PER_MM, autoWidth: true, autoHeight: true } }, objectCenter(source, measureFabric), measureFabric) as TextObject, expectedRevision = revision();
      queueMicrotask(() => { if (!this.disposed) onText?.(source.id, object, expectedRevision); });
    });
    this.canvas.on('text:editing:entered', ({ target }) => {
      if (this.rendering) return;
      this.editingRevision = revision(); this.editingText = target.text; onEditing?.(true);
      target.hiddenTextarea?.setAttribute('aria-label', 'Testo nel canvas');
      this.publishSelection();
    });
    this.canvas.on('text:editing:exited', ({ target }) => {
      if (this.rendering) return;
      const id = this.idByObject.get(target), text = target.text, expectedRevision = this.editingRevision;
      const snapshot = target instanceof EditorTextBox ? this.textSnapshot(target) : null;
      const changed = text !== this.editingText;
      queueMicrotask(() => {
        if (this.disposed) return;
        if (id && changed && snapshot) onText?.(id, snapshot, expectedRevision);
        onEditing?.(false);
        this.publishSelection();
      });
    });
  }
  private role:EditorRole='customer';
  setRole(role:EditorRole):void{this.role=role;}
  private unverifiedViewGeometry(target: FabricObject): boolean {
    if(target instanceof Group)return target.getObjects().some(child=>this.unverifiedViewGeometry(child));
    const source=this.sourceByObject.get(target);return source?.type==='text'&&!textGeometryVerified(target instanceof EditorTextBox?this.textFontProbe(target,source):source);
  }
  private applyLocks(target:FabricObject,ids:readonly string[]):void{
    if(!this.document)return;const sources=this.document.objects.filter(object=>ids.includes(object.id));
    if(sources.some(object=>object.type==='text'&&!textGeometryVerified(object)))target.set({lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false});
    if(this.role==='admin')return;
    if(sources.some(object=>effectiveObjectProperties(this.document!,object.id).selectionLocked))target.set({selectable:false,evented:false});
    if(sources.some(object=>effectiveObjectProperties(this.document!,object.id).transformLocked))target.set({lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false});
  }
  render(document: GraphicDocument, selection: string | null | readonly string[] = this.selectedIds, serializationOnly=false,outputOptions:GraphicRenderOptions={}): void {
    for(const object of document.objects)if(object.type==='text'&&objectIsVisible(document,object))for(const font of [object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]])assertFontAvailable(font);
    const selectedIds = typeof selection === 'string' ? [selection] : selection ?? [], selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const active = this.canvas.getActiveObject(), focus = window.document.activeElement as HTMLElement | null;
    const editing = active instanceof EditorTextBox && active.isEditing && this.idByObject.get(active) === selectedId ? { start: active.selectionStart, end: active.selectionEnd, focused: focus === active.hiddenTextarea, snapshot: this.textSnapshot(active), pending: document.revision === this.editingRevision, committedText: this.editingText } : null;
    this.document = document;
    this.activeGuides = {}; this.guideMeasurements = new WeakMap();
    // clear()/setActiveObject emettono eventi: il render canonico non è una selezione utente.
    this.rendering = true;
    try {
      this.canvas.clear();
      this.canvas.backgroundColor = document.paperColor ?? '#ffffff';
      const partial = document.objects.some(object => { if(!objectIsVisible(document,object))return false;if(object.type==='text'&&!textGeometryVerified(object))return true; const bounds = objectGeometry(object, measureFabric); return object.xMm < 0 || object.yMm < 0 || object.xMm + bounds.widthMm > document.areaMm.width || object.yMm + bounds.heightMm > document.areaMm.height; });
      this.canvas.clipPath = document.shape === 'round'
        ? new Circle({ radius: document.areaMm.width * PX_PER_MM / 2, left: 0, top: 0, originX: 'left', originY: 'top', strokeWidth: 0, absolutePositioned: true })
        : partial ? new Rect({ width: document.areaMm.width * PX_PER_MM, height: document.areaMm.height * PX_PER_MM, left: 0, top: 0, originX: 'left', originY: 'top', strokeWidth: 0, absolutePositioned: true }) : undefined;
      if(serializationOnly){
        // SVG needs logical paper dimensions, never a paper-sized bitmap.
        this.canvas.width=document.areaMm.width*PX_PER_MM;this.canvas.height=document.areaMm.height*PX_PER_MM;
        this.canvas.windowPaper=null;this.canvas.setZoom(this.zoom);
      }else this.configureDisplaySurface(document);
      const rendered = new Set<string>();
      for (const object of document.objects) {
        if (rendered.has(object.id)) continue;
        const owner=rootGroupFor(document,object.id),group=owner&&this.directObjectId&&owner.objectIds.includes(this.directObjectId)?undefined:owner;
        const members = group ? document.objects.filter(object => group.objectIds.includes(object.id)) : [object];
        const children = members.map(object => { const source = editing?.pending && object.id === selectedId && object.type === 'text' ? editing.snapshot : object, f = source.type === 'text' && !textGeometryVerified(source) ? unverifiedTextMarker(source) : renderObject(source, true); this.idByObject.set(f, object.id); this.sourceByObject.set(f, object); this.membersByObject.set(f, [object.id]); rendered.add(object.id);
          f.set({visible:objectIsVisible(document,object)});if(serializationOnly)outputParts(f,object.id,outputOptions);
          if (f instanceof EditorTextBox && object.type === 'text' && this.textRenderGuard) f.textRenderPermission = () => this.textRenderGuard!.status(this.textFontProbe(f, object), document.fontAssets) === 'ready';
          return f; });
        const root = group ? new Group(children, { originX: 'center', originY: 'center', strokeWidth: 0, objectCaching: false, subTargetCheck: false, interactive: false, perPixelTargetFind: true }) : children[0]!;
        if (group) selectionControls(root);
        root.set({visible:members.some(object=>objectIsVisible(document,object))});
        if(members.some(object=>object.type==='text'&&!textGeometryVerified(object)))root.set({lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false});
        this.membersByObject.set(root, members.map(object => object.id)); this.applyLocks(root,members.map(object=>object.id));this.canvas.add(root);
      }
      this.selectObjects(selectedIds);
      const selected = this.canvas.getActiveObject();
      if (editing && selected instanceof EditorTextBox) {
        selected.enterEditing(); const length = Array.from(selected.text).length;
        selected.selectionStart = Math.min(editing.start, length); selected.selectionEnd = Math.min(editing.end, length);
        selected.hiddenTextarea?.setAttribute('aria-label', 'Testo nel canvas'); selected._updateTextarea();
        this.editingRevision = document.revision; this.editingText = editing.pending ? editing.committedText : selected.text;
        if (!editing.focused) focus?.focus();
        this.canvas.requestRenderAll();
      }
    } finally { this.rendering = false; }
    this.textRenderGuard?.retain(new Set(document.objects.filter(object => object.type === 'text').map(object => object.id)));
    this.publishFontRenderStatus(); this.configureNodeControls(); this.publishSelection();
  }
  setGuides(settings: GuideSettings): void {
    if (!Number.isFinite(settings.gridMm) || settings.gridMm < 0.1 || settings.gridMm > 10) throw new Error('Passo griglia non valido');
    this.guides = { ...settings }; this.activeGuides = {}; this.canvas.requestRenderAll();
  }
  setDrawingTool(kind: DrawingPrimitive | 'freehand' | 'polyline' | 'bezier' | null, callbacks: PrimitiveDrawingCallbacks & Pick<FreehandCallbacks, 'onStroke'> & Partial<Pick<PolylineCallbacks, 'onPath' | 'onCount'>> & Partial<Pick<BezierDrawingCallbacks, 'onCurve'>>): void {
    const wrapped: PrimitiveDrawingCallbacks = { ...callbacks, onActive: active => { if (!active) { this.activeGuides = {}; this.canvas.requestRenderAll(); } callbacks.onActive(active); }, onExit: () => { this.activeGuides = {}; this.canvas.requestRenderAll(); callbacks.onExit(); } };
    const resolve = (point: PointMm, event: TPointerEvent) => {
      this.activeGuides = {};
      if (this.guides.snapEnabled && !event.altKey && !event.shiftKey && this.document) {
        const snapped = snapPoint(this.document, point, this.guides.gridMm, 6 / (PX_PER_MM * this.zoom), object => {
          const cached = this.guideMeasurements.get(object); if (cached) return cached;
          const size = measureFabric(object); this.guideMeasurements.set(object, size); return size;
        }); this.activeGuides = snapped; return snapped;
      }
      return point;
    };
    if (!this.primitiveDrawing) this.primitiveDrawing = new PrimitiveDrawingController(this.canvas, PX_PER_MM, () => this.document?.revision ?? 0, resolve, (type, start, end) => renderObject(primitiveFromEndpoints(type, 'drawing-preview', start, end)), wrapped);
    this.primitiveDrawing.callbacks = wrapped;
    if (!this.freehandDrawing) this.freehandDrawing = new FreehandDrawingController(this.canvas, PX_PER_MM, () => this.document?.revision ?? 0, points => renderObject({ id: 'stroke-preview', type: 'path', ...strokeGeometry(points), closed: false, strokeMm: 0.25, stroke: '#000000' }), { ...wrapped, onStroke: callbacks.onStroke });
    this.freehandDrawing.callbacks = { ...wrapped, onStroke: callbacks.onStroke };
    const polylineCallbacks: PolylineCallbacks = { ...wrapped, onPath: callbacks.onPath ?? (() => {}), onCount: callbacks.onCount ?? (() => {}) };
    if (!this.polylineDrawing) this.polylineDrawing = new PolylineDrawingController(this.canvas, PX_PER_MM, () => this.document?.revision ?? 0, resolve, (points, closed) => renderObject({ id: 'pen-preview', type: 'path', ...strokeGeometry(points), closed, strokeMm: 0.25, stroke: '#000000' }), polylineCallbacks);
    this.polylineDrawing.callbacks = polylineCallbacks;
    const bezierCallbacks: BezierDrawingCallbacks = { ...wrapped, onCurve: callbacks.onCurve ?? (() => {}), onCount: callbacks.onCount ?? (() => {}) };
    if (!this.bezierDrawing) this.bezierDrawing = new BezierDrawingController(this.canvas, PX_PER_MM, () => this.document?.revision ?? 0, resolve, (nodes, closed) => renderObject({ id: 'bezier-preview', type: 'bezier', ...normalizedBezier(nodes, closed), closed, strokeMm: 0.25, stroke: '#000000' }), bezierCallbacks);
    this.bezierDrawing.callbacks = bezierCallbacks;
    // Ripristinare prima le opzioni del precedente strumento: ciascuno conserva
    // soltanto il proprio stato di vista, mai una seconda scena canonica.
    if (kind === 'freehand') { this.primitiveDrawing.setTool(null); this.polylineDrawing.setEnabled(false); this.bezierDrawing.setEnabled(false); this.freehandDrawing.setEnabled(true); }
    else if (kind === 'polyline') { this.primitiveDrawing.setTool(null); this.freehandDrawing.setEnabled(false); this.bezierDrawing.setEnabled(false); this.polylineDrawing.setEnabled(true); }
    else if (kind === 'bezier') { this.primitiveDrawing.setTool(null); this.freehandDrawing.setEnabled(false); this.polylineDrawing.setEnabled(false); this.bezierDrawing.setEnabled(true); }
    else { this.freehandDrawing.setEnabled(false); this.polylineDrawing.setEnabled(false); this.bezierDrawing.setEnabled(false); this.primitiveDrawing.setTool(kind); }
  }
  finishPolyline(closed: boolean): boolean { return this.polylineDrawing?.finish(closed) ?? false; }
  cancelPolyline(): void { this.polylineDrawing?.cancel(); }
  finishBezier(closed: boolean): boolean { return this.bezierDrawing?.finish(closed) ?? false; }
  cancelBezier(): void { this.bezierDrawing?.cancel(); }
  setTextPathHandler(onChange: (object: TextObject, revision: number) => void): void { this.onTextPathChange = onChange; }
  setRasterCropHandler(onChange: (object: ImageObject, revision: number) => void): void { this.onCropChange = onChange; }
  setRasterCropFocus(id: string | null, moveContents=false): void { this.cropFocus = id;this.moveCropContents=moveContents; this.configureNodeControls(); this.canvas.requestRenderAll(); }
  setGeometryFocus(focus:GeometryFocus|null):void{this.geometryFocus=focus?{...focus}:null;this.geometryPointMarker.update(this.geometryFocus,this.document);}
  setNodeDragHandlers(onMove: (object: PathObject, index: number, point: PointMm, revision: number) => void, onActive: (active: boolean) => void): void { this.onNodeMove = onMove; this.onNodeActive = onActive; }
  setBezierDragHandler(onChange: (object: BezierObject, revision: number) => void): void { this.onBezierChange = onChange; }
  setNodeFocus(focus: { objectId: string; index: number } | null): void { this.nodeFocus = focus; this.configureNodeControls(); this.canvas.requestRenderAll(); }
  private configureNodeControls(): void {
    const object = this.canvas.getActiveObject(), focus = this.nodeFocus;
    const pathSource = object ? this.sourceByObject.get(object) : null;
    this.textPathControls.configure(object instanceof EditorPathText ? object : null, pathSource?.type === 'text' ? pathSource : null, measureFabric, renderObject, () => { this.dragging = true; if (!this.nodeDragging) { this.nodeDragging = true; this.onNodeActive?.(true); } });
    this.nodeControls.configure(object instanceof Polyline && focus && this.idByObject.get(object) === focus.objectId ? object : null, focus?.index ?? -1);
    const source = focus ? this.document?.objects.find(item => item.id === focus.objectId) : null;
    this.bezierControls.configure(object instanceof FabricPath && focus && this.idByObject.get(object) === focus.objectId ? object : null, source?.type === 'bezier' ? source : null, focus?.index ?? -1, measureFabric, renderObject, () => { this.dragging = true; if (!this.nodeDragging) { this.nodeDragging = true; this.onNodeActive?.(true); } }, PX_PER_MM);
    const cropSource = this.cropFocus ? this.document?.objects.find(item => item.id === this.cropFocus) : null;
    this.cropControls.configure(object instanceof FabricImage && this.idByObject.get(object) === this.cropFocus ? object : null, cropSource?.type === 'image' ? cropSource : null, measureFabric, renderObject, () => { this.dragging = true; if (!this.nodeDragging) { this.nodeDragging = true; this.onNodeActive?.(true); } }, this.moveCropContents,this.zoom);
    // Restoring a contextual controller can replace the full set of keys.
    // Publish their coordinates before the next queued Fabric render.
    object?.setCoords();
  }
  private drawTextPathGuide(): void {
    const target = this.canvas.getActiveObject(); if (!(target instanceof EditorPathText) || !target.path) return;
    const context = this.canvas.getContext(), retina = this.canvas.getRetinaScaling(), matrix = util.multiplyTransformMatrices(this.canvas.viewportTransform, target.calcTransformMatrix());
    context.save(); context.setTransform(retina, 0, 0, retina, 0, 0); context.transform(...matrix); context.translate(-target.pathCenterOffset.x, -target.pathCenterOffset.y);
    const path = target.path, stroke = path.stroke, width = path.strokeWidth, dash = path.strokeDashArray;
    path.stroke = '#0088cc'; path.strokeWidth = 1 / this.zoom; path.strokeDashArray = [4 / this.zoom, 3 / this.zoom]; context.globalAlpha = .7;
    try { path._render(context); } finally { path.stroke = stroke; path.strokeWidth = width; path.strokeDashArray = dash; context.restore(); }
  }
  private drawRasterCropFocus(): void {
    const target = this.canvas.getActiveObject(), original = this.document?.objects.find(object => object.id === this.cropFocus);
    if (!(target instanceof FabricImage) || original?.type !== 'image' || this.idByObject.get(target) !== this.cropFocus || !this.document) return;
    const object = this.cropControls.preview ?? original, crop = checkedRasterCrop(object.source, object.crop), bitmap = object.raster.mode==='original'?originalRasterImage(object.source):rasterCanvas(object.source, object.raster), context = this.canvas.getContext();
    context.save(); this.overlayTransform(context); context.beginPath();
    if (this.document.shape === 'round') context.arc(this.document.areaMm.width * 4, this.document.areaMm.height * 4, this.document.areaMm.width * 4, 0, Math.PI * 2); else context.rect(0, 0, this.document.areaMm.width * 8, this.document.areaMm.height * 8);
    context.clip(); context.transform(...target.calcTransformMatrix());
    const x = -crop.leftPx - crop.widthPx / 2, y = -crop.topPx - crop.heightPx / 2;
    context.beginPath(); context.rect(x, y, bitmap.width, bitmap.height); context.rect(-crop.widthPx / 2, -crop.heightPx / 2, crop.widthPx, crop.heightPx); context.clip('evenodd');
    context.globalAlpha = .22; context.drawImage(bitmap, x, y); context.globalAlpha = .65; context.strokeStyle = '#0088cc'; const unit = 1 / (Math.abs(target.scaleX) * this.zoom); context.lineWidth = unit; context.setLineDash([4 * unit, 3 * unit]); context.strokeRect(x, y, bitmap.width, bitmap.height); context.restore();
  }
  private drawNodeFocus(): void {
    const doc = this.document, focus = this.nodeFocus;
    if (!doc || !focus || this.selectedIds.length !== 1 || this.selectedIds[0] !== focus.objectId) return;
    const object = doc.objects.find(object => object.id === focus.objectId);
    if (object?.type === 'bezier') { this.drawBezierFocus(this.bezierControls.preview ?? object, focus.index); return; }
    if (object?.type !== 'path') return;
    const points = pathWorldPoints(object, source => {
      const cached = this.guideMeasurements.get(source); if (cached) return cached;
      const size = measureFabric(source); this.guideMeasurements.set(source, size); return size;
    });
    const context = this.canvas.getContext(); context.save();
    this.overlayTransform(context); context.beginPath();
    if (doc.shape === 'round') context.arc(doc.areaMm.width * PX_PER_MM / 2, doc.areaMm.height * PX_PER_MM / 2, doc.areaMm.width * PX_PER_MM / 2, 0, Math.PI * 2);
    else context.rect(0, 0, doc.areaMm.width * PX_PER_MM, doc.areaMm.height * PX_PER_MM);
    context.clip(); context.lineWidth = 1.5 / this.zoom; context.strokeStyle = '#0088cc';
    points.forEach((point, index) => {
      if (this.nodeDragging && index === focus.index) return;
      const x = point.xMm * PX_PER_MM, y = point.yMm * PX_PER_MM, size = (index === focus.index ? 8 : 5) / this.zoom;
      context.fillStyle = index === focus.index ? '#0088cc' : '#ffffff'; context.fillRect(x - size / 2, y - size / 2, size, size); context.strokeRect(x - size / 2, y - size / 2, size, size);
    });
    context.restore();
  }
  private drawBezierFocus(object: BezierObject, index: number): void {
    const doc = this.document; if (!doc) return;
    const nodes = bezierWorldNodes(object, measureFabric), node = nodes[index]; if (!node) return;
    const context = this.canvas.getContext(); context.save(); this.overlayTransform(context); context.beginPath();
    if (doc.shape === 'round') context.arc(doc.areaMm.width * PX_PER_MM / 2, doc.areaMm.height * PX_PER_MM / 2, doc.areaMm.width * PX_PER_MM / 2, 0, Math.PI * 2); else context.rect(0, 0, doc.areaMm.width * PX_PER_MM, doc.areaMm.height * PX_PER_MM);
    context.clip(); context.strokeStyle = '#0088cc'; context.lineWidth = 1 / this.zoom;
    for (const side of ['in', 'out'] as const) {
      const point = node[side]; if (!point || !object.closed && (side === 'in' && index === 0 || side === 'out' && index === nodes.length - 1)) continue;
      context.beginPath(); context.moveTo(node.x * PX_PER_MM, node.y * PX_PER_MM); context.lineTo(point.x * PX_PER_MM, point.y * PX_PER_MM); context.stroke();
    }
    nodes.forEach((point, i) => { if (i === index) return; const size = 5 / this.zoom; context.fillStyle = '#ffffff'; context.fillRect(point.x * PX_PER_MM - size / 2, point.y * PX_PER_MM - size / 2, size, size); context.strokeRect(point.x * PX_PER_MM - size / 2, point.y * PX_PER_MM - size / 2, size, size); }); context.restore();
  }
  /** Visual technical guides only. No Fabric objects are added, so these
   * never enter SVG, PNG/PDF production or persistent archive thumbnails. */
  private drawProductionProfileGuides():void{
    const doc=this.document;if(!doc?.productionProfile)return;const profile=profileForPage(doc.productionProfile,doc),context=this.canvas.getContext();
    context.save();this.overlayTransform(context);const width=doc.areaMm.width*PX_PER_MM,height=doc.areaMm.height*PX_PER_MM;
    context.beginPath();if(doc.shape==='round')context.arc(width/2,height/2,width/2,0,Math.PI*2);else context.rect(0,0,width,height);context.clip();context.lineWidth=1/this.zoom;context.strokeStyle='#0088cc';context.setLineDash([4/this.zoom,3/this.zoom]);
    const margin=profile.safeMarginMm;if(margin!==null&&margin>0){const inset=margin*PX_PER_MM;context.beginPath();if(doc.shape==='round')context.arc(width/2,height/2,width/2-inset,0,Math.PI*2);else context.rect(inset,inset,width-2*inset,height-2*inset);context.stroke();}
    context.fillStyle='rgba(255,183,99,.22)';context.strokeStyle='#a95b16';
    for(const region of profile.reservedAreas){const x=region.xMm*PX_PER_MM,y=region.yMm*PX_PER_MM,w=region.widthMm*PX_PER_MM,h=region.heightMm*PX_PER_MM;context.beginPath();if(region.shape==='ellipse')context.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);else context.rect(x,y,w,h);context.fill();context.stroke();}
    context.restore();
  }
  private drawPlaqueMounting():void{
    const doc=this.document;if(!doc?.plaque)return;const points=plaqueMountingPoints(doc.areaMm,doc.plaque,doc.shape),context=this.canvas.getContext();
    context.save();this.overlayTransform(context);context.lineWidth=1.5/this.zoom;context.strokeStyle='#006b9d';
    for(const point of points){const x=point.xMm*PX_PER_MM,y=point.yMm*PX_PER_MM,r=doc.plaque.holeDiameterMm?doc.plaque.holeDiameterMm*PX_PER_MM/2:6/this.zoom;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fillStyle=doc.plaque.method==='holes'?'#ffffff':'#c4d9e3';context.fill();context.stroke();if(doc.plaque.method==='screws'){context.beginPath();context.moveTo(x-r*.6,y-r*.6);context.lineTo(x+r*.6,y+r*.6);context.moveTo(x+r*.6,y-r*.6);context.lineTo(x-r*.6,y+r*.6);context.stroke();}else if(doc.plaque.method.startsWith('spacer')){context.beginPath();context.arc(x,y,r*.45,0,Math.PI*2);context.stroke();}}
    if(doc.plaque.holeDiameterMm!==null&&doc.plaque.clearanceMm!=null&&doc.plaque.clearanceMm>0){context.strokeStyle='#0088cc';context.lineWidth=1/this.zoom;context.setLineDash([4/this.zoom,3/this.zoom]);for(const point of points){context.beginPath();context.arc(point.xMm*PX_PER_MM,point.yMm*PX_PER_MM,(doc.plaque.holeDiameterMm/2+doc.plaque.clearanceMm)*PX_PER_MM,0,Math.PI*2);context.stroke();}}
    context.restore();
  }
  private drawGuides(): void {
    const doc = this.document, guides = this.activeGuides;
    if (!doc || !this.guides.gridVisible && guides.guideXmm === undefined && guides.guideYmm === undefined) return;
    const context = this.canvas.getContext(), width = doc.areaMm.width * PX_PER_MM, height = doc.areaMm.height * PX_PER_MM;
    context.save();
    this.overlayTransform(context);
    context.beginPath();
    if (doc.shape === 'round') context.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
    else context.rect(0, 0, width, height);
    context.clip(); context.lineWidth = 1 / this.zoom;
    if (this.guides.gridVisible) {
      const nominal = this.guides.gridMm * PX_PER_MM;
      const v=this.canvas.viewportTransform,windowed=!!this.canvas.windowPaper,left=windowed?Math.max(0,-v[4]/this.zoom):0,top=windowed?Math.max(0,-v[5]/this.zoom):0,right=windowed?Math.min(width,(this.canvas.width-v[4])/this.zoom):width,bottom=windowed?Math.min(height,(this.canvas.height-v[5])/this.zoom):height;
      const jump = Math.max(1, Math.ceil(8 / (nominal * this.zoom)), Math.ceil((right-left) / nominal / 400), Math.ceil((bottom-top) / nominal / 400)),step=nominal*jump;
      context.globalCompositeOperation = 'multiply'; context.strokeStyle = '#d6dfd3'; context.beginPath();
      for (let x = Math.max(step,Math.ceil(left/step)*step); x < right; x += step) { context.moveTo(x, top); context.lineTo(x, bottom); }
      for (let y = Math.max(step,Math.ceil(top/step)*step); y < bottom; y += step) { context.moveTo(left, y); context.lineTo(right, y); }
      context.stroke();
    }
    context.globalCompositeOperation = 'source-over'; context.strokeStyle = '#0088cc'; context.setLineDash([4 / this.zoom, 3 / this.zoom]); context.beginPath();
    if (guides.guideXmm !== undefined) { context.moveTo(guides.guideXmm * PX_PER_MM, 0); context.lineTo(guides.guideXmm * PX_PER_MM, height); }
    if (guides.guideYmm !== undefined) { context.moveTo(0, guides.guideYmm * PX_PER_MM); context.lineTo(width, guides.guideYmm * PX_PER_MM); }
    context.stroke(); context.restore();
  }
  contextObjectIds(event: MouseEvent): string[] | null {
    const active=this.canvas.getActiveObject();
    if(active instanceof EditorTextBox&&active.isEditing)return null;
    const {target}=this.canvas.findTarget(event);
    return target?this.objectIds(target):[];
  }
  private objectIds(object: FabricObject): string[] {
    return object instanceof ActiveSelection ? object.getObjects().flatMap(child => this.objectIds(child)) : this.membersByObject.get(object) ?? [];
  }
  private textSnapshot(target: EditorTextBox): TextObject {
    const source = this.sourceByObject.get(target) as TextObject;
    let line = 0, column = 0; const alignments: ReturnType<typeof lineAlignments> = [];
    const styles = Array.from(target.text, character => {
      alignments.push((target.styles[line]?.[column] as { editorLineAlign?: import('./model').TextAlignment } | undefined)?.editorLineAlign);
      if (character === '\n') { line++; column = 0; return {}; }
      const raw = target.styles[line]?.[column++] as { editorKerningPt?: number } | undefined;
      const { fontSize, fontWeight, fontStyle, underline, linethrough, overline, fill, fontFamily, stroke, strokeWidth } = raw as (IText['styles'][number][number] & { editorKerningPt?: number }) ?? {};
      return Object.fromEntries(Object.entries({ kerningPt: raw?.editorKerningPt, fontSizePt: fontSize === undefined ? undefined : fontPoints(fontSize), fontWeight, fontStyle, underline, linethrough, overline, ...textPaintFromFabric(fill, source.fillOpacity), ...(strokeWidth === undefined ? {} : { strokeMm: strokeWidth / PX_PER_MM }), ...textStrokeFromFabric(stroke, source.strokeOpacity), fontFamily: canonicalFontFamily(fontFamily) }).filter(([, value]) => value !== undefined)) as CharacterStyle;
    });
    alignments.push((target.styles[line]?.[column] as { editorLineAlign?: import('./model').TextAlignment } | undefined)?.editorLineAlign);
    const next = { ...source, text: target.text, characterStyles: compressStyles(styles), lineStyles: compressLineAlignments(alignments, Array.from(target.text).length, target.text.endsWith('\n')) };
    if (!next.lineStyles.length) delete (next as TextObject).lineStyles;
    if (!next.characterStyles.length) delete (next as TextObject).characterStyles;
    if(!textGeometryVerified(next)||!textGeometryVerified(source))return next;
    return source.textPath ? preserveTextPathGuide(source, next, measureFabric) : placeObjectAtCenter(next, objectCenter(source, measureFabric), measureFabric) as TextObject;
  }
  mergeEditingObject(update: SceneObject): SceneObject {
    const target = this.canvas.getActiveObject(); if (!(target instanceof EditorTextBox) || !target.isEditing || update.type !== 'text') return update;
    const source = this.sourceByObject.get(target); if (source?.type !== 'text' || update.id !== source.id) return update;
    const snapshot = this.textSnapshot(target), next = { ...snapshot }, keys = new Set([...Object.keys(source), ...Object.keys(update)]);
    for (const key of keys) if (!['xMm', 'yMm'].includes(key) && JSON.stringify(source[key as keyof TextObject]) !== JSON.stringify(update[key as keyof TextObject])) {
      const value = update[key as keyof TextObject]; if (value === undefined) delete (next as Record<string, unknown>)[key]; else (next as Record<string, unknown>)[key] = structuredClone(value);
    }
    if(!textGeometryVerified(source)||!textGeometryVerified(snapshot)||!textGeometryVerified(update)||!textGeometryVerified(next))return next;
    if (source.textPath && next.textPath && textPathStyleChanged(source, next)) return preserveTextPathGuide(source, next, measureFabric);
    const originalCenter = objectCenter(source, measureFabric), desiredCenter = objectCenter(update, measureFabric), liveCenter = objectCenter(snapshot, measureFabric);
    return placeObjectAtCenter(next, { xMm: liveCenter.xMm + desiredCenter.xMm - originalCenter.xMm, yMm: liveCenter.yMm + desiredCenter.yMm - originalCenter.yMm }, measureFabric);
  }
  stretchedText(value: number): { object: TextObject; revision: number } | null {
    const target = this.canvas.getActiveObject(); if (!(target instanceof EditorTextBox) || !target.isEditing) return null;
    const snapshot = this.textSnapshot(target), next = { ...snapshot, textScaleX: value };
    return { object: snapshot.textPath ? preserveTextPathGuide(snapshot, next, measureFabric) : placeObjectAtCenter(next, objectCenter(snapshot, measureFabric), measureFabric) as TextObject, revision: this.editingRevision };
  }
  alignedText(alignment: import('./model').TextAlignment): { object: TextObject; revision: number } | null {
    const target = this.canvas.getActiveObject(); if (!(target instanceof EditorTextBox) || !target.isEditing) return null;
    const snapshot = this.textSnapshot(target);
    if (snapshot.textPath) return { object: preserveTextPathGuide(snapshot, { ...snapshot, textAlign: alignment === 'justify-left' ? 'center' : alignment }, measureFabric), revision: this.editingRevision };
    const scope = lineSelection(snapshot, target.visualLineRanges(), target.selectionStart, target.selectionEnd);
    const next = applyLineAlignment(snapshot, alignment, scope, { widthMm: target.width * target.scaleX / PX_PER_MM, heightMm: target.height * target.scaleY / PX_PER_MM });
    return { object: snapshot.textPath ? preserveTextPathGuide(snapshot, next, measureFabric) : placeObjectAtCenter(next, objectCenter(snapshot, measureFabric), measureFabric) as TextObject, revision: this.editingRevision };
  }
  styledText(style: CharacterStyle): { object: TextObject; revision: number } | null {
    const target = this.canvas.getActiveObject();
    if (!(target instanceof EditorTextBox) || !target.isEditing || target.selectionStart === target.selectionEnd) return null;
    const snapshot = this.textSnapshot(target), next = applyCharacterStyle(snapshot, style, { start: target.selectionStart, end: target.selectionEnd });
    return { object: snapshot.textPath ? preserveTextPathGuide(snapshot, next, measureFabric) : placeObjectAtCenter(next, objectCenter(snapshot, measureFabric), measureFabric) as TextObject, revision: this.editingRevision };
  }
  kernedText(value: number): { object: TextObject; revision: number } | null {
    const target = this.canvas.getActiveObject(); if (!(target instanceof EditorTextBox) || !target.isEditing) return null;
    const snapshot = this.textSnapshot(target), next = applyTextKerning(snapshot, value, { start: target.selectionStart, end: target.selectionEnd });
    return { object: snapshot.textPath ? preserveTextPathGuide(snapshot, next, measureFabric) : placeObjectAtCenter(next, objectCenter(snapshot, measureFabric), measureFabric) as TextObject, revision: this.editingRevision };
  }
  selectObject(id: string | null): void {
    this.selectObjects(id ? [id] : []);
  }
  selectObjects(ids: readonly string[]): void {
    const previous = this.rendering; this.rendering = true;
    try {
      const direct=ids.length===1&&ids[0]===this.directObjectId;
      const expanded = this.document ? selectableObjectIds(this.document,direct?ids:expandSelection(this.document,ids),this.role,direct) : [];
      this.canvas.discardActiveObject();
      const targets = this.canvas.getObjects().filter(object => this.objectIds(object).some(id => expanded.includes(id)));
      this.selectedIds = expanded; this.selectedId = expanded.length === 1 ? expanded[0]! : null;
      if (targets.length === 1) this.canvas.setActiveObject(targets[0]!);
      else if (targets.length > 1) {
        const target = new ActiveSelection(targets, { canvas: this.canvas, strokeWidth: 0, perPixelTargetFind: true });
        selectionControls(target);this.applyLocks(target,expanded);this.canvas.setActiveObject(target);
      }
      this.canvas.requestRenderAll();
    } finally { this.rendering = previous; }
    this.publishObjectSelection();
  }
  /** Low-level serialization; runtime output callers use exportDocumentSvg. */
  exportSvg(document: GraphicDocument,transparentPaper=false,options:GraphicRenderOptions={}): string {
    assertRenderOptions(document,options);
    for(const object of productionDocument(document).objects)if(object.type==='text'){for(const id of [object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]])assertFontAvailable(id);assertTextGeometry(object);}
    const zoom = this.zoom;
    const selected = [...this.selectedIds];
    try {
      this.zoom = 1; this.render(productionDocument(document), null,true,options);if(transparentPaper&&!document.paperColor)this.canvas.backgroundColor='';
      // Both physical axes are explicit. Avoid a subpixel "meet" gutter from
      // rounding the intrinsic millimetre viewport to CSS pixels in SVG images.
      const svg=preciseIntermediateSvg(()=>this.canvas.toSVG({ width: `${document.areaMm.width}mm`, height: `${document.areaMm.height}mm`, viewBox: { x: 0, y: 0, width: document.areaMm.width * PX_PER_MM, height: document.areaMm.height * PX_PER_MM } })).replace('<svg ','<svg preserveAspectRatio="none" ');
      return embedSvgFonts(svg, document.fontAssets);
    } finally { this.zoom = zoom; this.render(document, selected); }
  }
  setZoom(zoom: number, document: GraphicDocument): void {
    if (!Number.isFinite(zoom) || zoom < 0.01 || zoom > 4) throw new Error('Zoom non valido');
    this.zoom = zoom; this.render(document);
  }
  activateSelectionTool(): void {
    this.primitiveDrawing?.setTool(null); this.freehandDrawing?.setEnabled(false); this.polylineDrawing?.cancel(); this.bezierDrawing?.cancel();
    this.setNodeFocus(null); this.setRasterCropFocus(null); this.cancelDrag(new KeyboardEvent('keydown', { key: 'Escape' })); this.finishEditing();
    this.activeGuides = {}; this.canvas.setCursor(this.canvas.defaultCursor); this.canvas.requestRenderAll(); this.canvas.upperCanvasEl.focus({ preventScroll: true });
  }
  finishEditing(): void {
    const active = this.canvas.getActiveObject();
    if (active instanceof IText && active.isEditing) active.exitEditing();
  }
  dispose(): void { this.disposed = true;this.viewportCleanup?.();this.canvas.wrapperEl.removeEventListener('mousedown',this.guardInteraction,true);this.canvas.wrapperEl.removeEventListener('touchstart',this.guardInteraction,true);this.canvas.upperCanvasEl.removeEventListener('mousedown',this.directMouseDown,true);this.externalControls.dispose();this.geometryPointMarker.dispose(); this.unsubscribeFontCoverage?.(); this.textRenderGuard?.dispose(); this.nodeControls.restore(); this.bezierControls.restore(); this.cropControls.restore(); this.textPathControls.restore(); this.primitiveDrawing?.dispose(); this.freehandDrawing?.dispose(); this.polylineDrawing?.dispose(); this.bezierDrawing?.dispose(); window.removeEventListener('keydown', this.cancelDrag, true); void this.canvas.dispose(); }
}
