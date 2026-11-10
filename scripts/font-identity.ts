import {fontIdentityNameKey} from '../src/editor/font-family-key';
import {fontNames,fontTable} from './font-names';
/** Verify the actual file, never substitute a similar family, synthetic weight or variable default. */
export function assertExactFontIdentity(bytes:Buffer,format:string,family:string,weight:number,italic:boolean):void{
 const names=fontNames(bytes,format),key=fontIdentityNameKey;
 if(!key(family)||![names.familyGroup,names.family,names.fullName].some(name=>name&&key(name)===key(family)))throw new Error(`Il file non dichiara la famiglia «${family}». Nessun fallback consentito.`);
 if(names.weight!==weight||names.italic!==italic)throw new Error(`Il file di ${family} non corrisponde al peso/stile ${weight}${italic?' corsivo':''}. Nessun fallback consentito.`);
 const table=fontTable(bytes,format,'fvar');if(table&&table.length>=16){const offset=table.readUInt16BE(4),count=table.readUInt16BE(8),size=table.readUInt16BE(10);for(let i=0;i<count;i++){const at=offset+i*size;if(at+20>table.length)throw new Error('Tabella delle variazioni non valida');if(table.toString('ascii',at,at+4)==='wght'&&table.readInt32BE(at+8)/65536!==weight)throw new Error(`Il font variabile ${family} richiede un’istanza statica del peso ${weight}. Nessun fallback consentito.`);}}
}
