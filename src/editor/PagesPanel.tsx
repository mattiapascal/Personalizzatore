import{useEffect,useLayoutEffect,useRef,useState,type CSSProperties}from'react';import{EditorButton}from'./EditorButton';import{activeGraphicPageId,graphicPages,blankGraphicPage}from'./pages';import type{GraphicDocument,GraphicCommand}from'./model';
export function PagesPanel({document,disabled,onCommand}:{document:GraphicDocument;disabled:boolean;onCommand:(tool:GraphicCommand['tool'],args:unknown)=>void}){
 const pages=graphicPages(document),active=activeGraphicPageId(document),index=pages.findIndex(page=>activeGraphicPageId(page)===active),[name,setName]=useState(document.pageName??'Pagina 1'),[removing,setRemoving]=useState(false),[open,setOpen]=useState(false),details=useRef<HTMLDetailsElement>(null),panel=useRef<HTMLElement>(null),[position,setPosition]=useState<CSSProperties|null>(null);
 const close=()=>{if(details.current)details.current.open=false;details.current?.querySelector('summary')?.focus();};
 useEffect(()=>{setName(document.pageName??'Pagina 1');setRemoving(false);},[active,document.pageName]);
 useLayoutEffect(()=>{
  if(!open)return;
  const place=()=>{
   const anchor=details.current?.querySelector('summary')?.getBoundingClientRect(),element=panel.current;if(!anchor||!element||!details.current?.open)return;
   const width=Math.min(340,innerWidth-16),above=anchor.top-16,below=innerHeight-anchor.bottom-16,limit=Math.max(1,Math.min(420,innerHeight-16,Math.max(above,below)));
   element.style.width=width+'px';element.style.maxHeight=limit+'px';const height=element.getBoundingClientRect().height;
   const top=above>=below?anchor.top-height-8:anchor.bottom+8;
   setPosition({left:Math.max(8,Math.min(anchor.right-width,innerWidth-width-8)),top:Math.max(8,Math.min(top,innerHeight-height-8)),width,maxHeight:limit});
  };
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!details.current?.contains(event.target)&&details.current)details.current.open=false;};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}};
  place();const observer=new ResizeObserver(place);if(panel.current)observer.observe(panel.current);
  window.addEventListener('resize',place);window.addEventListener('scroll',place,true);window.addEventListener('pointerdown',outside,true);window.addEventListener('keydown',key,true);
  return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',key,true);};
 },[open]);
 return <details ref={details} className="page-manager" onToggle={event=>{setOpen(event.currentTarget.open);if(!event.currentTarget.open)setPosition(null);}}><summary>Gestisci pagine</summary><section ref={panel} className="page-manager-panel" aria-label="Gestione pagine" style={{...position,visibility:position?'visible':'hidden'}}><div className="layers-popover-heading"><strong>Pagine del progetto</strong><EditorButton className="page-manager-close" icon="close" label="Chiudi gestione pagine" onClick={close}/></div><label>Nome pagina<input aria-label="Nome pagina" value={name} maxLength={120} disabled={disabled} onChange={event=>setName(event.target.value)} onBlur={()=>{if(!name.trim())setName(document.pageName??'Pagina 1');else if(name.trim()!==(document.pageName??'Pagina 1'))onCommand('renamePage',{pageId:active,name:name.trim()});}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/></label>
 <div className="button-row"><EditorButton icon="newFile" label="Aggiungi pagina vuota" disabled={disabled||pages.length>=100} onClick={()=>onCommand('addPage',{page:blankGraphicPage(document,`page-${crypto.randomUUID()}`,`Pagina ${pages.length+1}`)})}/><EditorButton icon="duplicate" label="Duplica pagina" disabled={disabled||pages.length>=100} onClick={()=>onCommand('duplicatePage',{pageId:active,newPageId:`page-${crypto.randomUUID()}`,name:(document.pageName??'Pagina 1').slice(0,112)+' · copia'})}/><EditorButton icon="forward" label="Sposta pagina prima" disabled={disabled||index<=0} onClick={()=>onCommand('reorderPage',{pageId:active,index:index-1})}/><EditorButton icon="backward" label="Sposta pagina dopo" disabled={disabled||index>=pages.length-1} onClick={()=>onCommand('reorderPage',{pageId:active,index:index+1})}/><EditorButton icon="delete" label="Elimina pagina" disabled={disabled||pages.length===1} onClick={()=>setRemoving(true)}/></div>
 {removing&&<div className="notice" role="group" aria-label="Conferma eliminazione pagina"><p>Eliminare «{document.pageName??'Pagina 1'}» con tutti i suoi oggetti?</p><button disabled={disabled} onClick={()=>{onCommand('removePage',{pageId:active});setRemoving(false);}}>Conferma elimina pagina</button><button onClick={()=>setRemoving(false)}>Mantieni pagina</button></div>}
 </section></details>;
}
