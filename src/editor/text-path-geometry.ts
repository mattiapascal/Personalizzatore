import {effectiveStrokeCap} from './stroke-cap';
import { paintWithOpacity } from './paint-opacity';
import { mapVector } from './vector-geometry';
import { Path, util } from 'fabric';
import { bezierCommands } from './bezier-geometry';
import type { TextPathGuide } from './text-path-spec';
export function createTextGuide(guide: TextPathGuide): Path {
  let commands: string;
  if (guide.type === 'circle' || guide.type === 'ellipse') {
    const rx = (guide.type === 'circle' ? guide.radiusMm : guide.rxMm) * 8, ry = (guide.type === 'circle' ? guide.radiusMm : guide.ryMm) * 8;
    commands = `M ${rx} ${ry * 2} A ${rx} ${ry} 0 1 1 ${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} ${ry * 2} Z`;
  } else if (guide.type === 'line') commands = `M 0 0 L ${guide.lengthMm * 8} 0`;
  else if (guide.type === 'vector') commands = mapVector(guide.commands,(x,y)=>({x:x*guide.widthMm*8,y:y*guide.heightMm*8})).map(c=>c.join(' ')).join(' ');
  else if (guide.type === 'bezier') commands = bezierCommands(guide.nodes, guide.closed, guide.widthMm * 8, guide.heightMm * 8).map(command => command.join(' ')).join(' ');
  else commands = guide.points.map((point, i) => `${i ? 'L' : 'M'} ${point.x * guide.widthMm * 8} ${point.y * guide.heightMm * 8}`).join(' ') + (guide.closed ? ' Z' : '');
  const path = new Path(commands, { left: 0, top: 0, originX: 'center', originY: 'center', fill: null, stroke: paintWithOpacity(guide.stroke, guide.strokeOpacity), strokeWidth: guide.stroke === 'none' ? 0 : guide.strokeMm * 8, visible: false, objectCaching: false, strokeLineCap:guide.type==='circle'||guide.type==='ellipse'?'round':effectiveStrokeCap(guide),strokeLineJoin:guide.type==='vector'&&guide.strokeFrameVersion!==1?'round':'strokeLineJoin'in guide?guide.strokeLineJoin??'round':'round',strokeMiterLimit:'strokeMiterLimit'in guide?guide.strokeMiterLimit??4:4, strokeDashArray: guide.strokeDash === 'dashed' ? [guide.strokeMm * 32, guide.strokeMm * 16] : guide.strokeDash === 'dotted' ? [0, guide.strokeMm * 16] : null });
  path.segmentsInfo = util.getPathSegmentsInfo(path.path); return path;
}
export function guideLength(path: Path): number { return path.segmentsInfo?.at(-1)?.length ?? 0; }
export function sampleTextGuide(path: Path, distance: number, closed: boolean, reversed: boolean) {
  const length = guideLength(path); if (!(length > 0)) throw new Error('Il tracciato deve avere una lunghezza positiva');
  let d = reversed ? length - distance : distance;
  if (closed) d = ((d % length) + length) % length;
  const clamped = Math.max(0, Math.min(length, d)), point = util.getPointOnPath(path.path, clamped, path.segmentsInfo)!;
  const extra = closed ? 0 : d - clamped;
  return { x: point.x + Math.cos(point.angle) * extra - path.pathOffset.x, y: point.y + Math.sin(point.angle) * extra - path.pathOffset.y, angle: point.angle + (reversed ? Math.PI : 0) };
}
