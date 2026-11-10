import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
export const WOFF2_TAGS=['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill']as const;
const MAX_EXPANDED=8*1024*1024,wanted=new Set(['cmap','name','OS/2','head','maxp']),cache=new Map<string,Map<string,Buffer>>();
/** Extract analysis tables only; no font conversion or reconstruction of transformed outlines. */
export function woff2AnalysisTable(bytes:Buffer,tag:string):Buffer|undefined {
 if(!wanted.has(tag)||bytes.length<48||bytes.length>1024*1024)return;
 const key=createHash('sha256').update(bytes).digest('hex'),cached=cache.get(key);if(cached)return cached.get(tag);
 try{
  if(bytes.toString('ascii',0,4)!=='wOF2'||bytes.readUInt32BE(8)!==bytes.length||bytes.readUInt32BE(4)===0x74746366)return;
  const count=bytes.readUInt16BE(12),compressed=bytes.readUInt32BE(20);if(!count||count>256||!compressed)return;
  let cursor=48,total=0;const tables:{tag:string;offset:number;length:number;transformed:boolean}[]=[],tags=new Set<string>();
  const base128=()=>{let value=0;for(let i=0;i<5;i++){if(cursor>=bytes.length)throw new Error('Troncato');const byte=bytes[cursor++]!;if(i===0&&byte===0x80)throw new Error('Base128 non canonico');value=value*128+(byte&127);if(value>0xffffffff)throw new Error('Overflow');if(!(byte&128))return value;}throw new Error('Base128 troppo lungo');};
  for(let i=0;i<count;i++){
   if(cursor>=bytes.length)return;const flags=bytes[cursor++]!,index=flags&63,version=flags>>>6;
   let tableTag:string;if(index===63){if(cursor+4>bytes.length)return;tableTag=bytes.toString('ascii',cursor,cursor+4);cursor+=4;}else tableTag=WOFF2_TAGS[index]!;
   if(tags.has(tableTag))return;tags.add(tableTag);const original=base128(),glyph=tableTag==='glyf'||tableTag==='loca';
   if(glyph&&version!==0&&version!==3||!glyph&&version!==0&&!(tableTag==='hmtx'&&version===1))return;
   const transformed=glyph?version===0:version!==0,length=transformed?base128():original;
   if(tableTag==='loca'&&transformed&&length!==0||wanted.has(tableTag)&&transformed||wanted.has(tableTag)&&length>1024*1024)return;
   tables.push({tag:tableTag,offset:total,length,transformed});total+=length;if(total>MAX_EXPANDED)return;
  }
  const end=cursor+compressed;if(end>bytes.length)return;
  for(const[field,size]of [[28,32],[40,44]]as const){const start=bytes.readUInt32BE(field),length=bytes.readUInt32BE(size);if(start&&(start<end||start+length>bytes.length))return;}
  const data=brotliDecompressSync(bytes.subarray(cursor,end),{maxOutputLength:MAX_EXPANDED});if(data.length!==total)return;
  const result=new Map<string,Buffer>();for(const table of tables)if(wanted.has(table.tag)&&!table.transformed)result.set(table.tag,Buffer.from(data.subarray(table.offset,table.offset+table.length)));
  if(cache.size>=8)cache.delete(cache.keys().next().value!);cache.set(key,result);return result.get(tag);
 }catch{return;}
}
