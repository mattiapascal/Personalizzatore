import type { AdminSnapshot, ArchiveRecord } from './schema';
export const tagText=(value:string)=>value.normalize('NFC').trim().replace(/\s+/g,' ');
export const tagKey=(value:string)=>tagText(value).toLocaleLowerCase('it');
export function uniqueTags(values:readonly string[]):string[]{const seen=new Set<string>();return values.map(tagText).filter(value=>{const key=tagKey(value);if(!value||seen.has(key))return false;seen.add(key);return true;});}
export const parseTags=(value:string)=>uniqueTags(value.split(','));
export function archiveTagVocabulary(state:Pick<AdminSnapshot,'records'|'tagOrder'>):string[]{return uniqueTags([...(state.tagOrder??[]),...state.records.flatMap(record=>record.tags)]);}
export function canonicalRecordTags(values:readonly string[],known:readonly string[]):string[]{const labels=new Map(known.map(tag=>[tagKey(tag),tag]));return uniqueTags(values).map(tag=>labels.get(tagKey(tag))??tag);}
export function moveTag(order:readonly string[],source:string,index:number):string[]{const result=[...order],at=result.findIndex(tag=>tagKey(tag)===tagKey(source));if(at<0)return result;const[tag]=result.splice(at,1);result.splice(Math.max(0,Math.min(index,result.length)),0,tag!);return result;}
export type ArchiveListRecord=Omit<ArchiveRecord,'document'>&{previewKey?:string;technicalPreviewKey?:string};
export function archiveList(records:readonly ArchiveListRecord[],options:{kind:'template'|'composition';archived:boolean;query:string;tags:readonly string[];mode:'all'|'any';sort:'tags'|'title'|'updated';priority:readonly string[]}):ArchiveListRecord[]{
 const query=options.query.trim().toLocaleLowerCase('it'),wanted=options.tags.map(tagKey),collator=new Intl.Collator('it',{numeric:true,sensitivity:'base'});
 return records.filter(record=>{if(record.kind!==options.kind||record.archived!==options.archived||query&&!`${record.title} ${record.tags.join(' ')} ${record.clientRef}`.toLocaleLowerCase('it').includes(query))return false;const keys=new Set(record.tags.map(tagKey));return !wanted.length||(options.mode==='all'?wanted.every(key=>keys.has(key)):wanted.some(key=>keys.has(key)));}).sort((a,b)=>{
  if(options.sort==='tags'){const left=new Set(a.tags.map(tagKey)),right=new Set(b.tags.map(tagKey));for(const tag of options.priority){const key=tagKey(tag),difference=Number(right.has(key))-Number(left.has(key));if(difference)return difference;}}
  if(options.sort==='updated'){const difference=b.updatedAt.localeCompare(a.updatedAt);if(difference)return difference;}
  return collator.compare(a.title,b.title)||a.id.localeCompare(b.id);
 });
}
