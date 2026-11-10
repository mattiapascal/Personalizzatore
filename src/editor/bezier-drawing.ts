import { Circle, Line, type Canvas, type CanvasEvents, type FabricObject, type TPointerEvent } from 'fabric';
import { cloneBezierNodes, MAX_BEZIER_NODES, type BezierNode, type CurvePoint } from './bezier-geometry';
import { constrainedLineEnd, type PointMm } from './line-geometry';
export interface BezierDrawingCallbacks { onCurve: (nodes: BezierNode[], closed: boolean, revision: number) => void; onActive: (active: boolean) => void; onExit: () => void; onCount: (count: number) => void; }
/** Construction is transient: only finish() publishes a canonical command. */
export class BezierDrawingController {
  private enabled = false;
  private disposed = false;
  private nodes: BezierNode[] = [];
  private pressed = false;
  private revision = 0;
  private previews: FabricObject[] = [];
  private previous: { selection: boolean; skipTargetFind: boolean; defaultCursor: string; hoverCursor: string } | null = null;
  constructor(private canvas: Canvas, private pxPerMm: number, private getRevision: () => number, private resolve: (point: PointMm, event: TPointerEvent) => PointMm, private render: (nodes: BezierNode[], closed: boolean) => FabricObject, public callbacks: BezierDrawingCallbacks) {
    canvas.on('mouse:down', this.down); canvas.on('mouse:move', this.move); canvas.on('mouse:up', this.up); canvas.on('mouse:dblclick', this.doubleClick); window.addEventListener('keydown', this.key, true);
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
  private point(event: TPointerEvent, anchor?: CurvePoint): CurvePoint {
    const p = this.canvas.getScenePoint(event), resolved = this.resolve({ xMm: p.x / this.pxPerMm, yMm: p.y / this.pxPerMm }, event);
    const end = anchor && event.shiftKey ? constrainedLineEnd({ xMm: anchor.x, yMm: anchor.y }, resolved) : resolved;
    return { x: end.xMm, y: end.yMm };
  }
  private distance(a: CurvePoint, b: CurvePoint): number { return Math.hypot(a.x - b.x, a.y - b.y) * this.pxPerMm * this.canvas.getZoom(); }
  private down = ({ e }: CanvasEvents['mouse:down']) => {
    if (!this.enabled || 'button' in e && e.button !== 0 || 'detail' in e && e.detail > 1) return;
    const first = this.nodes[0], last = this.nodes.at(-1), point = this.point(e, last);
    if (first && this.nodes.length >= 3 && this.distance(first, point) <= 8) { this.finish(true); return; }
    if (this.nodes.length >= MAX_BEZIER_NODES || last && this.distance(last, point) < 2 || first && this.nodes.length === 2 && this.distance(first, point) < 2) return;
    if (!first) { this.revision = this.getRevision(); this.callbacks.onActive(true); }
    this.nodes.push(point); this.pressed = true; this.callbacks.onCount(this.nodes.length); this.updatePreview();
  };
  private move = ({ e }: CanvasEvents['mouse:move']) => {
    if (!this.enabled || !this.nodes.length) return;
    const node = this.nodes.at(-1)!, point = this.point(e, node);
    if (this.pressed) {
      if (this.distance(node, point) >= 2) { node.out = point; node.in = { x: node.x * 2 - point.x, y: node.y * 2 - point.y }; }
      else { delete node.out; delete node.in; }
      this.updatePreview();
    } else this.updatePreview(point);
  };
  private up = () => { if (this.enabled && this.pressed) { this.pressed = false; this.updatePreview(); } };
  private doubleClick = () => { if (this.enabled) this.finish(false); };
  private removePreview(): void { for (const object of this.previews) this.canvas.remove(object); this.previews = []; }
  private addPreview(object: FabricObject): void {
    object.set({ selectable: false, evented: false, hasControls: false, excludeFromExport: true, objectCaching: false }); this.previews.push(object); this.canvas.add(object);
  }
  private updatePreview(cursor?: CurvePoint): void {
    this.removePreview(); const first = this.nodes[0]; if (!first) { this.canvas.requestRenderAll(); return; }
    const close = !!cursor && this.nodes.length >= 3 && this.distance(first, cursor) <= 8, nodes = cloneBezierNodes(this.nodes);
    if (cursor && nodes.length < MAX_BEZIER_NODES && this.distance(nodes.at(-1)!, cursor) >= 2 && !close) nodes.push(cursor);
    if (nodes.length > 1) {
      try { this.addPreview(this.render(nodes, close)); } catch { /* A single/flat closed point has no drawable curve yet. */ }
    }
    const zoom = this.canvas.getZoom(), px = this.pxPerMm;
    for (const [index, node] of this.nodes.entries()) {
      if (index === this.nodes.length - 1) for (const side of ['in', 'out'] as const) {
        const handle = node[side]; if (!handle) continue;
        this.addPreview(new Line([node.x * px, node.y * px, handle.x * px, handle.y * px], { stroke: '#0088cc', strokeWidth: 1 / zoom }));
        this.addPreview(new Circle({ left: handle.x * px, top: handle.y * px, originX: 'center', originY: 'center', radius: 3 / zoom, strokeWidth: 1 / zoom, stroke: '#0088cc', fill: '#ffffff' }));
      }
      this.addPreview(new Circle({ left: node.x * px, top: node.y * px, originX: 'center', originY: 'center', radius: 4 / zoom, strokeWidth: 1.5 / zoom, stroke: '#0088cc', fill: index === 0 && close ? '#0088cc' : '#ffffff' }));
    }
    this.canvas.requestRenderAll();
  }
  finish(closed: boolean): boolean {
    if (!this.enabled || this.pressed || this.nodes.length < (closed ? 3 : 2)) return false;
    const nodes = cloneBezierNodes(this.nodes), revision = this.revision, callbacks = this.callbacks;
    this.setEnabled(false); callbacks.onExit(); queueMicrotask(() => { if (!this.disposed) callbacks.onCurve(nodes, closed, revision); }); return true;
  }
  cancel(): void { if (!this.enabled) return; this.setEnabled(false); this.callbacks.onExit(); }
  private clear(): void { const active = this.nodes.length > 0; this.nodes = []; this.pressed = false; this.removePreview(); this.callbacks.onCount(0); if (active) this.callbacks.onActive(false); }
  private key = (event: KeyboardEvent) => {
    if (!this.enabled || event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.cancel(); return; }
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable=true]')) return;
    if (event.key === 'Enter' && !(event.target instanceof Element && event.target.closest('button'))) { event.preventDefault(); event.stopImmediatePropagation(); this.finish(event.shiftKey); }
    if (event.key === 'Backspace' && this.nodes.length) { event.preventDefault(); event.stopImmediatePropagation(); this.nodes.pop(); this.pressed = false; this.callbacks.onCount(this.nodes.length); if (!this.nodes.length) this.callbacks.onActive(false); this.updatePreview(); }
  };
  dispose(): void { this.disposed = true; this.removePreview(); this.nodes = []; this.canvas.off('mouse:down', this.down); this.canvas.off('mouse:move', this.move); this.canvas.off('mouse:up', this.up); this.canvas.off('mouse:dblclick', this.doubleClick); window.removeEventListener('keydown', this.key, true); }
}
