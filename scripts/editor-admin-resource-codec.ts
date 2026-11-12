import {createHash} from 'node:crypto';
import type {AdminState,ArchiveRecord} from '../src/editor-admin/schema';
import {cloneArchiveValue} from './editor-admin-read-cache';
import {allGraphicObjects} from '../src/editor/pages';
export const resourceHash=(value:string)=>createHash('sha256').update(value).digest('hex');
const prefix='@editor-resource-v1:';
function visitRecord(record:ArchiveRecord,visit:(value:string)=>string){
 for(const font of record.document.fontAssets??[])font.dataBase64=visit(font.dataBase64);
 for(const object of allGraphicObjects(record.document))if(object.type==='image')object.source.dataUrl=visit(object.source.dataUrl);
}
export function encodeArchiveRecord(record:ArchiveRecord,save:(value:string)=>string){const copy=cloneArchiveValue(record);visitRecord(copy,value=>prefix+save(value));return JSON.stringify(copy);}
export function decodeArchiveRecord(payload:string,load:(hash:string)=>string):unknown{const record=JSON.parse(payload)as ArchiveRecord;visitRecord(record,value=>load(markerHash(value)));return record;}
export function encodeArchiveFont(font:AdminState['fonts'][number],save:(value:string)=>string){return JSON.stringify({...font,dataBase64:prefix+save(font.dataBase64)});}
export function decodeArchiveFont(payload:string,load:(hash:string)=>string):unknown{const font=JSON.parse(payload);font.dataBase64=load(markerHash(font.dataBase64));return font;}
function markerHash(value:unknown):string{if(typeof value!=='string'||!new RegExp('^'+prefix+'[a-f0-9]{64}$').test(value))throw Error('Riferimento risorsa archivio non valido');return value.slice(prefix.length);}
