export type AreaAlignment = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';
/** Traslazione dell'ingombro, mai scala: uguale per un oggetto o l'intero insieme. */
export function areaAlignmentDelta(bounds: { xMm: number; yMm: number; widthMm: number; heightMm: number }, area: { width: number; height: number }, alignment: AreaAlignment, marginMm: number) {
  const x = alignment === 'left' ? marginMm : alignment === 'centerX' ? (area.width - bounds.widthMm) / 2 : alignment === 'right' ? area.width - marginMm - bounds.widthMm : bounds.xMm;
  const y = alignment === 'top' ? marginMm : alignment === 'centerY' ? (area.height - bounds.heightMm) / 2 : alignment === 'bottom' ? area.height - marginMm - bounds.heightMm : bounds.yMm;
  return { xMm: x - bounds.xMm, yMm: y - bounds.yMm };
}
