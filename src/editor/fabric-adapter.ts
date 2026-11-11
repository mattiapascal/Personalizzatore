import {productionDocument,selectableObjectIds,effectiveObjectProperties,type EditorRole} from './object-properties';
import {rootGroupFor} from './scene-groups';
import {plaqueMountingPoints} from './plaque';
import { mapVector } from './vector-geometry';
import { TextPathControls } from './text-path-controls';
import { EditorPathText } from './text-path-view';
import { preserveTextPathGuide, textPathStyleChanged } from './text-path-model';
import { scaledTextPath } from './text-path-spec';
export { prepareRasterSource } from './raster-cache';
import { RasterCropControls } from './raster-crop-controls';
import { checkedRasterCrop, type ImageObject } from './raster-geometry';
import { Canvas, StaticCanvas, IText, Rect, Path as FabricPath, Circle, Ellipse, Line, Polyline, Polygon, FabricImage, Control, Group, ActiveSelection, controlsUtils, util, type FabricObject, type TPointerEvent } from 'fabric';
import type { GraphicDocument, Measure, SceneObject, TransformArguments, SelectionTransformArguments } from './model';
import { DocumentSchema, validateLayout, objectGeometry, objectIntersectsArea, objectCenter, placeObjectAtCenter, type CharacterStyle } from './model';
import { lineAlignments, compressLineAlignments, lineSelection, applyLineAlignment } from './text-lines';
import { EditorTextBox, textBoxControls } from './text-box';
import { characterStyles, compressStyles, applyCharacterStyle, selectionStyle, applyTextKerning, textSpacingScope, type TextObject, type CharacterSelection } from './text-style';
import { expandSelection } from './selection';
import { DEFAULT_GUIDES, snapTranslation, snapPoint, type GuideSettings, type SnapResult } from './guides';
import { PrimitiveDrawingController, type PrimitiveDrawingCallbacks } from './primitive-drawing';
import { primitiveFromEndpoints, type DrawingPrimitive } from './primitive-geometry';
import { FreehandDrawingController, type FreehandCallbacks } from './freehand-drawing';
import { strokeGeometry } from './path-geometry';
import { assertFontAvailable, renderFontFamily, canonicalFontFamily, embedSvgFonts } from './fonts';
import { tintImprintPixels } from './ink';
import { pathWorldPoints, type PathObject } from './path-nodes';
import { PathNodeControls, polyNodeScenePoint } from './path-node-controls';
import type { PointMm } from './line-geometry';
import { PolylineDrawingController, type PolylineCallbacks } from './polyline-drawing';
import { assertRasterParameters, rasterCanvas } from './raster-cache';
import { bezierCommands, normalizedBezier } from './bezier-geometry';
import { BezierDrawingController, type BezierDrawingCallbacks } from './bezier-drawing';
import { BezierNodeControls } from './bezier-controls';
import { bezierWorldNodes, type BezierObject } from './bezier-nodes';
import { pngExportSize, pngWithDpi, type PngDpi } from './png-export';

