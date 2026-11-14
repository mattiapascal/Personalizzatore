import {selectionGraphicHandoff,type SelectionGraphicHandoff} from './editor-assistant/selection-handoff';
import { lazy, Suspense, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createCatalog, mountFixtureCatalog as fixtureCatalog, productPage, mountSnapshot as snapshot, type CatalogAdapter } from './catalog/adapter';
import type { ProductProfile } from './catalog/schema';
import { profileKey } from './catalog/schema';
import { RuntimeSchema, type RuntimeState } from './runtime/schema';
import { ProductPreview } from './catalog/ProductPreview';
import { missingInformation } from './selection/rules';
import { SelectionChat } from './selection/SelectionChat';
import { newSession, restoreSession, SESSION_KEY } from './selection/session';
import { initialInteraction, selectionInteraction, type SelectionAction, type SelectionInteraction } from './selection/interaction';
import type { SelectionSession } from './selection/schema';
import { adviseProducts } from './selection/advisor';
const EditorLab = lazy(() => import('./editor/EditorLab').then(module => ({ default: module.EditorLab })));
const PitchprintImport=lazy(()=>import('./editor-admin/PitchprintImport'));
const ShopProductEditor=lazy(()=>import('./editor/ShopProductEditor'));
const PlaqueEditor=lazy(()=>import('./editor/PlaqueEditor'));
const ConfirmedDesign=lazy(()=>import('./editor-workflow/ConfirmedDesign'));
const EditorAdmin = lazy(() => import('./editor-admin/AdminPanel'));
const TemplateGallery = lazy(() => import('./editor-workflow/TemplateGallery'));
const EditorStandalone = lazy(() => import('./editor/EditorStandalone'));

