import {EditorButton} from './EditorButton';
import type {StrokeCap} from './stroke-cap';
export function StrokeCapControl({value,disabled=false,dotted=false,onChange}:{value:StrokeCap|null;disabled?:boolean;dotted?:boolean;onChange:(value:StrokeCap)=>void}){
 return <fieldset className="inspector-arrangement" disabled={disabled||dotted}><legend>Estremità</legend><div className="button-row" role="group" aria-label="Estremità del contorno">{([['butt','capButt','Estremità piatte'],['round','capRound','Estremità arrotondate'],['square','capSquare','Estremità quadrate']]as const).map(([cap,icon,label])=><EditorButton key={cap} icon={icon} label={label} aria-pressed={value===cap} onClick={()=>onChange(cap)}/>)}</div>{dotted&&<p className="caption">Il contorno punteggiato usa estremità arrotondate. Torna a continuo o tratteggiato per cambiarle.</p>}</fieldset>;
}
