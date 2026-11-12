import { pitchprintNumber as number } from './pitchprint-units';
import { canonicalPaint } from './paint';
import type { SceneObject } from './model';
import type { ObjectProperties } from './object-properties';

type Raw = Record<string, unknown>;
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
function dimensions(item: Raw) {
  const width = number(item.width, 'Larghezza forma'), height = number(item.height, 'Altezza forma');
  if (width < 0 || height < 0) throw Error('Dimensioni della forma negative.');
  if (item.type === 'circle') {
    const radius = number(item.radius, 'Raggio cerchio');
    if (radius < 0 || !near(width, 2 * radius) || !near(height, 2 * radius)) throw Error('Dimensioni del cerchio discordanti dal raggio dichiarato.');
  }
  if (item.type === 'ellipse') {
    const rx = number(item.rx, 'Raggio X ellisse'), ry = number(item.ry, 'Raggio Y ellisse');
    if (rx < 0 || ry < 0 || !near(width, 2 * rx) || !near(height, 2 * ry)) throw Error('Dimensioni dell’ellisse discordanti dai raggi dichiarati.');
  }
  return { width, height };
}

/** Only known primitives with zero area and no effective stroke. Never infer
 * that a path/group is empty from cached dimensions or erase operational data. */
export function emptyPitchprintPrimitive(item: Raw, editor: ObjectProperties, grouped: boolean, stroke: string): string | null {
  if (!['rect', 'circle', 'ellipse'].includes(String(item.type)) || stroke !== 'none') return null;
  const { width, height } = dimensions(item);
  if (width > 0 && height > 0) return null;
  if (item.type === 'rect' && (number(item.rx ?? 0, 'Raggio X') !== 0 || number(item.ry ?? 0, 'Raggio Y') !== 0)) return null;
  const background = canonicalPaint(item.backgroundColor);
  if (Object.values(editor).some(Boolean) || grouped || item.list || item.chain || item.tags || item.clickMask || item.hooks && JSON.stringify(item.hooks) !== '{}' || background !== 'none') throw Error('Forma senza area con proprietà operative, sfondo o appartenenza a un gruppo: richiede revisione.');
  return item.type === 'circle' ? 'cerchio' : item.type === 'ellipse' ? 'ellisse' : 'rettangolo';
}

/** Preserve unpainted placeholders as real geometry, not fake visible strokes.
 * The caller supplies the exact orthogonal affine axes and source centre. */
export function unstrokedPitchprintPrimitive(item: Raw, id: string, editor: ObjectProperties, axisX: number, axisY: number, rotation: number, fill: string): Extract<SceneObject,{type:'rect'|'circle'|'ellipse'}> | null {
  if (!['rect', 'circle', 'ellipse'].includes(String(item.type))) return null;
  const { width, height } = dimensions(item);
  if (width <= 0 || height <= 0) return null;
  if (!Number.isFinite(axisX) || !Number.isFinite(axisY) || axisX <= 0 || axisY <= 0) throw Error('Scala della forma non valida.');
  if (canonicalPaint(item.backgroundColor) !== 'none') throw Error('Sfondo della forma da convertire separatamente.');
  const common = { id, xMm: 0, yMm: 0, stroke: 'none' as const, strokeMm: .25, fill, editor };
  if (item.type === 'rect') {
    if (number(item.rx ?? 0, 'Raggio X') || number(item.ry ?? 0, 'Raggio Y')) return null;
    return { ...common, type: 'rect', widthMm: width * axisX, heightMm: height * axisY, rotationDeg: rotation };
  }
  // Fabric 3 serialized radians (2π); later versions use degrees (360).
  if (item.type === 'circle') {
    const endAngle = number(item.endAngle ?? 360, 'Fine arco');
    if (number(item.startAngle ?? 0, 'Inizio arco') !== 0 || !near(endAngle, 360) && !near(endAngle, 2 * Math.PI)) throw Error('Arco circolare da convertire senza sostituirlo con un cerchio intero.');
  }
  if (item.type === 'circle' && near(axisX, axisY)) return { ...common, type: 'circle', radiusMm: width * axisX / 2, rotationDeg: 0 };
  return { ...common, type: 'ellipse', rxMm: width * axisX / 2, ryMm: height * axisY / 2, rotationDeg: rotation };
}
