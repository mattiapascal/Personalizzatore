import {checkedRasterCrop,RASTER_CROP_EPSILON,type ImageObject} from './raster-geometry';
import type {RasterSource} from './raster-source';

/** Replace the pixels, keeping the existing physical frame and orientation.
 * Use a central source viewport at uniform scale, never stretch the new image. */
export function coverRasterReplacement(object:ImageObject,source:RasterSource):ImageObject {
 const scale=Math.max(object.widthMm/source.pixelWidth,object.heightMm/source.pixelHeight);
 const span=(value:number,limit:number)=>Math.min(limit,value<1&&value>=1-RASTER_CROP_EPSILON?1:value);
 const widthPx=span(object.widthMm/scale,source.pixelWidth),heightPx=span(object.heightMm/scale,source.pixelHeight);
 if(widthPx<1||heightPx<1)throw new Error('Il formato della nuova immagine richiederebbe meno di un pixel visibile. Scegli un’immagine con proporzioni più adatte alla cornice.');
 const crop=checkedRasterCrop(source,{leftPx:(source.pixelWidth-widthPx)/2,topPx:(source.pixelHeight-heightPx)/2,widthPx,heightPx});
 const next={...object,source:{...source},crop};delete next.pixelAspectRatio;
 return next;
}
