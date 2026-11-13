import {useEffect,useRef,useState,type CSSProperties,type RefObject,type PointerEvent,type KeyboardEvent} from 'react';

/** Positions belong to the workspace UI, never to the graphic document. */
export function useMovablePanel(open:boolean,base:CSSProperties,externalRef?:RefObject<HTMLElement|null>){
 const ownRef=useRef<HTMLElement>(null),panelRef=externalRef??ownRef,[point,setPoint]=useState<{left:number;top:number}|null>(null);
 const gesture=useRef<{pointer:number;x:number;y:number;left:number;top:number;width:number;height:number}|null>(null);
 const clamp=(left:number,top:number,width:number,height:number)=>({left:Math.max(8,Math.min(left,innerWidth-Math.min(width,innerWidth-16)-8)),top:Math.max(8,Math.min(top,innerHeight-Math.min(height,innerHeight-16)-8))});
 useEffect(()=>{
  if(!open)return;
  const resize=()=>{const panel=panelRef.current;if(panel)setPoint(current=>{if(!current)return current;const next=clamp(current.left,current.top,panel.offsetWidth,panel.offsetHeight);return next.left===current.left&&next.top===current.top?current:next;});};
  const observer=new ResizeObserver(resize);if(panelRef.current)observer.observe(panelRef.current);window.addEventListener('resize',resize);return()=>{observer.disconnect();window.removeEventListener('resize',resize);};
 },[open]);
 const onPointerDown=(event:PointerEvent<HTMLElement>)=>{
  if(event.button!==0||event.target instanceof Element&&event.target.closest('button,input,select,a'))return;
  const box=panelRef.current?.getBoundingClientRect();if(!box)return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
  gesture.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top,width:box.width,height:box.height};
 };
 const onPointerMove=(event:PointerEvent<HTMLElement>)=>{const g=gesture.current;if(g?.pointer!==event.pointerId)return;setPoint(clamp(g.left+event.clientX-g.x,g.top+event.clientY-g.y,g.width,g.height));};
 const finish=(event:PointerEvent<HTMLElement>)=>{if(gesture.current?.pointer===event.pointerId)gesture.current=null;};
 const onKeyDown=(event:KeyboardEvent<HTMLElement>)=>{
  if(event.target!==event.currentTarget)return;
  if(event.key==='Home'){event.preventDefault();setPoint(null);return;}
  const direction=({ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}as const)[event.key as 'ArrowLeft'];if(!direction)return;
  const box=panelRef.current?.getBoundingClientRect();if(!box)return;event.preventDefault();event.stopPropagation();const step=event.shiftKey?1:10;setPoint(clamp(box.left+direction[0]*step,box.top+direction[1]*step,box.width,box.height));
 };
 return {panelRef,style:{...base,...(point?{position:'fixed' as const,...point}:{})},headingProps:{tabIndex:0,onPointerDown,onPointerMove,onPointerUp:finish,onPointerCancel:finish,onLostPointerCapture:finish,onKeyDown,onDoubleClick:()=>setPoint(null),title:'Trascina per spostare il pannello. Frecce per spostarlo da tastiera; Home o doppio clic per riposizionarlo sotto il pulsante.','data-movable-heading':true}};
}
