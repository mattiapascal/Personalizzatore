import type {GraphicDocument} from './model';
export type EditorMode='customer'|'admin'|'test';
export function editorMode(search=location.search):EditorMode {const value=new URLSearchParams(search).get('mode');return value==='customer'||value==='admin'?value:'test';}
export function editorReturnUrl(mode:EditorMode,kind:'template'|'composition'='composition'):string{return mode==='admin'?`/editor/admin?section=${kind}`:'/editor/confirmed';}
export function metadataKey(title:string,kind:string,tags:string):string{return JSON.stringify([title.trim(),kind,tags.split(',').map(tag=>tag.trim()).filter(Boolean)]);}
export function sessionDocumentKey(document:GraphicDocument):string{return`${document.documentId}:${document.revision}`;}

export function copyArchiveTitle(title:string):string{const suffix=' · copia';let base='';for(const character of title.trim()||'Composizione'){if(base.length+character.length>120-suffix.length)break;base+=character;}return base+suffix;}
