import { objectCenter, placeObjectAtCenter, type Measure } from './model';
import { checkedRasterCrop, changeRasterCrop, type ImageObject, type RasterCrop } from './raster-geometry';
/** Crop without moving/rescaling the remaining pixels, including rotated/flipped images. */
export function cropRasterInPlace(object: ImageObject, crop: RasterCrop, measure: Measure): ImageObject {
  const before = checkedRasterCrop(object.source, object.crop), after = checkedRasterCrop(object.source, crop), next = changeRasterCrop(object, after), center = objectCenter(object, measure), mmX = object.widthMm / before.widthPx, mmY = object.heightMm / before.heightPx, angle = (object.rotationDeg ?? 0) * Math.PI / 180;
  const x = (after.leftPx + after.widthPx / 2 - before.leftPx - before.widthPx / 2) * mmX * (object.flipX ? -1 : 1), y = (after.topPx + after.heightPx / 2 - before.topPx - before.heightPx / 2) * mmY * (object.flipY ? -1 : 1);
  return placeObjectAtCenter(next, { xMm: center.xMm + x * Math.cos(angle) - y * Math.sin(angle), yMm: center.yMm + x * Math.sin(angle) + y * Math.cos(angle) }, measure) as ImageObject;
}
export function dragRasterCrop(object: ImageObject, horizontal: number, vertical: number, deltaXmm: number, deltaYmm: number, measure: Measure): ImageObject {
  const crop = checkedRasterCrop(object.source, object.crop), mmX = object.widthMm / crop.widthPx, mmY = object.heightMm / crop.heightPx, angle = (object.rotationDeg ?? 0) * Math.PI / 180, sx = object.flipX ? -1 : 1, sy = object.flipY ? -1 : 1;
  const dx = Math.round((deltaXmm * Math.cos(angle) + deltaYmm * Math.sin(angle)) * sx / mmX), dy = Math.round((-deltaXmm * Math.sin(angle) + deltaYmm * Math.cos(angle)) * sy / mmY);
  let left = crop.leftPx, right = crop.leftPx + crop.widthPx, top = crop.topPx, bottom = crop.topPx + crop.heightPx;
  if (horizontal * sx < 0) left = Math.max(0, Math.min(right - 1, left + dx)); else if (horizontal * sx > 0) right = Math.min(object.source.pixelWidth, Math.max(left + 1, right + dx));
  if (vertical * sy < 0) top = Math.max(0, Math.min(bottom - 1, top + dy)); else if (vertical * sy > 0) bottom = Math.min(object.source.pixelHeight, Math.max(top + 1, bottom + dy));
  return cropRasterInPlace(object, { leftPx: left, topPx: top, widthPx: right - left, heightPx: bottom - top }, measure);
}
