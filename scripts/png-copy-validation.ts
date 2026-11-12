import{allGraphicObjects}from'../src/editor/pages';
import{pngDescriptor,pngFrameBytes,validatePngData}from'../src/editor/png-source';import{assertSamePngPixels,rawPngPixelOffset,type PngPixelRows}from'../src/editor/png-pixel-equivalence';import{MAX_RASTER_PIXELS}from'../src/editor/raster-limits';import type{GraphicDocument}from'../src/editor/model';
const checked=new Map<string,Promise<void>>();let bytes=0,queue:Promise<unknown>=Promise.resolve();
/** Decoder adapter stays in the local Node backend, never in the storefront.
 * Plain PNGs use the existing validation path without loading native code. */
export async function validatePngCopies(dataUrl:string):Promise<void>{
 const info=pngDescriptor(dataUrl);if(info.frames.length===1)return;const cached=checked.get(dataUrl);if(cached)return cached;
 const work=async()=>{await validatePngData(dataUrl);const{default:sharp}=await import('sharp');let first:PngPixelRows|undefined;
  for(let i=0;i<info.frames.length;i++){const frame=info.frames[i]!,input=pngFrameBytes(dataUrl,i),{data,info:decoded}=await sharp(Buffer.from(input.buffer,input.byteOffset,input.byteLength),{limitInputPixels:MAX_RASTER_PIXELS,failOn:'warning',sequentialRead:true}).timeout({seconds:10}).toColourspace('srgb').ensureAlpha().raw({depth:'uchar'}).toBuffer({resolveWithObject:true});if(decoded.width!==frame.rawWidth||decoded.height!==frame.rawHeight||decoded.channels!==4)throw Error('Dimensioni PNG decodificate non coerenti');
   const pixels:PngPixelRows={width:frame.width,height:frame.height,readRows:(top,height)=>{const output=new Uint8Array(frame.width*height*4);for(let y=0;y<height;y++)for(let x=0;x<frame.width;x++){const at=rawPngPixelOffset(frame.orientation,frame.rawWidth,frame.rawHeight,x,top+y),target=(y*frame.width+x)*4;output.set(data.subarray(at,at+4),target);}return output;}};
   if(!first)first=pixels;else assertSamePngPixels(first,pixels);
  }
 };
 const pending=queue.then(work);queue=pending.catch(()=>{});checked.set(dataUrl,pending);bytes+=dataUrl.length;while(checked.size>16||bytes>64*1024*1024){const key=checked.keys().next().value!;bytes-=key.length;checked.delete(key);}try{await pending;}catch(error){if(checked.get(dataUrl)===pending){checked.delete(dataUrl);bytes-=dataUrl.length;}throw error;}
}
export async function validateDocumentPngCopies(documents:readonly (Pick<GraphicDocument,'objects'>&Partial<Pick<GraphicDocument,'otherPages'>>)[]):Promise<void>{const seen=new Set<string>();for(const document of documents)for(const object of allGraphicObjects(document))if(object.type==='image'&&object.source.mime==='image/png'&&!seen.has(object.source.dataUrl)){seen.add(object.source.dataUrl);await validatePngCopies(object.source.dataUrl);}}
