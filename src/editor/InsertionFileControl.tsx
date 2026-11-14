import {useEffect,useRef} from 'react';
import {EditorButton,type EditorIconName} from './EditorButton';

/** Pin the validated destination and import options while the native chooser is open. */
export function InsertionFileControl({id,label,fileLabel,icon,badge,accept,onPrepare}:{id:string;label:string;fileLabel:string;icon:EditorIconName;badge?:string;accept:string;onPrepare:()=>((file:File)=>void)|null}){
 const input=useRef<HTMLInputElement>(null),request=useRef<((file:File)=>void)|null>(null);
 useEffect(()=>{const element=input.current,clear=()=>{request.current=null;};element?.addEventListener('cancel',clear);return()=>element?.removeEventListener('cancel',clear);},[]);
 return <><div className="button-row"><EditorButton preserveFocus icon={icon} label={label} badge={badge} onClick={()=>{request.current=onPrepare();if(request.current)input.current?.click();}}/></div>
  <label htmlFor={id} className="sr-only">{fileLabel}</label><input ref={input} id={id} className="sr-only" type="file" accept={accept} onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';const insert=request.current;request.current=null;if(file)(insert??onPrepare())?.(file);}}/>
 </>;
}
