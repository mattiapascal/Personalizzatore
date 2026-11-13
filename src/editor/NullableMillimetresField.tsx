import {useEffect,useRef,useState} from 'react';
/** A blank field means unknown, never zero or a suggested production value. */
export function NullableMillimetresField({label,value,revision,min,max,disabled,onChange}:{label:string;value:number|null;revision:number;min:number;max:number;disabled:boolean;onChange:(value:number|null)=>void}){
 const [raw,setRaw]=useState(value===null?'':String(value)),[badInput,setBadInput]=useState(false),focused=useRef(false);
 useEffect(()=>{if(!focused.current)setRaw(value===null?'':String(value));},[value,revision]);
 const invalid=badInput||raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<min||Number(raw)>max);
 return <label>{label}<input type="number" aria-label={label} placeholder="Da definire" value={raw} min={min} max={max} step="any" disabled={disabled} aria-invalid={invalid} onFocus={()=>{focused.current=true;}} onBlur={()=>{focused.current=false;setBadInput(false);setRaw(value===null?'':String(value));}} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setBadInput(false);setRaw(value===null?'':String(value));}}} onChange={()=>{}} onInput={event=>{const next=event.currentTarget.value,bad=event.currentTarget.validity.badInput;setRaw(next);setBadInput(bad);if(bad)return;if(next==='')onChange(null);else if(Number.isFinite(Number(next)))onChange(Number(next));}}/></label>;
}
