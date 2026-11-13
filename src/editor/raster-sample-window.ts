import {checkedRasterCrop,type RasterCrop} from './raster-geometry';
import type {RasterSource} from './raster-source';
import type {ExifOrientation} from './exif-orientation';
import {rawPngPixelOffset} from './png-pixel-equivalence';
export interface RasterSampleWindow{left:number;top:number;width:number;height:number;}
export function assertSampleWindow(window:RasterSampleWindow,width:number,height:number):void{
 if(![width,height].every(n=>Number.isInteger(n)&&n>0)||![window.left,window.top,window.width,window.height].every(Number.isInteger)||window.left<0||window.top<0||window.width<1||window.height<1||window.left+window.width>width||window.top+window.height>height)throw Error('Finestra di campioni raster non valida.');
}
/** All cells with a positive intersection: never round away a fractional edge. */
export function rasterSampleWindow(source:RasterSource,crop?:RasterCrop):RasterSampleWindow{
 const checked=checkedRasterCrop(source,crop),left=Math.floor(checked.leftPx),top=Math.floor(checked.topPx),right=Math.ceil(Math.min(source.pixelWidth,checked.leftPx+checked.widthPx)),bottom=Math.ceil(Math.min(source.pixelHeight,checked.topPx+checked.heightPx));
 const result={left,top,width:right-left,height:bottom-top};assertSampleWindow(result,source.pixelWidth,source.pixelHeight);return result;
}
/** EXIF is an exact sample permutation. A logical rectangle is a raw rectangle. */
export function rawRasterSampleWindow(window:RasterSampleWindow,orientation:ExifOrientation,rawWidth:number,rawHeight:number):RasterSampleWindow{
 if(!Number.isInteger(orientation)||orientation<1||orientation>8)throw Error('Orientamento raster non valido.');
 assertSampleWindow(window,orientation>=5?rawHeight:rawWidth,orientation>=5?rawWidth:rawHeight);
 const xs=[window.left,window.left+window.width-1],ys=[window.top,window.top+window.height-1],points=xs.flatMap(x=>ys.map(y=>{const offset=rawPngPixelOffset(orientation,rawWidth,rawHeight,x,y)/4;return{x:offset%rawWidth,y:Math.floor(offset/rawWidth)};})),left=Math.min(...points.map(point=>point.x)),top=Math.min(...points.map(point=>point.y));
 const result={left,top,width:Math.max(...points.map(point=>point.x))-left+1,height:Math.max(...points.map(point=>point.y))-top+1};assertSampleWindow(result,rawWidth,rawHeight);return result;
}
