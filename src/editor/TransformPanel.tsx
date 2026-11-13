import {useMovablePanel} from './use-movable-panel';
import {useLayoutEffect,useRef,useState,useId,type CSSProperties} from 'react';
import {EditorButton} from './EditorButton';
import {NumberField} from './InspectorNumberField';
import {objectInclination} from './object-affine';
import {MAX_TEXT_SKEW_DEG} from './limits';
import {selectionUnits} from './selection';
import {effectiveObjectProperties} from './object-properties';
import {textGeometryVerified} from './font-measurement';
import type {GraphicDocument} from './model';
import type {AreaAlignment} from './align-area';

export function TransformPanel({document:doc,ids,masterId,page,customer,busy,onPage,onAlign,onIncline,onReflect,onDistribute}: {
 document:GraphicDocument;ids:string[];masterId:string|null;page:boolean;customer:boolean;busy:boolean;
 onPage:(value:boolean)=>void;onAlign:(alignment:AreaAlignment)=>void;onIncline:(angle:number)=>void;
 onReflect:(axis:'horizontal'|'vertical')=>void;onDistribute:(axis:'horizontal'|'vertical')=>void;
}) {
 const [open,setOpen]=useState(false),anchor=useRef<HTMLDivElement>(null),panelId=useId(),[position,setPosition]=useState<CSSProperties>({});
 useLayoutEffect(()=>{
  if(!open)return;
  const place=()=>{const box=anchor.current?.getBoundingClientRect();if(!box)return;const width=Math.min(320,innerWidth-16),height=Math.min(540,innerHeight-24);setPosition({position:'fixed',left:Math.max(8,Math.min(box.left,innerWidth-width-8)),top:Math.max(8,Math.min(box.bottom+8,innerHeight-height-8)),width,maxHeight:height});};
  const outside=(event:Event)=>{if(event.target instanceof Element&&!anchor.current?.contains(event.target)&&!event.target.closest('.drawing-stage'))setOpen(false);};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setOpen(false);anchor.current?.querySelector('button')?.focus();}};
  place();window.addEventListener('pointerdown',outside,true);window.addEventListener('keydown',key,true);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',key,true);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open]);
 const floating=useMovablePanel(open,position);
 const objects=doc.objects.filter(object=>ids.includes(object.id)),units=selectionUnits(doc,ids),angles=objects.map(objectInclination),angle=angles[0]??0,mixed=angles.some(value=>Math.abs(value-angle)>1e-7);
 const locked=busy||!objects.length||objects.some(object=>customer&&(effectiveObjectProperties(doc,object.id).transformLocked||effectiveObjectProperties(doc,object.id).hideMenus)||object.type==='text'&&!textGeometryVerified(object));
 const master=objects.find(object=>object.id===masterId),name=master?.editor?.label||master?.id;
 return <div className="workspace-transform-toggle" ref={anchor}>
  <EditorButton icon="transform" label="Trasforma" aria-expanded={open} aria-controls={panelId} onClick={()=>setOpen(!open)}/>
  <aside ref={floating.panelRef} id={panelId} hidden={!open} style={floating.style} className="workspace-transform-popover" aria-label="Trasforma">
   <div className="layers-popover-heading" {...floating.headingProps}><strong>Trasforma</strong><EditorButton className="panel-close" icon="close" label="Chiudi pannello Trasforma" onClick={()=>setOpen(false)}/></div>
   {!objects.length&&<p className="caption">Seleziona gli oggetti da trasformare.</p>}
   <fieldset disabled={locked} className="inspector-arrangement">
    <h3>Inclina</h3>
    <NumberField label="Inclinazione orizzontale (°)" value={angle} mixed={mixed} revision={doc.revision} min={-MAX_TEXT_SKEW_DEG} max={MAX_TEXT_SKEW_DEG} step={0.1} onChange={value=>{if(Math.abs(value)<=MAX_TEXT_SKEW_DEG)onIncline(value);}}/>
    {objects.length>1&&<p className="caption">Imposta l’inclinazione del riquadro di ogni elemento, mantenendone il centro.</p>}
    <h3>Rifletti</h3>
    <div className="button-row"><EditorButton icon="flipX" label="Rifletti orizzontalmente" onClick={()=>onReflect('horizontal')}/><EditorButton icon="flipY" label="Rifletti verticalmente" onClick={()=>onReflect('vertical')}/></div>
    <h3>Allinea</h3>
    <label className="transform-page-option"><input type="checkbox" checked={page} onChange={event=>onPage(event.target.checked)}/>Allinea alla pagina</label>
    <p className="caption" role="status">{page?'Riferimento: bordi e centro della pagina.':master?`Oggetto master: ${name}`:'Riferimento: ingombro della selezione.'}</p>
    <div className="button-row">{([['left','Allinea a sinistra'],['centerX','Centra orizzontalmente'],['right','Allinea a destra'],['top','Allinea in alto'],['centerY','Centra verticalmente'],['bottom','Allinea in basso']] as const).map(([alignment,label])=><EditorButton key={alignment} icon={alignment} label={label} disabled={!page&&units.length<2} onClick={()=>onAlign(alignment)}/>)}</div>
    <div className="button-row"><EditorButton icon="distributeX" label="Distribuisci spazi orizzontali" disabled={units.length<3} onClick={()=>onDistribute('horizontal')}/><EditorButton icon="distributeY" label="Distribuisci spazi verticali" disabled={units.length<3} onClick={()=>onDistribute('vertical')}/></div>
   </fieldset>
   <p className="caption">Per scegliere il master, fai un clic senza trascinare su un oggetto già compreso nella selezione multipla. Il master resta fermo.</p>
  </aside>
 </div>;
}
