import { Control, Point, util } from 'fabric';
import { EditorPathText } from './text-path-view';
import { guideClosed, updateTextPath } from './text-path-model';
import type { TextObject } from './text-style';
import type { Measure, SceneObject } from './model';
/** A view-only handle. The document changes once, on pointer release. */
export class TextPathControls {
  private saved: { object: EditorPathText; controls: Record<string, Control> } | null = null;
  preview: TextObject | null = null;
  configure(object: EditorPathText | null, source: TextObject | null, measure: Measure, render: (object: SceneObject) => unknown, active: () => void) {
    this.restore(); if (!object || !source?.textPath || object.isEditing) return;
    this.saved = { object, controls: object.controls }; const matrix = util.invertTransform(object.calcTransformMatrix()), originalOffset = { ...object.pathCenterOffset }, length = object.pathLength, start = object.anchorDistance(), closed = guideClosed(source.textPath.guide);
    let previousDistance = start;
    const distanceTo = (distance: number, point: Point) => { const p = object.pointAt(distance); return Math.hypot(p.x + object.pathCenterOffset.x - point.x - originalOffset.x, p.y + object.pathCenterOffset.y - point.y - originalOffset.y); };
    const handle = new Control({ actionName: 'slideTextPath', cursorStyle: 'move', touchSizeX: 28, touchSizeY: 28,
      positionHandler: (_dimensions, finalMatrix, target) => { const text = target as EditorPathText, p = text.pointAt(text.anchorDistance()); return new Point(p.x, p.y).transform(finalMatrix); },
      actionHandler: (_event, transform, x, y) => {
        const point = new Point(x, y).transform(matrix); let best = 0, error = Infinity; const step = length / 512;
        for (let i = 0; i <= 512; i++) { const d = i * step, e = distanceTo(d, point); if (e < error) { error = e; best = d; } }
        let lo = Math.max(0, best - step), hi = Math.min(length, best + step);
        for (let i = 0; i < 24; i++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (distanceTo(a, point) < distanceTo(b, point)) hi = b; else lo = a; }
        let distance = (lo + hi) / 2; if (closed) distance += Math.round((previousDistance - distance) / length) * length;
        previousDistance = distance;
        const offsetMm = source.textPath!.offsetMm + (distance - start) / 8;
        try { const next = updateTextPath(source, { offsetMm }, measure), fresh = render(next) as EditorPathText, target = transform.target as EditorPathText;
          target.binding = fresh.binding; target.path = fresh.path; target.initDimensions(); target.set({ left: fresh.left, top: fresh.top, width: fresh.width, height: fresh.height }); target.setCoords(); target.dirty = true; this.preview = next; active(); return true;
        } catch { return false; }
      },
      render: (context, x, y) => { context.save(); context.translate(x, y); context.fillStyle = '#fff'; context.strokeStyle = '#0088cc'; context.lineWidth = 2; context.beginPath(); context.moveTo(0, -7); context.lineTo(7, 0); context.lineTo(0, 7); context.lineTo(-7, 0); context.closePath(); context.fill(); context.stroke(); context.restore(); },
    }); object.controls = { ...object.controls, textPathOffset: handle }; object.setControlVisible('textPathOffset', true); object.setCoords();
  }
  restore() { if (this.saved) this.saved.object.controls = this.saved.controls; this.saved = null; this.preview = null; }
}
