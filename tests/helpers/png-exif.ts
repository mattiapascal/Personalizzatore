import{testPng,pngChunk}from'./png';
/** Six asymmetric, opaque colours; expected matrices in tests do not use production transforms. */
export const PNG_TEST_RGBA=new Uint8Array([255,0,0,255,0,255,0,255,0,0,255,255,255,255,0,255,255,0,255,255,0,255,255,255]);
export function tiffOrientation(value:number,little=false):Buffer{const b=Buffer.alloc(26);b.write(little?'II':'MM');const u16=(v:number,at:number)=>little?b.writeUInt16LE(v,at):b.writeUInt16BE(v,at),u32=(v:number,at:number)=>little?b.writeUInt32LE(v,at):b.writeUInt32BE(v,at);u16(42,2);u32(8,4);u16(1,8);u16(0x112,10);u16(3,12);u32(1,14);u16(value,18);return b;}
export function pngWithExif(orientation:number,beforeData=true,rgba=PNG_TEST_RGBA):Buffer{const png=testPng(3,2,rgba),chunk=pngChunk('eXIf',tiffOrientation(orientation)),at=beforeData?33:png.length-12;return Buffer.concat([png.subarray(0,at),chunk,png.subarray(at)]);}
export const pngUrl=(bytes:Uint8Array)=>'data:image/png;base64,'+Buffer.from(bytes).toString('base64');
export const PNG_ORIENTED_INDICES:Record<number,number[]>={1:[0,1,2,3,4,5],2:[2,1,0,5,4,3],3:[5,4,3,2,1,0],4:[3,4,5,0,1,2],5:[0,3,1,4,2,5],6:[3,0,4,1,5,2],7:[5,2,4,1,3,0],8:[2,5,1,4,0,3]};
