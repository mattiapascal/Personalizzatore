import { MAX_RASTER_SIDE } from './raster-limits';
import { z } from 'zod';
import type { RasterSource } from './raster-source';
import type { SceneObject } from './model';
export const RASTER_CROP_EPSILON = 1e-9;
export const RasterCropSchema = z.strictObject({ leftPx: z.number().finite().min(0).max(MAX_RASTER_SIDE - 1), topPx: z.number().finite().min(0).max(MAX_RASTER_SIDE - 1), widthPx: z.number().finite().min(1).max(MAX_RASTER_SIDE), heightPx: z.number().finite().min(1).max(MAX_RASTER_SIDE) });
export type RasterCrop = z.infer<typeof RasterCropSchema>;
export type ImageObject = Extract<SceneObject, { type: 'image' }>;
export function fullRasterCrop(source: RasterSource): RasterCrop { return { leftPx: 0, topPx: 0, widthPx: source.pixelWidth, heightPx: source.pixelHeight }; }
export function checkedRasterCrop(source: RasterSource, raw?: RasterCrop): RasterCrop {
  const crop = RasterCropSchema.parse(raw ?? fullRasterCrop(source));
  if (crop.leftPx + crop.widthPx - source.pixelWidth > RASTER_CROP_EPSILON || crop.topPx + crop.heightPx - source.pixelHeight > RASTER_CROP_EPSILON) throw new Error('Ritaglio fuori dai pixel della sorgente originale'); return crop;
}
/** Mantiene la scala dei pixel; il chiamante conserva l’ancoraggio centrale. */
export function changeRasterCrop(object: ImageObject, change: Partial<RasterCrop>): ImageObject {
  const before = checkedRasterCrop(object.source, object.crop), next = { ...before, ...change };
  if (change.leftPx !== undefined && change.widthPx === undefined) next.widthPx = Math.min(before.widthPx, object.source.pixelWidth - change.leftPx);
  if (change.topPx !== undefined && change.heightPx === undefined) next.heightPx = Math.min(before.heightPx, object.source.pixelHeight - change.topPx);
  const crop = checkedRasterCrop(object.source, next), mmPerPixelX = object.widthMm / before.widthPx, mmPerPixelY = object.heightMm / before.heightPx;
  return { ...object, crop, widthMm: crop.widthPx * mmPerPixelX, heightMm: crop.heightPx * mmPerPixelY };
}

export interface RasterInsets { left: number; right: number; top: number; bottom: number; }
export function rasterInsets(object: ImageObject): RasterInsets {
  const crop = checkedRasterCrop(object.source, object.crop), right = object.source.pixelWidth - crop.leftPx - crop.widthPx, bottom = object.source.pixelHeight - crop.topPx - crop.heightPx; return { left: object.flipX ? right : crop.leftPx, right: object.flipX ? crop.leftPx : right, top: object.flipY ? bottom : crop.topPx, bottom: object.flipY ? crop.topPx : bottom };
}
export function cropFromInsets(object: ImageObject, change: Partial<RasterInsets>): RasterCrop {
  const inset = { ...rasterInsets(object), ...change };
  if (Object.values(inset).some(value => !Number.isFinite(value) || value < 0)) throw new Error('I bordi richiedono valori finiti non negativi');
  // Normalize only computed endpoint cancellation, never an imported crop.
  const span=(value:number)=>value<1&&value>=1-RASTER_CROP_EPSILON?1:value,
    start=(value:number,size:number)=>value>size-1&&value<=size-1+RASTER_CROP_EPSILON?size-1:value;
  return checkedRasterCrop(object.source, { leftPx: start(object.flipX ? inset.right : inset.left,object.source.pixelWidth), topPx: start(object.flipY ? inset.bottom : inset.top,object.source.pixelHeight), widthPx: span(object.source.pixelWidth - inset.left - inset.right), heightPx: span(object.source.pixelHeight - inset.top - inset.bottom) });
}

/** User-facing physical insets; the document keeps exact source coordinates. */
export function rasterInsetsMm(object: ImageObject): RasterInsets {
  const crop=checkedRasterCrop(object.source,object.crop),insets=rasterInsets(object),sx=object.widthMm/crop.widthPx,sy=object.heightMm/crop.heightPx;
  return {left:insets.left*sx,right:insets.right*sx,top:insets.top*sy,bottom:insets.bottom*sy};
}
export function cropFromInsetsMm(object: ImageObject, change: Partial<RasterInsets>): RasterCrop {
  const crop=checkedRasterCrop(object.source,object.crop),sx=object.widthMm/crop.widthPx,sy=object.heightMm/crop.heightPx;
  const pixels=Object.fromEntries(Object.entries(change).map(([key,value])=>[key,value!/(key==='left'||key==='right'?sx:sy)]));
  return cropFromInsets(object,pixels);
}
