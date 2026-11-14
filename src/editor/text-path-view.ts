import {pathStrokeFrame} from './path-stroke';
import {textStrokeEnvelope} from './text-stroke';
import { util, type TextboxProps, type TOptions, type TPointerEvent } from 'fabric';
import { EditorTextBox } from './text-box';
import { createTextGuide, guideLength, sampleTextGuide } from './text-path-geometry';
import { guideClosed } from './text-path-model';
import type { TextPathBinding } from './text-path-spec';
const xml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
let measuringContext: CanvasRenderingContext2D | null = null;
function measureContext() { return measuringContext ??= document.createElement('canvas').getContext('2d')!; }
const rounded = (value: number) => Math.round(value * 1e6) / 1e6;
export class EditorPathText extends EditorTextBox {
  binding?: TextPathBinding;
  renderPart:'all'|'artwork'|'guide-only'='all';
  private paintsGuide(){return !!this.binding?.showGuide&&(this.renderPart!=='artwork'||!this.binding.originalPathMetadata?.editor?.reference);}
  glyphScale = 1;
  pathCenterOffset = { x: 0, y: 0 };
  textAdvance = 0;
  private cursorDistances: number[] = [];
  private geometryReady = false;
  constructor(text: string, options: TOptions<TextboxProps>, binding: TextPathBinding, glyphScale: number) {
    super(text, { ...options, scaleX: 1, scaleY: 1, path: createTextGuide(binding.guide), pathAlign: 'baseline', pathStartOffset: binding.offsetMm * 8 });
    this.binding = binding; this.glyphScale = glyphScale; this.initDimensions(); this.setCoords();
  }
  override strokeBoundsWidth(): number { return this.binding ? 0 : super.strokeBoundsWidth(); }
  get pathLength(): number { return this.path ? guideLength(this.path) : 0; }
  private sample(distance: number) { return sampleTextGuide(this.path!, distance, !!this.binding && guideClosed(this.binding.guide), this.binding?.reversed ?? false); }
  private baselineShift(style: ReturnType<EditorPathText['getCompleteStyleDeclaration']>, character: string) {
    if(!this.binding||this.binding.baseline==='baseline')return -(this.binding?.normalOffsetMm??0)*8;
    if(!character||!this.canMeasureCharacter(character,style))return -(this.binding.normalOffsetMm??0)*8;
    const context = measureContext(); context.font = this._getFontDeclaration(style); const metric = context.measureText(character);
    const reference = this.binding?.baseline === 'ascender' ? metric.fontBoundingBoxAscent ?? style.fontSize * .8 : this.binding?.baseline === 'descender' ? -(metric.fontBoundingBoxDescent ?? style.fontSize * .2) : 0;
    return reference - (this.binding?.normalOffsetMm ?? 0) * 8;
  }
  override _getGraphemeBox(...args: Parameters<EditorTextBox['_getGraphemeBox']>): ReturnType<EditorTextBox['_getGraphemeBox']> {
    const box = super._getGraphemeBox(...args), scale = this.glyphScale ?? 1; box.width *= scale; box.kernedWidth *= scale;
    const previous = this.__charBounds[args[1]]?.[args[2] - 1]; if (previous && !args[4]) box.left = previous.left + previous.width + box.kernedWidth - box.width; return box;
  }
  override measureLine(index: number): ReturnType<EditorTextBox['measureLine']> { return this.binding ? this._measureLine(index) : super.measureLine(index); }
  override _measureLine(index: number): ReturnType<EditorTextBox['_measureLine']> {
    if (!this.binding || !this.path) return super._measureLine(index);
    const line = this._textLines[index]!, boxes: ReturnType<EditorTextBox['_getGraphemeBox']>[] = []; this.__charBounds[index] = boxes;
    for (let i = 0; i < line.length; i++) boxes.push(this._getGraphemeBox(line[i]!, index, i, line[i - 1]));
    if (line.length) { const style = this._getStyleDeclaration(index, line.length - 1) as { editorKerningPt?: number }, tail = (this._getWidthOfCharSpacing() + (style?.editorKerningPt ?? 0) * 25.4 / 72 * 8) * this.glyphScale; boxes.at(-1)!.width -= tail; boxes.at(-1)!.kernedWidth -= tail; }
    const width = boxes.reduce((sum, box) => sum + box.kernedWidth, 0), start = this.textAlign === 'center' ? (this.pathLength - width) / 2 : this.textAlign === 'right' ? this.pathLength - width : 0;
    let distance = start + this.binding.offsetMm * 8; this.cursorDistances = [distance];
    for (const box of boxes) { const point = this.sample(distance + box.kernedWidth / 2); Object.assign(box, { renderLeft: point.x, renderTop: point.y, angle: point.angle }); distance += box.kernedWidth; this.cursorDistances.push(distance); }
    boxes.push({ left: width, width: 0, kernedWidth: 0, height: this.fontSize, deltaY: 0 }); this.textAdvance = width; return { width, numOfSpaces: 0 };
  }
  override initDimensions(): void {
    if (!this.initialized) return;
    if (!this.binding || !this.path) { super.initDimensions(); return; }
    const old = this.geometryReady && this.isEditing ? this.getCenterPoint() : null, a = this.angle * Math.PI / 180, oldOffset = { ...this.pathCenterOffset };
    this._styleMap = this._generateStyleMap(this._splitText()); this._clearCache(); this.dirty = true; this.clipPath = undefined;
    this.width = this.path.width; this.height = this.path.height; this.getLineWidth(0);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const include = (x: number, y: number) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    this._textLines[0]!.forEach((character, i) => {
      if (!character.trim()) return; const box = this.__charBounds[0]![i]!, style = this.getCompleteStyleDeclaration(0, i), context = measureContext(); context.font = this._getFontDeclaration(style); const metric = this.canMeasureCharacter(character,style) ? context.measureText(character) : {actualBoundingBoxLeft:0,actualBoundingBoxRight:0,actualBoundingBoxAscent:0,actualBoundingBoxDescent:0}, shift = this.baselineShift(style, character), angle = box.angle ?? 0;
      const halfStroke = textStrokeEnvelope(style.stroke, style.strokeWidth, this.strokeLineJoin, this.strokeMiterLimit) / 2, left = -box.width / 2 - (metric.actualBoundingBoxLeft + halfStroke) * this.glyphScale, right = -box.width / 2 + (metric.actualBoundingBoxRight + halfStroke) * this.glyphScale;
      let top = shift - metric.actualBoundingBoxAscent - halfStroke, bottom = shift + metric.actualBoundingBoxDescent + halfStroke;
      for (const decoration of ['underline', 'overline', 'linethrough'] as const) if (style[decoration]) { const y = shift + this.offsets[decoration] * style.fontSize; top = Math.min(top, y); bottom = Math.max(bottom, y + style.fontSize / 12); }
      for (const [x, y] of [[left, top], [right, top], [right, bottom], [left, bottom]]) include(box.renderLeft! + x! * Math.cos(angle) - y! * Math.sin(angle), box.renderTop! + x! * Math.sin(angle) + y! * Math.cos(angle));
    });
    if (!Number.isFinite(minX) || this.binding.showGuide) { const guide=this.binding.guide,half=guide.stroke==='none'?0:guide.strokeMm*4,frame=(guide.type==='path'||guide.type==='bezier'||guide.type==='vector')&&guide.strokeFrameVersion===1?pathStrokeFrame(guide):null;const x=frame?frame.widthMm*4:this.path.width/2+half,y=frame?frame.heightMm*4:this.path.height/2+half;include(-x,-y);include(x,y); }
    this.pathCenterOffset = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }; this.width = Math.max(.001, maxX - minX); this.height = Math.max(.001, maxY - minY);
    for (const box of this.__charBounds[0]!.slice(0, -1)) { box.renderLeft! -= this.pathCenterOffset.x; box.renderTop! -= this.pathCenterOffset.y; }
    this.contentWidth = this.width; this.contentHeight = this.height; this.geometryReady = true;
    if (old) this.set({ left: old.x - oldOffset.x * Math.cos(a) + oldOffset.y * Math.sin(a) + this.pathCenterOffset.x * Math.cos(a) - this.pathCenterOffset.y * Math.sin(a), top: old.y - oldOffset.x * Math.sin(a) - oldOffset.y * Math.cos(a) + this.pathCenterOffset.x * Math.sin(a) + this.pathCenterOffset.y * Math.cos(a) });
  }
  override get overflow(): boolean { return this.textAdvance > this.pathLength + 1e-6; }
  anchorDistance(): number { return (this.textAlign === 'center' ? this.pathLength / 2 : this.textAlign === 'right' ? this.pathLength : 0) + (this.binding?.offsetMm ?? 0) * 8; }
  pointAt(distance: number) { const point = this.sample(distance); return { x: point.x - this.pathCenterOffset.x, y: point.y - this.pathCenterOffset.y, angle: point.angle }; }
  override _setTextStyles(...args: Parameters<EditorTextBox['_setTextStyles']>): void { super._setTextStyles(...args); if (this.path) args[0].textBaseline = 'alphabetic'; }
  override _renderChar(...args: Parameters<EditorTextBox['_renderChar']>): void {
    if (!this.binding) { super._renderChar(...args); return; } const context = args[1], style = this.getCompleteStyleDeclaration(args[2], args[3]), shift = this.baselineShift(style, args[4]); context.save(); context.scale(this.glyphScale, 1); args[5] /= this.glyphScale; args[6] += shift; try { super._renderChar(...args); } finally { context.restore(); }
  }
  override _render(context: CanvasRenderingContext2D): void {
    if (this.paintsGuide() && this.path) { context.save(); context.translate(-this.pathCenterOffset.x, -this.pathCenterOffset.y); this.path._render(context); context.restore(); }
    if(this.renderPart!=='guide-only')super._render(context);
  }
  override _renderTextDecoration(context: CanvasRenderingContext2D, type: 'underline' | 'linethrough' | 'overline'): void {
    if (!this.binding) { super._renderTextDecoration(context, type); return; }
    this._textLines[0]!.forEach((character, i) => { const style = this.getCompleteStyleDeclaration(0, i); if (!style[type]) return; const box = this.__charBounds[0]![i]!; context.save(); context.translate(box.renderLeft!, box.renderTop!); context.rotate(box.angle!); context.fillStyle = String(style.fill); context.fillRect(-box.kernedWidth / 2, this.baselineShift(style, character) + this.offsets[type] * style.fontSize, box.kernedWidth, style.fontSize / 15); context.restore(); });
  }
  override onInput(event: Event): void {
    if (this.binding && this.hiddenTextarea) this.hiddenTextarea.value = this.hiddenTextarea.value.replace(/\n/g, ' ');
    super.onInput(event);
  }
  override getSelectionStartFromPointer(event: TPointerEvent): number {
    if (!this.binding || !this.canvas) return super.getSelectionStartFromPointer(event); const point = this.canvas.getScenePoint(event).transform(util.invertTransform(this.calcTransformMatrix())); let nearest = 0, distance = Infinity;
    this.cursorDistances.forEach((position, i) => { const p = this.pointAt(position), style = this.getCompleteStyleDeclaration(0, Math.max(0, i - 1)), dx = point.x - p.x, dy = point.y - p.y, x = dx * Math.cos(p.angle) + dy * Math.sin(p.angle), y = -dx * Math.sin(p.angle) + dy * Math.cos(p.angle), top = this.baselineShift(style, this._textLines[0]?.[Math.max(0, i - 1)] ?? '') - style.fontSize * .85, bottom = top + style.fontSize, delta = Math.hypot(x, y - Math.max(top, Math.min(bottom, y))); if (delta < distance) { distance = delta; nearest = i; } }); return nearest;
  }
  override _renderCursor(...args: Parameters<EditorTextBox['_renderCursor']>): void {
    if (!this.binding) { super._renderCursor(...args); return; } const index = args[2], point = this.pointAt(this.cursorDistances[index] ?? this.anchorDistance()), style = this.getCompleteStyleDeclaration(0, Math.max(0, index - 1)), context = args[0]; context.save(); context.translate(point.x, point.y); context.rotate(point.angle); context.globalAlpha = this._currentCursorOpacity; context.fillStyle = this.cursorColor || String(style.fill); context.fillRect(0, this.baselineShift(style, this._textLines[0]?.[Math.max(0, index - 1)] ?? '') - style.fontSize * .85, this.cursorWidth / (this.getTotalObjectScaling().x || 1), style.fontSize); context.restore();
  }
  override _renderSelection(...args: Parameters<EditorTextBox['_renderSelection']>): void {
    if (!this.binding) { super._renderSelection(...args); return; } const context = args[0], selection = args[1]; context.save(); context.fillStyle = this.selectionColor;
    for (let i = selection.selectionStart; i < selection.selectionEnd; i++) { const box = this.__charBounds[0]?.[i]; if (!box || box.renderLeft === undefined) continue; const style = this.getCompleteStyleDeclaration(0, i); context.save(); context.translate(box.renderLeft, box.renderTop!); context.rotate(box.angle!); context.fillRect(-box.kernedWidth / 2, this.baselineShift(style, this._textLines[0]?.[i] ?? '') - style.fontSize * .85, box.kernedWidth, style.fontSize); context.restore(); } context.restore();
  }
  override _toSVG(): string[] {
    if (!this.binding) return super._toSVG(); let content = '';
    if (this.paintsGuide() && this.path) { const visible = this.path.visible; this.path.visible = true; try { content += `<g transform="translate(${-this.pathCenterOffset.x} ${-this.pathCenterOffset.y})">${this.path.toSVG()}</g>`; } finally { this.path.visible = visible; } }
    if(this.renderPart==='guide-only')return ['<g ', 'COMMON_PARTS', '>', content, '</g>'];
    this._textLines[0]!.forEach((character, i) => {
      const box = this.__charBounds[0]![i]!, style = this.getCompleteStyleDeclaration(0, i), shift = this.baselineShift(style, character), decoration = [style.underline && 'underline', style.linethrough && 'line-through', style.overline && 'overline'].filter(Boolean).join(' ');
      content += `<g transform="translate(${rounded(box.renderLeft!)} ${rounded(box.renderTop!)}) rotate(${rounded(box.angle! * 180 / Math.PI)}) scale(${rounded(this.glyphScale)} 1)"><text xml:space="preserve" x="${rounded(-box.width / 2 / this.glyphScale)}" y="${rounded(shift)}" font-family="${xml(style.fontFamily)}" font-size="${rounded(style.fontSize)}" font-weight="${style.fontWeight}" font-style="${style.fontStyle}" fill="${xml(String(style.fill))}" stroke="${xml(String(style.stroke ?? 'none'))}" stroke-width="${rounded(style.strokeWidth)}" stroke-linecap="${this.strokeLineCap}" stroke-linejoin="${this.strokeLineJoin}" stroke-miterlimit="${this.strokeMiterLimit}" paint-order="${this.paintFirst === 'stroke' ? 'stroke fill' : 'fill stroke'}"${decoration ? ` text-decoration="${decoration}"` : ''}><tspan>${xml(character)}</tspan></text></g>`;
    }); return ['<g ', 'COMMON_PARTS', '>', content, '</g>'];
  }
  override toSVG(...args: Parameters<EditorTextBox['toSVG']>): string { return this.binding ? this._createBaseSVGMarkup(this._toSVG(), { reviver: args[0], noStyle: true, withShadow: true }) : super.toSVG(...args); }
}
