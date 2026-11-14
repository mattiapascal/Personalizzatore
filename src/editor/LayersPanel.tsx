import {canReorderGroupMember,innermostGroup} from './group-member';
import {selectableObjectIds,effectiveObjectProperties,visibilityProblem} from './object-properties';
import {objectIsVisible,groupIsVisible} from './scene-visibility';
import {useEffect,useRef,useState,type ReactNode,type PointerEvent} from 'react';
import type {GraphicDocument,SceneObject,SceneGroup} from './model';
import {expandSelection,canReorderSelection} from './selection';
import {EditorButton,EditorIcon} from './EditorButton';
import {ObjectIdentity,objectTypeLabel} from './ObjectIdentity';
import {rootGroupFor} from './scene-groups';
interface Drag{ids:string[];revision:number;documentId:string;pageId:string;memberId?:string;}
interface Drop{kind:'row'|'group'|'root';id:string;side:'above'|'below';parentGroupId?:string|null;}
export function LayersPanel({customer=false,document:doc,selectedIds,directObjectId,onSelectObject,disabled,multiple,onSelect,onPlace,onPlaceMember,onReorder,onVisibility,onBeginDrag,actions}:{
 customer?:boolean;document:GraphicDocument;selectedIds:string[];directObjectId?:string|null;disabled:boolean;multiple:boolean;actions:ReactNode;
 onBeginDrag?:()=>GraphicDocument|null;
 onSelect:(id:string,additive:boolean)=>void;onSelectObject?:(id:string)=>void;
 onPlace:(ids:string[],target:string,side:'above'|'below',revision:number)=>void;
 onPlaceMember?:(id:string,parentGroupId:string|null,targetObjectId:string|undefined,side:'above'|'below',revision:number)=>void;
 onReorder:(position:'front'|'forward'|'backward'|'back')=>void;
 onVisibility?:(kind:'object'|'group',id:string,visible:boolean,revision:number)=>void;
}){
 const drag=useRef<Drag|null>(null),pointer=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null),destination=useRef<Drop|null>(null),list=useRef<HTMLDivElement>(null);
 const [hover,setHover]=useState<Drop|null>(null),[dragging,setDragging]=useState(false),[memberDrag,setMemberDrag]=useState(false);
 const clear=()=>{drag.current=null;pointer.current=null;destination.current=null;setHover(null);setDragging(false);setMemberDrag(false);};
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();event.stopImmediatePropagation();clear();}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[]);
 useEffect(()=>{if(disabled||drag.current&&(drag.current.documentId!==doc.documentId||drag.current.pageId!==(doc.pageId??'page-1')))clear();},[disabled,doc.documentId,doc.pageId]);
 const begin=(ids:string[],memberId?:string)=>{if(disabled)return false;const current=onBeginDrag?onBeginDrag():doc;if(!current||current.documentId!==doc.documentId||(current.pageId??'page-1')!==(doc.pageId??'page-1')||ids.some(id=>!current.objects.some(object=>object.id===id)))return false;drag.current={ids,memberId,revision:current.revision,documentId:current.documentId,pageId:current.pageId??'page-1'};setDragging(true);setMemberDrag(!!memberId);return true;};
 const beginObject=(object:SceneObject)=>{
  if(customer&&effectiveObjectProperties(doc,object.id).selectionLocked)return false;
  const member=!!onPlaceMember&&(!!innermostGroup(doc,object.id)||!selectedIds.includes(object.id)||selectedIds.length===1);
  return begin(member?[object.id]:selectedIds.includes(object.id)?expandSelection(doc,selectedIds):expandSelection(doc,[object.id]),member?object.id:undefined);
 };
 const locate=(element:HTMLElement|null,y:number)=>{
  const source=drag.current,node=element?.closest<HTMLElement>('[data-layer-id],[data-layer-group-id],[data-layer-root-drop]');
  if(!node||!list.current?.contains(node)||!source){destination.current=null;setHover(null);return;}
  const bounds=node.getBoundingClientRect(),side=y<bounds.y+bounds.height/2?'above':'below';let drop:Drop|null=null;
  if(node.dataset.layerId){const id=node.dataset.layerId;if(source.memberId){if(id!==source.memberId)drop={kind:'row',id,side,parentGroupId:innermostGroup(doc,id)?.id??null};}else if(!expandSelection(doc,[id]).some(id=>source.ids.includes(id)))drop={kind:'row',id,side};}
  else if(node.dataset.layerGroupId){const group=doc.groups?.find(group=>group.id===node.dataset.layerGroupId);if(group){if(source.memberId)drop={kind:'group',id:group.id,side:'above',parentGroupId:group.id};else if(!group.objectIds.some(id=>source.ids.includes(id)))drop={kind:'row',id:group.objectIds[0]!,side};}}
  else if(source.memberId&&node.dataset.layerRootDrop)drop={kind:'root',id:node.dataset.layerRootDrop,side:node.dataset.layerRootDrop==='top'?'above':'below',parentGroupId:null};
  destination.current=drop;setHover(drop);
 };
 const commit=()=>{const source=drag.current,target=destination.current;clear();if(!source||!target||disabled||source.documentId!==doc.documentId||source.pageId!==(doc.pageId??'page-1'))return;if(source.memberId&&onPlaceMember)onPlaceMember(source.memberId,target.parentGroupId??null,target.kind==='row'?target.id:undefined,target.side,source.revision);else if(target.kind==='row')onPlace(source.ids,target.id,target.side,source.revision);};
 const gripEvents=(start:()=>boolean)=>({
  onPointerDown:(event:PointerEvent<HTMLButtonElement>)=>{if(disabled||event.button!==0)return;event.preventDefault();if(!start())return;pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);},
  onPointerMove:(event:PointerEvent<HTMLButtonElement>)=>{const active=pointer.current;if(!active||event.pointerId!==active.id)return;active.moved||=Math.hypot(event.clientX-active.x,event.clientY-active.y)>4;if(!active.moved)return;const bounds=list.current!.getBoundingClientRect();if(event.clientY<bounds.top+25)list.current!.scrollTop-=12;else if(event.clientY>bounds.bottom-25)list.current!.scrollTop+=12;locate(document.elementFromPoint(event.clientX,event.clientY)as HTMLElement|null,event.clientY);},
  onPointerUp:(event:PointerEvent<HTMLButtonElement>)=>{if(pointer.current?.id!==event.pointerId)return;const moved=pointer.current.moved;if(moved)commit();else clear();if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);},
  onPointerCancel:clear,onLostPointerCapture:()=>{if(pointer.current)clear();},
 });
 const dropEvents={onDragOver:(event:React.DragEvent<HTMLElement>)=>{if(!drag.current||disabled)return;event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';locate(event.currentTarget,event.clientY);},onDrop:(event:React.DragEvent<HTMLElement>)=>{if(!drag.current||disabled)return;event.preventDefault();event.stopPropagation();locate(event.currentTarget,event.clientY);commit();}};
 const visibilityButton=(kind:'object'|'group',id:string,own:boolean,effective:boolean)=>{
  if(!onVisibility)return null;const problem=visibilityProblem(doc,kind,id,customer?'customer':'admin'),action=`${own?'Nascondi':'Mostra'} ${kind==='group'?'gruppo':'oggetto'} ${id}`;
  return <button type="button" className="layer-visibility" disabled={!!problem} aria-label={action} aria-pressed={own} title={problem??`${action} · La visibilità vale anche per i file esportati.${own&&!effective?' Nascosto dal gruppo.':''}`} onDragStart={event=>{event.preventDefault();event.stopPropagation();}} onClick={()=>onVisibility(kind,id,!own,doc.revision)}><EditorIcon name={own?'eye':'eyeOff'}/></button>;
 };
 const renderObject=(object:SceneObject)=>{
  const visible=objectIsVisible(doc,object),locked=!visible||customer&&!selectableObjectIds(doc,[object.id],'customer').length,directLocked=!visible||customer&&!selectableObjectIds(doc,[object.id],'customer',true).length,reorderLocked=customer&&!!effectiveObjectProperties(doc,object.id).selectionLocked,selected=selectedIds.includes(object.id),group=rootGroupFor(doc,object.id),preview=object.type==='text'?object.text.replace(/\s+/gu,' ').trim():'';
  return <div key={object.id} className="layer-row" data-layer-id={object.id} data-visible={visible} data-selected={selected} data-grouped={!!group} data-drop={hover?.kind==='row'&&hover.id===object.id?hover.side:undefined} draggable={!disabled&&!reorderLocked}
   onDragStart={event=>{if(disabled||reorderLocked||pointer.current||!beginObject(object)){event.preventDefault();return;}event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-editor-layers',object.id);}} onDragEnd={clear} {...dropEvents}>
   <button type="button" className="layer-select" disabled={locked} aria-label={`${objectTypeLabel(object)} · ${object.id}`} aria-pressed={selected} title={`${object.id}${preview?` - ${preview}`:''}${group?` · Gruppo ${group.id}`:''}`} onClick={event=>group&&event.altKey&&onSelectObject?onSelectObject(object.id):onSelect(object.id,multiple||event.shiftKey||event.metaKey||event.ctrlKey)}><ObjectIdentity object={{...object,editor:effectiveObjectProperties(doc,object.id)}}/></button>
   {group&&onSelectObject&&<button type="button" className="layer-direct-select" disabled={directLocked} aria-label={`Seleziona solo ${object.id}`} title="Seleziona solo questo elemento · Option/Alt + clic nel canvas" aria-pressed={directObjectId===object.id} onClick={()=>onSelectObject(object.id)}><EditorIcon name="directSelect"/></button>}
   {visibilityButton('object',object.id,object.visible!==false,visible)}
   <button type="button" className="layer-grip" disabled={reorderLocked} aria-label={`Sposta livello ${object.id}`} title="Trascina per cambiare livello o gruppo" {...gripEvents(()=>beginObject(object))}><EditorIcon name="grip"/></button>
  </div>;
 };
 const renderGroup=(group:SceneGroup):ReactNode=>{const root=!group.parentId,visible=groupIsVisible(doc,group),reorderLocked=customer&&group.objectIds.some(id=>effectiveObjectProperties(doc,id).selectionLocked),locked=!visible||!selectableObjectIds(doc,group.objectIds,customer?'customer':'admin').length,label=group.editor?.label||group.id;
  return <div className="layer-container" key={'group:'+group.id} role="group" aria-label={`Contenuto gruppo ${label}`}><div className="layer-group-heading" data-root={root} data-visible={visible} data-selected={group.objectIds.every(id=>selectedIds.includes(id))} data-layer-group-id={group.id} data-drop={hover?.kind==='group'&&hover.id===group.id?'inside':undefined} draggable={root&&!disabled&&!reorderLocked} {...dropEvents} onDragStart={event=>{if(!root||disabled||reorderLocked||pointer.current||!begin([...group.objectIds])){event.preventDefault();return;}event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-editor-layers',group.id);}} onDragEnd={clear}>
   {root?<button type="button" className="layer-select" disabled={locked} aria-label={`Seleziona gruppo ${group.id}`} onClick={()=>onSelect(group.objectIds[0]!,false)}><EditorIcon name="groupFolder"/>{label}</button>:<span className="layer-group-name"><EditorIcon name="groupFolder"/>{label}</span>}
   {visibilityButton('group',group.id,group.visible!==false,visible)}
   {root&&<button type="button" className="layer-grip" disabled={reorderLocked} aria-label={`Sposta gruppo ${group.id}`} {...gripEvents(()=>begin([...group.objectIds]))}><EditorIcon name="grip"/></button>}
  </div><div className="layer-group-children">{renderItems(group.id)}</div></div>;
 };
 const renderItems=(parentId:string|null):ReactNode[]=>{const parent=doc.groups?.find(group=>group.id===parentId),allowed=new Set(parent?.objectIds??doc.objects.map(object=>object.id)),groups=doc.groups?.filter(group=>(group.parentId??null)===parentId)??[],seen=new Set<string>(),result:ReactNode[]=[];for(const object of[...doc.objects].reverse()){if(!allowed.has(object.id)||seen.has(object.id))continue;const group=groups.find(group=>group.objectIds.includes(object.id));if(group){group.objectIds.forEach(id=>seen.add(id));result.push(renderGroup(group));}else{seen.add(object.id);result.push(renderObject(object));}}return result;};
 const single=selectedIds.length===1,labels=single?['Porta in primo piano','Avanti di un livello','Indietro di un livello','Porta sul fondo']:['Porta selezione in primo piano','Avanza selezione di un livello','Arretra selezione di un livello','Porta selezione sul fondo'];
 const rootDrop=(position:'top'|'bottom')=>!!onPlaceMember&&!!doc.groups?.length&&<div className="layer-root-drop" data-active={memberDrag} data-layer-root-drop={position} data-drop={hover?.kind==='root'&&hover.id===position?'inside':undefined} {...dropEvents}>Fuori dai gruppi · {position==='top'?'primo piano':'fondo'}</div>;
 return <fieldset className="editor-actions layers-content" disabled={disabled}><div className="layers-actions">{actions}</div><h3 className="layers-section-title">Ordine</h3><div className="button-row" role="group" aria-label="Ordine livelli">{(['front','forward','backward','back']as const).map((position,index)=><EditorButton preserveFocus key={position} icon={position} label={labels[index]!} disabled={!selectedIds.length||!(directObjectId?canReorderGroupMember(doc,directObjectId,position):canReorderSelection(doc,selectedIds,position))} onClick={()=>onReorder(position)}/>)}</div><p className="caption">Primo piano in alto. Le prese dei singoli elementi cambiano ordine o contenitore; la presa nell’intestazione sposta l’intero gruppo.</p><div ref={list} className="layer-list" role="group" aria-label="Oggetti del progetto" data-dragging={dragging}>{rootDrop('top')}{renderItems(null)}{rootDrop('bottom')}</div>{!doc.objects.length&&<p className="caption">Il progetto è vuoto.</p>}</fieldset>;
}
