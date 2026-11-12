import{useLayoutEffect,useRef,type KeyboardEvent}from'react';import{createPortal}from'react-dom';import{EditorIcon}from'./EditorButton';
export function CanvasContextMenu({point,selected,canPaste,busy,onCopy,onCut,onPaste,onClose}:{point:{x:number;y:number};selected:boolean;canPaste:boolean;busy:boolean;onCopy:()=>void;onCut:()=>void;onPaste:(fit:boolean)=>void;onClose:()=>void}){
 const menu=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const element=menu.current!;const rect=element.getBoundingClientRect();element.style.left=`${Math.max(8,Math.min(point.x,innerWidth-rect.width-8))}px`;element.style.top=`${Math.max(8,Math.min(point.y,innerHeight-rect.height-8))}px`;element.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
 const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!element.contains(event.target))onClose();};const cancel=()=>onClose();window.addEventListener('pointerdown',outside,true);window.addEventListener('resize',cancel);window.addEventListener('blur',cancel);return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',cancel);window.removeEventListener('blur',cancel);};},[point.x,point.y]);
 const keyboard=(event:KeyboardEvent)=>{const buttons=[...menu.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];if(event.key==='Escape'){event.preventDefault();onClose();return;}if(event.key==='Tab'){onClose();return;}if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const at=buttons.indexOf(document.activeElement as HTMLButtonElement),index=event.key==='Home'?0:event.key==='End'?buttons.length-1:(at+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[index]?.focus();}};
 const run=(action:()=>void)=>{onClose();action();};
 return createPortal(<div ref={menu} className="canvas-context-menu" role="menu" aria-label="Menu oggetti" style={{left:point.x,top:point.y}} onKeyDown={keyboard} onContextMenu={event=>event.preventDefault()}>
 <button role="menuitem" type="button" disabled={!selected||busy} onClick={()=>run(onCut)}><EditorIcon name="cut"/>Taglia<span aria-hidden="true">⌘/Ctrl X</span></button>
 <button role="menuitem" type="button" disabled={!selected||busy} onClick={()=>run(onCopy)}><EditorIcon name="copy"/>Copia<span aria-hidden="true">⌘/Ctrl C</span></button>
 <button role="menuitem" type="button" disabled={!canPaste||busy} onClick={()=>run(()=>onPaste(false))}><EditorIcon name="paste"/>Incolla<span aria-hidden="true">⌘/Ctrl V</span></button>
 <button role="menuitem" type="button" disabled={!canPaste||busy} onClick={()=>run(()=>onPaste(true))}><EditorIcon name="fit"/>Incolla adattando al foglio</button>
 </div>,document.body);
}