function load(catalog: CatalogAdapter): SelectionSession {
  try { return restoreSession(localStorage.getItem(SESSION_KEY), catalog); } catch { return newSession(catalog); }
}
export function App() {
  const standalone = window.location.pathname === '/editor', admin = import.meta.env.DEV && window.location.pathname === '/editor/admin', templates = import.meta.env.DEV && window.location.pathname === '/editor/templates', plaque=import.meta.env.DEV&&window.location.pathname==='/editor/plaque',confirmed=import.meta.env.DEV&&window.location.pathname==='/editor/confirmed', pitchImport=import.meta.env.DEV&&window.location.pathname==='/editor/import-pitchprint',shopProduct=import.meta.env.DEV&&window.location.pathname==='/editor/product',localOnly = shopProduct || standalone || admin || templates || confirmed || plaque || pitchImport;
  const [initial, setInitial] = useState<RuntimeState | null>(null);
  useEffect(() => {
    if (localOnly) return;
    let active = true;
    fetch('/api/bootstrap', { signal: AbortSignal.timeout(5000) }).then(response => response.json()).then(data => {
      if (active) setInitial(RuntimeSchema.parse(data));
    }).catch(() => {
      if (active) setInitial({ csrfToken: 'offline'.repeat(8), ai: { mode: 'openai', ready: false, reason: 'Backend locale non raggiungibile. Riavvia npm run dev oppure seleziona esplicitamente la demo.', model: '', budgetUsd: 0, reservedUsd: 0, requests: 0 }, catalog: { version: fixtureCatalog.version, snapshot, checkedAt: null, pending: [] }, sync: { configured: false, intervalSeconds: 300, lastError: null, refreshing: false } });
    });
    return () => { active = false; };
  }, [localOnly]);
  if(shopProduct)return <Suspense fallback={<p>Caricamento prodotto…</p>}><ShopProductEditor/></Suspense>;
  if(pitchImport)return <Suspense fallback={<p>Caricamento importazione…</p>}><PitchprintImport/></Suspense>;
  if(plaque)return <Suspense fallback={<p>Caricamento targa…</p>}><PlaqueEditor/></Suspense>;
  if(confirmed)return <Suspense fallback={<p>Caricamento design…</p>}><ConfirmedDesign/></Suspense>;
  if (admin) return <Suspense fallback={<main><p role="status">Caricamento gestione locale…</p></main>}><EditorAdmin/></Suspense>;
  if (templates) return <Suspense fallback={<main><p role="status">Caricamento template…</p></main>}><TemplateGallery/></Suspense>;
  if (standalone) return <Suspense fallback={<main><p role="status">Caricamento editor…</p></main>}><EditorStandalone/></Suspense>;
  return initial ? <Laboratory initial={initial}/> : <main><p role="status">Avvio del laboratorio locale…</p></main>;
}
function Laboratory({ initial }: { initial: RuntimeState }) {
  const [runtime, setRuntime] = useState(initial);
  const [now, setNow] = useState(Date.now);
  const [catalogState, setCatalogState] = useState(initial.catalog);
  const catalog = useMemo(() => createCatalog(catalogState.snapshot, catalogState.version), [catalogState]);
  const [{ session, feedback, feedbackRevision, feedbackIsError, informationAnswer, clarification, clarificationBlocksSelection, contentBrief }, dispatch] = useReducer(
    (state: SelectionInteraction, action: SelectionAction) => selectionInteraction(state, action, catalog),
    undefined,
    () => initialInteraction(load(catalog)),
  );
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [mode, setMode] = useState<'server' | 'mock'>(initial.ai.mode === 'openai' ? 'server' : 'mock');
  const [tab, setTab] = useState<'selection' | 'editor'>('selection');
  const [editorBinding, setEditorBinding] = useState<{ product: ProductProfile; version: string } | null>(() => initial.catalog.snapshot.fixture&&session.selectedProductId ? { product: catalog.get(session.selectedProfileId ?? session.selectedProductId), version: catalog.version } : null);
  const [shopBinding,setShopBinding]=useState<SelectionGraphicHandoff|null>(null),[shopOpened,setShopOpened]=useState(false);
  const [editorEditing, setEditorEditing] = useState(false);
  const editorProduct = editorBinding?.product ?? null;
  const candidatesRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { setNotice('Persistenza non disponibile: la sessione resta in memoria.'); } }, [session]);
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      void fetch('/api/bootstrap', { signal: AbortSignal.timeout(5000) }).then(response => response.json()).then(data => setRuntime(RuntimeSchema.parse(data))).catch(() => {});
    }, 10_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (runtime.catalog.version === catalogState.version && runtime.catalog.checkedAt !== catalogState.checkedAt) setCatalogState(runtime.catalog);
    else if (runtime.catalog.version !== catalogState.version && !busy && !editorEditing) { setCatalogState(runtime.catalog); dispatch({ type: 'catalog' }); }
  }, [runtime.catalog, catalogState.version, catalogState.checkedAt, busy, editorEditing]);
  const catalogStale = runtime.sync.stale === true || (!catalogState.snapshot.fixture && (!catalogState.checkedAt || now - Date.parse(catalogState.checkedAt) > Math.max(600, runtime.sync.intervalSeconds * 2) * 1000));
  const missing = missingInformation(session.requirements);
  const advice = adviseProducts(catalog, session.requirements, contentBrief);
  const showingAdvice = !session.candidates.length && advice.length > 0;
  const visibleCandidates = session.candidates.length ? session.candidates : advice;
  const refreshRuntime = () => { void fetch('/api/bootstrap').then(response => response.json()).then(data => setRuntime(RuntimeSchema.parse(data))).catch(() => {}); };
  const refreshCatalog = async () => {
    setSyncBusy(true);
    try {
      const response = await fetch('/api/catalog/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Token': runtime.csrfToken }, body: '{}', signal: AbortSignal.timeout(35_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Aggiornamento non riuscito');
      setRuntime(RuntimeSchema.parse(data)); setNotice('Lettura Shopify completata.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Aggiornamento non riuscito: catalogo precedente conservato.'); }
    finally { setSyncBusy(false); }
  };
  return <>
    <header><div className="brand">IS<span> / laboratorio digitale</span></div><span className="badge">Solo locale · 0.1</span></header>
    <main>
      <div className="intro"><span className="eyebrow">Incisoria Sacchetti / Prototipo</span><h1>Troviamo il tuo <em>timbro.</em></h1><p>Raccontaci cosa vuoi imprimere. Ti aiutiamo a scegliere il formato e a preparare una prima bozza.</p></div>
      <aside className="notice environment-notice"><strong>Ambiente di prova.</strong> {catalogState.snapshot.fixture ? 'Catalogo TEST' : 'Catalogo Shopify'} · {mode === 'mock' ? 'Demo a parole chiave' : runtime.ai.ready ? 'AI collegata' : `AI non attiva: ${runtime.ai.reason}`}.</aside>
      <details className="connection-status"><summary>Collegamenti AI e catalogo</summary>
        <p>Dati del {catalogState.snapshot.capturedOn}. {runtime.ai.ready ? `Modello: ${runtime.ai.model}.` : runtime.ai.reason} BSS e PitchPrint restano il percorso attuale sulla pagina prodotto.</p>
        <p>Il modello riceve richiesta protetta, requisiti, brief protetto e domanda corrente. {runtime.ai.catalogContextEnabled ? 'Condivisione catalogo autorizzata: al massimo sei riepiloghi pertinenti, senza prezzi, ID, URL o immagini.' : 'Il contesto catalogo per il modello è disattivato.'} Proposte e immagini vengono validate dal catalogo locale. La conversazione viene inviata al provider solo in modalità AI reale, dopo il controllo privacy locale nei casi dubbi.</p>
        <div className="button-row"><button aria-pressed={mode === 'server'} disabled={busy} onClick={() => setMode('server')}>AI reale</button><button aria-pressed={mode === 'mock'} disabled={busy} onClick={() => setMode('mock')}>Demo a parole chiave</button></div>
        <p>{runtime.ai.reason ?? 'Provider pronto.'} {runtime.ai.requests} richieste complessive{runtime.ai.estimatedStandardUsd !== undefined ? ` · consumo stimato a tariffa standard: ${runtime.ai.estimatedStandardUsd.toFixed(4)} USD` : ''}.</p>
        <p>{runtime.ai.localLimitsEnforced === false ? 'Conteggio locale informativo: i limiti di spesa sono gestiti nel tuo account OpenAI.' : `Blocco prudenziale locale attivo: riserve cumulative ${runtime.ai.reservedUsd.toFixed(4)} / ${runtime.ai.budgetUsd.toFixed(2)} USD. Le riserve non sono la spesa effettiva.`} Uso e fatturazione effettivi sono nel pannello OpenAI.</p>
        <p>Resta attivo il tetto per singola conversazione: {runtime.ai.sessionBudgetUsd?.toFixed(2) ?? '0.05'} USD a tariffa standard, con riserva prima della chiamata. Può fermare l’AI prima di raggiungere quel costo effettivo; prodotti e bozza restano disponibili.</p>
        <p>{runtime.sync.configured ? `Lettura Shopify automatica ogni ${runtime.sync.intervalSeconds} secondi a server aperto.` : 'Lettura Shopify non configurata: il catalogo non si aggiorna automaticamente.'} Ultima lettura completa: {runtime.catalog.checkedAt ?? 'mai (campione iniziale)'}.</p>
        {runtime.sync.lastError && <p role="status">{runtime.sync.lastError}</p>}
        <button disabled={!runtime.sync.configured || syncBusy || runtime.sync.refreshing} onClick={() => void refreshCatalog()}>{syncBusy ? 'Lettura Shopify…' : 'Aggiorna da Shopify'}</button>
        {!!runtime.catalog.pending.length && <><h3>Prodotti esclusi o da verificare ({runtime.catalog.pending.length})</h3><ul>{runtime.catalog.pending.map(product => <li key={product.productId}>{product.title}: {product.reason}</li>)}</ul></>}
      </details>
      {runtime.catalog.version !== catalogState.version && <aside className="notice" role="status">È disponibile una nuova versione del catalogo. La bozza aperta conserva il proprio prodotto e non viene approvata automaticamente.<button disabled={busy || editorEditing} onClick={() => { setCatalogState(runtime.catalog); dispatch({ type: 'catalog' }); }}>Applica aggiornamento ai risultati</button></aside>}
      {catalogStale && <p role="alert" className="notice">Catalogo da aggiornare: le nuove proposte e lo SVG sono sospesi finché Shopify non viene riletto. Conversazione e bozza sono conservate; puoi salvare il JSON.</p>}
      {editorBinding && editorBinding.version !== catalogState.version && <p className="notice">La bozza usa una versione precedente del catalogo. Per esportare lo SVG, torna alla scelta e riapri un candidato aggiornato; la composizione verrà rivalidata. Puoi salvare subito il JSON della bozza.</p>}
      <nav aria-label="Sezioni del laboratorio"><button disabled={editorEditing} aria-pressed={tab === 'selection'} onClick={() => setTab('selection')}>01 · Scegli il timbro</button><button aria-pressed={tab === 'editor'} onClick={() => { if (editorProduct||shopBinding) setTab('editor'); else window.location.assign('/editor'); }}>02 · Editor Fabric.js</button></nav>
      {shopBinding&&<div hidden={tab!=='editor'}><Suspense fallback={<p role="status">Caricamento personalizzazione…</p>}><ShopProductEditor key={`${shopBinding.productId}:${shopBinding.kind}:${shopBinding.variantIds.join(',')}`} handoff={shopBinding} active={tab==='editor'} catalogOutdated={catalogStale} onReturn={()=>setTab('selection')} onWorkspaceChange={setShopOpened} onEditingChange={setEditorEditing}/></Suspense></div>}
      {editorBinding && <div hidden={tab !== 'editor'}><Suspense fallback={<p role="status">Caricamento laboratorio…</p>}><EditorLab product={editorBinding.product} draftText={contentBrief?.text} catalogVersion={editorBinding.version} catalogOutdated={catalogStale || editorBinding.version !== catalogState.version} onEditingChange={setEditorEditing} onKeepProduct={(id, variantId) => { const product = catalog.list().find(p => p.productId === id && p.variantIds.includes(variantId)); if (product) setEditorBinding({ product, version: catalog.version }); }}/></Suspense></div>}
      <div hidden={tab !== 'selection'}><div className="selection-grid">
        <section className="panel chat-panel" aria-labelledby="assistant-title">
          <span className="eyebrow">01 / Assistente di selezione</span><h2 id="assistant-title">Di cosa hai bisogno?</h2>
          {notice && <p role="status" className="notice">{notice}</p>}
          <SelectionChat informationAnswer={informationAnswer} feedbackIsError={feedbackIsError} session={session} feedback={feedback} feedbackRevision={feedbackRevision} clarification={clarification} clarificationBlocksSelection={clarificationBlocksSelection} contentBrief={contentBrief} catalog={catalog} runtime={runtime} mode={mode} busy={busy} active={tab === 'selection'} dispatch={dispatch} onBusy={setBusy} onComplete={refreshRuntime} onShowResults={() => candidatesRef.current?.focus()}/>
        </section>
        <section className="results-panel" aria-labelledby="candidate-title"><span className="eyebrow">Catalogo / {catalog.list().length} referenze censite</span><h2 id="candidate-title" ref={candidatesRef} tabIndex={-1}>Possibilità da verificare</h2>
          {showingAdvice && <p className="caption">Proposta iniziale basata sull’uso descritto. Montatura, ingombro e grafica restano da confermare.</p>}
          {!visibleCandidates.length && <div className="empty panel"><span className="empty-mark">↗</span><h3>{missing.length ? 'Partiamo dalle tue esigenze' : 'Nessun candidato nel campione'}</h3><p>{missing.length ? 'Raccogliamo i criteri prima di proporti una referenza.' : 'La ricerca usa soltanto i profili censiti. Non significa che il prodotto manchi nel catalogo completo.'}</p><p className="caption">Per aprire il canvas, scegli un modello dai risultati e premi «Prova nel canvas».</p></div>}
          {shopOpened&&<p className="notice" role="status">Hai una bozza aperta. Riprendila per modificarla o cambiare prodotto; chiudila dall’editor prima di iniziare un altro progetto.<button type="button" onClick={()=>setTab('editor')}>Riprendi la bozza</button></p>}<div className="candidates">{(!clarificationBlocksSelection && !catalogStale ? visibleCandidates : []).map((candidate, index) => { const p = catalog.get(candidate.profileId ?? candidate.productId); return <article className="product-card panel" key={profileKey(p)}>
            <div className="product-number">{String(index + 1).padStart(2, '0')}<span>{p.shape === 'round' ? `Ø ${p.nominalAreaMm.width}` : `${p.nominalAreaMm.width} × ${p.nominalAreaMm.height}`} mm nominali</span></div><h3>{p.title}</h3>{p.variantLabel && <p className="variant-label">Variante: {p.variantLabel}</p>}<p className="caption">Referenza Shopify · profilo TEST v{p.profileVersion} · idoneità produttiva non verificata</p>
            <ProductPreview product={p}/>
            <details><summary>Perché questo modello</summary><ul className="reasons">{candidate.reasons.map(r => <li key={r.ruleId}><span className="rule">{r.ruleId}</span>{r.explanation}</li>)}</ul></details>
            <details><summary>Verifiche ancora necessarie</summary><ul>{candidate.pending.map(item => <li key={item}>{item}</li>)}</ul></details>
            {(catalogState.snapshot.fixture||!!editorBinding)&&!shopOpened?<button className="primary canvas-link" onClick={() => { dispatch({ type: showingAdvice ? 'acceptAdvice' : 'choose', productId: profileKey(p) }); setShopBinding(null);setEditorBinding({ product: p, version: catalog.version }); setTab('editor'); }}>Prova nel canvas →</button>:<button className="primary canvas-link" disabled={busy||shopOpened} onClick={()=>{if(!shopOpened){const handoff=selectionGraphicHandoff(p,contentBrief,session.sessionId);dispatch({type:showingAdvice?'acceptAdvice':'choose',productId:profileKey(p)});setEditorBinding(null);setShopBinding(handoff);}setTab('editor');}}>Personalizza nel nuovo editor →</button>}
            <a className="product-link" href={productPage(catalog, profileKey(p))} target="_blank" rel="noopener noreferrer" onClick={() => dispatch({ type: showingAdvice ? 'acceptAdvice' : 'choose', productId: profileKey(p) })}>Personalizza sulla pagina prodotto ↗</a>
            <p className="caption">Prezzo e disponibilità sulla pagina attuale. Apertura in una nuova scheda; nessun trasferimento automatico di opzioni.</p>
          </article>; })}</div>
        </section>
      </div></div>
      <footer>Prototipo locale · nessuna approvazione produttiva · Shopify / BSS / PitchPrint dietro confini espliciti</footer>
    </main>
  </>;
}
