import{EditorIcon}from'./EditorButton';
export function AspectRatioControl({linked,onChange}:{linked:boolean;onChange:(value:boolean)=>void}){
 return <label className="aspect-ratio-control" title={linked?'Proporzioni collegate: modifica entrambe le misure':'Proporzioni separate: modifica una sola misura'}><input className="sr-only" aria-label="Mantieni proporzioni" type="checkbox" checked={linked} onChange={event=>onChange(event.target.checked)}/><EditorIcon name={linked?'link':'unlink'}/></label>;
}
