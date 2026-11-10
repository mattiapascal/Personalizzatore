import {useEffect,useRef,useState} from 'react';
import {readDraft,type DraftSummary} from './drafts';
import {DocumentPreview} from './DocumentPreview';
import type {GraphicDocument} from '../editor/model';
let queue=Promise.resolve();
export function DraftThumbnail({summary}:{summary:DraftSummary}){
 const node=useRef<HTMLDivElement>(null),[active,setActive]=useState(false),[document,setDocument]=useState<GraphicDocument|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(!node.current)return;if(typeof IntersectionObserver==='undefined'){setActive(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))setActive(true);},{rootMargin:'80px'});observer.observe(node.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(!active)return;let current=true;const work=queue.then(async()=>{if(!current)return;const draft=await readDraft(summary.id),{loadFontAssets}=await import('../editor/fonts'),{prepareRasterSource}=await import('../editor/raster-cache');if(draft.summary.version!==summary.version)throw new Error('Bozza aggiornata: riapri l’elenco.');await Promise.all([loadFontAssets(draft.document.fontAssets),...draft.document.objects.filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source))]);if(current)setDocument(draft.document);});queue=work.catch(()=>{});void work.catch(cause=>{if(current)setError(cause instanceof Error?cause.message:'Anteprima non disponibile');});return()=>{current=false;};},[active,summary.id,summary.version]);
 return <div ref={node} className="draft-thumbnail">{document?<DocumentPreview document={document} label={`Anteprima bozza ${summary.title}`}/>:<span className="caption">{error||'Preparazione anteprima…'}</span>}</div>;
}
