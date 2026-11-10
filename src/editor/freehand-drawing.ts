import type { Canvas, CanvasEvents, FabricObject, TPointerEvent } from 'fabric';
import type { PointMm } from './line-geometry';
import { simplifyStroke } from './path-geometry';
export interface FreehandCallbacks { onStroke: (points: PointMm[], revision: number) => void; onActive: (active: boolean) => void; onExit: () => void; }
export class FreehandDrawingController {
  private enabled = false;
  private disposed = false;
  private points: PointMm[] = [];
  private revision = 0;
  private preview: FabricObject | null = null;
  private previous: { selection: boolean; skipTargetFind: boolean; defaultCursor: string; hoverCursor: string } | null = null;
  constructor(private canvas: Canvas, private pxPerMm: number, private getRevision: () => number, private render: (points: PointMm[]) => FabricObject, public callbacks: FreehandCallbacks) {
    canvas.on('mouse:down', this.down); canvas.on('mouse:move', this.move); canvas.on('mouse:up', this.up); window.addEventListener('keydown', this.escape, true);
  }
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.previous = { selection: this.canvas.selection, skipTargetFind: this.canvas.skipTargetFind, defaultCursor: this.canvas.defaultCursor, hoverCursor: this.canvas.hoverCursor };
      this.canvas.discardActiveObject(); this.canvas.selection = false; this.canvas.skipTargetFind = true; this.canvas.defaultCursor = 'crosshair'; this.canvas.hoverCursor = 'crosshair'; this.canvas.setCursor('crosshair');
    } else { this.clear(true); if (this.previous) Object.assign(this.canvas, this.previous); this.previous = null; this.canvas.setCursor(this.canvas.defaultCursor); }
    this.canvas.requestRenderAll();
  }
  private point(event: TPointerEvent): PointMm { const point = this.canvas.getScenePoint(event); return { xMm: point.x / this.pxPerMm, yMm: point.y / this.pxPerMm }; }
  private append(point: PointMm, force = false): void {
    const previous = this.points.at(-1); if (!previous) return;
    const distance = Math.hypot(point.xMm - previous.xMm, point.yMm - previous.yMm) * this.pxPerMm * this.canvas.getZoom();
    if (distance === 0 || !force && distance < 0.75) return;
    if (this.points.length >= 512) this.points = this.points.filter((_, index) => index % 2 === 0 || index === 511);
    this.points.push(point);
  }
  private down = ({ e }: CanvasEvents['mouse:down']) => {
    if (!this.enabled || 'button' in e && e.button !== 0) return;
    this.clear(false); this.points = [this.point(e)]; this.revision = this.getRevision(); this.callbacks.onActive(true);
  };
  private move = ({ e }: CanvasEvents['mouse:move']) => {
    if (!this.enabled || !this.points.length) return;
    const count = this.points.length; this.append(this.point(e)); if (this.points.length === count) return;
    if (this.preview) this.canvas.remove(this.preview);
    this.preview = this.render(this.points); this.preview.set({ selectable: false, evented: false, hasControls: false, excludeFromExport: true, objectCaching: false }); this.canvas.add(this.preview); this.canvas.requestRenderAll();
  };
  private up = ({ e }: CanvasEvents['mouse:up']) => {
    if (!this.enabled || !this.points.length) return;
    this.append(this.point(e), true);
    const xs = this.points.map(p => p.xMm), ys = this.points.map(p => p.yMm), size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * this.pxPerMm * this.canvas.getZoom();
    const points = simplifyStroke(this.points, 0.5 / (this.pxPerMm * this.canvas.getZoom())), revision = this.revision, callbacks = this.callbacks;
    this.setEnabled(false); callbacks.onExit();
    if (size >= 2 && points.length > 1 && points.some(p => p.xMm !== points[0]!.xMm || p.yMm !== points[0]!.yMm)) queueMicrotask(() => { if (!this.disposed) callbacks.onStroke(points, revision); });
  };
  private clear(notify: boolean): void { const active = this.points.length > 0; this.points = []; if (this.preview) { this.canvas.remove(this.preview); this.preview = null; } if (active && notify) this.callbacks.onActive(false); }
  private escape = (event: KeyboardEvent) => { if (event.key !== 'Escape' || !this.enabled) return; event.preventDefault(); event.stopImmediatePropagation(); this.setEnabled(false); this.callbacks.onExit(); };
  dispose(): void { this.disposed = true; this.clear(false); this.canvas.off('mouse:down', this.down); this.canvas.off('mouse:move', this.move); this.canvas.off('mouse:up', this.up); window.removeEventListener('keydown', this.escape, true); }
}
