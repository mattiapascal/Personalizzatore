import {rasterSampleWindow} from './raster-sample-window';
import {RasterParametersSchema} from './raster-processing';
import {binaryInkWindow,guaranteesBinaryRaster,type BinaryRasterCheck} from './production-check';
import {assertRasterParameters,rasterCanvas} from './raster-cache';

/** Reuse the already prepared, full-resolution pixels, never a zoomed/cropped
 * canvas. Scan in strips so checking a 24 MP original adds only a small buffer. */
export const browserBinaryRasterCheck:BinaryRasterCheck=async object=>{
 const window=rasterSampleWindow(object.source,object.crop),params=RasterParametersSchema.parse(object.raster);object={...object,raster:params};
 assertRasterParameters(object.source,object.raster);
 if(guaranteesBinaryRaster(object))return true;
 const canvas=rasterCanvas(object.source,object.raster),context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('Controllo B/N dell’immagine non disponibile: riprova prima di confermare.');
 for(let top=window.top;top<window.top+window.height;top+=128){const height=Math.min(128,window.top+window.height-top),pixels=context.getImageData(window.left,top,window.width,height).data;if(!binaryInkWindow(pixels,window.width,{left:0,top:0,width:window.width,height}))return false;}
 return true;
};