export const PX_PER_MM = 8; // Solo zoom di visualizzazione, indipendente da DPI fisici.
export const PT_TO_MM = 25.4 / 72;
const fontPoints = (pixels: number) => Math.round(pixels / (PT_TO_MM * PX_PER_MM) * 1e9) / 1e9;
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
function renderObject(o: SceneObject, editable = false): FabricObject {
  const common = { borderColor: '#0088cc', cornerColor: '#0088cc', left: o.xMm * PX_PER_MM, top: o.yMm * PX_PER_MM, angle: o.rotationDeg ?? 0, originX: 'center' as const, originY: 'center' as const, lockScalingFlip: true, lockSkewingX: true, lockSkewingY: true, lockRotation: o.type === 'circle', hasControls: editable, objectCaching: false };
  let object: FabricObject;
  if (o.type === 'text') {
    assertFontAvailable(o.fontFamily);
    for (const run of o.characterStyles ?? []) if (run.style.fontFamily) assertFontAvailable(run.style.fontFamily);
    const options = { ...common, scaleX: o.textScaleX ?? 1, scaleY: o.textScaleY ?? 1, fontSize: o.fontSizePt * PT_TO_MM * PX_PER_MM, fontFamily: renderFontFamily(o.fontFamily), fill: o.fill, strokeWidth: 0,
      fontWeight: o.fontWeight ?? 'normal', fontStyle: o.fontStyle ?? 'normal', underline: o.underline ?? false, linethrough: o.linethrough ?? false, overline: o.overline ?? false,
      textAlign: o.textAlign ?? 'left', lineHeight: o.lineHeight ?? 1, charSpacing: (o.letterSpacingPt ?? 0) / o.fontSizePt * 1000 };
    const styles: IText['styles'] = {}, characters = characterStyles(o), alignments = lineAlignments(o);
    let line = 0, column = 0;
    Array.from(o.text).forEach((character, index) => {
      const { fontSizePt, kerningPt, ...style } = characters[index]!; if (style.fontFamily) style.fontFamily = renderFontFamily(style.fontFamily);
      const editorLineAlign = alignments[index];
      if (Object.keys(style).length || fontSizePt !== undefined || kerningPt !== undefined || editorLineAlign !== undefined) (styles[line] ??= {})[column] = { ...style, ...(editorLineAlign === undefined ? {} : { editorLineAlign }), ...(kerningPt === undefined ? {} : { editorKerningPt: kerningPt }), ...(fontSizePt === undefined ? {} : { fontSize: fontSizePt * PT_TO_MM * PX_PER_MM }) };
      if (character === '\n') { line++; column = 0; } else column++;
    });
    if (alignments[Array.from(o.text).length]) (styles[line] ??= {})[column] = { ...styles[line]?.[column], editorLineAlign: alignments[Array.from(o.text).length] } as IText['styles'][number][number];
    const box = o.textPath ? new EditorPathText(o.text, { ...options, styles }, o.textPath, o.textScaleX ?? 1) : new EditorTextBox(o.text, { ...options, styles }, o.textBox && { width: o.textBox.widthMm * PX_PER_MM / (o.textScaleX ?? 1), height: o.textBox.heightMm * PX_PER_MM / (o.textScaleY ?? 1), autoWidth: o.textBox.autoWidth, autoHeight: o.textBox.autoHeight }, o.justification);
    if (editable) { if (box instanceof EditorPathText) selectionControls(box); else textBoxControls(box); }
    object = box;
  } else if (o.type === 'image') {
    const bitmap = rasterCanvas(o.source, o.raster, o.crop);
    object = new FabricImage(bitmap, { ...common, strokeWidth: 0, perPixelTargetFind: true, flipX: o.flipX ?? false, flipY: o.flipY ?? false, scaleX: o.widthMm * PX_PER_MM / bitmap.width, scaleY: o.heightMm * PX_PER_MM / bitmap.height });
  } else {
    const strokeWidth = o.stroke === 'none' ? 0 : o.strokeMm * PX_PER_MM;
    const appearance = { fill: !o.fill || o.fill === 'none' ? 'transparent' : o.fill, perPixelTargetFind: !o.fill || o.fill === 'none', stroke: o.stroke === 'none' ? undefined : o.stroke, strokeWidth,
      strokeDashArray: o.strokeDash === 'dashed' ? [strokeWidth * 4, strokeWidth * 2] : o.strokeDash === 'dotted' ? [0, strokeWidth * 2] : undefined,
      strokeLineCap: o.strokeDash === 'dotted' ? 'round' as const : 'butt' as const };
    object = o.type === 'circle'
      ? new Circle({ ...common, ...appearance, radius: o.radiusMm * PX_PER_MM })
      : o.type === 'ellipse' ? new Ellipse({ ...common, ...appearance, rx: o.rxMm * PX_PER_MM, ry: o.ryMm * PX_PER_MM })
      : o.type === 'vector' ? new FabricPath(mapVector(o.commands, (x, y) => ({ x: x * o.widthMm * PX_PER_MM, y: y * o.heightMm * PX_PER_MM })), { ...common, ...appearance, fillRule: o.fillRule, perPixelTargetFind: true, strokeLineCap: o.strokeDash === 'dotted' ? 'round' : o.strokeLineCap, strokeLineJoin: o.strokeLineJoin, strokeMiterLimit: o.strokeMiterLimit, lockScalingX: o.widthMm === 0, lockScalingY: o.heightMm === 0 })
      : o.type === 'bezier' ? new FabricPath(bezierCommands(o.nodes, o.closed, o.widthMm * PX_PER_MM, o.heightMm * PX_PER_MM), { ...common, ...appearance, fillRule: 'evenodd', strokeLineCap: 'round', strokeLineJoin: 'round', lockScalingX: o.widthMm === 0, lockScalingY: o.heightMm === 0 })
      : o.type === 'path' ? new (o.closed ? Polygon : Polyline)(o.points.map(p => ({ x: p.x * o.widthMm * PX_PER_MM, y: p.y * o.heightMm * PX_PER_MM })), { ...common, ...appearance, fillRule: 'evenodd', strokeLineCap: 'round', strokeLineJoin: 'round', lockScalingX: o.widthMm === 0, lockScalingY: o.heightMm === 0 })
      : o.type === 'line' ? new Line([0, 0, o.lengthMm * PX_PER_MM, 0], { ...common, ...appearance, strokeLineCap: 'round', lockScalingY: true })
      : new Rect({ ...common, ...appearance, width: o.widthMm * PX_PER_MM, height: o.heightMm * PX_PER_MM, rx: (o.cornerRadiusMm ?? 0) * PX_PER_MM, ry: (o.cornerRadiusMm ?? 0) * PX_PER_MM });
  }
  if (o.type === 'vector' && o.clipRect) { const c = o.clipRect; object.clipPath = new Rect({ left: ((c.left + c.right) / 2 - .5) * o.widthMm * PX_PER_MM, top: ((c.top + c.bottom) / 2 - .5) * o.heightMm * PX_PER_MM, width: (c.right - c.left) * o.widthMm * PX_PER_MM, height: (c.bottom - c.top) * o.heightMm * PX_PER_MM, originX: 'center', originY: 'center', strokeWidth: 0, fill: '#000000' }); }
  if (o.type === 'line') {
    object.setControlsVisibility({ tl: false, tr: false, bl: false, br: false, mt: false, mb: false, ml: true, mr: true, mtr: true });
    for (const name of ['ml', 'mr']) { const original = object.controls[name]!; object.controls[name] = new Control({ ...original, actionName: 'scaleX', getActionName: () => 'scaleX', actionHandler: controlsUtils.scalingX, cursorStyleHandler: controlsUtils.scaleCursorStyleHandler }); }
  }
  if ((o.type === 'path' || o.type === 'bezier') && (o.widthMm === 0 || o.heightMm === 0)) {
    object.setControlsVisibility({ tl: false, tr: false, bl: false, br: false, ml: o.widthMm > 0, mr: o.widthMm > 0, mt: o.heightMm > 0, mb: o.heightMm > 0 });
  }
  if (o.type === 'circle' || o.type === 'image') {
    object.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false, mtr: o.type !== 'circle' });
    // I cerchi ammettono soltanto scala uniforme, anche premendo Maiusc.
    for (const name of ['tl', 'tr', 'bl', 'br']) {
      const control = object.controls[name]!;
      const handler = control.actionHandler;
      if (handler) object.controls[name] = new Control({ ...control, actionHandler: (event, transform, x, y) => handler({ ...event, shiftKey: false }, transform, x, y) });
    }
  }
  if (editable && o.type !== 'circle') keepRotationHandleInCanvas(object);
  // L’origine Fabric è centrale; il formato JSON conserva le coordinate esterne
  // storiche. La conversione non sposta i progetti salvati né cambia lo SVG.
  object.setCoords();
  const bounds = object.getBoundingRect();
  object.set({ left: object.left + o.xMm * PX_PER_MM - bounds.left, top: object.top + o.yMm * PX_PER_MM - bounds.top });
  object.setCoords();
  return object;
}
export const measureFabric: Measure = object => {
  if (object.type === 'image') { assertRasterParameters(object.source, object.raster); return { widthMm: object.widthMm, heightMm: object.heightMm }; }
  const f = renderObject(object);
  return { widthMm: f.getScaledWidth() / PX_PER_MM, heightMm: f.getScaledHeight() / PX_PER_MM, ...(f instanceof EditorPathText ? { pathCenterOffsetMm: { x: f.pathCenterOffset.x / PX_PER_MM, y: f.pathCenterOffset.y / PX_PER_MM }, pathLengthMm: f.pathLength / PX_PER_MM, textAdvanceMm: f.textAdvance / PX_PER_MM } : {}) };
};
export function measureTextFrame(object: TextObject) {
  const box = renderObject(object) as EditorTextBox;
  return { widthMm: box.getScaledWidth() / PX_PER_MM, heightMm: box.getScaledHeight() / PX_PER_MM, overflow: box.overflow, justificationLimited: box.justificationResults.some(line => line.underfull || line.overfull), lines: box.textLines.length };
}
/** Canvas temporaneo: né overlay della vista né selezione entrano nel PNG. */
export async function exportDocumentPng(document: GraphicDocument, dpi: PngDpi, transparent: boolean): Promise<Blob> {
  const size = pngExportSize(document.areaMm, dpi);
  DocumentSchema.parse(document); validateLayout(document, measureFabric, 'edit');
  const element = window.document.createElement('canvas');
  const output = new StaticCanvas(element, { width: size.width, height: size.height, enableRetinaScaling: false, renderOnAddRemove: false });
  try {
    const scale = size.pixelsPerMm / PX_PER_MM;
    output.setViewportTransform([scale, 0, 0, scale, 0, 0]);
    if (document.shape === 'round') output.clipPath = new Circle({ radius: document.areaMm.width * PX_PER_MM / 2, left: 0, top: 0, originX: 'left', originY: 'top', strokeWidth: 0, absolutePositioned: true });
    for (const object of productionDocument(document).objects) output.add(renderObject(object));
    output.renderAll();
    if (!transparent) {
      const context = element.getContext('2d'); if (!context) throw new Error('Esportazione PNG non disponibile');
      context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.globalCompositeOperation = 'destination-over'; context.fillStyle = '#ffffff'; context.fillRect(0, 0, size.width, size.height); context.restore();
    }
    if(document.inkColor&&document.inkColor!=='black'){const context=element.getContext('2d');if(!context)throw new Error('Anteprima colore non disponibile');const pixels=context.getImageData(0,0,size.width,size.height);tintImprintPixels(pixels.data,document.inkColor);context.putImageData(pixels,0,0);}
    const blob = await new Promise<Blob>((resolve, reject) => element.toBlob(value => value ? resolve(value) : reject(new Error('Il browser non ha generato il PNG')), 'image/png'));
    return new Blob([pngWithDpi(new Uint8Array(await blob.arrayBuffer()), dpi)], { type: 'image/png' });
  } finally { await output.dispose(); }
}
export class FabricAdapter {
  readonly canvas: Canvas;
  private idByObject = new WeakMap<FabricObject, string>();
  private sourceByObject = new WeakMap<FabricObject, SceneObject>();
  private membersByObject = new WeakMap<FabricObject, string[]>();
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
  private onCropChange?: (object: ImageObject, revision: number) => void;
  private bezierControls = new BezierNodeControls();
  private onBezierChange?: (object: BezierObject, revision: number) => void;
  private nodeDragging = false;
  private onNodeMove?: (object: PathObject, index: number, point: PointMm, revision: number) => void;
  private onNodeActive?: (active: boolean) => void;
  private readonly cancelDrag: (event: KeyboardEvent) => void;
  private publishSelection: () => void;
  private publishObjectSelection: () => void;
  constructor(element: HTMLCanvasElement, revision: () => number, onMove: (id: string, xMm: number, yMm: number, expectedRevision: number) => void, onText?: (id: string, object: TextObject, expectedRevision: number) => void, onEditing?: (editing: boolean) => void, onSelect?: (id: string | null) => void, onTransform?: (id: string, args: TransformArguments, expectedRevision: number) => void, onDeleteDrag?: (id: string, expectedRevision: number) => void, onTrash?: (visible: boolean) => void, onCharacterSelection?: (selection: CharacterSelection | null) => void, onSelection?: (ids: string[]) => void, onMoveSelection?: (ids: string[], deltaXmm: number, deltaYmm: number, revision: number) => void, onDeleteSelection?: (ids: string[], revision: number) => void, onTransformSelection?: (ids: string[], args: Omit<SelectionTransformArguments, 'objectIds'>, revision: number) => void) {
    this.canvas = new Canvas(element, { selection: true, selectionFullyContained: true, selectionKey: 'shiftKey', preserveObjectStacking: true, backgroundColor: '#ffffff', selectionColor: '#0088cc22', selectionBorderColor: '#0088cc', enableRetinaScaling: true, uniformScaling: true, centeredScaling: false, centeredRotation: true, centeredKey: null });
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
    this.canvas.on('text:changed', this.publishSelection);
    this.canvas.on('after:render', () => { this.drawGuides(); this.drawPlaqueMounting(); this.drawNodeFocus(); this.drawRasterCropFocus(); this.drawTextPathGuide(); });
    let gestureRevision = revision(), gestureBounds = { left: 0, top: 0 }, gestureAngle = 0, gestureScale = 1;
    this.canvas.on('before:transform', ({ transform }) => { gestureRevision = revision(); gestureBounds = transform.target.getBoundingRect(); gestureAngle = transform.target.angle; gestureScale = transform.target.scaleX; this.cancelled = false; });
    const delta = (object: FabricObject) => {
      const bounds = object.getBoundingRect();
      return { x: Math.round((bounds.left - gestureBounds.left) / PX_PER_MM * 1e9) / 1e9, y: Math.round((bounds.top - gestureBounds.top) / PX_PER_MM * 1e9) / 1e9 };
    };
    const outside = (object: FabricObject) => {
      const ids = this.objectIds(object);
      if (this.document&&(ids.length>1||rootGroupFor(this.document,ids[0]!))) {
        const offset = delta(object), document = this.document;
        return ids.every(id => { const source = document.objects.find(object => object.id === id)!; return !objectIntersectsArea(document, { ...source, xMm: source.xMm + offset.x, yMm: source.yMm + offset.y }, measureFabric); });
      }
      const source = this.sourceByObject.get(object), bounds = object.getBoundingRect();
      return !!source && !!this.document && !objectIntersectsArea(this.document, { ...source, xMm: bounds.left / PX_PER_MM, yMm: bounds.top / PX_PER_MM }, measureFabric);
    };
    this.canvas.on('object:moving', ({ target, e }) => {
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
    this.canvas.on('mouse:up', () => { this.dragging = false; if (this.nodeDragging) { this.nodeDragging = false; this.onNodeActive?.(false); } this.activeGuides = {}; this.canvas.requestRenderAll(); onTrash?.(false); });
    this.cancelDrag = event => {
      if (event.key !== 'Escape' || !this.dragging) return;
      event.preventDefault(); event.stopImmediatePropagation(); this.cancelled = true; this.canvas.endCurrentTransform(); this.dragging = false; onTrash?.(false);
      if (this.nodeDragging) { this.nodeDragging = false; this.onNodeActive?.(false); }
      if (this.document) this.render(this.document);
    };
    window.addEventListener('keydown', this.cancelDrag, true);
    this.canvas.on('object:modified', event => {
      if (this.cancelled) return;
      const object = event.target;
      const id = this.idByObject.get(object);
      const bounds = object.getBoundingRect();
      const xMm = bounds.left / PX_PER_MM;
      const yMm = bounds.top / PX_PER_MM;
      const expectedRevision = gestureRevision;
      const ids = this.objectIds(object);
      const grouped=!!this.document&&!!rootGroupFor(this.document,ids[0]!);
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
      if (id && source?.type === 'image' && event.action === 'cropRaster') {
        const next = this.cropControls.preview;
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
            ...(object instanceof EditorTextBox && object.frame ? { textBox: { widthMm: object.getScaledWidth() / PX_PER_MM, heightMm: object.getScaledHeight() / PX_PER_MM, autoWidth: object.frame.autoWidth, autoHeight: object.frame.autoHeight } } : {}) }
          : source.type === 'image' ? { type: 'image', widthMm: object.getScaledWidth() / PX_PER_MM, heightMm: object.getScaledHeight() / PX_PER_MM }
          : source.type === 'circle'
            ? { type: 'circle', radiusMm: ((source.radiusMm * 2 + strokeMm) * object.scaleX - strokeMm) / 2 }
            : source.type === 'line' ? { type: 'line', lengthMm: (source.lengthMm + strokeMm) * object.scaleX - strokeMm }
            : source.type === 'ellipse' ? { type: 'ellipse', rxMm: ((source.rxMm * 2 + strokeMm) * object.scaleX - strokeMm) / 2, ryMm: ((source.ryMm * 2 + strokeMm) * object.scaleY - strokeMm) / 2 }
            : source.type === 'path' || source.type === 'bezier' || source.type === 'vector' ? { type: source.type, widthMm: source.widthMm === 0 ? 0 : (source.widthMm + strokeMm) * object.scaleX - strokeMm, heightMm: source.heightMm === 0 ? 0 : (source.heightMm + strokeMm) * object.scaleY - strokeMm }
            : { type: 'rect', widthMm: (source.widthMm + strokeMm) * object.scaleX - strokeMm, heightMm: (source.heightMm + strokeMm) * object.scaleY - strokeMm };
        const rotationDeg = source.type === 'circle' ? 0 : ((object.angle + 180) % 360 + 360) % 360 - 180;
        queueMicrotask(() => { if (!this.disposed) onTransform?.(id, { xMm, yMm, rotationDeg, size }, expectedRevision); });
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
      const source = this.sourceByObject.get(target); if (source?.type !== 'text' || (source.textBox?.autoWidth ?? true) || source.textAlign === 'justify-left' || source.lineStyles?.some(run => run.alignment === 'justify-left')) return;
      const object = placeObjectAtCenter({ ...source, textBox: { widthMm: target.getScaledWidth() / PX_PER_MM, heightMm: target.getScaledHeight() / PX_PER_MM, autoWidth: true, autoHeight: true } }, objectCenter(source, measureFabric), measureFabric) as TextObject, expectedRevision = revision();
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
  private applyLocks(target:FabricObject,ids:readonly string[]):void{
    if(this.role==='admin'||!this.document)return;const sources=this.document.objects.filter(object=>ids.includes(object.id));
    if(sources.some(object=>effectiveObjectProperties(this.document!,object.id).selectionLocked))target.set({selectable:false,evented:false});
    if(sources.some(object=>effectiveObjectProperties(this.document!,object.id).transformLocked))target.set({lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false});
  }
  render(document: GraphicDocument, selection: string | null | readonly string[] = this.selectedIds): void {
    for(const object of document.objects)if(object.type==='text')for(const font of [object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]])assertFontAvailable(font);
    const selectedIds = typeof selection === 'string' ? [selection] : selection ?? [], selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const active = this.canvas.getActiveObject(), focus = window.document.activeElement as HTMLElement | null;
    const editing = active instanceof EditorTextBox && active.isEditing && this.idByObject.get(active) === selectedId ? { start: active.selectionStart, end: active.selectionEnd, focused: focus === active.hiddenTextarea, snapshot: this.textSnapshot(active), pending: document.revision === this.editingRevision, committedText: this.editingText } : null;
    this.document = document;
    this.activeGuides = {}; this.guideMeasurements = new WeakMap();
    // clear()/setActiveObject emettono eventi: il render canonico non è una selezione utente.
    this.rendering = true;
    try {
      this.canvas.clear();
      this.canvas.backgroundColor = '#ffffff';
      const partial = document.objects.some(object => { const bounds = objectGeometry(object, measureFabric); return object.xMm < 0 || object.yMm < 0 || object.xMm + bounds.widthMm > document.areaMm.width || object.yMm + bounds.heightMm > document.areaMm.height; });
      this.canvas.clipPath = document.shape === 'round'
        ? new Circle({ radius: document.areaMm.width * PX_PER_MM / 2, left: 0, top: 0, originX: 'left', originY: 'top', strokeWidth: 0, absolutePositioned: true })
        : partial ? new Rect({ width: document.areaMm.width * PX_PER_MM, height: document.areaMm.height * PX_PER_MM, left: 0, top: 0, originX: 'left', originY: 'top', strokeWidth: 0, absolutePositioned: true }) : undefined;
      this.canvas.setDimensions({ width: document.areaMm.width * PX_PER_MM * this.zoom, height: document.areaMm.height * PX_PER_MM * this.zoom });
      this.canvas.setZoom(this.zoom);
      const rendered = new Set<string>();
      for (const object of document.objects) {
        if (rendered.has(object.id)) continue;
        const group = rootGroupFor(document,object.id);
        const members = group ? document.objects.filter(object => group.objectIds.includes(object.id)) : [object];
        const children = members.map(object => { const f = renderObject(editing?.pending && object.id === selectedId && object.type === 'text' ? editing.snapshot : object, true); this.idByObject.set(f, object.id); this.sourceByObject.set(f, object); this.membersByObject.set(f, [object.id]); rendered.add(object.id); return f; });
        const root = group ? new Group(children, { originX: 'center', originY: 'center', strokeWidth: 0, objectCaching: false, subTargetCheck: false, interactive: false, perPixelTargetFind: true }) : children[0]!;
        if (group) selectionControls(root);
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
    this.configureNodeControls(); this.publishSelection();
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
  setRasterCropFocus(id: string | null): void { this.cropFocus = id; this.configureNodeControls(); this.canvas.requestRenderAll(); }
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
    this.cropControls.configure(object instanceof FabricImage && this.idByObject.get(object) === this.cropFocus ? object : null, cropSource?.type === 'image' ? cropSource : null, measureFabric, renderObject, () => { this.dragging = true; if (!this.nodeDragging) { this.nodeDragging = true; this.onNodeActive?.(true); } });

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
    const object = this.cropControls.preview ?? original, crop = checkedRasterCrop(object.source, object.crop), bitmap = rasterCanvas(object.source, object.raster), context = this.canvas.getContext(), retina = this.canvas.getRetinaScaling();
    context.save(); context.setTransform(retina * this.zoom, 0, 0, retina * this.zoom, 0, 0); context.beginPath();
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
    const context = this.canvas.getContext(), retina = this.canvas.getRetinaScaling(); context.save();
    context.setTransform(retina * this.zoom, 0, 0, retina * this.zoom, 0, 0); context.beginPath();
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
    const context = this.canvas.getContext(), retina = this.canvas.getRetinaScaling(); context.save(); context.setTransform(retina * this.zoom, 0, 0, retina * this.zoom, 0, 0); context.beginPath();
    if (doc.shape === 'round') context.arc(doc.areaMm.width * PX_PER_MM / 2, doc.areaMm.height * PX_PER_MM / 2, doc.areaMm.width * PX_PER_MM / 2, 0, Math.PI * 2); else context.rect(0, 0, doc.areaMm.width * PX_PER_MM, doc.areaMm.height * PX_PER_MM);
    context.clip(); context.strokeStyle = '#0088cc'; context.lineWidth = 1 / this.zoom;
    for (const side of ['in', 'out'] as const) {
      const point = node[side]; if (!point || !object.closed && (side === 'in' && index === 0 || side === 'out' && index === nodes.length - 1)) continue;
      context.beginPath(); context.moveTo(node.x * PX_PER_MM, node.y * PX_PER_MM); context.lineTo(point.x * PX_PER_MM, point.y * PX_PER_MM); context.stroke();
    }
    nodes.forEach((point, i) => { if (i === index) return; const size = 5 / this.zoom; context.fillStyle = '#ffffff'; context.fillRect(point.x * PX_PER_MM - size / 2, point.y * PX_PER_MM - size / 2, size, size); context.strokeRect(point.x * PX_PER_MM - size / 2, point.y * PX_PER_MM - size / 2, size, size); }); context.restore();
  }
  private drawPlaqueMounting():void{
    const doc=this.document;if(!doc?.plaque)return;const points=plaqueMountingPoints(doc.areaMm,doc.plaque),context=this.canvas.getContext(),scale=this.canvas.getRetinaScaling()*this.zoom;
    context.save();context.setTransform(scale,0,0,scale,0,0);context.lineWidth=1.5/this.zoom;context.strokeStyle='#006b9d';
    for(const point of points){const x=point.xMm*PX_PER_MM,y=point.yMm*PX_PER_MM,r=doc.plaque.holeDiameterMm?doc.plaque.holeDiameterMm*PX_PER_MM/2:6/this.zoom;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fillStyle=doc.plaque.method==='holes'?'#ffffff':'#c4d9e3';context.fill();context.stroke();if(doc.plaque.method==='screws'){context.beginPath();context.moveTo(x-r*.6,y-r*.6);context.lineTo(x+r*.6,y+r*.6);context.moveTo(x+r*.6,y-r*.6);context.lineTo(x-r*.6,y+r*.6);context.stroke();}else if(doc.plaque.method.startsWith('spacer')){context.beginPath();context.arc(x,y,r*.45,0,Math.PI*2);context.stroke();}}
    context.restore();
  }
  private drawGuides(): void {
    const doc = this.document, guides = this.activeGuides;
    if (!doc || !this.guides.gridVisible && guides.guideXmm === undefined && guides.guideYmm === undefined) return;
    const context = this.canvas.getContext(), retina = this.canvas.getRetinaScaling(), width = doc.areaMm.width * PX_PER_MM, height = doc.areaMm.height * PX_PER_MM;
    context.save();
    context.setTransform(retina * this.zoom, 0, 0, retina * this.zoom, 0, 0);
    context.beginPath();
    if (doc.shape === 'round') context.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
    else context.rect(0, 0, width, height);
    context.clip(); context.lineWidth = 1 / this.zoom;
    if (this.guides.gridVisible) {
      const nominal = this.guides.gridMm * PX_PER_MM;
      const jump = Math.max(1, Math.ceil(8 / (nominal * this.zoom)), Math.ceil(width / nominal / 400), Math.ceil(height / nominal / 400));
      context.globalCompositeOperation = 'multiply'; context.strokeStyle = '#d6dfd3'; context.beginPath();
      for (let x = nominal * jump; x < width; x += nominal * jump) { context.moveTo(x, 0); context.lineTo(x, height); }
      for (let y = nominal * jump; y < height; y += nominal * jump) { context.moveTo(0, y); context.lineTo(width, y); }
      context.stroke();
    }
    context.globalCompositeOperation = 'source-over'; context.strokeStyle = '#0088cc'; context.setLineDash([4 / this.zoom, 3 / this.zoom]); context.beginPath();
    if (guides.guideXmm !== undefined) { context.moveTo(guides.guideXmm * PX_PER_MM, 0); context.lineTo(guides.guideXmm * PX_PER_MM, height); }
    if (guides.guideYmm !== undefined) { context.moveTo(0, guides.guideYmm * PX_PER_MM); context.lineTo(width, guides.guideYmm * PX_PER_MM); }
    context.stroke(); context.restore();
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
      const { fontSize, fontWeight, fontStyle, underline, linethrough, overline, fill, fontFamily } = raw as (IText['styles'][number][number] & { editorKerningPt?: number }) ?? {};
      return Object.fromEntries(Object.entries({ kerningPt: raw?.editorKerningPt, fontSizePt: fontSize === undefined ? undefined : fontPoints(fontSize), fontWeight, fontStyle, underline, linethrough, overline, fill, fontFamily: canonicalFontFamily(fontFamily) }).filter(([, value]) => value !== undefined)) as CharacterStyle;
    });
    alignments.push((target.styles[line]?.[column] as { editorLineAlign?: import('./model').TextAlignment } | undefined)?.editorLineAlign);
    const next = { ...source, text: target.text, characterStyles: compressStyles(styles), lineStyles: compressLineAlignments(alignments, Array.from(target.text).length, target.text.endsWith('\n')) };
    if (!next.lineStyles.length) delete (next as TextObject).lineStyles;
    if (!next.characterStyles.length) delete (next as TextObject).characterStyles;
    return source.textPath ? preserveTextPathGuide(source, next, measureFabric) : placeObjectAtCenter(next, objectCenter(source, measureFabric), measureFabric) as TextObject;
  }
  mergeEditingObject(update: SceneObject): SceneObject {
    const target = this.canvas.getActiveObject(); if (!(target instanceof EditorTextBox) || !target.isEditing || update.type !== 'text') return update;
    const source = this.sourceByObject.get(target); if (source?.type !== 'text' || update.id !== source.id) return update;
    const snapshot = this.textSnapshot(target), next = { ...snapshot }, keys = new Set([...Object.keys(source), ...Object.keys(update)]);
    for (const key of keys) if (!['xMm', 'yMm'].includes(key) && JSON.stringify(source[key as keyof TextObject]) !== JSON.stringify(update[key as keyof TextObject])) {
      const value = update[key as keyof TextObject]; if (value === undefined) delete (next as Record<string, unknown>)[key]; else (next as Record<string, unknown>)[key] = structuredClone(value);
    }
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
    const next = applyLineAlignment(snapshot, alignment, scope, { widthMm: target.getScaledWidth() / PX_PER_MM, heightMm: target.getScaledHeight() / PX_PER_MM });
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
      const expanded = this.document ? selectableObjectIds(this.document,expandSelection(this.document,ids),this.role) : [];
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
  exportSvg(document: GraphicDocument): string {
    const zoom = this.zoom;
    const selected = [...this.selectedIds];
    try {
      this.zoom = 1; this.render(productionDocument(document), null);
      return embedSvgFonts(this.canvas.toSVG({ width: `${document.areaMm.width}mm`, height: `${document.areaMm.height}mm`, viewBox: { x: 0, y: 0, width: document.areaMm.width * PX_PER_MM, height: document.areaMm.height * PX_PER_MM } }), document.fontAssets);
    } finally { this.zoom = zoom; this.render(document, selected); }
  }
  setZoom(zoom: number, document: GraphicDocument): void {
    if (!Number.isFinite(zoom) || zoom < 0.25 || zoom > 4) throw new Error('Zoom non valido');
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
  dispose(): void { this.disposed = true; this.nodeControls.restore(); this.bezierControls.restore(); this.cropControls.restore(); this.textPathControls.restore(); this.primitiveDrawing?.dispose(); this.freehandDrawing?.dispose(); this.polylineDrawing?.dispose(); this.bezierDrawing?.dispose(); window.removeEventListener('keydown', this.cancelDrag, true); void this.canvas.dispose(); }
}
