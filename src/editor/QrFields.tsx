import {useLayoutEffect,useRef} from 'react';
import {QrParametersSchema,QR_MAX_BYTES,qrSymbol,qrModuleMm,type QrParameters} from './qr-code';
export function QrFields({value,onChange,widthMm,showError=true}:{showError?:boolean;value:QrParameters;onChange:(value:QrParameters)=>void;widthMm:number}){
 const input=useRef<HTMLTextAreaElement>(null),parsed=QrParametersSchema.safeParse(value),error=parsed.success?'':parsed.error.issues[0]!.message;
 useLayoutEffect(()=>{input.current?.setCustomValidity(error);},[error]);
 const change=(patch:Partial<QrParameters>)=>onChange({...value,...patch});
 return <div className="qr-fields"><label>Tipo di contenuto<select aria-label="Tipo di contenuto QR" value={value.kind} onChange={e=>change({kind:e.target.value as QrParameters['kind']})}><option value="url">Indirizzo web</option><option value="text">Testo</option></select></label>
  <label>Contenuto del QR<textarea ref={input} required maxLength={QR_MAX_BYTES} rows={4} aria-label="Contenuto del QR" aria-invalid={!!error} value={value.content} placeholder={value.kind==='url'?'https://esempio.it':'Scrivi il contenuto da codificare'} onChange={e=>change({content:e.target.value})}/></label>
  {error&&showError&&<p className="caption" role="alert">Modifica non applicata: {error}</p>}
  <label>Tolleranza ai danni<select aria-label="Tolleranza ai danni QR" value={value.ecc} onChange={e=>change({ecc:e.target.value as QrParameters['ecc']})}><option value="L">Bassa (L)</option><option value="M">Standard (M)</option><option value="Q">Alta (Q)</option><option value="H">Massima (H)</option></select></label>
  {parsed.success&&<p className="caption" data-testid="qr-details">{qrSymbol(parsed.data).modules} × {qrSymbol(parsed.data).modules} moduli · modulo {qrModuleMm(widthMm,parsed.data).toFixed(3)} mm · bordo bianco incluso.</p>}
  <p className="caption">La lettura dipende anche da dimensione, supporto e stampa. Un livello maggiore di tolleranza rende il codice più denso.</p>
 </div>;
}
