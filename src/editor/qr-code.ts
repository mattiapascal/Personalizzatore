import {z} from 'zod';
import {qrcodegen} from '../vendor/qrcodegen';
import {EDITOR_LIMITS} from './limits';
import type {VectorCommand} from './vector-geometry';

export const QR_QUIET_MODULES=4;
export const QR_MAX_BYTES=1024;
const definition=z.strictObject({encoding:z.literal('qr-v1'),kind:z.enum(['url','text']),content:z.string().min(1,'Inserisci il contenuto del QR.').max(QR_MAX_BYTES,'Il contenuto del QR è troppo lungo.'),ecc:z.enum(['L','M','Q','H'])});
export type QrParameters=z.infer<typeof definition>;
const cache=new Map<string,{modules:number;version:number;commands:readonly VectorCommand[];matrix:readonly(readonly boolean[])[]}>();
/** qr-v1 fixes encoder, ECI UTF-8, exact requested ECC and automatic mask.
 * Future encoders must use another version, never silently rewrite old QR art. */
export function qrSymbol(spec:QrParameters){
 const key=JSON.stringify([spec.encoding,spec.content,spec.ecc]);let found=cache.get(key);if(found){cache.delete(key);cache.set(key,found);return found;}
 const {QrCode,QrSegment}=qrcodegen,ecc={L:QrCode.Ecc.LOW,M:QrCode.Ecc.MEDIUM,Q:QrCode.Ecc.QUARTILE,H:QrCode.Ecc.HIGH}[spec.ecc],bytes=Array.from(new TextEncoder().encode(spec.content));
 const qr=QrCode.encodeSegments([QrSegment.makeEci(26),QrSegment.makeBytes(bytes)],ecc,1,40,-1,false),size=qr.size+2*QR_QUIET_MODULES,commands:VectorCommand[]=[],matrix:boolean[][]=[];
 for(let y=0;y<qr.size;y++){
  matrix.push(Array.from({length:qr.size},(_,x)=>qr.getModule(x,y)));
  for(let x=0;x<qr.size;){if(!qr.getModule(x,y)){x++;continue;}const start=x;while(x<qr.size&&qr.getModule(x,y))x++;const left=(start+QR_QUIET_MODULES)/size,right=(x+QR_QUIET_MODULES)/size,top=(y+QR_QUIET_MODULES)/size,bottom=(y+QR_QUIET_MODULES+1)/size;commands.push(['M',left,top],['L',right,top],['L',right,bottom],['L',left,bottom],['Z']);}
 }
 if(commands.length>EDITOR_LIMITS.vectorCommandsPerObject)throw Error('QR troppo complesso: riduci il contenuto o il recupero errori.');
 found=Object.freeze({modules:qr.size,version:qr.version,commands:Object.freeze(commands.map(c=>Object.freeze(c) as VectorCommand)),matrix:Object.freeze(matrix.map(row=>Object.freeze(row)))});
 cache.set(key,found);while(cache.size>32)cache.delete(cache.keys().next().value!);return found;
}
export const QrParametersSchema=definition.superRefine((value,ctx)=>{
 const invalid=(message:string)=>ctx.addIssue({code:'custom',message});
 if(!value.content.trim()||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value.content)||Array.from(value.content).some(c=>{const p=c.codePointAt(0)!;return p>=0xd800&&p<=0xdfff;})){invalid('Inserisci un contenuto testuale valido per il QR.');return;}
 if(new TextEncoder().encode(value.content).length>QR_MAX_BYTES){invalid(`Il contenuto del QR supera ${QR_MAX_BYTES} byte UTF-8.`);return;}
 if(value.kind==='url'){try{const url=new URL(value.content);if(!['http:','https:'].includes(url.protocol)||/[\s]/u.test(value.content)||url.username||url.password)throw Error();}catch{invalid('Inserisci un indirizzo web completo con http:// o https://, senza spazi o credenziali.');return;}}
 try{qrSymbol(value);}catch(error){invalid(error instanceof Error?error.message:'Contenuto QR non codificabile.');}
});
export function qrModuleMm(widthMm:number,spec:QrParameters){return widthMm/(qrSymbol(spec).modules+2*QR_QUIET_MODULES);}
