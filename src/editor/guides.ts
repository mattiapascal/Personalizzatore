import type { GraphicDocument, Measure } from './model';
import { selectionBounds, selectionUnits } from './selection';
import type { PointMm } from './line-geometry';

export interface GuideSettings { gridVisible: boolean; snapEnabled: boolean; gridMm: number; }
export interface SnapResult { deltaXmm: number; deltaYmm: number; guideXmm?: number; guideYmm?: number; }
export const DEFAULT_GUIDES: GuideSettings = { gridVisible: false, snapEnabled: false, gridMm: 1 };
const anchors = (start: number, size: number) => [start, start + size / 2, start + size];
function references(doc: GraphicDocument, ignored: readonly string[], measure: Measure) {
  const others = selectionUnits(doc, doc.objects.filter(object => !ignored.includes(object.id)).map(object => object.id));
  const targets = others.map(unit => selectionBounds(unit, measure));
  return { xs: [...targets.flatMap(box => anchors(box.xMm, box.widthMm)), 0, doc.areaMm.width / 2, doc.areaMm.width], ys: [...targets.flatMap(box => anchors(box.yMm, box.heightMm)), 0, doc.areaMm.height / 2, doc.areaMm.height] };
}
function nearest(positions: number[], targets: number[], gridMm: number, toleranceMm: number) {
  let best: { delta: number; guide: number } | null = null;
  const consider = (delta: number, guide: number) => {
    if (Math.abs(delta) <= toleranceMm + 1e-9 && (!best || Math.abs(delta) < Math.abs(best.delta) - 1e-9)) best = { delta, guide };
  };
  for (const target of targets) for (const position of positions) consider(target - position, target);
  const center = positions[1]!, grid = Math.round(center / gridMm) * gridMm;
  consider(grid - center, grid);
  return best as { delta: number; guide: number } | null;
}
/** Solo calcolo della preview: il comando di spostamento finale resta validato dal motore. */
export function snapTranslation(doc: GraphicDocument, objectIds: readonly string[], deltaXmm: number, deltaYmm: number, gridMm: number, toleranceMm: number, measure: Measure): SnapResult {
  if (![deltaXmm, deltaYmm, gridMm, toleranceMm].every(Number.isFinite) || gridMm <= 0 || toleranceMm < 0) throw new Error('Parametri di aggancio non validi');
  const objects = doc.objects.filter(object => objectIds.includes(object.id)), bounds = selectionBounds(objects, measure);
  const { xs, ys } = references(doc, objectIds, measure);
  const x = nearest(anchors(bounds.xMm + deltaXmm, bounds.widthMm), xs, gridMm, toleranceMm);
  const y = nearest(anchors(bounds.yMm + deltaYmm, bounds.heightMm), ys, gridMm, toleranceMm);
  return { deltaXmm: deltaXmm + (x?.delta ?? 0), deltaYmm: deltaYmm + (y?.delta ?? 0), ...(x ? { guideXmm: x.guide } : {}), ...(y ? { guideYmm: y.guide } : {}) };
}
export function snapPoint(doc: GraphicDocument, point: PointMm, gridMm: number, toleranceMm: number, measure: Measure): PointMm & Pick<SnapResult, 'guideXmm' | 'guideYmm'> {
  if (![point.xMm, point.yMm, gridMm, toleranceMm].every(Number.isFinite) || gridMm <= 0 || toleranceMm < 0) throw new Error('Parametri di aggancio non validi');
  const { xs, ys } = references(doc, [], measure), x = nearest([point.xMm, point.xMm, point.xMm], xs, gridMm, toleranceMm), y = nearest([point.yMm, point.yMm, point.yMm], ys, gridMm, toleranceMm);
  return { xMm: point.xMm + (x?.delta ?? 0), yMm: point.yMm + (y?.delta ?? 0), ...(x ? { guideXmm: x.guide } : {}), ...(y ? { guideYmm: y.guide } : {}) };
}
