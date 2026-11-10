import { Circle, type Canvas, type CanvasEvents, type FabricObject, type TPointerEvent } from 'fabric';
import { constrainedLineEnd, type PointMm } from './line-geometry';
export interface PolylineCallbacks { onPath: (points: PointMm[], closed: boolean, revision: number) => void; onActive: (active: boolean) => void; onExit: () => void; onCount: (count: number) => void; }
export class PolylineDrawingController {
  private enabled = false;
  private disposed = false;
  private points: PointMm[] = [];
  private revision = 0;
  private preview: FabricObject | null = null;
  private marker: Circle | null = null;
  private previous: { selection: boolean; skipTargetFind: boolean; defaultCursor: string; hoverCursor: string } | null = null;
  constructor(private canvas: Canvas, private pxPerMm: number, private getRevision: () => number, private resolve: (point: PointMm, event: TPointerEvent) => PointMm, private render: (points: PointMm[], closed: boolean) => FabricObject, public callbacks: PolylineCallbacks) {
    canvas.on('mouse:down', this.down); canvas.on('mouse:move', this.move); canvas.on('mouse:dblclick', this.doubleClick); window.addEventListener('keydown', this.key, true);
  }
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.previous = { selection: this.canvas.selection, skipTargetFind: this.canvas.skipTargetFind, defaultCursor: this.canvas.defaultCursor, hoverCursor: this.canvas.hoverCursor };
      this.canvas.discardActiveObject(); this.canvas.selection = false; this.canvas.skipTargetFind = true; this.canvas.defaultCursor = 'crosshair'; this.canvas.hoverCursor = 'crosshair'; this.canvas.setCursor('crosshair');
    } else { this.clear(); if (this.previous) Object.assign(this.canvas, this.previous); this.previous = null; this.canvas.setCursor(this.canvas.defaultCursor); }
    this.canvas.requestRenderAll();
  }
  private point(event: TPointerEvent): PointMm {
    const p = this.canvas.getScenePoint(event), point = this.resolve({ xMm: p.x / this.pxPerMm, yMm: p.y / this.pxPerMm }, event), last = this.points.at(-1);
    return last && event.shiftKey ? constrainedLineEnd(last, point) : point;
  }
  private distance(a: PointMm, b: PointMm): number { return Math.hypot(a.xMm - b.xMm, a.yMm - b.yMm) * this.pxPerMm * this.canvas.getZoom(); }
  private down = ({ e }: CanvasEvents['mouse:down']) => {
    if (!this.enabled || 'button' in e && e.button !== 0 || 'detail' in e && e.detail > 1) return;
    const point = this.point(e), first = this.points[0], last = this.points.at(-1);
    if (first && this.points.length >= 3 && this.distance(first, point) <= 8) { this.finish(true); return; }
    if (last && this.distance(last, point) < 2 || first && this.points.length === 2 && this.distance(first, point) < 2 || this.points.length >= 512) return;
    if (!first) { this.revision = this.getRevision(); this.callbacks.onActive(true); }
    this.points.push(point); this.callbacks.onCount(this.points.length); this.updatePreview();
  };
  private move = ({ e }: CanvasEvents['mouse:move']) => { if (this.enabled && this.points.length) this.updatePreview(this.point(e)); };
  private doubleClick = () => { if (this.enabled) this.finish(false); };
  private updatePreview(cursor?: PointMm): void {
    if (this.preview) { this.canvas.remove(this.preview); this.preview = null; }
    if (this.marker) { this.canvas.remove(this.marker); this.marker = null; }
    const first = this.points[0]; if (!first) { this.canvas.requestRenderAll(); return; }
    const close = !!cursor && this.points.length >= 3 && this.distance(first, cursor) <= 8;
    const points = [...this.points]; if (cursor && points.length < 512 && this.distance(points.at(-1)!, cursor) > 0) points.push(close ? first : cursor);
    if (points.length > 1 && points.some(p => this.distance(p, first) > 0)) {
      this.preview = this.render(points, false); this.preview.set({ selectable: false, evented: false, hasControls: false, excludeFromExport: true, objectCaching: false }); this.canvas.add(this.preview);
    }
    this.marker = new Circle({ left: first.xMm * this.pxPerMm, top: first.yMm * this.pxPerMm, originX: 'center', originY: 'center', radius: 4 / this.canvas.getZoom(), strokeWidth: 1.5 / this.canvas.getZoom(), stroke: '#0088cc', fill: close ? '#0088cc' : '#ffffff', selectable: false, evented: false, excludeFromExport: true, objectCaching: false }); this.canvas.add(this.marker); this.canvas.requestRenderAll();
  }
  finish(closed: boolean): boolean {
    if (!this.enabled || this.points.length < (closed ? 3 : 2)) return false;
    const points = this.points.map(p => ({ ...p })), revision = this.revision, callbacks = this.callbacks;
    this.setEnabled(false); callbacks.onExit(); queueMicrotask(() => { if (!this.disposed) callbacks.onPath(points, closed, revision); }); return true;
  }
  cancel(): void { if (!this.enabled) return; this.setEnabled(false); this.callbacks.onExit(); }
  private clear(): void {
    const active = this.points.length > 0; this.points = [];
    if (this.preview) { this.canvas.remove(this.preview); this.preview = null; } if (this.marker) { this.canvas.remove(this.marker); this.marker = null; }
    this.callbacks.onCount(0); if (active) this.callbacks.onActive(false);
  }
  private key = (event: KeyboardEvent) => {
    if (!this.enabled || event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.cancel(); return; }
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable=true]')) return;
    if (event.key === 'Enter' && !(event.target instanceof Element && event.target.closest('button'))) { event.preventDefault(); event.stopImmediatePropagation(); this.finish(event.shiftKey); }
    if (event.key === 'Backspace' && this.points.length) {
      event.preventDefault(); event.stopImmediatePropagation(); this.points.pop(); this.callbacks.onCount(this.points.length); if (!this.points.length) this.callbacks.onActive(false); this.updatePreview();
    }
  };
  dispose(): void { this.disposed = true; if (this.preview) this.canvas.remove(this.preview); if (this.marker) this.canvas.remove(this.marker); this.points = []; this.canvas.off('mouse:down', this.down); this.canvas.off('mouse:move', this.move); this.canvas.off('mouse:dblclick', this.doubleClick); window.removeEventListener('keydown', this.key, true); }
}
