import {binaryInkPixels,guaranteesBinaryRaster,type BinaryRasterCheck} from './production-check';
import {assertRasterParameters,rasterCanvas} from './raster-cache';

/** Reuse the already prepared, full-resolution pixels, never a zoomed/cropped
 * canvas. Scan in strips so checking a 24 MP original adds only a small buffer. */
export const browserBinaryRasterCheck:BinaryRasterCheck=async object=>{
 assertRasterParameters(object.source,object.raster);
 if(guaranteesBinaryRaster(object))return true;
 const canvas=rasterCanvas(object.source,object.raster),context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('Controllo B/N dell’immagine non disponibile: riprova prima di confermare.');
 for(let top=0;top<canvas.height;top+=128)if(!binaryInkPixels(context.getImageData(0,top,canvas.width,Math.min(128,canvas.height-top)).data))return false;
 return true;
};
