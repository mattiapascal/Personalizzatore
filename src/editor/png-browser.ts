import{pngDescriptor,pngFrameBytes,validatePngData}from'./png-source';import{jpegOrientationMatrix}from'./jpeg-source';import{assertSamePngPixels,type PngPixelRows}from'./png-pixel-equivalence';
export type DecodedPng=HTMLImageElement|HTMLCanvasElement;
const release=(image:DecodedPng|undefined)=>{if(image instanceof HTMLCanvasElement)image.width=image.height=1;};
function rows(image:HTMLCanvasElement):PngPixelRows{const context=image.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Decodifica PNG non disponibile');return{width:image.width,height:image.height,readRows:(top,height)=>context.getImageData(0,top,image.width,height).data};}
/** Original bytes remain in the document. Strip EXIF from a derived stream and
 * apply the canonical orientation exactly once, independently of the browser. */
export async function decodeCanonicalPng(dataUrl:string):Promise<DecodedPng>{
 const info=pngDescriptor(dataUrl);await validatePngData(dataUrl);let first:DecodedPng|undefined,success=false;
 try{for(let index=0;index<info.frames.length;index++){
  const frame=info.frames[index]!,special=info.special,url=special?URL.createObjectURL(new Blob([pngFrameBytes(dataUrl,index)],{type:'image/png'})):dataUrl;let normalized:DecodedPng|undefined;
  try{const image=new Image();image.src=url;try{await image.decode();}catch{throw Error('PNG non decodificabile: nessuna modifica applicata');}if(image.naturalWidth!==frame.rawWidth||image.naturalHeight!==frame.rawHeight)throw Error('Dimensioni decodificate diverse dall’intestazione PNG');
   if(!special)normalized=image;else{const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;normalized=canvas;const context=canvas.getContext('2d');if(!context)throw Error('Orientamento PNG non disponibile');context.setTransform(...jpegOrientationMatrix(frame.orientation,frame.rawWidth,frame.rawHeight));context.drawImage(image,0,0);context.resetTransform();}
   if(!first){first=normalized;normalized=undefined;}else assertSamePngPixels(rows(first as HTMLCanvasElement),rows(normalized as HTMLCanvasElement));
  }finally{if(special)URL.revokeObjectURL(url);release(normalized);}
 }success=true;return first!;}finally{if(!success)release(first);}
}
