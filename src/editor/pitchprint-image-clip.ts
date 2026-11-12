import { Path, Rect } from 'fabric';
import { EDITOR_LIMITS } from './limits';
import { pitchprintNumber as number } from './pitchprint-units';
import { checkedRasterCrop, type RasterCrop } from './raster-geometry';
import type { RasterSource } from './raster-source';
import type { PitchprintMatrix } from './pitchprint-tree';

type Data = Record<string, unknown>;
interface Bounds { left: number; top: number; right: number; bottom: number; }
interface Geometry { widthMm: number; heightMm: number; pixelAspectRatio: number; crop: RasterCrop; }

/** Only a single rectangular fill aligned with the image plane can become a
 * normal editable crop. Cached SVG, clipBounds and serialized pathOffset are
 * not geometry authorities. No source code or cached markup is executed. */
export function pitchprintImageClip(item: Data, name = 'Immagine'): Bounds | undefined {
  if (item.clipPath == null) return;
  const fail = () => new Error(`${name}: maschera immagine non rettangolare o non rappresentabile come ritaglio modificabile.`);
  if (item.type !== 'image' || typeof item.clipPath !== 'object' || Array.isArray(item.clipPath)) throw fail();
  const raw = item.clipPath as Data;
  if (raw.absolutePositioned && raw.absolutePositioned !== false || raw.inverted && raw.inverted !== false || raw.clipPath || raw.clipTo || raw.transformMatrix || raw.shadow || raw.visible === false || raw.globalCompositeOperation && raw.globalCompositeOperation !== 'source-over' || number(raw.opacity ?? 1, name) !== 1 || number(raw.skewX ?? 0, name) || number(raw.skewY ?? 0, name)) throw fail();
  const scalar = (key: string, fallback?: number) => {
    const value = number(raw[key] ?? fallback, `${name}: maschera ${key}`);
    if (Math.abs(value) > 1e7) throw fail();
    return value;
  };
  const origin = (key: 'originX' | 'originY') => {
    const value = raw[key] ?? (key === 'originX' ? 'left' : 'top');
    if (!(key === 'originX' ? ['left', 'center', 'right'] : ['top', 'center', 'bottom']).includes(String(value))) throw fail();
    return value as 'left' | 'center' | 'right';
  };
  const options = { ...(raw.left === undefined ? {} : { left: scalar('left') }), ...(raw.top === undefined ? {} : { top: scalar('top') }), scaleX: scalar('scaleX', 1), scaleY: scalar('scaleY', 1), angle: scalar('angle', 0), strokeWidth: scalar('strokeWidth', 1), strokeUniform: raw.strokeUniform === true, originX: origin('originX'), originY: origin('originY') as 'top' | 'center' | 'bottom', flipX: raw.flipX === true, flipY: raw.flipY === true, fill: '#000000', stroke: null };
  if (options.scaleX <= 0 || options.scaleY <= 0 || options.strokeWidth < 0) throw fail();
  let shape: Path | Rect;
  if (raw.type === 'rect') {
    const width = scalar('width'), height = scalar('height');
    if (width <= 0 || height <= 0 || scalar('rx', 0) || scalar('ry', 0)) throw fail();
    shape = new Rect({ ...options, width, height });
  } else if (raw.type === 'path') {
    const path = raw.path;
    if (!Array.isArray(path) || path.length < 4 || path.length > EDITOR_LIMITS.vectorCommandsPerObject) throw fail();
    const checked = path.map((command, i) => {
      if (!Array.isArray(command) || typeof command[0] !== 'string') throw fail();
      const code = command[0], upper = code.toUpperCase(), size = ({ M: 3, L: 3, H: 2, V: 2, Z: 1 } as Record<string, number>)[upper];
      if (size !== command.length || !size || (i === 0 ? upper !== 'M' : upper === 'M') || (i === path.length - 1 ? upper !== 'Z' : upper === 'Z')) throw fail();
      return [code, ...command.slice(1).map(v => { const n = number(v, name); if (Math.abs(n) > 1e7) throw fail(); return n; })];
    });
    shape = new Path(checked as ConstructorParameters<typeof Path>[0], options);
  } else throw fail();
  try {
    const matrix = shape.calcOwnMatrix(), local = shape instanceof Path ? shape.path.filter(c => c[0] !== 'Z').map(c => {
      if (c[0] !== 'M' && c[0] !== 'L') throw fail();
      return { x: c[1] - shape.pathOffset.x, y: c[2] - shape.pathOffset.y };
    }) : [{ x: -shape.width / 2, y: -shape.height / 2 }, { x: shape.width / 2, y: -shape.height / 2 }, { x: shape.width / 2, y: shape.height / 2 }, { x: -shape.width / 2, y: shape.height / 2 }];
    const points = local.map(p => ({ x: matrix[0] * p.x + matrix[2] * p.y + matrix[4], y: matrix[1] * p.x + matrix[3] * p.y + matrix[5] }));
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const p of points) { if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.max(Math.abs(p.x), Math.abs(p.y)) > 1e9) throw fail(); left = Math.min(left, p.x); top = Math.min(top, p.y); right = Math.max(right, p.x); bottom = Math.max(bottom, p.y); }
    const w = right - left, h = bottom - top, epsilon = Math.max(w, h) * 1e-10;
    if (w <= 0 || h <= 0) throw fail();
    let area = 0, perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!, b = points[(i + 1) % points.length]!, dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) > epsilon && Math.abs(dy) > epsilon) throw fail();
      if (!(Math.abs(a.x - left) <= epsilon || Math.abs(a.x - right) <= epsilon || Math.abs(a.y - top) <= epsilon || Math.abs(a.y - bottom) <= epsilon)) throw fail();
      // Translate before area accumulation to avoid cancellation far from zero.
      area += (a.x - left) * (b.y - top) - (b.x - left) * (a.y - top);
      perimeter += Math.hypot(dx, dy);
    }
    if (Math.abs(Math.abs(area) / 2 - w * h) > w * h * 1e-9 || Math.abs(perimeter - 2 * (w + h)) > (w + h) * 1e-9) throw fail();
    const width = number(item.width, name), height = number(item.height, name);
    if (width <= 0 || height <= 0) throw fail();
    const clipped = { left: Math.max(left, -width / 2), top: Math.max(top, -height / 2), right: Math.min(right, width / 2), bottom: Math.min(bottom, height / 2) };
    if (clipped.right <= clipped.left || clipped.bottom <= clipped.top) throw fail();
    return clipped;
  } finally { shape.dispose(); }
}

