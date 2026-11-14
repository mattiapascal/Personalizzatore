import {useEffect,useRef,useState} from 'react';
/** A blank field means unknown, never zero or a suggested production value. */
export function NullableMillimetresField({label,value,revision,min,max,disabled,onChange}:{label:string;value:number|null;revision:number;min:number;max:number;disabled:boolean;onChange:(value:number|null)=>void|boolean}){
 const [raw,setRaw]=useState(value===null?'':String(value)),[badInput,setBadInput]=useState(false),focused=useRef(false);
 const previous=useRef(value),submitted=useRef<{value:number|null}|null>(null);
 useEffect(()=>{
  // Keep local notation while typing, but follow a different canonical value
  // (e.g. hardware changed, Undo) even when this input still owns focus.
  const external=previous.current!==value&&submitted.current?.value!==value;
  if(!focused.current||external){setRaw(value===null?'':String(value));setBadInput(false);}
  previous.current=value;submitted.current=null;
 },[value,revision]);
 const invalid=badInput||raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<min||Number(raw)>max);
 return <label>{label}<input type="number" aria-label={label} placeholder="Da definire" value={raw} min={min} max={max} step="any" disabled={disabled} aria-invalid={invalid} onFocus={()=>{focused.current=true;}} onBlur={()=>{focused.current=false;setBadInput(false);setRaw(value===null?'':String(value));}} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();submitted.current=null;setBadInput(false);setRaw(value===null?'':String(value));}}} onChange={()=>{}} onInput={event=>{const next=event.currentTarget.value,bad=event.currentTarget.validity.badInput;setRaw(next);setBadInput(bad);if(bad)return;if(next===''||Number.isFinite(Number(next))){const value_=next===''?null:Number(next);submitted.current={value:value_};if(onChange(value_)===false){submitted.current=null;setBadInput(false);setRaw(value===null?'':String(value));}}}}/></label>;
}
