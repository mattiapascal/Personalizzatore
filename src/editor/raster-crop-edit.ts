import {frameToWorld,worldToFrame} from './object-affine';
import { objectCenter, placeObjectAtCenter, type Measure } from './model';
import { checkedRasterCrop, changeRasterCrop, type ImageObject, type RasterCrop } from './raster-geometry';
/** Crop without moving/rescaling the remaining pixels, including rotated/flipped images. */
export function cropRasterInPlace(object: ImageObject, crop: RasterCrop, measure: Measure): ImageObject {
  const before = checkedRasterCrop(object.source, object.crop), after = checkedRasterCrop(object.source, crop), next = changeRasterCrop(object, after), center = objectCenter(object, measure), mmX = object.widthMm / before.widthPx, mmY = object.heightMm / before.heightPx;
  const x = (after.leftPx + after.widthPx / 2 - before.leftPx - before.widthPx / 2) * mmX * (object.flipX ? -1 : 1), y = (after.topPx + after.heightPx / 2 - before.topPx - before.heightPx / 2) * mmY * (object.flipY ? -1 : 1);
  return placeObjectAtCenter(next, {xMm:center.xMm+frameToWorld(object,x,y).x,yMm:center.yMm+frameToWorld(object,x,y).y}, measure) as ImageObject;
}
export function dragRasterCrop(object: ImageObject, horizontal: number, vertical: number, deltaXmm: number, deltaYmm: number, measure: Measure): ImageObject {
  const crop = checkedRasterCrop(object.source, object.crop), mmX = object.widthMm / crop.widthPx, mmY = object.heightMm / crop.heightPx, sx = object.flipX ? -1 : 1, sy = object.flipY ? -1 : 1;
  const local=worldToFrame(object,deltaXmm,deltaYmm), dx=local.x*sx/mmX,dy=local.y*sy/mmY;
  let left = crop.leftPx, right = crop.leftPx + crop.widthPx, top = crop.topPx, bottom = crop.topPx + crop.heightPx;
  if (horizontal * sx < 0) left = Math.max(0, Math.min(right - 1, left + dx)); else if (horizontal * sx > 0) right = Math.min(object.source.pixelWidth, Math.max(left + 1, right + dx));
  if (vertical * sy < 0) top = Math.max(0, Math.min(bottom - 1, top + dy)); else if (vertical * sy > 0) bottom = Math.min(object.source.pixelHeight, Math.max(top + 1, bottom + dy));
  return cropRasterInPlace(object, { leftPx: left, topPx: top, widthPx: Math.max(1,right-left), heightPx: Math.max(1,bottom-top) }, measure);
}

/** Visible photo offset from the centered source window, along the frame axes. */
export function rasterContentOffsetMm(object:ImageObject):{x:number;y:number} {
  const crop=checkedRasterCrop(object.source,object.crop),sx=object.widthMm/crop.widthPx,sy=object.heightMm/crop.heightPx;
  return {x:((object.source.pixelWidth-crop.widthPx)/2-crop.leftPx)*sx*(object.flipX?-1:1),y:((object.source.pixelHeight-crop.heightPx)/2-crop.topPx)*sy*(object.flipY?-1:1)};
}
/** Move pixels within a fixed viewport, never exposing pixels outside the original. */
export function positionRasterContents(object:ImageObject,offset:Partial<{x:number;y:number}>):ImageObject {
  const before=checkedRasterCrop(object.source,object.crop),current=rasterContentOffsetMm(object),next={...current,...offset};
  if(!Number.isFinite(next.x)||!Number.isFinite(next.y))throw new Error('Posizione della foto non valida');
  const sx=object.widthMm/before.widthPx,sy=object.heightMm/before.heightPx,gapX=Math.max(0,object.source.pixelWidth-before.widthPx),gapY=Math.max(0,object.source.pixelHeight-before.heightPx);
  const crop=checkedRasterCrop(object.source,{...before,leftPx:next.x===current.x?before.leftPx:Math.max(0,Math.min(gapX,gapX/2-next.x/sx*(object.flipX?-1:1))),topPx:next.y===current.y?before.topPx:Math.max(0,Math.min(gapY,gapY/2-next.y/sy*(object.flipY?-1:1)))});
  return crop.leftPx===before.leftPx&&crop.topPx===before.topPx?object:{...object,crop};
}
export function panRasterContents(object:ImageObject,deltaXmm:number,deltaYmm:number):ImageObject {
  if(!Number.isFinite(deltaXmm)||!Number.isFinite(deltaYmm))throw new Error('Spostamento della foto non valido');
  if(deltaXmm===0&&deltaYmm===0)return object;
  const offset=rasterContentOffsetMm(object),delta=worldToFrame(object,deltaXmm,deltaYmm);
  return positionRasterContents(object,{x:offset.x+delta.x,y:offset.y+delta.y});
}

/** 100% is the widest source window that fills this frame without distortion. */
export function rasterContentZoom(object: ImageObject): { value: number; max: number } {
  const crop = checkedRasterCrop(object.source, object.crop);
  const room = Math.min(object.source.pixelWidth / crop.widthPx, object.source.pixelHeight / crop.heightPx);
  return { value: Math.max(100, room * 100), max: Math.max(100, room * Math.min(crop.widthPx, crop.heightPx) * 100) };
}

/** Enlarge the photo about the visible center, preserving frame and pixel proportions. */
export function zoomRasterContents(object: ImageObject, percent: number): ImageObject {
  const zoom = rasterContentZoom(object);
  if (!Number.isFinite(percent) || percent < 100 || percent > zoom.max) throw new Error('Ingrandimento fuori dai limiti della foto');
  if (percent === zoom.value) return object;
  const before = checkedRasterCrop(object.source, object.crop), scale = zoom.value / percent;
  // Only normalize arithmetic at the computed endpoints; never repair imported crops.
  const widthPx = Math.max(1, Math.min(object.source.pixelWidth, before.widthPx * scale));
  const heightPx = Math.max(1, Math.min(object.source.pixelHeight, before.heightPx * scale));
  const crop = checkedRasterCrop(object.source, {
    widthPx, heightPx,
    leftPx: Math.max(0, Math.min(object.source.pixelWidth - widthPx, before.leftPx + (before.widthPx - widthPx) / 2)),
    topPx: Math.max(0, Math.min(object.source.pixelHeight - heightPx, before.topPx + (before.heightPx - heightPx) / 2)),
  });
  return { ...object, crop };
}
