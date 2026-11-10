import { z } from 'zod';
import type { RasterSource } from './raster-source';
import type { SceneObject } from './model';
export const RasterCropSchema = z.strictObject({ leftPx: z.number().int().min(0).max(4095), topPx: z.number().int().min(0).max(4095), widthPx: z.number().int().min(1).max(4096), heightPx: z.number().int().min(1).max(4096) });
export type RasterCrop = z.infer<typeof RasterCropSchema>;
export type ImageObject = Extract<SceneObject, { type: 'image' }>;
export function fullRasterCrop(source: RasterSource): RasterCrop { return { leftPx: 0, topPx: 0, widthPx: source.pixelWidth, heightPx: source.pixelHeight }; }
export function checkedRasterCrop(source: RasterSource, raw?: RasterCrop): RasterCrop {
  const crop = RasterCropSchema.parse(raw ?? fullRasterCrop(source));
  if (crop.leftPx + crop.widthPx > source.pixelWidth || crop.topPx + crop.heightPx > source.pixelHeight) throw new Error('Ritaglio fuori dai pixel della sorgente originale'); return crop;
}
/** Mantiene la scala dei pixel; il chiamante conserva l’ancoraggio centrale. */
export function changeRasterCrop(object: ImageObject, change: Partial<RasterCrop>): ImageObject {
  const before = checkedRasterCrop(object.source, object.crop), next = { ...before, ...change };
  if (change.leftPx !== undefined && change.widthPx === undefined) next.widthPx = Math.min(before.widthPx, object.source.pixelWidth - change.leftPx);
  if (change.topPx !== undefined && change.heightPx === undefined) next.heightPx = Math.min(before.heightPx, object.source.pixelHeight - change.topPx);
  const crop = checkedRasterCrop(object.source, next), mmPerPixel = object.widthMm / before.widthPx;
  return { ...object, crop, widthMm: crop.widthPx * mmPerPixel, heightMm: crop.heightPx * mmPerPixel };
}

export interface RasterInsets { left: number; right: number; top: number; bottom: number; }
export function rasterInsets(object: ImageObject): RasterInsets {
  const crop = checkedRasterCrop(object.source, object.crop), right = object.source.pixelWidth - crop.leftPx - crop.widthPx, bottom = object.source.pixelHeight - crop.topPx - crop.heightPx; return { left: object.flipX ? right : crop.leftPx, right: object.flipX ? crop.leftPx : right, top: object.flipY ? bottom : crop.topPx, bottom: object.flipY ? crop.topPx : bottom };
}
export function cropFromInsets(object: ImageObject, change: Partial<RasterInsets>): RasterCrop {
  const inset = { ...rasterInsets(object), ...change };
  if (Object.values(inset).some(value => !Number.isInteger(value) || value < 0)) throw new Error('I bordi richiedono pixel interi non negativi');
  return checkedRasterCrop(object.source, { leftPx: object.flipX ? inset.right : inset.left, topPx: object.flipY ? inset.bottom : inset.top, widthPx: object.source.pixelWidth - inset.left - inset.right, heightPx: object.source.pixelHeight - inset.top - inset.bottom });
}
