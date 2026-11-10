import type {ReactNode} from 'react';
export function NumericStepper({label,value,min,max,step=.1,disabled,onStep,children}:{label:string;value:number|null;min:number;max:number;step?:number;disabled?:boolean;onStep:(value:number)=>void;children:ReactNode}){
 const change=(direction:number)=>{const next=value===null?min:Math.round((value+direction*step)*1e9)/1e9;onStep(Math.max(min,Math.min(max,next)));};
 return <span className="numeric-stepper">{children}<span className="numeric-stepper-buttons"><button type="button" tabIndex={-1} aria-label={`Aumenta ${label}`} title={`Aumenta ${label}`} disabled={disabled||value!==null&&value>=max} onMouseDown={event=>event.preventDefault()} onClick={()=>change(1)}>▲</button><button type="button" tabIndex={-1} aria-label={`Diminuisci ${label}`} title={`Diminuisci ${label}`} disabled={disabled||value!==null&&value<=min} onMouseDown={event=>event.preventDefault()} onClick={()=>change(-1)}>▼</button></span></span>;
}
