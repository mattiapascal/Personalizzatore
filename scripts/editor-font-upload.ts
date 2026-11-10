import {fontFileFormat} from './font-format';
import type {AdminState} from '../src/editor-admin/schema';
import {fontNames,detectedFontCategories} from './font-names';
function validFontTables(bytes: Buffer, format: string): boolean {
  if (format === 'ttf' || format === 'otf') {
    if (bytes.length < 12) return false; const count = bytes.readUInt16BE(4); if (!count || count > 256 || bytes.length < 12 + count * 16) return false;
    for (let i = 0; i < count; i++) { const at = 12 + i * 16, offset = bytes.readUInt32BE(at + 8), length = bytes.readUInt32BE(at + 12); if (offset + length > bytes.length) return false; } return true;
  }
  if (bytes.length < (format === 'woff2' ? 48 : 44) || bytes.readUInt32BE(8) !== bytes.length || !bytes.readUInt16BE(12)) return false;
  if (format === 'woff2') return bytes.readUInt32BE(20) > 0 && bytes.readUInt32BE(20) <= bytes.length - 48;
  const count = bytes.readUInt16BE(12); if (count > 256 || 44 + count * 20 > bytes.length) return false;
  for (let i = 0; i < count; i++) { const at = 44 + i * 20, offset = bytes.readUInt32BE(at + 4), length = bytes.readUInt32BE(at + 8); if (offset + length > bytes.length || length > bytes.readUInt32BE(at + 12)) return false; } return true;
}
export function validateFontFile(font:Pick<AdminState['fonts'][number],'format'|'dataBase64'>):void{
 const bytes=Buffer.from(font.dataBase64,'base64');if(!bytes.length||bytes.length>1024*1024||bytes.toString('base64')!==font.dataBase64)throw new Error('Font oltre 1 MB o codifica non valida');const magic=bytes.subarray(0,4).toString('latin1'),expected={woff:'wOFF',woff2:'wOF2',otf:'OTTO',ttf:'\0\x01\0\0'}[font.format];if(magic!==expected||!validFontTables(bytes,font.format))throw new Error('Formato o tabelle del font non validi');
}

export function prepareManualFont(file:{fileName:string;format:AdminState['fonts'][number]['format'];dataBase64:string;family?:string;notes?:string;sourceUrl?:string;licenseText?:string;weight?:number;italic?:boolean}){
 const bytes=Buffer.from(file.dataBase64,'base64'),format=fontFileFormat(bytes);validateFontFile({...file,format});const names=fontNames(bytes,format),familyGroup=names.familyGroup;
 if(!familyGroup||!names.family||!/[\p{L}\p{N}]/u.test(familyGroup)||!/[\p{L}\p{N}]/u.test(names.family))throw new Error(`«${file.fileName}»: nomi interni del font non validi. Ripara una copia del file prima di importarlo; nessun nome o carattere sostitutivo viene inventato.`);
 if(!names.weight||names.italic===undefined)throw new Error(`«${file.fileName}»: famiglia, peso o stile non rilevabili dal file. Nessun carattere sostitutivo consentito.`);
 if(file.weight!==undefined&&file.weight!==names.weight||file.italic!==undefined&&file.italic!==names.italic)throw new Error(`«${file.fileName}»: peso o stile dichiarato diverso dal file. Nessuno stile sintetico consentito.`);
 return {originalFileName:file.fileName.split(/[\\/]/).at(-1)!,family:file.family??(names.fullName??names.family).slice(0,80).replace(/[\uD800-\uDBFF]$/,''),familyGroup,styleName:names.styleName,weight:names.weight,italic:names.italic,format,dataBase64:file.dataBase64,notes:file.notes??'',categories:detectedFontCategories(bytes,format),source:'manual' as const,sourceUrl:file.sourceUrl,licenseText:file.licenseText};
}
