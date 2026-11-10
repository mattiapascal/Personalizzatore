import { VectorCommandsSchema, vectorBounds } from './vector-geometry';
import { z } from 'zod';
import { BezierNodeSchema, bezierBounds, MAX_BEZIER_NODES } from './bezier-geometry';
const size = z.number().finite().positive().max(1000), dimension = z.number().finite().nonnegative().max(1000), paint = z.enum(['#000000', '#ffffff', 'none']);
const appearance = { stroke: paint, strokeMm: z.number().finite().positive().max(2), fill: paint.optional(), strokeDash: z.enum(['solid', 'dashed', 'dotted']).optional() };
const point = z.strictObject({ x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1) });
export const TextPathGuideSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('vector'), widthMm: dimension, heightMm: dimension, commands: VectorCommandsSchema, ...appearance, fill: paint, fillRule: z.enum(['evenodd','nonzero']), strokeLineCap: z.enum(['butt','round','square']), strokeLineJoin: z.enum(['miter','round','bevel']), strokeMiterLimit: z.number().finite().min(1).max(100) }),
  z.strictObject({ type: z.literal('line'), lengthMm: size, ...appearance, stroke: z.enum(['#000000', '#ffffff']), fill: z.literal('none').optional() }),
  z.strictObject({ type: z.literal('circle'), radiusMm: z.number().finite().positive().max(500), ...appearance }),
  z.strictObject({ type: z.literal('ellipse'), rxMm: z.number().finite().positive().max(500), ryMm: z.number().finite().positive().max(500), ...appearance }),
  z.strictObject({ type: z.literal('path'), widthMm: dimension, heightMm: dimension, points: z.array(point).min(2).max(512), closed: z.boolean(), ...appearance, stroke: z.enum(['#000000', '#ffffff']) }),
  z.strictObject({ type: z.literal('bezier'), widthMm: dimension, heightMm: dimension, nodes: z.array(BezierNodeSchema).min(2).max(MAX_BEZIER_NODES), closed: z.boolean(), ...appearance, stroke: z.enum(['#000000', '#ffffff']) }),
]).superRefine((guide, ctx) => {
  if (guide.type === 'vector') { const b = vectorBounds(guide.commands), near = (a:number,b:number) => Math.abs(a-b)<1e-7; if (guide.commands.filter(c=>c[0]==='M').length!==1 || !guide.widthMm && !guide.heightMm || !near(b.x,0) || !near(b.y,0) || !near(b.width,guide.widthMm?1:0) || !near(b.height,guide.heightMm?1:0)) ctx.addIssue({code:'custom',message:'La guida SVG richiede un solo contorno normalizzato'}); return; }
  if (guide.type !== 'path' && guide.type !== 'bezier') return;
  if (!guide.closed && guide.fill && guide.fill !== 'none') ctx.addIssue({ code: 'custom', message: 'Guida aperta senza riempimento' });
  if (!guide.widthMm && !guide.heightMm || guide.closed && (!guide.widthMm || !guide.heightMm)) { ctx.addIssue({ code: 'custom', message: 'Guida degenere' }); return; }
  if (guide.type === 'path') {
    const xs = guide.points.map(p => p.x), ys = guide.points.map(p => p.y);
    if (guide.closed && guide.points.length < 3 || Math.min(...xs) !== 0 || Math.min(...ys) !== 0 || Math.max(...xs) !== (guide.widthMm ? 1 : 0) || Math.max(...ys) !== (guide.heightMm ? 1 : 0)) ctx.addIssue({ code: 'custom', message: 'Guida poligonale non normalizzata' });
  } else {
    const box = bezierBounds(guide.nodes, guide.closed), near = (a: number, b: number) => Math.abs(a - b) < 1e-8;
    if (!near(box.x, 0) || !near(box.y, 0) || !near(box.width, guide.widthMm ? 1 : 0) || !near(box.height, guide.heightMm ? 1 : 0)) ctx.addIssue({ code: 'custom', message: 'Guida Bézier non normalizzata' });
  }
});
export type TextPathGuide = z.infer<typeof TextPathGuideSchema>;
export const TextPathSchema = z.strictObject({ guide: TextPathGuideSchema, originalPathId: z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/), offsetMm: z.number().finite().min(-10000).max(10000), normalOffsetMm: z.number().finite().min(-1000).max(1000).optional(), baseline: z.enum(['baseline', 'ascender', 'descender']), reversed: z.boolean(), showGuide: z.boolean() });
export type TextPathBinding = z.infer<typeof TextPathSchema>;
export const TextPathOptionsSchema = TextPathSchema.pick({ offsetMm: true, normalOffsetMm: true, baseline: true, reversed: true, showGuide: true }).partial().refine(value => Object.keys(value).length > 0, 'Specifica almeno un’opzione del testo su tracciato');
export function scaledTextPath(binding: TextPathBinding, scale: number): TextPathBinding {
  const guide = structuredClone(binding.guide); guide.strokeMm *= scale;
  if (guide.type === 'circle') guide.radiusMm *= scale;
  else if (guide.type === 'ellipse') { guide.rxMm *= scale; guide.ryMm *= scale; }
  else if (guide.type === 'line') guide.lengthMm *= scale;
  else { guide.widthMm *= scale; guide.heightMm *= scale; }
  return { ...binding, guide, offsetMm: binding.offsetMm * scale, ...(binding.normalOffsetMm === undefined ? {} : { normalOffsetMm: binding.normalOffsetMm * scale }) };
}
