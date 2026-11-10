import { Point, Polyline, controlsUtils, type Control } from 'fabric';
/** Solo controlli transitori Fabric: i punti canonici si aggiornano al rilascio. */
export class PathNodeControls {
  private previous: { object: Polyline; controls: Record<string, Control>; hasBorders: boolean; cornerColor: string; cornerStrokeColor: string; transparentCorners: boolean; cornerSize: number; touchCornerSize: number } | null = null;
  configure(object: Polyline | null, index: number): void {
    this.restore(); if (!object || index < 0 || index >= object.points.length) return;
    this.previous = { object, controls: object.controls, hasBorders: object.hasBorders, cornerColor: object.cornerColor, cornerStrokeColor: object.cornerStrokeColor, transparentCorners: object.transparentCorners, cornerSize: object.cornerSize, touchCornerSize: object.touchCornerSize };
    const name = `p${index}`, controls = controlsUtils.createPolyControls(object, { cursorStyle: 'crosshair' });
    object.controls = { [name]: controls[name]! };
    object.set({ hasBorders: false, cornerColor: '#0088cc', cornerStrokeColor: '#ffffff', transparentCorners: false, cornerSize: 10, touchCornerSize: 24 }); object.setCoords();
  }
  restore(): void {
    if (!this.previous) return;
    const { object, ...properties } = this.previous; object.set(properties); object.setCoords(); this.previous = null;
  }
}
export function polyNodeScenePoint(object: Polyline, index: number): { x: number; y: number } {
  const point = object.points[index]; if (!point) throw new Error('Nodo Fabric non presente');
  const world = new Point(point).subtract(object.pathOffset).transform(object.calcTransformMatrix());
  return { x: world.x, y: world.y };
}
