import {useLayoutEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {EditorIcon} from './EditorButton';
export function GuideContextMenu({point,onDelete,onClose}:{point:{x:number;y:number};onDelete:()=>void;onClose:()=>void}){
 const menu=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const element=menu.current!,rect=element.getBoundingClientRect();element.style.left=`${Math.max(8,Math.min(point.x,innerWidth-rect.width-8))}px`;element.style.top=`${Math.max(8,Math.min(point.y,innerHeight-rect.height-8))}px`;element.querySelector('button')?.focus({preventScroll:true});
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!element.contains(event.target))onClose();},cancel=()=>onClose();
  window.addEventListener('pointerdown',outside,true);window.addEventListener('resize',cancel);window.addEventListener('blur',cancel);window.addEventListener('scroll',cancel,true);
  return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',cancel);window.removeEventListener('blur',cancel);window.removeEventListener('scroll',cancel,true);};
 },[point.x,point.y]);
 return createPortal(<div ref={menu} className="canvas-context-menu" role="menu" aria-label="Menu guida" style={{left:point.x,top:point.y}} onContextMenu={event=>event.preventDefault()} onKeyDown={event=>{event.stopPropagation();if(event.key==='Escape'||event.key==='Tab'){if(event.key==='Escape')event.preventDefault();onClose();}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();menu.current?.querySelector('button')?.focus();}}}>
  <button type="button" role="menuitem" onClick={onDelete}><EditorIcon name="delete"/>Elimina guida<span aria-hidden="true">Canc</span></button>
 </div>,document.body);
}
