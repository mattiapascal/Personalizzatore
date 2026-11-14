import {EDITOR_LIMITS} from './limits';
import {useInspectorController,type InspectorControllerChange} from './inspector-controller';
import {EditorButton} from './EditorButton';
import { useEffect,useLayoutEffect,useRef, useState } from 'react';
import { ObjectIdentity } from './ObjectIdentity';
import { SelectedTextFontNotice } from './SelectedTextFontNotice';
import { FontPicker } from './FontPicker';
import { applyCharacterStyle, characterStyles, compressStyles, type TextObject } from './text-style';
import { chooseFontStyle } from './fonts';
import { lineAlignments, compressLineAlignments } from './text-lines';
import type { InspectorSnapshot } from './use-inspector-draft';
/** A recovery form, never a geometry inspector with guessed dimensions. */
export function UnverifiedTextInspector({object,revision,onApply,onFontMenuOpen,onControllerChange}:{onControllerChange?:InspectorControllerChange;object:TextObject;revision:number;onFontMenuOpen:()=>void;onApply:(object:TextObject,revision:number)=>InspectorSnapshot|null}) {
 const [text,setText]=useState(object.text),[error,setError]=useState(''),input=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{input.current?.setCustomValidity(error);},[error]);
 useEffect(()=>{setText(object.text);setError('');},[object,revision]);
 const save=()=>{
  if(text===object.text){setError('');input.current?.setCustomValidity('');return true;}
  const before=Array.from(object.text),after=Array.from(text);let start=0,end=0;
  while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  while(end<before.length-start&&end<after.length-start&&before[before.length-1-end]===after[after.length-1-end])end++;
  const styles=characterStyles(object),lines=lineAlignments(object),inserted=after.length-start-end;
  const next={...object,text,characterStyles:compressStyles([...styles.slice(0,start),...Array.from({length:inserted},()=>({...styles[Math.max(0,start-1)]})),...styles.slice(before.length-end)]),lineStyles:compressLineAlignments([...lines.slice(0,start),...Array.from({length:inserted},()=>lines[Math.max(0,start-1)]),...lines.slice(before.length-end)],after.length,text.endsWith('\n'))};
  if(!next.characterStyles.length)delete(next as TextObject).characterStyles;
  if(!next.lineStyles.length)delete(next as TextObject).lineStyles;
  if(!onApply(next,revision)){const message='Modifica non applicata: controlla il testo.';setError(message);input.current?.setCustomValidity(message);return false;}setError('');return true;
 };
 useInspectorController(save,onControllerChange);
 return <div className="object-inspector" aria-label="Proprietà oggetto">
  <div className="inspector-selection"><ObjectIdentity object={object}/></div>
  <div role="tablist" aria-label="Sezioni dell’ispettore" className="inspector-tabs"><EditorButton role="tab" aria-selected={false} disabled icon="geometry" label="Geometria"/><EditorButton role="tab" aria-selected={true} icon="text" label="Testo" id="recovery-text-tab" aria-controls="recovery-text-content"/></div><div className="inspector-content" role="tabpanel" id="recovery-text-content" aria-labelledby="recovery-text-tab">
  <SelectedTextFontNotice object={object}/>
  <p className="caption" data-testid="unverified-text-geometry">Ingombro non verificato: il riquadro arancione è un segnaposto. Correggi il testo o scegli un font; posizione e stili originali sono conservati.</p>
  <FontPicker disabled={false} value={object.fontFamily} onOpen={onFontMenuOpen} onChange={fontFamily=>onApply(applyCharacterStyle(object,chooseFontStyle(fontFamily)),revision)}/>
  <label>Testo da correggere<textarea maxLength={EDITOR_LIMITS.textCharacters*2} ref={input} aria-invalid={!!error} aria-label="Testo da correggere" value={text} onChange={event=>{setText(event.target.value);setError('');}} onBlur={()=>{save();}} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();setText(object.text);setError('');}}}/></label>
  {error&&<p role="alert">{error}</p>}
 </div></div>;
}
