import {binaryInkPixels,guaranteesBinaryRaster,type BinaryRasterCheck} from '../src/editor/production-check';
import {RasterSourceSchema,MAX_RASTER_PIXELS} from '../src/editor/raster-source';
import {pngDescriptor,pngFrameBytes} from '../src/editor/png-source';
import {jpegInfo} from '../src/editor/jpeg-source';
import {rasterPixels} from '../src/editor/raster-processing';
import {validatePngCopies} from './png-copy-validation';

/** Local API decoder. Orientation cannot change a full-image binary check.
 * Decode one bounded image at a time; retain only pass/fail results upstream. */
export const serverBinaryRasterCheck:BinaryRasterCheck=async object=>{
 const source=RasterSourceSchema.parse(object.source);
 if(source.mime==='image/png')await validatePngCopies(source.dataUrl);
 const frame=source.mime==='image/png'?pngDescriptor(source.dataUrl).frames[0]!:jpegInfo(source.dataUrl);
 const input=source.mime==='image/png'?Buffer.from(pngFrameBytes(source.dataUrl,0)):Buffer.from(source.dataUrl.split(',')[1]!,'base64');
 const {default:sharp}=await import('sharp');
 const {data,info}=await sharp(input,{limitInputPixels:MAX_RASTER_PIXELS,failOn:'warning',sequentialRead:true}).timeout({seconds:10}).toColourspace('srgb').ensureAlpha().raw({depth:'uchar'}).toBuffer({resolveWithObject:true});
 if(info.width!==frame.rawWidth||info.height!==frame.rawHeight||info.channels!==4)throw Error('Dimensioni decodificate non coerenti durante il controllo B/N.');
 if(guaranteesBinaryRaster(object))return true;
 for(let top=0;top<info.height;top+=128){const rows=data.subarray(top*info.width*4,Math.min(top+128,info.height)*info.width*4),pixels=new Uint8ClampedArray(rows.buffer,rows.byteOffset,rows.length);if(!binaryInkPixels(object.raster.mode==='original'?pixels:rasterPixels(pixels,object.raster,info.width)))return false;}
 return true;
};
