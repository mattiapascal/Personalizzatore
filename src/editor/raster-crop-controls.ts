import { FabricImage, Control } from 'fabric';
import type { ImageObject } from './raster-geometry';
import { dragRasterCrop } from './raster-crop-edit';
import type { Measure, SceneObject } from './model';
export class RasterCropControls {
  private saved: { object: FabricImage; controls: Record<string, Control>; visibility: Record<string, boolean> } | null = null;
  preview: ImageObject | null = null;
  configure(object: FabricImage | null, source: ImageObject | null, measure: Measure, render: (source: SceneObject) => unknown, active: () => void): void {
    this.restore(); if (!object || !source) return; this.saved = { object, controls: object.controls, visibility: Object.fromEntries(Object.keys(object.controls).map(key => [key, object.isControlVisible(key)])) };
    const controls: Record<string, Control> = {}, points = { tl: [-.5, -.5], tr: [.5, -.5], br: [.5, .5], bl: [-.5, .5], ml: [-.5, 0], mr: [.5, 0], mt: [0, -.5], mb: [0, .5] };
    for (const [key, [x = 0, y = 0]] of Object.entries(points)) controls[key] = new Control({ x, y, actionName: 'cropRaster', cursorStyle: 'crosshair', touchSizeX: 26, touchSizeY: 26,
      actionHandler: (_event, transform, px, py) => {
        try { const next = dragRasterCrop(source, x, y, (px - transform.ex) / 8, (py - transform.ey) / 8, measure), fresh = render(next) as FabricImage, target = transform.target as FabricImage;
          target.setElement(fresh.getElement()); target.set({ left: fresh.left, top: fresh.top, width: fresh.width, height: fresh.height, cropX:fresh.cropX,cropY:fresh.cropY, scaleX: fresh.scaleX, scaleY: fresh.scaleY, angle: fresh.angle, flipX: fresh.flipX, flipY: fresh.flipY }); target.setCoords(); target.set('dirty', true); this.preview = next; active(); return true;
        } catch { return false; }
      },
      render: (context, left, top) => { context.save(); context.translate(left, top); context.rotate(object.angle * Math.PI / 180); context.strokeStyle = '#fff'; context.lineWidth = 5; context.beginPath(); if (x && y) { context.moveTo(-Math.sign(x) * 9, 0); context.lineTo(0, 0); context.lineTo(0, -Math.sign(y) * 9); } else { context.moveTo(x ? 0 : -6, y ? 0 : -6); context.lineTo(x ? 0 : 6, y ? 0 : 6); } context.stroke(); context.strokeStyle = '#0088cc'; context.lineWidth = 2; context.stroke(); context.restore(); },
    });
    object.controls = controls; object.setControlsVisibility(Object.fromEntries(Object.keys(controls).map(key => [key, true]))); object.setCoords();
  }
  restore(): void { if (this.saved) { this.saved.object.controls = this.saved.controls; this.saved.object.setControlsVisibility(this.saved.visibility); } this.saved = null; this.preview = null; }
}
