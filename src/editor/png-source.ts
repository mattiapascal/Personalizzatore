import{MAX_RASTER_BYTES,MAX_RASTER_PIXELS,MAX_RASTER_SIDE,RASTER_PIXEL_LIMIT_LABEL}from'./raster-limits';
import{readExifOrientation,type ExifOrientation}from'./exif-orientation';import{crc32}from'./png-crc';
export const PNG_DECODING_POLICY='static-png-exif-before-idat-1';
export const MAX_PNG_STREAMS=4,MAX_PNG_CHUNKS=8192;
interface Chunk{readonly kind:string;readonly start:number;readonly end:number;}
export interface PngFrame{readonly start:number;readonly end:number;readonly rawWidth:number;readonly rawHeight:number;readonly width:number;readonly height:number;readonly orientation:ExifOrientation;readonly exif?:Readonly<{value:0|ExifOrientation;beforeData:boolean}>;readonly depth:number;readonly colorType:number;readonly interlace:number;readonly chunks:readonly Chunk[];}
export interface PngDescriptor{readonly bytes:number;readonly width:number;readonly height:number;readonly frames:readonly PngFrame[];readonly special:boolean;}
const prefix='data:image/png;base64,',signature=[137,80,78,71,13,10,26,10],cache=new Map<string,PngDescriptor>();let cachedBytes=0;
export function pngBytes(dataUrl:string):Uint8Array<ArrayBuffer>{
 if(!dataUrl.startsWith(prefix))throw Error('È richiesto un PNG locale incorporato, senza URL esterni');const encoded=dataUrl.slice(prefix.length);if(!encoded.length||encoded.length%4)throw Error('Codifica PNG base64 non valida');
 const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;for(let i=0;i<encoded.length-padding;i++){const c=encoded.charCodeAt(i);if(!(c>=65&&c<=90||c>=97&&c<=122||c>=48&&c<=57||c===43||c===47))throw Error('Codifica PNG base64 non valida');}
 const length=encoded.length/4*3-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0);if(length>MAX_RASTER_BYTES)throw Error('PNG oltre 20 MB');if(length<45)throw Error('PNG troncato');return Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
}
/** Descriptor only: no mutable pixel buffers are retained in this bounded cache. */
export function pngDescriptor(dataUrl:string):PngDescriptor{
 const previous=cache.get(dataUrl);if(previous)return previous;const bytes=pngBytes(dataUrl),view=new DataView(bytes.buffer),frames:PngFrame[]=[];let at=0,pixels=0,chunkCount=0;
 while(at<bytes.length){
  const start=at;if(frames.length>=MAX_PNG_STREAMS)throw Error('PNG oltre quattro copie concatenate');if(signature.some((v,i)=>bytes[at+i]!==v))throw Error(at?'Dati sconosciuti dopo la fine del PNG':'Firma o intestazione PNG non valida');
  if(at+33>bytes.length||view.getUint32(at+8)!==13||String.fromCharCode(...bytes.subarray(at+12,at+16))!=='IHDR')throw Error('Firma o intestazione PNG non valida');if(crc32(bytes.subarray(at+12,at+29))!==view.getUint32(at+29))throw Error('Intestazione PNG corrotta');
  const rawWidth=view.getUint32(at+16),rawHeight=view.getUint32(at+20),depth=bytes[at+24]!,colorType=bytes[at+25]!,interlace=bytes[at+28]!;pixels+=rawWidth*rawHeight;
  if(!rawWidth||!rawHeight||rawWidth>MAX_RASTER_SIDE||rawHeight>MAX_RASTER_SIDE||pixels>MAX_RASTER_PIXELS)throw Error(`PNG oltre ${RASTER_PIXEL_LIMIT_LABEL}, comprese le copie concatenate`);
  const depths:Record<number,number[]>={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};if(!depths[colorType]?.includes(depth)||bytes[at+26]!==0||bytes[at+27]!==0||interlace>1)throw Error('Formato dei pixel PNG non valido');
  const chunks:Chunk[]=[];let ended=false,data=false,dataEnded=false,exif:PngFrame['exif'],palette=false;at+=8;
  while(at<bytes.length){
   if(++chunkCount>MAX_PNG_CHUNKS)throw Error('PNG con troppi chunk');if(at+12>bytes.length)throw Error('Chunk PNG troncato');const size=view.getUint32(at),end=at+size+12,kind=String.fromCharCode(...bytes.subarray(at+4,at+8));
   if(end>bytes.length||!/^[A-Za-z]{4}$/.test(kind)||at!==start+8&&kind==='IHDR')throw Error('Struttura PNG non valida');if(crc32(bytes.subarray(at+4,end-4))!==view.getUint32(end-4))throw Error('Chunk PNG corrotto');
   if(['acTL','fcTL','fdAT'].includes(kind))throw Error('PNG animati non supportati in questo incremento');
   if(kind[0]===kind[0]!.toUpperCase()&&!['IHDR','PLTE','IDAT','IEND'].includes(kind))throw Error('Chunk PNG critico sconosciuto');
   if(kind==='eXIf'){if(exif)throw Error('Profilo EXIF PNG duplicato');exif={value:readExifOrientation(bytes.subarray(at+8,end-4),true),beforeData:!data};}
   if(kind==='PLTE'){if(palette||data||!size||size%3||size>768||[0,4].includes(colorType)||colorType===3&&size/3>2**depth)throw Error('Palette PNG non valida');palette=true;}
   if(kind==='IDAT'){if(dataEnded||colorType===3&&!palette)throw Error('Struttura IDAT o palette PNG non valida');data=true;}else if(data)dataEnded=true;
   chunks.push({kind,start:at,end});at=end;
   if(kind==='IEND'){if(size!==0)throw Error('Fine PNG non valida');ended=true;break;}
  }
  if(!ended||!data)throw Error('PNG incompleto: manca il contenuto o la fine');const orientation=exif?.beforeData&&exif.value?exif.value:1,swap=orientation>=5;
  frames.push({start,end:at,rawWidth,rawHeight,width:swap?rawHeight:rawWidth,height:swap?rawWidth:rawHeight,orientation,exif,depth,colorType,interlace,chunks});
 }
 for(const frame of frames){for(const chunk of frame.chunks)Object.freeze(chunk);Object.freeze(frame.chunks);if(frame.exif)Object.freeze(frame.exif);Object.freeze(frame);}Object.freeze(frames);
 const first=frames[0]!,result=Object.freeze({bytes:bytes.length,width:first.width,height:first.height,frames,special:frames.length>1||frames.some(f=>!!f.exif)});cache.set(dataUrl,result);cachedBytes+=dataUrl.length;
 while(cache.size>64||cachedBytes>64*1024*1024){const key=cache.keys().next().value!;cachedBytes-=key.length;cache.delete(key);}return result;
}
/** Existing public shape deliberately unchanged. Pixel equivalence is an async preparation gate. */
export function pngInfo(dataUrl:string):{width:number;height:number;bytes:number}{const info=pngDescriptor(dataUrl);return{width:info.width,height:info.height,bytes:info.bytes};}
/** Complete PNG stream, losslessly retaining image/color chunks while removing
 * Exif for deterministic decoding. The project's data URL is never replaced. */
