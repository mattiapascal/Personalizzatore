import { parseTags,tagKey } from './archive-tags';
export function ArchiveTagInput({label,value,onChange,vocabulary,name='tags'}:{label:string;value:string;onChange:(value:string)=>void;vocabulary:readonly string[];name?:string}){
 const selected=parseTags(value),keys=new Set(selected.map(tagKey));
 return <div className="archive-tag-input"><label>{label}<input name={name} value={value} maxLength={900} onChange={event=>onChange(event.target.value)} placeholder="timbri, fattura, datario"/></label>
 <label>Aggiungi un tag salvato<select aria-label={`${label}: tag salvati`} value="" onChange={event=>{if(event.target.value)onChange([...selected,event.target.value].join(', '));}}><option value="">Scegli dall’elenco…</option>{vocabulary.filter(tag=>!keys.has(tagKey(tag))).map(tag=><option value={tag} key={tagKey(tag)}>{tag}</option>)}</select></label>
 {!!selected.length&&<div className="archive-tag-chips" aria-label={`${label}: tag assegnati`}>{selected.map(tag=><button type="button" key={tagKey(tag)} aria-label={`Rimuovi tag ${tag}`} onClick={()=>onChange(selected.filter(item=>tagKey(item)!==tagKey(tag)).join(', '))}>{tag} <span aria-hidden="true">×</span></button>)}</div>}
 <p className="caption">Puoi assegnare più tag, separati da virgole. I nuovi tag saranno riutilizzabili dopo il salvataggio.</p></div>;
}
