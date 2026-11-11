import {useEffect,useRef} from 'react';
import {EditorButton} from './EditorButton';
export function ImageReplacementControl({revision,disabled,onReplace}:{revision:number;disabled:boolean;onReplace:(file:File,revision:number)=>void}) {
 const input=useRef<HTMLInputElement>(null);
 // Pin the callback as well as the revision while the native file chooser is open.
 // A new selection/document must not silently redirect the chosen file.
 const request=useRef<{replace:typeof onReplace;revision:number}|null>(null);
 useEffect(()=>{const element=input.current,clear=()=>{request.current=null;};element?.addEventListener('cancel',clear);return()=>element?.removeEventListener('cancel',clear);},[]);
 return <>
  <EditorButton icon="replaceImage" label="Sostituisci immagine mantenendo la cornice" disabled={disabled} onClick={()=>{if(input.current?.form&&!input.current.form.reportValidity())return;request.current={replace:onReplace,revision};input.current?.click();}}/>
  <input ref={input} className="sr-only" type="file" aria-label="File per sostituire l’immagine" accept=".png,.jpg,.jpeg,image/png,image/jpeg" disabled={disabled} onChange={event=>{
   const file=event.currentTarget.files?.[0],target=request.current??{replace:onReplace,revision};event.currentTarget.value='';request.current=null;
   if(file&&!disabled)target.replace(file,target.revision);
  }}/>
  <p className="caption">Mantiene posizione, dimensioni, rotazione e riflessioni. La nuova immagine riempie la cornice senza deformarsi: le parti in eccesso vengono ritagliate al centro. Filtri conservati; Annulla ripristina l’immagine precedente.</p>
 </>;
}
