import { useEffect,useId,useRef,useState } from 'react';
import { readArchiveRecord } from './api';
import { ArchiveRecordSchema,type ArchiveRecord } from './schema';
import { InkPreviewFilter } from '../editor/InkPreviewFilter';
type Preview={svg:string;color:NonNullable<ArchiveRecord['document']['inkColor']>};
const cache=new Map<string,Preview>();let queue=Promise.resolve();
function queued<T>(job:()=>Promise<T>):Promise<T>{const work=queue.then(job);queue=work.then(()=>{},()=>{});return work;}
async function renderRecord(record:ArchiveRecord):Promise<Preview>{
 const {FabricAdapter,prepareRasterSource}=await import('../editor/fabric-adapter'),{loadFontAssets}=await import('../editor/fonts');
 await Promise.all([loadFontAssets(record.document.fontAssets),...record.document.objects.filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source))]);
 const view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});try{return{svg:view.exportSvg(record.document),color:record.document.colorMode==='color'?'black':record.document.inkColor??'black'};}finally{view.dispose();}
}
function remember(key:string,preview:Preview){cache.delete(key);cache.set(key,preview);let bytes=[...cache.values()].reduce((sum,value)=>sum+value.svg.length*2,0);while(cache.size>32||bytes>16*1024*1024){const first=cache.keys().next().value;if(!first)break;bytes-=cache.get(first)!.svg.length*2;cache.delete(first);}}
export function ArchiveThumbnail({id,version,title,record,large=false}:{id:string;version:number;title:string;record?:ArchiveRecord;large?:boolean}){
 const ref=useRef<HTMLSpanElement>(null),[active,setActive]=useState(large),[url,setUrl]=useState(''),[error,setError]=useState(''),[color,setColor]=useState<Preview['color']>('black'),filter=`archive-ink-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
 useEffect(()=>{if(large){setActive(true);return;}const element=ref.current;if(!element)return;if(typeof IntersectionObserver==='undefined'){setActive(true);return;}const observer=new IntersectionObserver(entries=>setActive(entries.some(entry=>entry.isIntersecting)),{rootMargin:'120px'});observer.observe(element);return()=>observer.disconnect();},[large]);
 useEffect(()=>{let current=true,uri='';setUrl('');setError('');if(!active)return;const key=`${id}:${version}`;
 void queued(async()=>{if(!current)return;const cached=cache.get(key);if(cached)return cached;const source=record??ArchiveRecordSchema.parse(await readArchiveRecord(id));if(source.version!==version)throw new Error('Archivio aggiornato: premi Aggiorna.');if(!current)return;const preview=await renderRecord(source);remember(key,preview);return preview;}).then(preview=>{if(!current||!preview)return;uri=URL.createObjectURL(new Blob([preview.svg],{type:'image/svg+xml'}));setColor(preview.color);setUrl(uri);}).catch(cause=>{if(current)setError(cause instanceof Error?cause.message:'Miniatura non disponibile');});
 return()=>{current=false;if(uri)URL.revokeObjectURL(uri);};},[active,id,version,record]);
 return <span ref={ref} className={large?'archive-large-image':'archive-thumbnail'}>{url?<><InkPreviewFilter id={filter} color={color}/><img src={url} alt={`${large?'Anteprima':'Miniatura'} ${title}`} style={{filter:color==='black'?'none':`url(#${filter})`}}/></>:<span className="caption">{error||(!active?'Anteprima':'Preparazione…')}</span>}</span>;
}
