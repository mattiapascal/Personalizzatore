import {textStrokeEnvelope} from './text-stroke';
import { decorationRects, decorationSvg } from './text-decoration-svg';
import { fabricTextSkew, physicalTextSkew } from './text-skew';
import { canMeasureFontText } from './font-measurement';
import { EDITOR_LIMITS } from './limits';
import { justifySpacing, type JustificationSettings } from './justification';
import type { VisualTextLine } from './text-lines';
import { Textbox, Rect, Point, Control, util, type TextboxProps, type TOptions, type TPointerEventInfo } from 'fabric';

export interface TextFrame { width: number; height: number; autoWidth: boolean; autoHeight: true; }

/** Vista Fabric del contenitore: testo originale e parametri restano nel documento. */
export class EditorTextBox extends Textbox {
  private vectorDecorationSvg = false;
  getSvgTextDecoration(style: Partial<Pick<TextboxProps,'underline'|'overline'|'linethrough'>>): string {
    // Fabric installs this SVG mixin at runtime but omits it from Textbox's
    // declaration. Delegate through the native prototype to preserve its policy.
    const native=Textbox.prototype as unknown as {getSvgTextDecoration(options:typeof style):string};
    return this.vectorDecorationSvg ? '' : native.getSvgTextDecoration.call(this,style);
  }
  /** Interactive glyph drawing gate. Outputs have their own preflight. */
  textRenderPermission?: () => boolean;
  override _render(context: CanvasRenderingContext2D): void {
    if (!this.textRenderPermission || this.textRenderPermission()) { super._render(context); return; }
    const width = Math.max(1, this.width), height = Math.max(1, this.height);
    context.save(); context.strokeStyle = '#a34b00'; context.fillStyle = '#fff0dc'; context.lineWidth = 1;
    context.fillRect(-width / 2, -height / 2, width, height); context.strokeRect(-width / 2, -height / 2, width, height);
    context.beginPath(); context.moveTo(-width / 2, -height / 2); context.lineTo(width / 2, height / 2); context.moveTo(width / 2, -height / 2); context.lineTo(-width / 2, height / 2); context.stroke(); context.restore();
  }
  protected canMeasureCharacter(text: string, style: ReturnType<EditorTextBox['getCompleteStyleDeclaration']>): boolean {
    return canMeasureFontText(text, style.fontFamily, style.fontWeight, style.fontStyle);
  }
  override _measureChar(...args: Parameters<Textbox['_measureChar']>): ReturnType<Textbox['_measureChar']> {
    // Provisional input layout only. Canonical measures reject this text via
    // assertTextGeometry; these zeroes never enter the Fabric font cache.
    if (!this.canMeasureCharacter(args[0], args[1])) return { width: 0, kernedWidth: 0 };
    // An unsupported preceding glyph must never enter a kerning pair or Fabric cache.
    if (args[2] && !this.canMeasureCharacter(args[2], args[3] as ReturnType<EditorTextBox['getCompleteStyleDeclaration']>)) { args[2] = undefined; args[3] = {}; }
    return super._measureChar(...args);
  }
  /** Envelope affects selection/containment, never wrapping or character advances. */
  strokeBoundsWidth(): number {
    let width = 0;
    for (const [row, line] of (this._textLines ?? []).entries()) for (const [column, character] of line.entries()) {
      if (!character.trim()) continue;
      const style = this.getCompleteStyleDeclaration(row, column);
      width = Math.max(width, textStrokeEnvelope(style.stroke, style.strokeWidth, this.strokeLineJoin, this.strokeMiterLimit));
    }
    return width;
  }
  override _getNonTransformedDimensions(): Point { const extra = this.strokeBoundsWidth(); return new Point(this.width + extra, this.height + extra); }
  override _getTransformedDimensions(options: Parameters<Textbox['_getTransformedDimensions']>[0] = {}): Point { return super._getTransformedDimensions({ ...options, strokeWidth: this.strokeBoundsWidth() }); }
  override drawBorders(...[context, options, style]: Parameters<Textbox['drawBorders']>): void {
    if (!this.skewX || style?.forActiveSelection) { super.drawBorders(context, options, style); return; }
    // Fabric normally draws the rotated envelope of a skewed object. The text
    // frame and its handles instead follow the actual parallelogram.
    const extra = this.strokeBoundsWidth(), width = this.width + extra, height = this.height + extra;
    const shear = Math.tan(options.skewX * Math.PI / 180);
    context.save(); context.strokeStyle = style?.borderColor ?? this.borderColor;
    this._setLineDash(context, style?.borderDashArray ?? this.borderDashArray);
    context.beginPath();
    for (const [index, [x, y]] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].entries()) {
      const px = options.scaleX * (x! * width + shear * y! * height), py = options.scaleY * y! * height;
      if (index) context.lineTo(px, py); else context.moveTo(px, py);
    }
    context.closePath(); context.stroke();
    if ((style?.hasControls ?? this.hasControls) && this.controls.mtr?.getVisibility(this, 'mtr')) {
      const size = this._calculateCurrentDimensions();
      context.beginPath(); context.moveTo(-options.scaleX * shear * height / 2, -options.scaleY * height / 2);
      context.lineTo(0, -size.y / 2 + this.controls.mtr.offsetY); context.stroke();
    }
    context.restore();
  }
  frame?: TextFrame;
  justificationSettings?: JustificationSettings;
  justificationResults: ReturnType<typeof justifySpacing>[] = [];
  contentWidth = 0;
  contentHeight = 0;
  constructor(text: string, options: TOptions<TextboxProps>, frame?: TextFrame, justificationSettings?: JustificationSettings) {
    super(text, { ...options, minWidth: 0.001 });
    this.frame = frame; this.justificationSettings = justificationSettings; this.initDimensions();
  }
  visualLineRanges(): VisualTextLine[] {
    let start = 0; const length = Array.from(this.text).length;
    return this._textLines.map((line, index) => { const end = Math.min(length, start + line.length + this.missingNewlineOffset(index)); const range = { start, end }; start = end; return range; });
  }
  private hasLineStyles(): boolean { return Object.values(this.styles ?? {}).some(line => Object.values(line).some(style => !!(style as { editorLineAlign?: string }).editorLineAlign)); }
  lineAlignment(index: number): Textbox['textAlign'] {
    const style = this._getStyleDeclaration(index, 0) as { editorLineAlign?: Textbox['textAlign'] };
    const alignment=style?.editorLineAlign??this.textAlign;
    return alignment==='justify-left'&&(style?.editorLineAlign||this.justificationSettings?.justifyLastLine)?'justify':alignment;
  }
  override _getLineLeftOffset(index: number): number {
    const previous = this.textAlign; this.textAlign = this.lineAlignment(index); try { return super._getLineLeftOffset(index); } finally { this.textAlign = previous; }
  }
  override enlargeSpaces(): void {
    // IText-style automatic width follows the longest hard line. Using the
    // provisional Textbox width here would justify to an unrelated default.
    const targetWidth=this.justificationSettings?.distribution==='word-space'&&(!this.frame||this.frame.autoWidth)?this.calcTextWidth():this.width;
    for (let i = 0; i < this._textLines.length; i++) {
      const alignment = this.lineAlignment(i); if (!alignment.includes('justify') || alignment !== 'justify' && this.isEndOfWrapping(i)) continue;
      const line = this._textLines[i]!, width = this.getLineWidth(i), words: number[] = [], letters: number[] = [];
      for (let j = 0; j < line.length; j++) {
        const space = this._measureChar(' ', this.getCompleteStyleDeclaration(i, j), undefined, {}).width;
        words.push(/[ \t]/.test(line[j]!) ? space : 0);
        letters.push(j < line.length - 1 && !/[ \t]/.test(line[j]!) && !/[ \t]/.test(line[j + 1]!) ? space : 0);
      }
      const spacing = justifySpacing(width, targetWidth, words.reduce((sum, value) => sum + value, 0), letters.reduce((sum, value) => sum + value, 0), this.justificationSettings, line.filter(char=>/[ \t]/.test(char)).length);
      this.justificationResults.push(spacing); let offset = 0;
      for (let j = 0; j <= line.length; j++) {
        const box = this.__charBounds[i]![j]!; box.left += offset;
        if (j < line.length) { const delta = spacing.spaceDelta===undefined?words[j]! * (spacing.wordPercent - 100) / 100 + letters[j]! * spacing.letterPercent / 100:/[ \t]/.test(line[j]!)?spacing.spaceDelta:0; box.width += delta; box.kernedWidth += delta; offset += delta; }
      }
    }
  }
  private kerningAt(line: number, char: number): number {
    const style = this._getStyleDeclaration(line, char) as { editorKerningPt?: number }; return (style?.editorKerningPt ?? 0) * 25.4 / 72 * 8;
  }
  private hasKerning(): boolean { return Object.values(this.styles ?? {}).some(line => Object.values(line).some(style => !!(style as { editorKerningPt?: number }).editorKerningPt)); }
  override _getGraphemeBox(...args: Parameters<Textbox['_getGraphemeBox']>): ReturnType<Textbox['_getGraphemeBox']> {
    const box = super._getGraphemeBox(...args), extra = this.kerningAt(args[1], args[2]); box.width += extra; box.kernedWidth += extra; return box;
  }
  override measureLine(index: number): ReturnType<Textbox['measureLine']> {
    const result = super.measureLine(index), length = this._textLines[index]?.length ?? 0, tail = length ? this.kerningAt(index, length - 1) : 0;
    result.width = Math.max(0, result.width - tail); const end = this.__charBounds[index]?.[length]; if (end) end.left -= tail; return result;
  }
  override _wrapLine(lineIndex: number, desiredWidth: number, data: Parameters<Textbox['_wrapLine']>[2], reservedSpace = 0): string[][] {
    if (!this.hasKerning() || this.splitByGrapheme) return super._wrapLine(lineIndex, desiredWidth, data, reservedSpace);
    const lines: string[][] = []; let line: string[] = [], width = 0, offset = 0;
    for (const item of data.wordsData[lineIndex]!) {
      const space = line.length ? this._measureWord([' '], lineIndex, offset - 1) : 0, candidate = width + space + item.width;
      const tail = super._getWidthOfCharSpacing() + (item.word.length ? this.kerningAt(lineIndex, offset + item.word.length - 1) : 0);
      if (line.length && candidate - tail > desiredWidth - reservedSpace) { lines.push(line); line = [...item.word]; width = item.width; }
      else { if (line.length) line.push(' '); line.push(...item.word); width = candidate; }
      offset += item.word.length + 1;
    }
    lines.push(line); return lines;
  }
  override _renderChars(...args: Parameters<Textbox['_renderChars']>): void {
    const previous = this.charSpacing, align = this.textAlign; this.textAlign = this.lineAlignment(args[5]);
    if (this.hasKerning() || this.hasLineStyles() || this.justificationResults.some(line => line.letterPercent !== 0)) this.charSpacing = 1;
    try { super._renderChars(...args); } finally { this.charSpacing = previous; this.textAlign = align; }
  }
  override toSVG(...args: Parameters<Textbox['toSVG']>): string {
    const types=['underline','overline','linethrough'] as const;
    const decoration=Object.fromEntries(types.map(type=>[type,decorationSvg(decorationRects(context=>this._renderTextDecoration(context,type)),type)]));
    const previous = this.charSpacing, previousDecoration=this.vectorDecorationSvg;
    const painted=types.some(type=>this[type]||Object.values(this.styles).some(line=>Object.values(line).some(style=>style[type])));
    try {
      // Suppress only the CSS paint. Keep native style boundaries, kerning and
      // glyph runs: clearing decoration flags would merge otherwise distinct runs.
      this.vectorDecorationSvg=painted||previousDecoration;
      if(this.hasKerning()||this.hasLineStyles()||this.justificationResults.some(line=>line.letterPercent!==0))this.charSpacing=1;
      const svg=super.toSVG(...args);
      return painted?svg.replace(/<text\b/,decoration.underline+'<text').replace('</text>','</text>'+decoration.overline+decoration.linethrough):svg;
    } finally { this.charSpacing=previous;this.vectorDecorationSvg=previousDecoration; }
  }
  override _renderSelection(...args: Parameters<Textbox['_renderSelection']>): void {
    const draw = (selection: typeof args[1]) => {
      const end = this.get2DCursorLocation(selection.selectionEnd), box = this.__charBounds[end.lineIndex]?.[end.charIndex - 1], correction = end.charIndex > 0 ? this.kerningAt(end.lineIndex, end.charIndex - 1) : 0;
      if (box) box.width -= correction; try { super._renderSelection(args[0], selection, args[2]); } finally { if (box) box.width += correction; }
    };
    if (!this.hasLineStyles() && !this.justificationResults.length) { draw(args[1]); return; }
    const previous = this.textAlign;
    try {
      for (const [index, line] of this.visualLineRanges().entries()) {
        const start = Math.max(line.start, args[1].selectionStart), end = Math.min(line.start + this._textLines[index]!.length, args[1].selectionEnd);
        if (end < start || line.end <= args[1].selectionStart || line.start >= args[1].selectionEnd) continue;
        this.textAlign = this.lineAlignment(index); draw({ selectionStart: start, selectionEnd: end }); this.textAlign = previous;
      }
    } finally { this.textAlign = previous; }
  }
  override _renderTextDecoration(context: CanvasRenderingContext2D, type: 'underline' | 'linethrough' | 'overline'): void {
    if (!this.hasKerning()) { super._renderTextDecoration(context, type); return; }
    let top = this._getTopOffset();
    for (let line = 0; line < this._textLines.length; line++) {
      const height = this.getHeightOfLine(line), baseline = top + height / this.lineHeight * (1 - this._fontSizeFraction), left = this._getLeftOffset() + this._getLineLeftOffset(line);
      for (let char = 0; char < this._textLines[line]!.length; char++) {
        const style = this.getCompleteStyleDeclaration(line, char); if (!style[type]) continue;
        const box = this.__charBounds[line]![char]!, next = char + 1 < this._textLines[line]!.length ? this.getCompleteStyleDeclaration(line, char + 1) : null;
        const spacing = super._getWidthOfCharSpacing() + this.kerningAt(line, char), width = box.width - (next?.[type] ? 0 : spacing), thickness = this.fontSize * style.textDecorationThickness / 1000;
        const align = type === 'overline' ? 1 : type === 'linethrough' ? .5 : 0;
        context.fillStyle = String(style.textDecorationColor || style.fill); context.fillRect(left + box.left, baseline + this.offsets[type] * style.fontSize + style.deltaY - align * thickness, width, thickness);
      }
      top += height;
    }
  }
  override mouseUpHandler(options: Parameters<Textbox['mouseUpHandler']>[0]): void {
    // Anche un box già selezionato richiede un doppio clic per entrare in scrittura.
    if (!this.isEditing) this.selected = false;
    super.mouseUpHandler(options);
  }
  override doubleClickHandler(options: TPointerEventInfo): void {
    if (this.group && !this.group.interactive || this.getActiveControl() || options.e.shiftKey) return;
    if (this.isEditing) { super.doubleClickHandler(options); return; }
    this.enterEditing(options.e); this.setCursorByClick(options.e); this._updateTextarea(); this.renderCursorOrSelection();
  }
  override _wrapText(lines: string[], desiredWidth: number): string[][] {
    if (!this.frame || this.frame.autoWidth) return lines.map(line => this.graphemeSplit(line));
    this.isWrapping = true;
    const data = this.getGraphemeDataForRender(lines);
    // Una parola più larga del contenitore resta eccedente: non allargare il box.
    data.largestWordWidth = Math.min(data.largestWordWidth, desiredWidth);
    const wrapped = data.wordsData.flatMap((_, index) => this._wrapLine(index, desiredWidth, data));
    this.isWrapping = false; return wrapped;
  }
  override calcTextHeight(): number {
    if (this.lineHeight >= 1) return super.calcTextHeight();
    // A tall earlier line may extend below the last short line when baselines
    // overlap. Auto height must enclose every line, without changing advances.
    let advance = 0, height = 0;
    for (let index = 0; index < this._textLines.length; index++) {
      const line = this.getHeightOfLine(index);
      height = Math.max(height, advance + line / this.lineHeight);
      advance += line;
    }
    return height;
  }
  override initDimensions(): void {
    if (!this.initialized) return;
    this.justificationResults = [];
    if (this.frame && !this.frame.autoWidth) this.width = this.frame.width;
    super.initDimensions();
    if (this.hasLineStyles() && !this.textAlign.includes('justify')) this.enlargeSpaces();
    this.contentWidth = this.calcTextWidth(); this.contentHeight = this.height;
    if (!this.frame || this.frame.autoWidth) this.width = this.text.length === 0 ? Math.max(0.001, this.frame?.width ?? 2) : Math.max(0.001, this.contentWidth);
    this.clipPath = this.frame && !this.frame.autoWidth
      ? new Rect({ width: this.width + this.strokeBoundsWidth(), height: this.height + this.strokeBoundsWidth(), left: 0, top: 0, originX: 'center', originY: 'center', strokeWidth: 0 }) : undefined;
  }
  get overflow(): boolean { return this.contentWidth > this.width + 1e-6 || this.contentHeight > this.height + 1e-6; }
  resizeFrame(width: number, height: number, autoWidth = false): void {
    this.frame = { width: Math.max(0.001, width), height: Math.max(0.001, height), autoWidth, autoHeight: true }; this.initDimensions(); this.setCoords();
  }
}

