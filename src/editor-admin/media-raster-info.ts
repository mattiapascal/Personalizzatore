import{libraryJpegInfo}from'../editor/jpeg-source';import{rasterSourceFromBytes}from'../editor/raster-source';
export function libraryRasterInfo(bytes:Uint8Array){
 if(bytes.length>20_000_000)throw Error('Originale oltre20MB');
 if(bytes[0]===255&&bytes[1]===216){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));const info=libraryJpegInfo('data:image/jpeg;base64,'+btoa(text));return{mime:'image/jpeg' as const,width:info.width,height:info.height};}
 if(new TextDecoder().decode(bytes.subarray(0,4))==='RIFF'&&new TextDecoder().decode(bytes.subarray(8,12))==='WEBP'){
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.length<30||v.getUint32(4,true)+8!==bytes.length)throw Error('WebP troncato');const kind=new TextDecoder().decode(bytes.subarray(12,16));let width=0,height=0;
  if(kind==='VP8X'){if(bytes[20]!&2)throw Error('WebP animato non supportato');const u24=(at:number)=>bytes[at]!+(bytes[at+1]!<<8)+(bytes[at+2]!<<16);width=1+u24(24);height=1+u24(27);}
  else if(kind==='VP8 '&&bytes[23]===0x9d&&bytes[24]===1&&bytes[25]===0x2a){width=v.getUint16(26,true)&0x3fff;height=v.getUint16(28,true)&0x3fff;}
  else if(kind==='VP8L'&&bytes[20]===0x2f){const bits=v.getUint32(21,true);width=1+(bits&0x3fff);height=1+((bits>>>14)&0x3fff);}
  if(!width||!height||width>12000||height>12000||width*height>24_000_000)throw Error('Dimensioni WebP non supportate');return{mime:'image/webp' as const,width,height};
 }
 const source=rasterSourceFromBytes(`media-${crypto.randomUUID()}`,bytes);return{mime:source.mime,width:source.pixelWidth,height:source.pixelHeight};
}
