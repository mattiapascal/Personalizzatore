/** Conservative glyph-stroke envelope. Layout advances remain independent of
 * outline width; miter tips are bounded by the configured miter limit. */
export function textStrokeEnvelope(stroke: unknown, width: number, join: string, miterLimit: number): number {
 if(typeof stroke!=='string'||!stroke||stroke==='none'||stroke==='transparent'||/^rgba\([^)]*,\s*0\s*\)$/.test(stroke)||!Number.isFinite(width)||width<=0)return 0;
 return width*(join==='miter'?Math.max(1,miterLimit):1);
}