export function pngFrameBytes(dataUrl:string,index=0):Uint8Array<ArrayBuffer>{
 const info=pngDescriptor(dataUrl),frame=info.frames[index];if(!frame)throw Error('Copia PNG non presente');const bytes=pngBytes(dataUrl),chunks=frame.chunks.filter(c=>c.kind!=='eXIf'),output=new Uint8Array(8+chunks.reduce((n,c)=>n+c.end-c.start,0));output.set(bytes.subarray(frame.start,frame.start+8));let at=8;for(const chunk of chunks){output.set(bytes.subarray(chunk.start,chunk.end),at);at+=chunk.end-chunk.start;}return output;
}
/** Validate every compressed stream against its RAW rows, before any decoder.
 * Oriented dimensions must not change the number/length of encoded scanlines. */
export async function validatePngData(dataUrl:string):Promise<void>{
 const info=pngDescriptor(dataUrl),bytes=pngBytes(dataUrl);
 for(const frame of info.frames){
  const idat=frame.chunks.filter(c=>c.kind==='IDAT'),compressed=new Uint8Array(idat.reduce((n,c)=>n+c.end-c.start-12,0));let position=0;for(const c of idat){const part=bytes.subarray(c.start+8,c.end-4);compressed.set(part,position);position+=part.length;}
  const channels:Record<number,number>={0:1,2:3,3:1,4:2,6:4},bits=channels[frame.colorType]!*frame.depth,rows:number[]=[],passes=frame.interlace===0?[[0,0,1,1]]:[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]];
  for(const[x,y,sx,sy]of passes){const w=Math.max(0,Math.ceil((frame.rawWidth-x!)/sx!)),h=Math.max(0,Math.ceil((frame.rawHeight-y!)/sy!));if(w&&h)for(let i=0;i<h;i++)rows.push(Math.ceil(w*bits/8)+1);}
  if(typeof DecompressionStream==='undefined')throw Error('Questo browser non supporta la verifica locale dei PNG');let inputOffset=0;const stream=new ReadableStream<BufferSource>({pull(controller){if(inputOffset>=compressed.length){controller.close();return;}controller.enqueue(compressed.subarray(inputOffset,inputOffset+1024));inputOffset+=1024;}}),reader=stream.pipeThrough(new DecompressionStream('deflate')).getReader(),expected=rows.reduce((a,b)=>a+b,0);let count=0,nextRow=0,row=0;
  try{for(;;){const{value,done}=await reader.read();if(done)break;const end=count+value.length;if(end>expected)throw Error('Dati in eccesso');while(nextRow<end){if(value[nextRow-count]!>4)throw Error('Filtro non valido');nextRow+=rows[row++]!;}count=end;}if(count!==expected||row!==rows.length)throw Error('Dati incompleti');}
  catch{await reader.cancel().catch(()=>{});throw Error('PNG non decodificabile: dati compressi o righe non validi');}finally{reader.releaseLock();}
 }
}
export function pngSourceWarnings(dataUrl:string):string[]{const info=pngDescriptor(dataUrl),warnings:string[]=[];if(info.frames.length>1)warnings.push(`PNG: ${info.frames.length} copie concatenate verificate nei pixel; originale completo conservato nel progetto.`);if(info.frames.some(f=>f.exif?.value===0))warnings.push('PNG: orientamento EXIF 0 non dichiarato; mantenuto il verso dei pixel del sorgente.');if(info.frames.some(f=>f.exif&&!f.exif.beforeData&&f.exif.value>1))warnings.push('PNG: profilo EXIF successivo ai pixel conservato come metadato storico; orientamento del disegno preservato.');return warnings;}
