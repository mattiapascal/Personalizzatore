import {assertOutputFonts} from '../editor/font-preflight';
import {assertDocumentTextProduction} from '../editor/text-production';
import {assertDocumentProduction} from '../editor/production-check';
import {browserBinaryRasterCheck} from '../editor/production-check-browser';
import {productionDocument} from '../editor/object-properties';
import {validateObjectInputs} from '../editor/object-properties';
import { useEffect, useId, useRef, useState } from 'react';
import { InkPreviewFilter } from '../editor/InkPreviewFilter';
import { INK_PREVIEWS, type InkColor } from '../editor/ink';
import type { GraphicDocument } from '../editor/model';
import { assertDocumentFonts, fontIssueMessage, type FontReport } from '../editor/font-preflight';
import { fixtureCatalog } from '../catalog/adapter';
import { profileKey } from '../catalog/schema';
import type { CartSummary, ConfigurationCommand, FrozenConfiguration } from './schema';
export interface WorkflowEditorApi {
  document: GraphicDocument; busy: boolean; busyReason?: string;
  peek: () => GraphicDocument;
  /** Apply pending manual inputs before creating a proposal. */
  prepare: () => GraphicDocument | null;
  /** Check a captured proposal without rebasing its revision. */
  validate: (snapshot: GraphicDocument) => boolean;
  capture: () => Promise<{ document: GraphicDocument; svg: string }>;
  open: (document: GraphicDocument) => Promise<boolean>;
}
async function request<T>(path = '', body?: ConfigurationCommand): Promise<T> {
  const response = await fetch(`/__editor-local/configurations/${path}`, { method: body ? 'POST' : 'GET', headers: { 'X-Editor-Local': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Il carrello di prova non è disponibile'); return data;
}
function SvgPreview({ svg, document, label, color='black' }: { svg: string; document:GraphicDocument; label: string; color?:InkColor }) {
  const [state,setState]=useState<{svg:string;document:GraphicDocument;url?:string;error?:string}|null>(null),current=state?.svg===svg&&state.document===document?state:null,url=current?.url;
  const filterId=`configuration-ink-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
  useEffect(() => { let active=true,uri='';setState(null);void assertOutputFonts(productionDocument(document)).then(()=>{if(!active)return;uri=URL.createObjectURL(new Blob([svg.replace(/<!DOCTYPE[^>]*>/g,'' )],{type:'image/svg+xml'}));setState({svg,document,url:uri});}).catch(cause=>{if(active)setState({svg,document,error:cause instanceof Error?cause.message:'Anteprima non disponibile'});});return()=>{active=false;if(uri)URL.revokeObjectURL(uri);};},[svg,document]);
  return current?.error?<span role="alert">{current.error}</span>:url ? <><InkPreviewFilter id={filterId} color={color}/><img src={url} alt={label} className="configuration-preview" style={{filter:color==='black'?'none':`url(#${filterId})`}}/></> : <span>Preparazione anteprima…</span>;
}
function SavedPreview({ id, title }: { id: string; title: string }) {
  const [config, setConfig] = useState<FrozenConfiguration | null>(null), [error, setError] = useState(false);
  useEffect(() => { let active = true; setConfig(null); setError(false); void request<FrozenConfiguration>(id).then(value => { if (active) setConfig(value); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, [id]);
  return config ? <SvgPreview svg={config.svg} document={config.document} color={config.document.inkColor??config.options.inkColor} label={`Grafica salvata: ${title}`}/> : <span>{error ? 'Anteprima non disponibile' : 'Preparazione anteprima…'}</span>;
}
type Line = CartSummary['lines'][number];
type Capture = Awaited<ReturnType<WorkflowEditorApi['capture']>>;
export function ConfigurationPanel({ api }: { api: WorkflowEditorApi }) {
  const [state, setState] = useState<CartSummary | null>(null), [title, setTitle] = useState(''), [quantity, setQuantity] = useState(1);
  const [target, setTarget] = useState<Line | null>(null), [working, setWorking] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [view, setView] = useState<'cart' | 'review' | 'remove' | null>(null), [review, setReview] = useState<Capture | null>(null), [removing, setRemoving] = useState<Line | null>(null);
  const [fontReport, setFontReport] = useState<FontReport | null>(null);
  const modal = useRef<HTMLDialogElement>(null), headingId = useId(), busy = useRef(false), pending = useRef<{ key: string; command: ConfigurationCommand } | null>(null);
  useEffect(() => { const node = modal.current; if (!node) return; if (view && !node.open) node.showModal(); else if (!view && node.open) node.close(); if (view) node.querySelector<HTMLElement>('[data-dialog-heading]')?.focus(); }, [view]);
  const refresh = async () => { setState(await request<CartSummary>()); };
  const run = async (operation: () => Promise<void>) => {
    if (busy.current) return; busy.current = true; setWorking(true); setError('');
    try { await operation(); } catch (error) { setError(error instanceof TypeError ? 'Non ho ricevuto conferma. Riprova: la stessa operazione non aggiungerà due volte l’articolo.' : error instanceof Error ? error.message : 'Operazione non riuscita'); }
    finally { busy.current = false; setWorking(false); }
  };
  const openConfiguration = async (config: FrozenConfiguration, line: Line | null) => {
    const current = api.peek(), source = config.document;
    if (current.productId !== source.productId || current.variantId !== source.variantId) {
      const product = fixtureCatalog.list().find(p => p.productId === source.productId && p.variantIds.includes(source.variantId ?? ''));
      if (!product) throw new Error('Il formato di questo articolo non è disponibile nei formati di prova');
      const query = new URLSearchParams({ workspace: '1', configurations: '1', format: profileKey(product), configuration: config.id });
      if (line) { query.set('line', line.id); query.set('lineVersion', String(line.version)); }
      window.location.assign(`/editor?${query}`); return;
    }
    if (!await api.open({ ...source, inkColor:source.inkColor??config.options.inkColor, documentId: crypto.randomUUID(), revision: 0 })) throw new Error('Non è stato possibile aprire la grafica');
    setTarget(line); setTitle(''); pending.current = null; setError(''); setView(null);
    setNotice(line ? `Stai modificando «${line.title}». Il carrello cambierà solo dopo la tua conferma.` : `Copia di «${config.title}» aperta. Cambia la grafica, poi aggiungila come un nuovo articolo. L’originale resta nel carrello.`);
  };
  const openLine = async (line: Line, replace: boolean) => {
    const before = api.peek(), latest = await request<CartSummary>(); setState(latest); const actual = latest.lines.find(item=>item.id===line.id); if (!actual || actual.configurationId!==line.configurationId || actual.version!==line.version) throw new Error('Questo articolo è stato modificato o rimosso. L’elenco è stato aggiornato: scegli nuovamente l’articolo.'); const config = await request<FrozenConfiguration>(line.configurationId), current = api.peek();
    if (before.documentId !== current.documentId || before.revision !== current.revision) throw new Error('Il progetto è cambiato durante il caricamento: ripeti l’apertura');
    await openConfiguration(config, replace ? line : null);
  };
  useEffect(() => {
    const before = api.peek(); let active = true; void (async () => {
      try { const next = await request<CartSummary>(); if (!active) return; setState(next);
        const params = new URLSearchParams(window.location.search), id = params.get('configuration'); if (!id) return;
        const lineId = params.get('line'), line = lineId ? next.lines.find(l => l.id === lineId && l.configurationId === id && l.version === Number(params.get('lineVersion'))) : null;
        if (lineId && !line) throw new Error('L’articolo è cambiato o è stato rimosso. Apri il carrello di prova e scegli nuovamente l’articolo.');
        const config = await request<FrozenConfiguration>(id); if (active) { const current = api.peek(); if (current.documentId !== before.documentId || current.revision !== before.revision) throw new Error('Il progetto è cambiato durante il caricamento: apertura annullata'); await openConfiguration(config, line ?? null); }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Il carrello di prova non è disponibile'); }
    })(); return () => { active = false; };
  }, []);
  const startReview = async () => {
    setNotice('');
    const catalog={version:fixtureCatalog.version,products:fixtureCatalog.list()};
    const captured = await api.capture();assertDocumentTextProduction(captured.document,catalog,true);validateObjectInputs(captured.document);const report = await assertDocumentFonts(captured.document);
    await assertDocumentProduction(captured.document,catalog,browserBinaryRasterCheck,true);
    if(!api.validate(captured.document))throw Error('La grafica è cambiata. Controlla nuovamente l’anteprima.');
    setReview(captured); setFontReport(report);
    setTitle(captured.document.objects.filter(o => o.type === 'text').map(o => o.text.replace(/\s+/g, ' ')).join(' · ').trim().slice(0,120) || 'Composizione grafica');
    setView('review');
  };
  const confirm = async () => {
    if (!review) return;
    if (!api.validate(review.document)) throw new Error('La grafica è cambiata. Torna nell’editor e controlla nuovamente l’anteprima.');
    const key = JSON.stringify([review.document.documentId, review.document.revision, title, quantity, target?.id, target?.configurationId, target?.version]);
    if (!pending.current || pending.current.key !== key) {
      const args = { ...review, title, options: { inkColor: review.document.inkColor??'black' as const } };
      const command: ConfigurationCommand = target ? { requestId: crypto.randomUUID(), tool: 'replace', arguments: { ...args, lineId: target.id, expectedConfigurationId: target.configurationId, expectedVersion: target.version } } : { requestId: crypto.randomUUID(), tool: 'add', arguments: { ...args, quantity } };
      pending.current = { key, command };
    }
    const previous = target; setState(await request<CartSummary>('', pending.current.command)); pending.current = null;
    setNotice(previous ? `«${previous.title}» è stato sostituito con «${title}». Gli altri articoli sono rimasti invariati.` : `«${title}» è stato aggiunto. Gli articoli già presenti sono rimasti invariati.`);
    setTarget(null); setView('cart');
  };
  const showCart = () => { setView('cart'); void run(refresh); };
  return <section className="configuration-panel" aria-label="Progetto e carrello di prova">
    <p className="configuration-kicker">Prova locale · nessun acquisto</p>
    <strong>{target ? `Modifica di «${target.title}»` : 'Stai creando un nuovo articolo'}</strong>
    <p>{target ? 'Modifica la grafica sul foglio. Dopo il controllo potrai sostituire solo questo articolo nel carrello.' : 'Modifica la grafica sul foglio, poi controlla l’anteprima e aggiungila al carrello di prova.'}</p>
    {api.busy && <p className="caption">{api.busyReason??'Completa l’operazione sul foglio prima di continuare.'}</p>}
    {!api.document.objects.length && <p className="caption">Il foglio è vuoto: aggiungi un testo o un’immagine prima di continuare.</p>}
    {!view && error && <p role="alert" className="error">{error}</p>}{!view && notice && <p role="status" className="configuration-notice">{notice}</p>}
    <button type="button" className="configuration-primary" disabled={working || api.busy || !api.document.objects.length} onClick={()=>void run(startReview)}>{target ? 'Controlla le modifiche' : 'Controlla e aggiungi'}</button>
    <button type="button" disabled={working || api.busy} onClick={showCart}>Carrello di prova ({state?.lines.length ?? 0})</button>
    {target && <button type="button" className="configuration-link" disabled={working} onClick={() => { setTarget(null); pending.current = null; setNotice('Modifica annullata. L’articolo nel carrello non è cambiato; la grafica attuale resta nell’editor.'); }}>Annulla la modifica dell’articolo</button>}
    <dialog ref={modal} className="configuration-dialog" aria-labelledby={headingId} onCancel={event => { event.preventDefault(); if (!working) setView(null); }}>
      <div className="configuration-dialog-heading"><div><p className="configuration-kicker">Prova locale · prezzi e acquisti non collegati</p><h2 id={headingId} data-dialog-heading tabIndex={-1}>{view === 'review' ? target ? 'Controlla la sostituzione' : 'Controlla il nuovo articolo' : view === 'remove' ? 'Rimuovere questo articolo?' : 'Carrello di prova'}</h2></div><button type="button" className="configuration-close" aria-label="Chiudi riepilogo e torna all’editor" disabled={working} onClick={() => setView(null)}>×</button></div>
      {error && <p role="alert" className="error">{error}</p>}
      {error && view==='review' && target && <div className="configuration-conflict"><p>Le tue modifiche sono ancora nell’editor. Puoi controllare il carrello aggiornato oppure preparare un nuovo articolo con questa grafica.</p><button type="button" disabled={working} onClick={showCart}>Vedi il carrello aggiornato</button><button type="button" disabled={working} onClick={()=>{setTarget(null);pending.current=null;setError('');}}>Continua come nuovo articolo</button></div>}
      {view === 'review' && review && <>
        <p>{target ? `Confermando sostituirai soltanto «${target.title}». Gli altri articoli non cambieranno.` : 'Confermando aggiungerai un nuovo articolo. Gli articoli già nel carrello non cambieranno.'}</p>
        <p>Colore dell’impronta di prova: <strong>{INK_PREVIEWS[review.document.inkColor??'black'].label}</strong>.</p>
        {!!fontReport?.issues.length && <div className="font-check-panel" role="status">{fontReport.issues.map(issue=><p key={`${issue.objectId}:${issue.fontId}:${issue.kind}`}>{fontIssueMessage(issue)}</p>)}</div>}
        <div className={`configuration-review${target ? ' has-previous' : ''}`}>
          {target && <div><h3>Adesso nel carrello</h3><SavedPreview id={target.configurationId} title={target.title}/><p className="configuration-text">{target.text}</p></div>}
          <div><h3>{target ? 'Dopo la conferma' : 'Grafica da aggiungere'}</h3><SvgPreview svg={review.svg} document={review.document} color={review.document.inkColor??'black'} label="Anteprima della grafica da confermare"/><p className="configuration-text">{review.document.objects.filter(o=>o.type==='text').map(o=>o.text).join(' · ')}</p></div>
        </div>
        <div className="configuration-fields"><label>Nome articolo<input aria-label="Nome configurazione" value={title} maxLength={120} onChange={event=>setTitle(event.target.value)} disabled={working}/></label>{target ? <p>Quantità: <strong>{target.quantity}</strong></p> : <label>Quantità<input aria-label="Quantità configurazione" type="number" min={1} max={999} value={quantity} onChange={event=>setQuantity(Number(event.target.value))} disabled={working}/></label>}</div>
        <div className="configuration-dialog-actions"><button type="button" disabled={working} onClick={()=>setView(null)}>Continua a modificare</button><button type="button" className="configuration-primary" disabled={working || !title.trim() || !Number.isInteger(quantity) || quantity<1 || quantity>999} onClick={()=>void run(confirm)}>{working ? 'Conferma in corso…' : target ? 'Sostituisci questo articolo' : 'Aggiungi al carrello di prova'}</button></div>
      </>}
      {view === 'cart' && <>
        {notice && <p role="status" className="configuration-notice">{notice}</p>}
        <p>{state?.lines.length ? `${state.lines.length} articoli salvati. Ogni anteprima mostra la grafica che hai aggiunto.` : 'Il carrello di prova è vuoto. Torna nell’editor per creare il primo articolo.'}</p>
        <div className="configuration-lines">{state?.lines.map(line=><article key={line.id} className="configuration-line" data-testid="configuration-line">
          <div><SavedPreview id={line.configurationId} title={line.title}/><p className="configuration-text">{line.text || 'Composizione grafica'}</p></div>
          <div><h3>{line.title}</h3><p>{line.widthMm} × {line.heightMm} mm · Quantità: {line.quantity} · Impronta: {INK_PREVIEWS[line.options.inkColor].label}</p>
            <div className="configuration-choice"><button type="button" disabled={working || api.busy} onClick={()=>void run(()=>openLine(line,false))}>Crea una copia da aggiungere</button><small>Per un altro numero o testo. Questo articolo resterà identico.</small></div>
            <div className="configuration-choice"><button type="button" disabled={working || api.busy} onClick={()=>void run(()=>openLine(line,true))}>Modifica questo articolo nel carrello</button><small>Aggiornerai soltanto questa riga, dopo aver confermato l’anteprima.</small></div>
            <button type="button" className="configuration-link" disabled={working} onClick={()=>{setRemoving(line);setView('remove');}}>Rimuovi dal carrello di prova</button>
          </div>
        </article>)}</div>
        <div className="configuration-dialog-actions"><button type="button" className="configuration-primary" disabled={working} onClick={()=>setView(null)}>Torna all’editor</button></div>
      </>}
      {view === 'remove' && removing && <>
        <p>Rimuoverai «{removing.title}» dal carrello di prova. Gli altri articoli resteranno invariati.</p><SavedPreview id={removing.configurationId} title={removing.title}/>
        <div className="configuration-dialog-actions"><button type="button" disabled={working} onClick={()=>setView('cart')}>Mantieni articolo</button><button type="button" disabled={working} onClick={()=>void run(async()=>{setState(await request<CartSummary>('',{requestId:crypto.randomUUID(),tool:'remove',arguments:{lineId:removing.id,expectedConfigurationId:removing.configurationId,expectedVersion:removing.version}}));setNotice(`«${removing.title}» è stato rimosso.`);setView('cart');})}>Conferma rimozione</button></div>
      </>}
    </dialog>
  </section>;
}
