import { z } from 'zod';
import { bezierBounds, cubicPoint } from './bezier-geometry';
const coordinate = z.number().finite().min(-100).max(100);
export const VectorCommandsSchema = z.array(z.union([
  z.tuple([z.literal('M'), coordinate, coordinate]), z.tuple([z.literal('L'), coordinate, coordinate]),
  z.tuple([z.literal('C'), coordinate, coordinate, coordinate, coordinate, coordinate, coordinate]), z.tuple([z.literal('Z')]),
])).min(2).max(4096).superRefine((commands, ctx) => {
  let open = false, segments = 0;
  for (const command of commands) { if (command[0] === 'M') open = true; else if (!open) ctx.addIssue({ code: 'custom', message: 'Ogni contorno deve iniziare con M' }); else if (command[0] === 'Z') { open = false; segments++; } else segments++; }
  if (!segments) ctx.addIssue({ code: 'custom', message: 'Vettore senza segmenti' });
});
export const VectorClipSchema = z.strictObject({ left: coordinate, top: coordinate, right: coordinate, bottom: coordinate }).refine(rect => rect.left < rect.right && rect.top < rect.bottom, 'Ritaglio vettoriale degenere');
export type VectorCommand = z.infer<typeof VectorCommandsSchema>[number];
export function vectorBounds(commands: readonly VectorCommand[]) {
  let current = { x: 0, y: 0 }, start = current, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x: number, y: number) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
  for (const c of commands) {
    if (c[0] === 'Z') { current = start; continue; }
    if (c[0] === 'C') { const end = { x: c[5], y: c[6] }, b = bezierBounds([{ ...current, out: { x: c[1], y: c[2] } }, { ...end, in: { x: c[3], y: c[4] } }], false); add(b.x, b.y); add(b.x + b.width, b.y + b.height); current = end; }
    else if (c[0] === 'M') { current = { x: c[1], y: c[2] }; start = current; }
    else { add(current.x, current.y); current = { x: c[1], y: c[2] }; add(current.x, current.y); }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
export function mapVector(commands: readonly VectorCommand[], map: (x: number, y: number) => { x: number; y: number }): VectorCommand[] {
  return commands.map(command => { if (command[0] === 'Z') return ['Z']; const values: number[] = []; for (let i = 1; i < command.length; i += 2) { const point = map(command[i] as number, command[i + 1] as number); values.push(point.x, point.y); } return [command[0], ...values] as VectorCommand; });
}
export function vectorContours(commands: readonly VectorCommand[]) {
  const contours: { points: { x: number; y: number }[]; closed: boolean }[] = []; let current = { x: 0, y: 0 };
  for (const c of commands) {
    if (c[0] === 'M') { current = { x: c[1], y: c[2] }; contours.push({ points: [current], closed: false }); }
    else if (c[0] === 'Z') { contours.at(-1)!.closed = true; current = contours.at(-1)!.points[0]!; }
    else if (c[0] === 'L') { current = { x: c[1], y: c[2] }; contours.at(-1)!.points.push(current); }
    else { const end = { x: c[5], y: c[6] }, start = current; for (let i = 1; i <= 64; i++) contours.at(-1)!.points.push(cubicPoint(start, { x: c[1], y: c[2] }, { x: c[3], y: c[4] }, end, i / 64)); current = end; }
  }
  return contours.filter(contour => contour.points.length > 1);
}
export function vectorWinding(point: { x: number; y: number }, commands: readonly VectorCommand[]): number {
  let winding = 0; for (const { points } of vectorContours(commands)) for (let i = 0; i < points.length; i++) { const a = points[i]!, b = points[(i + 1) % points.length]!, cross = (b.x - a.x) * (point.y - a.y) - (point.x - a.x) * (b.y - a.y); if (a.y <= point.y && b.y > point.y && cross > 0) winding++; else if (a.y > point.y && b.y <= point.y && cross < 0) winding--; } return winding;
}