export function textBoxControls(object: EditorTextBox): void {
  const baseScale = object.scaleX, baseScaleY = object.scaleY, baseRawWidth = object.width + object.strokeBoundsWidth(), baseRawHeight = object.height + object.strokeBoundsWidth();
  const physicalSkew = physicalTextSkew(object.skewX, baseScale, baseScaleY);
  // Layout axes, before the shear. A skew must not change wrapping or the
  // horizontal stretch requested by dragging an edge.
  const baseWidth = baseRawWidth * baseScale, baseHeight = baseRawHeight * baseScaleY, automatic = object.frame?.autoWidth ?? true;
  const baseFrame=object.frame&&{...object.frame};
  const baseStroke = object.strokeWidth, baseFont = object.fontSize, baseStyles = structuredClone(object.styles), fonts = [baseFont, ...Object.values(baseStyles).flatMap(line => Object.values(line).map(style => style.fontSize ?? baseFont))];
  const spacings = [object.charSpacing / 1000 * baseFont / (25.4 / 72 * 8), ...Object.values(baseStyles).flatMap(line => Object.values(line).map(style => (style as { editorKerningPt?: number }).editorKerningPt ?? 0))], spacingScale = Math.min(Infinity, ...spacings.filter(value => value !== 0).map(value => value > 0 ? EDITOR_LIMITS.maxTrackingPt / value : EDITOR_LIMITS.minTrackingPt / value));
  const strokes = [baseStroke, ...Object.values(baseStyles).flatMap(line => Object.values(line).map(style => style.strokeWidth ?? 0))], strokeScale = Math.min(Infinity, ...strokes.filter(value => value > 0).map(value => EDITOR_LIMITS.maxStrokeMm * 8 / value));
  const minimumFontScale = EDITOR_LIMITS.minFontSizePt * 25.4 / 72 * 8 / Math.min(...fonts), maximumFontScale = Math.min(EDITOR_LIMITS.maxFontSizePt * 25.4 / 72 * 8 / Math.max(...fonts), spacingScale, strokeScale);
  const handles = { tl: [-0.5, -0.5], tr: [0.5, -0.5], bl: [-0.5, 0.5], br: [0.5, 0.5], ml: [-0.5, 0], mr: [0.5, 0], mt: [0, -0.5], mb: [0, 0.5] } as const;
  for (const [name, [x, y]] of Object.entries(handles)) {
    let gesture: Parameters<NonNullable<Control['actionHandler']>>[1] | undefined;
    let matrix = object.calcTransformMatrix(), inverse = util.invertTransform(matrix), anchor = new Point();
    object.controls[name] = new Control({ x, y, actionName: 'resizeTextBox', cursorStyle: y ? x * y > 0 ? 'nwse-resize' : 'nesw-resize' : 'ew-resize', cursorStyleHandler: (_event, control, target) => {
      // La diagonale dipende dall'angolo della maniglia, non dal rapporto
      // larghezza/altezza del testo (un box largo non deve mostrare frecce orizzontali agli angoli).
      const skew = physicalTextSkew(target.skewX, target.scaleX, target.scaleY);
      const angle = Math.atan2(control.y, control.x + Math.tan(skew * Math.PI / 180) * control.y) * 180 / Math.PI + target.getTotalAngle();
      return `${['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'][((Math.round(angle / 45) % 8) + 8) % 8]}-resize`;
    }, ...(object.skewX ? { positionHandler: (_dimensions, _matrix, target) => textFramePoint(target as EditorTextBox, x, y).transform(target.getViewportTransform()) } : {}), actionHandler: (event, transform, pointerX, pointerY) => {
      const target = transform.target as EditorTextBox;
      if (gesture !== transform) {
        gesture = transform; matrix = target.calcTransformMatrix(); inverse = util.invertTransform(matrix);
        anchor = new Point(-x * baseRawWidth, -y * baseRawHeight).transform(matrix);
      }
      // Start from the actual pointer-down point, including the grab offset.
      // Il punto opposto resta fermo anche con dilatazione su entrambi gli assi.
      const dx = pointerX - transform.ex, dy = pointerY - transform.ey;
      const delta = new Point(dx, dy).transform(inverse, true);
      const localX = delta.x * baseScale, localY = delta.y * baseScaleY;
      let width = x ? Math.max(0.08, Math.sign(x) * localX + baseWidth) : baseWidth;
      const proportional=!!x&&!!y&&!event.shiftKey;
      if (automatic||y) {
        const factor=proportional?Math.max(.001,1+(Math.sign(x)*localX+Math.sign(y)*localY)/(baseWidth+baseHeight)):1;
        const height=proportional?baseHeight*factor:y?Math.max(.08,Math.sign(y)*localY+baseHeight):baseHeight;
        const fontScale=Math.max(minimumFontScale,Math.min(maximumFontScale,height/(baseHeight/baseScaleY)));
        if(proportional)width=baseWidth*fontScale/baseScaleY;
        if((!automatic||object.text.length===0)&&baseFrame)target.frame={...baseFrame,width:baseFrame.width*fontScale,height:baseFrame.height*fontScale};
        const styles = structuredClone(baseStyles);
        for (const line of Object.values(styles)) for (const raw of Object.values(line)) {
          const style = raw as typeof raw & { editorKerningPt?: number };
          if (style.fontSize !== undefined) style.fontSize *= fontScale;
          if (style.strokeWidth !== undefined) style.strokeWidth *= fontScale;
          if (style.editorKerningPt !== undefined) style.editorKerningPt *= fontScale;
        }
        target.set({ fontSize: baseFont * fontScale, strokeWidth: baseStroke * fontScale, styles, scaleY: 1 }); target.initDimensions();
        target.set('scaleX', Math.max(.1, Math.min(10, width / (target.width + target.strokeBoundsWidth()))));
      } else target.resizeFrame(Math.max(.001, width / baseScale - target.strokeBoundsWidth()), object.height, false);
      target.set('skewX', fabricTextSkew(physicalSkew, target.scaleX, target.scaleY));
      const nextAnchor = textFramePoint(target, -x, -y);
      const correction = anchor.subtract(nextAnchor), parent = target.group;
      const localCorrection = parent ? correction.transform(util.invertTransform(parent.calcTransformMatrix()), true) : correction;
      target.set({ left: target.left + localCorrection.x, top: target.top + localCorrection.y });
      target.setCoords(); return true;
    } });
    if (!x || !y) object.controls[name]!.render = (context, left, top) => {
      const automatic = object.frame?.autoWidth ?? true;
      context.save(); context.translate(left, top); context.rotate(object.angle * Math.PI / 180); context.fillStyle = automatic ? '#fff' : '#0088cc'; context.strokeStyle = '#0088cc'; context.lineWidth = 1.5;
      context.fillRect(-4, -4, 8, 8); context.strokeRect(-4, -4, 8, 8); context.restore();
    };
  }
  object.setControlsVisibility({ mt:true,ml:true,mr:true,mb:true });
  object.controls.overflow = new Control({ x: 0.5, y: 0.5, offsetX: 11, offsetY: 11, cursorStyle: 'help', actionHandler: () => false, getVisibility: () => object.overflow, render: (context, left, top) => {
    context.save(); context.fillStyle = '#fff'; context.strokeStyle = '#b43a29'; context.lineWidth = 1.5; context.fillRect(left - 5, top - 5, 10, 10); context.strokeRect(left - 5, top - 5, 10, 10);
    context.beginPath(); context.moveTo(left - 3, top); context.lineTo(left + 3, top); context.moveTo(left, top - 3); context.lineTo(left, top + 3); context.stroke(); context.restore();
  } });
}

/** Actual text frame, including the conservative stroke envelope, in scene px. */
export function textFramePoint(object: EditorTextBox, x: number, y: number): Point {
  const extra = object.strokeBoundsWidth();
  return new Point(x * (object.width + extra), y * (object.height + extra)).transform(object.calcTransformMatrix());
}
