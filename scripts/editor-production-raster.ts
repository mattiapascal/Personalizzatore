import {rasterSampleWindow,rawRasterSampleWindow} from '../src/editor/raster-sample-window';
import {analyzeRasterPixels} from '../src/editor/raster-analysis';
import {binaryInkWindow,guaranteesBinaryRaster,type BinaryRasterCheck} from '../src/editor/production-check';
import {RasterSourceSchema,MAX_RASTER_PIXELS} from '../src/editor/raster-source';
import {pngDescriptor,pngFrameBytes} from '../src/editor/png-source';
import {jpegInfo} from '../src/editor/jpeg-source';
import {RasterParametersSchema,rasterPixels} from '../src/editor/raster-processing';
import {validatePngCopies} from './png-copy-validation';

/** Local API decoder. EXIF maps the crop to raw samples without resampling.
 * Decode one bounded image at a time; retain only pass/fail results upstream. */
export const serverBinaryRasterCheck:BinaryRasterCheck=async object=>{
 const source=RasterSourceSchema.parse(object.source),logicalWindow=rasterSampleWindow(source,object.crop),params=RasterParametersSchema.parse(object.raster);object={...object,raster:params};
 if(source.mime==='image/png')await validatePngCopies(source.dataUrl);
 const frame=source.mime==='image/png'?pngDescriptor(source.dataUrl).frames[0]!:jpegInfo(source.dataUrl);
 const input=source.mime==='image/png'?Buffer.from(pngFrameBytes(source.dataUrl,0)):Buffer.from(source.dataUrl.split(',')[1]!,'base64');
 const {default:sharp}=await import('sharp');
 const {data,info}=await sharp(input,{limitInputPixels:MAX_RASTER_PIXELS,failOn:'warning',sequentialRead:true}).timeout({seconds:10}).toColourspace('srgb').ensureAlpha().raw({depth:'uchar'}).toBuffer({resolveWithObject:true});
 if(info.width!==frame.rawWidth||info.height!==frame.rawHeight||info.channels!==4)throw Error('Dimensioni decodificate non coerenti durante il controllo B/N.');
 const window=rawRasterSampleWindow(logicalWindow,frame.orientation,info.width,info.height);
 if(guaranteesBinaryRaster(object))return true;
 if(params.backgroundRemoval&&params.mode!=='grayscale'){const analysis=analyzeRasterPixels(new Uint8ClampedArray(data.buffer,data.byteOffset,data.length));if(analysis.kind!=='grayscale'&&analysis.kind!=='empty')throw Error('Rimozione del bianco disponibile solo per originali in scala di grigi; canali RGB differenti richiedono una conversione esplicita');}
 for(let top=window.top;top<window.top+window.height;top+=128){const rows=data.subarray(top*info.width*4,Math.min(top+128,window.top+window.height)*info.width*4),pixels=new Uint8ClampedArray(rows.buffer,rows.byteOffset,rows.length);if(!binaryInkWindow(object.raster.mode==='original'?pixels:rasterPixels(pixels,object.raster,info.width),info.width,{left:window.left,top:0,width:window.width,height:rows.length/info.width/4}))return false;}
 return true;
};
