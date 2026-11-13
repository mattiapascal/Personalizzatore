import {useMovablePanel} from './use-movable-panel';
import {useLayoutEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {EditorButton,type EditorIconName} from './EditorButton';

export function ToolbarMenu({label,icon,children}:{label:string;icon:EditorIconName;children:ReactNode}){
 const [open,setOpen]=useState(false),anchor=useRef<HTMLDivElement>(null),[style,setStyle]=useState<CSSProperties>({});
 useLayoutEffect(()=>{
  if(!open)return;
  const place=()=>{const box=anchor.current?.getBoundingClientRect();if(box){const width=Math.min(320,innerWidth-16);setStyle({position:'fixed',width,left:Math.max(8,Math.min(box.left,innerWidth-width-8)),top:Math.max(8,box.bottom+8),maxHeight:Math.max(80,innerHeight-box.bottom-24)});}};
  const outside=(event:Event)=>{if(event.target instanceof Node&&!anchor.current?.contains(event.target))setOpen(false);};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setOpen(false);anchor.current?.querySelector('button')?.focus();}};
  place();window.addEventListener('pointerdown',outside,true);window.addEventListener('keydown',key,true);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',key,true);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open]);
 const floating=useMovablePanel(open,style);
 return <div ref={anchor} className="workspace-edit-toggle"><EditorButton icon={icon} label={label} aria-expanded={open} onClick={()=>setOpen(!open)}/><aside ref={floating.panelRef} aria-label={label} hidden={!open} className="workspace-transform-popover" style={floating.style}><div className="layers-popover-heading" {...floating.headingProps}><strong>{label}</strong><EditorButton className="panel-close" icon="close" label={`Chiudi pannello ${label}`} onClick={()=>setOpen(false)}/></div>{children}</aside></div>;
}
