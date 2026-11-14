import {EditorButton} from './EditorButton';
import {NumberField} from './InspectorNumberField';
import type {StrokeJoin} from './path-stroke';
export function StrokeJoinControl({value,limit,revision,disabled=false,onChange,onLimit}:{value:StrokeJoin|null;limit:number|null;revision:number;disabled?:boolean;onChange:(value:StrokeJoin)=>void;onLimit:(value:number)=>void}){
 return <fieldset className="inspector-arrangement" disabled={disabled}><legend>Giunzioni</legend><div className="button-row" role="group" aria-label="Giunzioni del contorno">{([['miter','joinMiter','Giunzioni a punta'],['round','joinRound','Giunzioni arrotondate'],['bevel','joinBevel','Giunzioni smussate']]as const).map(([join,icon,label])=><EditorButton key={join} icon={icon} label={label} aria-pressed={value===join} onClick={()=>onChange(join)}/>)}</div>{value==='miter'&&<><NumberField label="Limite delle punte" value={limit??4} mixed={limit===null} revision={revision} min={1} max={100} step={.1} onChange={onLimit}/><p className="caption">Rapporto massimo tra lunghezza della punta e metà spessore. Oltre questo limite la giunzione viene smussata.</p></>}</fieldset>;
}
