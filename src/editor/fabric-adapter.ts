import { Canvas, FabricText, IText, Rect, type FabricObject } from 'fabric';
import type { GraphicDocument, Measure, SceneObject } from './model';

export const PX_PER_MM = 8; // Solo zoom di visualizzazione, indipendente da DPI fisici.
export const PT_TO_MM = 25.4 / 72;
function renderObject(o: SceneObject, editable = false): FabricObject {
  const common = { left: o.xMm * PX_PER_MM, top: o.yMm * PX_PER_MM, originX: 'left' as const, originY: 'top' as const, lockScalingX: true, lockScalingY: true, lockRotation: true, hasControls: false, objectCaching: false };
  if (o.type === 'text') {
    const options = { ...common, fontSize: o.fontSizePt * PT_TO_MM * PX_PER_MM, fontFamily: o.fontFamily, fill: o.fill, strokeWidth: 0 };
    return editable ? new IText(o.text, options) : new FabricText(o.text, options);
  }
  return new Rect({ ...common, width: o.widthMm * PX_PER_MM, height: o.heightMm * PX_PER_MM, fill: 'transparent', stroke: o.stroke, strokeWidth: o.strokeMm * PX_PER_MM });
}
export const measureFabric: Measure = object => {
  const f = renderObject(object);
  return { widthMm: f.getScaledWidth() / PX_PER_MM, heightMm: f.getScaledHeight() / PX_PER_MM };
};
export class FabricAdapter {
  readonly canvas: Canvas;
  private idByObject = new WeakMap<FabricObject, string>();
  private disposed = false;
  private editingRevision = 0;
  private editingText = '';
  constructor(element: HTMLCanvasElement, revision: () => number, onMove: (id: string, xMm: number, yMm: number, expectedRevision: number) => void, onText?: (id: string, text: string, expectedRevision: number) => void, onEditing?: (editing: boolean) => void) {
    this.canvas = new Canvas(element, { selection: false, backgroundColor: '#ffffff', enableRetinaScaling: true });
    let gestureRevision = revision();
    this.canvas.on('before:transform', () => { gestureRevision = revision(); });
    this.canvas.on('object:modified', event => {
      const object = event.target;
      const id = this.idByObject.get(object);
      const xMm = object.left / PX_PER_MM;
      const yMm = object.top / PX_PER_MM;
      const expectedRevision = gestureRevision;
      // Fabric deve terminare il gesto prima del render canonico: clear() durante
      // object:modified rientra nel completamento della trasformazione attiva.
      if (id && !(object instanceof IText)) queueMicrotask(() => { if (!this.disposed) onMove(id, xMm, yMm, expectedRevision); });
      // IText emette object:modified anche all'uscita dalla scrittura: distinguere il trascinamento.
      if (id && object instanceof IText && event.action) queueMicrotask(() => { if (!this.disposed) onMove(id, xMm, yMm, expectedRevision); });
    });
    this.canvas.on('text:editing:entered', ({ target }) => {
      this.editingRevision = revision(); this.editingText = target.text; onEditing?.(true);
      target.hiddenTextarea?.setAttribute('aria-label', 'Testo nel canvas');
    });
    this.canvas.on('text:editing:exited', ({ target }) => {
      const id = this.idByObject.get(target), text = target.text, expectedRevision = this.editingRevision;
      const changed = text !== this.editingText;
      queueMicrotask(() => {
        if (this.disposed) return;
        if (id && changed) onText?.(id, text, expectedRevision);
        onEditing?.(false);
      });
    });
  }
  render(document: GraphicDocument): void {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.setDimensions({ width: document.areaMm.width * PX_PER_MM, height: document.areaMm.height * PX_PER_MM });
    for (const object of document.objects) {
      const f = renderObject(object, true); this.idByObject.set(f, object.id); this.canvas.add(f);
    }
    this.canvas.requestRenderAll();
  }
  exportSvg(document: GraphicDocument): string {
    this.render(document);
    return this.canvas.toSVG({ width: `${document.areaMm.width}mm`, height: `${document.areaMm.height}mm`, viewBox: { x: 0, y: 0, width: document.areaMm.width * PX_PER_MM, height: document.areaMm.height * PX_PER_MM } });
  }
  finishEditing(): void {
    const active = this.canvas.getActiveObject();
    if (active instanceof IText && active.isEditing) active.exitEditing();
  }
  dispose(): void { this.disposed = true; void this.canvas.dispose(); }
}