/** Map the existing source sampling rectangle, including legacy stretching and
 * preview/original ratios. The full image/group/page matrix moves the centre. */
export function clippedPitchprintImageGeometry(item: Data, source: RasterSource, base: Geometry, matrix: PitchprintMatrix) {
  const bounds = pitchprintImageClip(item);
  if (!bounds) return { ...base, center: { xMm: matrix[4], yMm: matrix[5] } };
  const width = number(item.width, 'Larghezza immagine'), height = number(item.height, 'Altezza immagine'), fx = (bounds.right - bounds.left) / width, fy = (bounds.bottom - bounds.top) / height, x = (bounds.left + bounds.right) / 2, y = (bounds.top + bounds.bottom) / 2;
  const crop = checkedRasterCrop(source, { leftPx: base.crop.leftPx + (bounds.left + width / 2) / width * base.crop.widthPx, topPx: base.crop.topPx + (bounds.top + height / 2) / height * base.crop.heightPx, widthPx: base.crop.widthPx * fx, heightPx: base.crop.heightPx * fy });
  return { widthMm: base.widthMm * fx, heightMm: base.heightMm * fy, pixelAspectRatio: base.pixelAspectRatio, crop, center: { xMm: matrix[0] * x + matrix[2] * y + matrix[4], yMm: matrix[1] * x + matrix[3] * y + matrix[5] } };
}
