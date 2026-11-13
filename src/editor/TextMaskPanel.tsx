import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
import { rectangularTextMask,TEXT_MASK_LOCAL_LIMIT,type TextClipMask } from './text-clip-masks';
import type { TextObject } from './text-style';
export function TextMaskPanel({object,frame,revision,disabled,onChange}:{object:TextObject;frame:{widthMm:number;heightMm:number};revision:number;disabled:boolean;onChange:(masks:TextClipMask[]|undefined)=>void}){
 const masks=object.textClipMasks??[];
 const update=(index:number,change:Partial<TextClipMask['frameMm']>)=>{const next=structuredClone(masks);Object.assign(next[index]!.frameMm,change);onChange(next);};
 const fields={revision,step:.1,disabled},limit=TEXT_MASK_LOCAL_LIMIT;
 return <details className="text-mask-settings"><summary>Maschera del testo{masks.length?' · attiva':''}</summary>
  <p className="caption">La maschera ritaglia la grafica senza eliminare i caratteri. Può nascondere parte del testo anche quando il box ha altezza automatica.</p>
  <EditorButton icon="crop" label="Aggiungi maschera rettangolare al testo" disabled={disabled||masks.length>=8} onClick={()=>{const em=object.fontSizePt*25.4/72;onChange([...masks,rectangularTextMask(frame.widthMm/(object.textScaleX??1)+2*em,frame.heightMm/(object.textScaleY??1)+2*em)]);}}/>
  {masks.map((mask,index)=>{const f=mask.frameMm,cx=f.x+f.width/2,cy=f.y+f.height/2;return <fieldset key={index} disabled={disabled}><legend>Maschera {index+1}</legend><div className="property-grid">
   <NumberField {...fields} label={`Centro X maschera ${index+1} (mm)`} value={cx} min={-limit} max={limit} onChange={value=>update(index,{x:value-f.width/2})}/>
   <NumberField {...fields} label={`Centro Y maschera ${index+1} (mm)`} value={cy} min={-limit} max={limit} onChange={value=>update(index,{y:value-f.height/2})}/>
   <NumberField {...fields} label={`Larghezza maschera ${index+1} (mm)`} value={f.width} min={.001} max={limit} onChange={value=>{if(value>0)update(index,{x:cx-value/2,width:value});}}/>
   <NumberField {...fields} label={`Altezza maschera ${index+1} (mm)`} value={f.height} min={.001} max={limit} onChange={value=>{if(value>0)update(index,{y:cy-value/2,height:value});}}/>
  </div><EditorButton icon="delete" label={`Rimuovi maschera ${index+1}`} disabled={disabled} onClick={()=>{const next=masks.filter((_,i)=>i!==index);onChange(next.length?next:undefined);}}/></fieldset>;})}
  {!!masks.length&&<p role="status" className="caption">Maschera attiva: controlla che il testo desiderato sia visibile. Le misure sono locali al testo, prima della dilatazione e dell’inclinazione.</p>}
 </details>;
}
