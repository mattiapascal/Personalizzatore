import {useEffect,useRef,useState} from 'react';
import {QrFields} from './QrFields';
import {QrParametersSchema,type QrParameters} from './qr-code';
import {NumberField} from './InspectorNumberField';
export function QrInsertDialog({side,onClose,onInsert}:{side:number;onClose:()=>void;onInsert:(value:QrParameters,side:number)=>boolean}){
 const dialog=useRef<HTMLDialogElement>(null),[value,setValue]=useState<QrParameters>({encoding:'qr-v1',kind:'url',content:'',ecc:'M'}),[size,setSize]=useState(side),[revision,setRevision]=useState(0);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="configuration-dialog qr-insert-dialog" aria-label="Aggiungi codice QR" onCancel={e=>{e.preventDefault();onClose();}}><form onSubmit={e=>{e.preventDefault();const parsed=QrParametersSchema.safeParse(value);if(parsed.success&&onInsert(parsed.data,size))onClose();}}><h2>Aggiungi codice QR</h2>
  <QrFields showError={!!value.content} value={value} widthMm={size} onChange={next=>{setValue(next);setRevision(n=>n+1);}}/>
  <NumberField label="Lato QR (mm)" value={size} revision={revision} min={.1} max={3000} step={.1} onChange={setSize}/>
  <div className="button-row"><button type="button" onClick={onClose}>Annulla</button><button type="submit" disabled={!QrParametersSchema.safeParse(value).success}>Inserisci QR</button></div>
 </form></dialog>;
}
