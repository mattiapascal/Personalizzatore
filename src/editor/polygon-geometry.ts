import type { PointMm } from './line-geometry';
export function regularPolygonPoints(sides: number, radiusMm: number): PointMm[] {
  if (!Number.isInteger(sides) || sides < 3 || sides > 32 || !Number.isFinite(radiusMm) || radiusMm <= 0 || radiusMm > 500) throw new Error('Poligono: da 3 a 32 lati e raggio positivo fino a 500 mm');
  return Array.from({ length: sides }, (_, i) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / sides; return { xMm: radiusMm * Math.cos(angle), yMm: radiusMm * Math.sin(angle) }; });
}
export function starPoints(tips: number, radiusMm: number, innerRatio: number): PointMm[] {
  if (!Number.isInteger(tips) || tips < 3 || tips > 32 || !Number.isFinite(radiusMm) || radiusMm <= 0 || radiusMm > 500 || !Number.isFinite(innerRatio) || innerRatio < 0.1 || innerRatio > 0.9) throw new Error('Stella: da 3 a 32 punte, raggio positivo fino a 500 mm e rapporto interno da 0,1 a 0,9');
  return Array.from({ length: tips * 2 }, (_, i) => { const angle = -Math.PI / 2 + i * Math.PI / tips, radius = i % 2 ? radiusMm * innerRatio : radiusMm; return { xMm: radius * Math.cos(angle), yMm: radius * Math.sin(angle) }; });
}
