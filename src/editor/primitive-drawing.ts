import { Canvas, type FabricObject, type CanvasEvents, type TPointerEvent } from 'fabric';
import type { PointMm } from './line-geometry';
import { constrainedPrimitiveEnd, type DrawingPrimitive } from './primitive-geometry';

export interface PrimitiveDrawingCallbacks { onPrimitive: (kind: DrawingPrimitive, start: PointMm, end: PointMm, revision: number) => void; onActive: (active: boolean) => void; onExit: () => void; }
/** Preview transitoria: solo il rilascio produce un comando nel documento. */
export class PrimitiveDrawingController {
  private kind: DrawingPrimitive | null = null;
  private disposed = false;
  private start: (PointMm & { revision: number }) | null = null;
  private preview: FabricObject | null = null;
  private previous: { selection: boolean; skipTargetFind: boolean; defaultCursor: string; hoverCursor: string } | null = null;
  callbacks: PrimitiveDrawingCallbacks;
  constructor(private canvas: Canvas, private pxPerMm: number, private revision: () => number, private resolve: (point: PointMm, event: TPointerEvent) => PointMm, private render: (kind: DrawingPrimitive, start: PointMm, end: PointMm) => FabricObject, callbacks: PrimitiveDrawingCallbacks) {
    this.callbacks = callbacks; canvas.on('mouse:down', this.down); canvas.on('mouse:move', this.move); canvas.on('mouse:up', this.up); window.addEventListener('keydown', this.escape, true);
  }
  setTool(kind: DrawingPrimitive | null): void {
    if (this.kind === kind) return;
    const previousKind = this.kind;
    this.clear(true); this.kind = kind;
    if (kind && !previousKind) {
      this.previous = { selection: this.canvas.selection, skipTargetFind: this.canvas.skipTargetFind, defaultCursor: this.canvas.defaultCursor, hoverCursor: this.canvas.hoverCursor };
      this.canvas.discardActiveObject(); this.canvas.selection = false; this.canvas.skipTargetFind = true; this.canvas.defaultCursor = 'crosshair'; this.canvas.hoverCursor = 'crosshair'; this.canvas.setCursor('crosshair');
    } else if (!kind) {
      if (this.previous) Object.assign(this.canvas, this.previous); this.previous = null; this.canvas.setCursor(this.canvas.defaultCursor);
    }
    this.canvas.requestRenderAll();
  }
  private point(event: TPointerEvent): PointMm {
    const point = this.canvas.getScenePoint(event), result = this.resolve({ xMm: point.x / this.pxPerMm, yMm: point.y / this.pxPerMm }, event);
    return this.start && this.kind && event.shiftKey ? constrainedPrimitiveEnd(this.kind, this.start, result) : result;
  }
  private down = ({ e }: CanvasEvents['mouse:down']) => {
    if (!this.kind || 'button' in e && e.button !== 0) return;
    this.clear(false); this.start = { ...this.point(e), revision: this.revision() }; this.callbacks.onActive(true);
  };
  private move = ({ e }: CanvasEvents['mouse:move']) => { if (this.kind && this.start) this.updatePreview(this.point(e)); };
  private up = ({ e }: CanvasEvents['mouse:up']) => {
    if (!this.kind || !this.start) return;
    const kind = this.kind, start = this.start, end = this.point(e), callbacks = this.callbacks;
    const dx = Math.abs(end.xMm - start.xMm), dy = Math.abs(end.yMm - start.yMm);
    const size = kind === 'rect' || kind === 'ellipse' ? Math.min(dx, dy) : Math.hypot(dx, dy), enough = size * this.pxPerMm * this.canvas.getZoom() >= 2;
    this.setTool(null); callbacks.onExit();
    if (enough) queueMicrotask(() => { if (!this.disposed) callbacks.onPrimitive(kind, start, end, start.revision); });
  };
  private updatePreview(end: PointMm): void {
    if (!this.start || !this.kind) return;
    if (this.preview) this.canvas.remove(this.preview);
    this.preview = null;
    const dx = end.xMm - this.start.xMm, dy = end.yMm - this.start.yMm;
    if (this.kind === 'rect' || this.kind === 'ellipse' ? dx !== 0 && dy !== 0 : dx !== 0 || dy !== 0) {
      this.preview = this.render(this.kind, this.start, end);
      this.preview.set({ selectable: false, evented: false, hasControls: false, excludeFromExport: true, objectCaching: false }); this.canvas.add(this.preview);
    }
    this.canvas.requestRenderAll();
  }
  private clear(notify: boolean): void {
    const active = this.start !== null; this.start = null;
    if (this.preview) { this.canvas.remove(this.preview); this.preview = null; }
    if (active && notify) this.callbacks.onActive(false);
  }
  private escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.kind) return;
    event.preventDefault(); event.stopImmediatePropagation(); this.setTool(null); this.callbacks.onExit();
  };
  dispose(): void {
    this.disposed = true; this.clear(false); this.canvas.off('mouse:down', this.down); this.canvas.off('mouse:move', this.move); this.canvas.off('mouse:up', this.up); window.removeEventListener('keydown', this.escape, true);
  }
}
