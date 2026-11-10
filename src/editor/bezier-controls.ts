import { Path, Point, Control, type FabricObject } from 'fabric';
import { bezierPartAvailable, bezierWorldNodes, moveBezierPart, type BezierObject, type BezierPart } from './bezier-nodes';
import type { Measure } from './model';
interface Saved { object: Path; controls: Record<string, Control>; hasBorders: boolean; }
function pathLocation(object: BezierObject, index: number, part: BezierPart): [number, number] {
  if (part === 'point') return [index, index === 0 ? 1 : 5];
  return part === 'in' ? [index === 0 ? object.nodes.length : index, 3] : [index === object.nodes.length - 1 ? object.nodes.length : index + 1, 1];
}
export class BezierNodeControls {
  private saved: Saved | null = null;
  preview: BezierObject | null = null;
  configure(object: Path | null, source: BezierObject | null, index: number, measure: Measure, render: (source: BezierObject) => FabricObject, onActive: () => void, pixelsPerMm: number): void {
    this.restore(); if (!object || !source || index < 0 || index >= source.nodes.length) return;
    this.saved = { object, controls: object.controls, hasBorders: object.hasBorders };
    const controls: Record<string, Control> = {};
    for (const part of ['point', 'in', 'out'] as const) {
      if (!bezierPartAvailable(source, index, part) || part !== 'point' && !source.nodes[index]![part]) continue;
      const [commandIndex, pointIndex] = pathLocation(source, index, part);
      const node = bezierWorldNodes(source, measure)[index]!, start = part === 'point' ? node : node[part]!;
      controls[`bezier-${part}`] = new Control({
        actionName: 'modifyBezier', cursorStyle: 'crosshair', sizeX: 12, sizeY: 12, touchSizeX: 24, touchSizeY: 24,
        positionHandler: (_dimensions, _matrix, target) => {
          const path = target as Path, command = path.path[commandIndex]!;
          return new Point(Number(command[pointIndex]), Number(command[pointIndex + 1])).subtract(path.pathOffset).transform(path.calcTransformMatrix()).transform(path.getViewportTransform());
        },
        actionHandler: (_event, transform, x, y) => {
          try {
            // Keep the grab offset, including subpixel coordinates and clicks near a handle's edge.
            const next = moveBezierPart(source, index, part, { x: start.x + (x - transform.ex) / pixelsPerMm, y: start.y + (y - transform.ey) / pixelsPerMm }, measure), fresh = render(next) as Path, target = transform.target as Path;
            target.path = fresh.path; target.setDimensions(); target.set({ left: fresh.left, top: fresh.top, angle: fresh.angle }); target.setCoords(); target.set('dirty', true);
            this.preview = next; onActive(); return true;
          } catch { return false; }
        },
        render: (context, left, top) => {
          context.save(); context.fillStyle = part === 'point' ? '#0088cc' : '#ffffff'; context.strokeStyle = '#0088cc'; context.lineWidth = 1.5;
          if (part === 'point') { context.fillRect(left - 5, top - 5, 10, 10); context.strokeRect(left - 5, top - 5, 10, 10); }
          else { context.beginPath(); context.arc(left, top, 5, 0, Math.PI * 2); context.fill(); context.stroke(); }
          context.restore();
        },
      });
    }
    object.controls = controls; object.hasBorders = false; object.setCoords();
  }
  restore(): void { if (this.saved) { const { object, controls, hasBorders } = this.saved; object.controls = controls; object.hasBorders = hasBorders; object.setCoords(); } this.saved = null; this.preview = null; }
}
