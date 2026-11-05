import { lazy, Suspense, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { fixtureCatalog, productPage, snapshot } from './catalog/adapter';
import { interpret } from './ai/contract';
import { mockProvider } from './ai/mock-provider';
import { missingInformation, questions } from './selection/rules';
import { newSession, restoreSession, SESSION_KEY } from './selection/session';
import { initialInteraction, selectionInteraction, type SelectionAction, type SelectionInteraction } from './selection/interaction';
import type { Requirements, SelectionSession } from './selection/schema';
const EditorLab = lazy(() => import('./editor/EditorLab').then(module => ({ default: module.EditorLab })));

function load(): SelectionSession {
  try { return restoreSession(localStorage.getItem(SESSION_KEY), fixtureCatalog); } catch { return newSession(fixtureCatalog); }
}
export function App() {
  const [{ session, feedback, feedbackRevision }, dispatch] = useReducer(
    (state: SelectionInteraction, action: SelectionAction) => selectionInteraction(state, action, fixtureCatalog),
    undefined,
    () => initialInteraction(load()),
  );
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'selection' | 'editor'>('selection');
  const [editorProductId, setEditorProductId] = useState<string | null>(session.selectedProductId);
  const [editorEditing, setEditorEditing] = useState(false);
  const editorProduct = useMemo(() => editorProductId ? fixtureCatalog.get(editorProductId) : null, [editorProductId]);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const candidatesRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { setNotice('Persistenza non disponibile: la sessione resta in memoria.'); } }, [session]);
  useEffect(() => { if (feedbackRevision > 0) feedbackRef.current?.focus(); }, [feedbackRevision]);
  const patch = (p: Requirements) => dispatch({ type: 'patch', patch: p });
  const missing = missingInformation(session.requirements);
  const submit = async () => {
    setBusy(true);
    try {
      const call = await interpret(mockProvider, message, session);
      dispatch({ type: 'tool', call });
      setMessage('');
    } catch { dispatch({ type: 'error', message: 'Assistente non disponibile o risposta non valida. Puoi continuare con le scelte guidate.' }); }
    finally { setBusy(false); }
  };
  return <>
    <header><div className="brand">IS<span> / laboratorio digitale</span></div><span className="badge">Solo locale · 0.1</span></header>
    <main>
      <div className="intro"><span className="eyebrow">Incisoria Sacchetti / Prototipo</span><h1>Dal bisogno al<br/><em>prodotto giusto.</em></h1><p>Selezione guidata dei timbri e prova di personalizzazione grafica. Un passo verificabile alla volta.</p></div>
      <aside className="notice"><strong>Ambiente di prova.</strong> Catalogo TEST da Shopify, catturato il {snapshot.capturedOn}; gli aggiornamenti Shopify non vengono ancora importati. Interpretazione dimostrativa a parole chiave, nessun modello AI collegato. BSS e PitchPrint restano il percorso attuale sulla pagina prodotto.</aside>
      <nav aria-label="Sezioni del laboratorio"><button disabled={editorEditing} aria-pressed={tab === 'selection'} onClick={() => setTab('selection')}>01 · Scegli il timbro</button><button disabled={!editorProduct} aria-pressed={tab === 'editor'} onClick={() => setTab('editor')}>02 · Editor Fabric.js</button></nav>
      {!editorProduct && <p className="caption">Per aprire il canvas, scegli un modello dai risultati e premi «Prova nel canvas».</p>}
      {editorProduct && <div hidden={tab !== 'editor'}><Suspense fallback={<p role="status">Caricamento laboratorio…</p>}><EditorLab product={editorProduct} catalogVersion={fixtureCatalog.version} onEditingChange={setEditorEditing} onKeepProduct={setEditorProductId}/></Suspense></div>}
      <div hidden={tab !== 'selection'}><div className="selection-grid">
        <section className="panel" aria-labelledby="assistant-title">
          <span className="eyebrow">01 / Assistente di selezione</span><h2 id="assistant-title">Di cosa hai bisogno?</h2>
          <form onSubmit={e => { e.preventDefault(); void submit(); }}><label htmlFor="request">Descrivi il tuo timbro</label><textarea id="request" rows={4} maxLength={1200} value={message} placeholder="Un timbro aziendale con logo e sei righe" onChange={e => setMessage(e.target.value)}/><button className="primary" type="submit" disabled={busy || !message.trim()}>{busy ? 'Analisi…' : 'Analizza richiesta di prova →'}</button></form>
          {notice && <p role="status" className="notice">{notice}</p>}
          <div className="assistant-response" ref={feedbackRef} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} data-testid="selection-feedback">
            <p className="acknowledgement">{feedback}</p>
            <h3>{missing.length ? 'Prossimo passo' : session.candidates.length ? 'Modelli trovati' : 'Ricerca nel campione'}</h3>
            {missing.map(f => <p key={f} data-testid="clarification">{questions[f]}</p>)}
            {!missing.length && (session.candidates.length ? <>
              <p>Ho trovato {session.candidates.length} {session.candidates.length === 1 ? 'modello da esplorare' : 'modelli da esplorare'} nel campione. L’idoneità della composizione resta da verificare{session.requirements.sizeUnknown ? ': non abbiamo ancora definito le misure' : ''}.</p>
              <button className="primary" onClick={() => candidatesRef.current?.focus()}>Mostra {session.candidates.length === 1 ? 'il modello' : `i ${session.candidates.length} modelli`} →</button>
            </> : <p>Nessun candidato in questo campione di tre timbri rettangolari autoinchiostranti. Puoi cambiare i requisiti; il catalogo completo può contenere altre soluzioni.</p>)}
          </div>
          <div className="guided"><h3>Scelte guidate</h3>
            <div className="button-row"><button aria-pressed={session.requirements.family === 'stamp'} onClick={() => patch({ family: 'stamp' })}>Cerco un timbro</button><button aria-pressed={session.requirements.mechanism === 'automatic'} onClick={() => patch({ family: 'stamp', mechanism: 'automatic' })}>Autoinchiostrante</button><button aria-pressed={session.requirements.mechanism === 'manual'} onClick={() => patch({ family: 'stamp', mechanism: 'manual' })}>Manuale</button></div>
            <form className="size-form" key={JSON.stringify([session.requirements.minimumAreaMm, session.requirements.sizeUnknown])} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); patch({ minimumAreaMm: { width: Number(data.get('width')), height: Number(data.get('height')) }, sizeUnknown: false }); }}>
              <label>Larghezza minima (mm)<input name="width" aria-label="Larghezza minima in mm" type="number" min="1" max="1000" step="0.1" required defaultValue={session.requirements.minimumAreaMm?.width ?? (session.requirements.sizeUnknown ? '' : 50)}/></label>
              <label>Altezza minima (mm)<input name="height" aria-label="Altezza minima in mm" type="number" min="1" max="1000" step="0.1" required defaultValue={session.requirements.minimumAreaMm?.height ?? (session.requirements.sizeUnknown ? '' : 20)}/></label>
              <button type="submit">Conferma ingombro</button>
            </form><button onClick={() => patch({ minimumAreaMm: null, sizeUnknown: true })}>Non so le misure</button>
          </div>
          <details><summary>Requisiti raccolti · revisione {session.revision}</summary><pre data-testid="requirements">{JSON.stringify(session.requirements, null, 2)}</pre></details>
          <p className="caption">Salviamo solo requisiti strutturati e selezione nel browser. Ripristino entro 24 ore dalla modifica; puoi cancellarli con Azzera sessione. Il testo libero della richiesta non viene conservato.</p><button className="text-button" onClick={() => { try { localStorage.removeItem(SESSION_KEY); } catch { setNotice('Persistenza non disponibile: la sessione resta in memoria.'); } dispatch({ type: 'reset' }); setMessage(''); }}>Azzera sessione</button>
        </section>
        <section aria-labelledby="candidate-title"><span className="eyebrow">Catalogo / 3 referenze reali</span><h2 id="candidate-title" ref={candidatesRef} tabIndex={-1}>Possibilità da verificare</h2>
          {!session.candidates.length && <div className="empty panel"><span className="empty-mark">↗</span><h3>{missing.length ? 'Partiamo dalle tue esigenze' : 'Nessun candidato nel campione'}</h3><p>{missing.length ? 'Raccogliamo i criteri prima di proporti una referenza.' : 'Questo campione contiene solo tre timbri rettangolari autoinchiostranti. Non significa che il prodotto manchi nel catalogo completo.'}</p></div>}
          <div className="candidates">{session.candidates.map((candidate, index) => { const p = fixtureCatalog.get(candidate.productId); return <article className="product-card panel" key={p.productId}>
            <div className="product-number">{String(index + 1).padStart(2, '0')}<span>{p.nominalAreaMm.width} × {p.nominalAreaMm.height} mm nominali</span></div><h3>{p.title}</h3><p className="caption">Fixture reale · profilo v{p.profileVersion} · idoneità produttiva non verificata</p>
            <ul className="reasons">{candidate.reasons.map(r => <li key={r.ruleId}><span className="rule">{r.ruleId}</span>{r.explanation}</li>)}</ul>
            <details><summary>Verifiche ancora necessarie</summary><ul>{candidate.pending.map(item => <li key={item}>{item}</li>)}</ul></details>
            <button className="primary canvas-link" onClick={() => { dispatch({ type: 'choose', productId: p.productId }); setEditorProductId(p.productId); setTab('editor'); }}>Prova nel canvas →</button>
            <a className="product-link" href={productPage(fixtureCatalog, p.productId)} target="_blank" rel="noopener noreferrer" onClick={() => dispatch({ type: 'choose', productId: p.productId })}>Personalizza sulla pagina prodotto ↗</a>
            <p className="caption">Prezzo e disponibilità sulla pagina attuale. Apertura in una nuova scheda; nessun trasferimento automatico di opzioni.</p>
          </article>; })}</div>
        </section>
      </div></div>
      <footer>Prototipo locale · nessuna approvazione produttiva · Shopify / BSS / PitchPrint dietro confini espliciti</footer>
    </main>
  </>;
}
