import { useEffect, useRef, useState } from 'react';
import { legacyFontRequests, replaceLegacyFonts } from './legacy-fonts';
import { loadFontAssets, registeredFontAsset } from './fonts';
import {refreshLibraryFonts} from '../editor-admin/library-fonts';
import { FontPicker } from './FontPicker';
import type { GraphicDocument } from './model';
interface Pending { document:GraphicDocument; resolve:(doc:GraphicDocument)=>void; reject:(cause:Error)=>void; }
function LegacyFontDialog({pending,onClose}:{pending:Pending;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),[choices,setChoices]=useState<Record<string,string>>({}),[error,setError]=useState('');
 const requests=legacyFontRequests(pending.document);
 useEffect(()=>{dialog.current?.showModal();return()=>{dialog.current?.close();};},[]);
 const cancel=()=>{pending.reject(new Error('Apertura annullata: il progetto originale è conservato.'));onClose();};
 return <dialog className="configuration-dialog" ref={dialog} aria-label="Scegli i font della libreria" onCancel={event=>{event.preventDefault();cancel();}}>
  <h2>Scegli i file font del progetto</h2><p>Questo progetto contiene nomi di font del computer. Associa ogni voce a un file della libreria. Il progetto originale resta invariato; controlla l’impaginazione dopo l’apertura.</p>
  <p><a href="/editor/admin?section=fonts" target="_blank" rel="noopener">Carica font nella libreria</a> <button onClick={()=>{void refreshLibraryFonts(pending.document.fontAssets).catch(cause=>setError(cause instanceof Error?cause.message:'Caricamento non riuscito'));}}>Aggiorna elenco font</button></p>
  {requests.map(item=><div key={item.key}><strong>{item.family}{item.bold?' · grassetto':''}{item.italic?' · corsivo':''}</strong><FontPicker emptyLabel="Scegli un file della libreria" value={choices[item.key]??''} disabled={false} onOpen={()=>{}} onChange={id=>setChoices(current=>({...current,[item.key]:id}))}/></div>)}
  {error&&<p role="alert">{error}</p>}
  <div className="configuration-dialog-actions"><button onClick={cancel}>Annulla apertura</button><button disabled={requests.some(item=>!choices[item.key])} onClick={()=>{try{const assets=new Map(requests.map(item=>{const asset=registeredFontAsset(choices[item.key]!);if(!asset)throw new Error('File font non caricato');return[item.key,asset];}));const document=replaceLegacyFonts(pending.document,assets);pending.resolve(document);onClose();}catch(cause){setError(cause instanceof Error?cause.message:'Associazione font non riuscita');}}}>Apri con i font scelti</button></div>
 </dialog>;
}
/** Preparation only; the caller still commits via the normal validated open/import command. */
export function useProjectFontPreparation(){
 const [pending,setPending]=useState<Pending|null>(null),active=useRef<Pending|null>(null);
 useEffect(()=>()=>{active.current?.reject(new Error('Editor chiuso durante la scelta dei font'));active.current=null;},[]);
 const prepare=async(document:GraphicDocument):Promise<GraphicDocument>=>{
  await loadFontAssets(document.fontAssets);if(!legacyFontRequests(document).length)return document;
  if(active.current)throw new Error('Completa la scelta dei font già aperta.');
  return new Promise((resolve,reject)=>{const next={document,resolve,reject};active.current=next;setPending(next);});
 };
 return {prepare,dialog:pending?<LegacyFontDialog key={pending.document.documentId} pending={pending} onClose={()=>{active.current=null;setPending(null);}}/>:null};
}
