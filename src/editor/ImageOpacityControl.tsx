import {NumberField} from './InspectorNumberField';
export function ImageOpacityControl({opacity,revision,onChange,selection=false}:{opacity:number|null;revision:number;onChange:(opacity:number,immediate?:boolean)=>void;selection?:boolean}){
 const value=opacity===null?0:Math.round((1-opacity)*1e6)/1e4,label=`Trasparenza immagine${selection?' selezione':''}`;
 const change=(percent:number,immediate=false)=>{if(Number.isFinite(percent)&&percent>=0&&percent<=100)onChange((100-percent)/100,immediate);};
 return <fieldset className="paint-opacity inspector-arrangement"><legend>Trasparenza immagine</legend><div className="paint-opacity-row">
  <NumberField label={`${label} (%)`} value={value} mixed={opacity===null} revision={revision} min={0} max={100} step={1} onChange={percent=>change(percent)}/>
  <input type="range" aria-label={label} aria-valuetext={opacity===null?'Mista':`${value}% trasparente`} min="0" max="100" step="1" value={value} onChange={event=>change(Number(event.target.value),true)}/>
 </div><p className="caption">0% opaca · 100% trasparente. Si combina con la trasparenza dei pixel; l’originale resta invariato.</p></fieldset>;
}
