import{pngDescriptor,pngFrameBytes,validatePngData}from'./png-source';
import{crc32}from'./png-crc';import{rawPngPixelOffset}from'./png-pixel-equivalence';
const channels:Record<number,number>={0:1,2:3,3:1,4:2,6:4};
function chunk(kind:string,data:Uint8Array):Uint8Array<ArrayBuffer>{const out=new Uint8Array(data.length+12),view=new DataView(out.buffer);view.setUint32(0,data.length);for(let i=0;i<4;i++)out[i+4]=kind.charCodeAt(i);out.set(data,8);view.setUint32(out.length-4,crc32(out.subarray(4,-4)));return out;}
function join(parts:readonly Uint8Array[]):Uint8Array<ArrayBuffer>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){out.set(part,at);at+=part.length;}return out;}
function paeth(a:number,b:number,c:number){const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;}
async function inflate(bytes:Uint8Array):Promise<Uint8Array<ArrayBuffer>>{const copy=new Uint8Array(bytes);return new Uint8Array(await new Response(new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());}
/** Lossless native sample permutation, including palette, packed and 16-bit
 * PNGs. No Canvas encoding, quantization, alpha rounding or resampling. */
export async function orientedPngFrameBytes(dataUrl:string,index=0):Promise<Uint8Array<ArrayBuffer>>{
 const frame=pngDescriptor(dataUrl).frames[index];if(!frame)throw Error('Copia PNG non presente');const plain=pngFrameBytes(dataUrl,index);if(frame.orientation===1)return plain;
 // Bounded decompression must finish before collecting a native sample buffer.
 await validatePngData(dataUrl);const parts:{kind:string;data:Uint8Array;full:Uint8Array}[]=[];for(let at=8;at<plain.length;){const n=new DataView(plain.buffer).getUint32(at),end=at+n+12,kind=String.fromCharCode(...plain.subarray(at+4,at+8));parts.push({kind,data:plain.subarray(at+8,end-4),full:plain.subarray(at,end)});at=end;}
 const decoded=await inflate(join(parts.filter(c=>c.kind==='IDAT').map(c=>c.data))),bits=channels[frame.colorType]!*frame.depth,bpp=Math.max(1,Math.ceil(bits/8)),rowBytes=Math.ceil(frame.rawWidth*bits/8),samples=new Uint8Array(rowBytes*frame.rawHeight),passes=frame.interlace===0?[[0,0,1,1]]:[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]];
 let at=0;const mask=bits<8?(1<<bits)-1:0;
 for(const[x,y,sx,sy]of passes){const w=Math.max(0,Math.ceil((frame.rawWidth-x!)/sx!)),h=Math.max(0,Math.ceil((frame.rawHeight-y!)/sy!));if(!w||!h)continue;const length=Math.ceil(w*bits/8);let previous=new Uint8Array(length);
  for(let row=0;row<h;row++){const filter=decoded[at++]!,current=decoded.slice(at,at+length);at+=length;for(let i=0;i<length;i++){const a=i>=bpp?current[i-bpp]!:0,b=previous[i]!,c=i>=bpp?previous[i-bpp]!:0;current[i]=(current[i]!+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}
   const top=(y!+row*sy!)*rowBytes;for(let col=0;col<w;col++){const targetX=x!+col*sx!;if(bits>=8){const from=col*bpp,to=top+targetX*bpp;for(let byte=0;byte<bpp;byte++)samples[to+byte]=current[from+byte]!;}else{const value=(current[Math.floor(col*bits/8)]!>>>(8-bits-col*bits%8))&mask,position=top+Math.floor(targetX*bits/8);samples[position]=samples[position]!|(value<<(8-bits-targetX*bits%8));}}
   previous=current;
  }
 }
 if(at!==decoded.length)throw Error('Righe PNG non coerenti durante l’orientamento');
 const outputRowBytes=Math.ceil(frame.width*bits/8);let row=0;
 // Sub-filter each oriented native row; stream into deflate to avoid retaining a
 // second full image of 16-bit samples in addition to its compressed output.
 const stream=new ReadableStream<Uint8Array<ArrayBuffer>>({pull(controller){if(row>=frame.height){controller.close();return;}const raw=new Uint8Array(outputRowBytes);for(let x=0;x<frame.width;x++){const pixel=rawPngPixelOffset(frame.orientation,frame.rawWidth,frame.rawHeight,x,row)/4,sourceY=Math.floor(pixel/frame.rawWidth),sourceX=pixel%frame.rawWidth;if(bits>=8){const from=sourceY*rowBytes+sourceX*bpp;for(let byte=0;byte<bpp;byte++)raw[x*bpp+byte]=samples[from+byte]!;}else{const value=(samples[sourceY*rowBytes+Math.floor(sourceX*bits/8)]!>>>(8-bits-sourceX*bits%8))&mask;raw[Math.floor(x*bits/8)]=raw[Math.floor(x*bits/8)]!|(value<<(8-bits-x*bits%8));}}const filtered=new Uint8Array(outputRowBytes+1);filtered[0]=1;for(let i=0;i<raw.length;i++)filtered[i+1]=(raw[i]!-(i>=bpp?raw[i-bpp]!:0))&255;row++;controller.enqueue(filtered);}});
 const compressed=new Uint8Array(await new Response(stream.pipeThrough(new CompressionStream('deflate'))).arrayBuffer()),header=new Uint8Array(parts[0]!.data),view=new DataView(header.buffer);view.setUint32(0,frame.width);view.setUint32(4,frame.height);header[12]=0;
 // Original metadata stays in JSON. This derived display stream retains colour
 // interpretation and pixel samples; positional/history chunks would be stale.
 const colour=new Set(['PLTE','tRNS','cHRM','gAMA','iCCP','sRGB','sBIT','cICP','mDCv','cLLi']);
 return join([plain.subarray(0,8),chunk('IHDR',header),...parts.filter(c=>colour.has(c.kind)).map(c=>c.full),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())]);
}
