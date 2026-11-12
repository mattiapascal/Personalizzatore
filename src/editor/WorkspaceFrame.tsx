import{config as fabricConfig}from'fabric';
import { useCanvasPan } from './use-canvas-pan';
import { EditorButton } from './EditorButton';
import { useEffect, useLayoutEffect, useRef, useState, useId, type CSSProperties, type ReactNode } from 'react';
import type { GraphicDocument } from './model';
import { PX_PER_MM,canvasZoomLimit } from './canvas-size';

export function WorkspaceFrame({ context, stage, tools, properties, project, diagnostics, document: doc, editing, onZoom, layers, panTool, onTemporaryPan, workflow, actions, showForm=false, mode='test' }: {
  context: ReactNode; stage: ReactNode; tools: ReactNode; properties: ReactNode; project: ReactNode; diagnostics: ReactNode;
  document: GraphicDocument; editing: boolean; onZoom: (zoom: number) => void;
  showForm?:boolean;actions?:ReactNode;mode?:'customer'|'admin'|'test';workflow?: ReactNode; layers: ReactNode; panTool: boolean; onTemporaryPan: (active: boolean) => void;
}) {
  const root = useRef<HTMLElement>(null), viewport = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(() => new URLSearchParams(window.location.search).get('workspace') === '1');
  const [objectsOpen, setObjectsOpen] = useState(() => window.innerWidth >= 900);
  const [propertiesOpen, setPropertiesOpen] = useState(() => window.innerWidth >= 900);
  const [workflowOpen,setWorkflowOpen]=useState(()=>mode==='customer'&&!!doc.plaque),workflowAnchor=useRef<HTMLDivElement>(null),workflowPanel=useRef<HTMLElement>(null);
  useEffect(()=>{if(showForm&&mode==='customer')setWorkflowOpen(true);},[showForm,mode,doc.documentId]);
  const workflowTitle=showForm?'Compila i dati':'Prodotto e fissaggi';
  const [layersOpen, setLayersOpen] = useState(false), layerAnchor = useRef<HTMLDivElement>(null), layerId = useId();
  const [layerPosition, setLayerPosition] = useState<CSSProperties>({});
  const maximumZoom=canvasZoomLimit(doc.areaMm,Math.max(fabricConfig.devicePixelRatio??window.devicePixelRatio??1,1));
  const [zoom, setZoom] = useState(()=>Math.min(1,maximumZoom)), [screenError, setScreenError] = useState('');
  const [viewReady,setViewReady]=useState(false),autoFit=useRef(true);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const view = useRef({ zoom: Math.min(1,maximumZoom), panX: 0, panY: 0 }), live = useRef({ onZoom, editing }); live.current = { onZoom, editing };
  useCanvasPan(viewport, view, panTool, editing, onTemporaryPan);
  const updateZoom = (value: number, anchor?: { x: number; y: number }, fitting=false) => {
    autoFit.current=fitting;
    const next = Math.max(0.01, Math.min(maximumZoom, value)), container = viewport.current?.querySelector<HTMLElement>('.canvas-container'), before = container?.getBoundingClientRect(), previous = view.current.zoom;
    if (anchor && Math.abs(next - previous) < 1e-9) return;
    const point = anchor && before ? { x: (anchor.x - before.left) / previous, y: (anchor.y - before.top) / previous } : null;
    if (!point) { view.current.panX = 0; view.current.panY = 0; if (container) container.style.transform = ''; }
    view.current.zoom = next; setZoom(next); live.current.onZoom(next);
    if (container && anchor && point) {
      // Compensate flex centering and scrollbar changes as the document crosses the viewport edges.
      for (let i = 0; i < 3; i++) {
        const after = container.getBoundingClientRect(); view.current.panX += anchor.x - (after.left + point.x * next); view.current.panY += anchor.y - (after.top + point.y * next);
        container.style.transform = `translate(${view.current.panX}px, ${view.current.panY}px)`;
      }
    }
  };
  useEffect(()=>{if(view.current.zoom>maximumZoom)updateZoom(maximumZoom);},[maximumZoom]);
  useEffect(() => {
    const area = viewport.current?.querySelector<HTMLElement>('.canvas-scroll'); if (!area) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); if (live.current.editing || area.dataset.panDragging === 'true') return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? area.clientHeight : 1, delta = Math.max(-200, Math.min(200, event.deltaY * unit));
      if (delta) updateZoom(view.current.zoom * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015)), { x: event.clientX, y: event.clientY });
    };
    area.addEventListener('wheel', wheel, { passive: false }); return () => area.removeEventListener('wheel', wheel);
  }, [maximumZoom]);
  useEffect(() => {
    if (!layersOpen) return;
    const position = () => {
      const anchor = layerAnchor.current?.getBoundingClientRect(); if (!anchor) return;
      const width = Math.min(360, innerWidth - 16), below = innerHeight - anchor.bottom - 16, above = anchor.top - 16;
      const height = Math.max(1, Math.min(600, innerHeight - 16, Math.max(below, above))), top = below >= Math.min(300, height) || below >= above ? Math.max(8, anchor.bottom + 8) : Math.max(8, anchor.top - height - 8);
      setLayerPosition({ left: Math.max(8, Math.min(anchor.left, innerWidth - width - 8)), top: Math.min(top, innerHeight - height - 8), width, height });
    };
    position();
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !layerAnchor.current?.contains(event.target)) setLayersOpen(false); };
    const focusOutside = (event: FocusEvent) => { if (event.target instanceof Node && !layerAnchor.current?.contains(event.target)) setLayersOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); setLayersOpen(false); layerAnchor.current?.querySelector<HTMLButtonElement>('button')?.focus(); } };
    window.addEventListener('pointerdown', outside, true); window.addEventListener('focusin', focusOutside, true); window.addEventListener('keydown', key, true); window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
    return () => { window.removeEventListener('pointerdown', outside, true); window.removeEventListener('focusin', focusOutside, true); window.removeEventListener('keydown', key, true); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [layersOpen]);
  useEffect(()=>{
    if(!workflowOpen||mode==='test')return;
    const position=()=>{const anchor=workflowAnchor.current?.getBoundingClientRect(),panel=workflowPanel.current;if(!anchor||!panel)return;const width=Math.min(360,innerWidth-16),below=innerHeight-anchor.bottom-16,above=anchor.top-16,height=Math.min(680,Math.max(below,above),innerHeight-16),top=below>=Math.min(260,height)||below>=above?anchor.bottom+8:anchor.top-height-8;Object.assign(panel.style,{position:'fixed',left:`${Math.max(8,Math.min(anchor.left,innerWidth-width-8))}px`,top:`${Math.max(8,top)}px`,width:`${width}px`,maxHeight:`${Math.max(100,height)}px`});};
    const outside=(event:Event)=>{if(event.target instanceof Node&&!workflowAnchor.current?.contains(event.target))setWorkflowOpen(false);};const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setWorkflowOpen(false);workflowAnchor.current?.querySelector<HTMLButtonElement>('button')?.focus();}};
    const focusOutside=(event:FocusEvent)=>{if(event.relatedTarget instanceof Node&&workflowAnchor.current?.contains(event.relatedTarget))outside(event);};
    position();window.addEventListener('pointerdown',outside,true);window.addEventListener('focusin',focusOutside,true);window.addEventListener('keydown',key,true);window.addEventListener('resize',position);return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('focusin',focusOutside,true);window.removeEventListener('keydown',key,true);window.removeEventListener('resize',position);};
  },[workflowOpen,mode]);
  const fit = () => {
    const area = viewport.current?.querySelector<HTMLElement>('.canvas-scroll'); if (!area||area.clientWidth<=48||area.clientHeight<=48) return;
    area.scrollLeft=0;area.scrollTop=0;
    updateZoom(Math.min((area.clientWidth - 48) / (doc.areaMm.width * PX_PER_MM), (area.clientHeight - 48) / (doc.areaMm.height * PX_PER_MM)),undefined,true);
  };
  useLayoutEffect(()=>{setViewReady(!expanded);},[expanded,doc.documentId,doc.pageId,doc.areaMm.width,doc.areaMm.height]);
  useEffect(()=>{
    if(!expanded)return;
    autoFit.current=true;
    const frame=requestAnimationFrame(()=>{fit();setViewReady(true);});
    return()=>cancelAnimationFrame(frame);
  },[expanded,doc.documentId,doc.pageId,doc.areaMm.width,doc.areaMm.height]);
  useEffect(()=>{
    const area=viewport.current?.querySelector<HTMLElement>('.canvas-scroll');if(!expanded||!area)return;
    const observer=new ResizeObserver(()=>{if(autoFit.current&&!live.current.editing)fit();});observer.observe(area);return()=>observer.disconnect();
  },[expanded,doc.documentId,doc.pageId,doc.areaMm.width,doc.areaMm.height]);
  const close = () => {
    if (document.fullscreenElement === root.current) void document.exitFullscreen();
    updateZoom(1); setExpanded(false);
  };
  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const blocked: { element: HTMLElement; inert: boolean }[] = [];
    for (let current: HTMLElement | null = root.current; current?.parentElement; current = current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) { blocked.push({ element: sibling, inert: sibling.inert }); sibling.inert = true; }
      }
      if (current.parentElement === document.body) break;
    }
    const frame = requestAnimationFrame(() => { root.current?.querySelector<HTMLButtonElement>('.workspace-close')?.focus(); });
    return () => { document.body.style.overflow = overflow; blocked.forEach(({ element, inert }) => { element.inert = inert; }); cancelAnimationFrame(frame); root.current?.querySelector<HTMLButtonElement>('.workspace-toolbar button')?.focus(); };
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    const escape = (event: KeyboardEvent) => {
      if (root.current?.querySelector('dialog[open]')) return;
      if (event.key === 'Escape' && !editing && !(event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable=true]'))) close();
      if (event.key === 'Tab' && !editing) {
        const focusable = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(element => element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[inert]'));
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [expanded, editing]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 899px)');
    const changed = () => { if (media.matches) { if (!root.current?.querySelector('.objects-panel dialog[open]')) setObjectsOpen(false); setPropertiesOpen(false); } };
    media.addEventListener('change', changed); return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    const changed = () => setNativeFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', changed); return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  return <section ref={root} role={expanded ? 'dialog' : 'region'} aria-modal={expanded || undefined} data-editor-mode={mode} className={`lab panel${expanded ? ' editor-workspace' : ''}`} aria-labelledby={expanded ? 'workspace-title' : 'lab-title'} data-testid="editor-workspace" data-view-ready={viewReady}>
    <div className="workspace-toolbar">
      {expanded ? <>
        <strong id="workspace-title">Area di disegno <span className="caption">· {mode==='admin'?'Amministrazione':mode==='customer'?'Cliente':'TEST'}</span></strong>
        <div className="workspace-panel-switches">
          <EditorButton aria-pressed={objectsOpen} onClick={() => { setObjectsOpen(!objectsOpen); if (window.innerWidth < 900) { setPropertiesOpen(false); } }} icon="objects" label="Strumenti"/>
          <EditorButton aria-pressed={propertiesOpen} onClick={() => { setPropertiesOpen(!propertiesOpen); if (window.innerWidth < 900) { setObjectsOpen(false); } }} icon="properties" label="Ispettore"/>
        </div>
        <label className="workspace-zoom">Zoom<input aria-label="Zoom canvas (%)" type="range" min="1" max={Math.round(maximumZoom*100)} step="1" disabled={editing} value={Math.round(zoom * 100)} onChange={event => updateZoom(Number(event.target.value) / 100)}/><output>{Math.round(zoom * 100)}%</output></label>
        <EditorButton disabled={editing} onClick={fit} icon="fit" label="Adatta all’area"/>
        {document.fullscreenEnabled && <EditorButton disabled={editing} icon={nativeFullscreen ? 'collapse' : 'expand'} label={nativeFullscreen ? 'Riduci finestra browser' : 'Schermo intero browser'} onClick={() => {
          if (nativeFullscreen) void document.exitFullscreen();
          else void root.current?.requestFullscreen().catch(() => setScreenError('Il browser non ha consentito lo schermo intero. La vista espansa resta disponibile.'));
        }}/>}
        <EditorButton className="workspace-close" disabled={editing} onClick={close} icon="return" label="Torna al laboratorio"/>
      </> : <EditorButton onClick={() => setExpanded(true)} disabled={editing} icon="workspace" label="Apri area di disegno a tutto schermo"/>}
      <div ref={layerAnchor} className="workspace-layers-toggle">
        <EditorButton aria-pressed={layersOpen} aria-expanded={layersOpen} aria-controls={layerId} onClick={() => {setLayersOpen(!layersOpen);setWorkflowOpen(false);}} icon="layers" label="Pannello livelli"/>
        <aside id={layerId} className="workspace-layers-popover" aria-label="Pannello livelli" hidden={!layersOpen} style={layerPosition}>
          <div className="layers-popover-heading"><strong>Livelli</strong><EditorButton className="panel-close" icon="close" label="Chiudi pannello livelli" onClick={() => { setLayersOpen(false); layerAnchor.current?.querySelector<HTMLButtonElement>('button')?.focus(); }}/></div>
          {layers}
        </aside>
      </div>
      {mode!=='test'&&workflow&&<div className="workspace-workflow-toggle" ref={workflowAnchor}><EditorButton icon="geometry" label={workflowTitle} aria-expanded={workflowOpen} onClick={()=>{setWorkflowOpen(!workflowOpen);setLayersOpen(false);}}/><aside ref={workflowPanel} className="workspace-workflow-popover" aria-label={workflowTitle} hidden={!workflowOpen}><div className="layers-popover-heading"><strong>{workflowTitle}</strong><EditorButton className="panel-close" icon="close" label="Chiudi pannello prodotto" onClick={()=>setWorkflowOpen(false)}/></div>{workflow}</aside></div>}
      {actions&&<div className="design-session-actions" aria-label="Azioni del design">{actions}</div>}
    </div>
    {!expanded && context}
    <div className="workspace-layout" data-objects-open={objectsOpen} data-properties-open={propertiesOpen} data-layers-open={layersOpen}>
      <div ref={viewport} className="drawing-stage">{stage}{screenError && <p role="status">{screenError}</p>}</div>
      <aside className="workspace-panel objects-panel" aria-label="Strumenti" hidden={expanded && !objectsOpen}>{mode==='test'&&workflow}{tools}{project}{diagnostics}</aside>
      <div className="workspace-right-panels" hidden={expanded && !propertiesOpen}>
        <aside className="workspace-panel properties-panel" aria-label="Ispettore oggetto" hidden={expanded && !propertiesOpen}>{properties}</aside>
      </div>
    </div>
  </section>;
}
