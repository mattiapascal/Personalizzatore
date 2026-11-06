import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createCatalog, productPage } from '../catalog/live-adapter.ts';
import { ProductPreview } from '../catalog/ProductPreview.tsx';
import { profileKey } from '../catalog/schema.ts';
import { SelectionChat } from '../selection/SelectionChat.tsx';
import { initialInteraction, selectionInteraction, type SelectionAction, type SelectionInteraction } from '../selection/interaction.ts';
import { newSession } from '../selection/session.ts';
import { adviseProducts } from '../selection/advisor.ts';
import type { RuntimeState } from '../runtime/schema.ts';
import { PublicBootstrapSchema, publicSnapshot, type PublicBootstrap } from './schema.ts';

declare global { interface Window { turnstile?: { render(node: HTMLElement, options: Record<string, unknown>): string; remove(id: string): void } } }
const storageKey = 'is.assistant.capability';
function readCapability(): string {
  try { const s = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); return /^[a-f0-9]{64}$/.test(s?.token) && s.expiresAt > Date.now() ? s.token : ''; } catch { return ''; }
}
export function PublicApp() {
  const [data, setData] = useState<PublicBootstrap | null>(null), [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => fetch('/api/public/bootstrap', { signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(raw => { if (!cancelled) { setData(PublicBootstrapSchema.parse(raw)); setError(false); } }).catch(() => { if (!cancelled) setError(true); });
    void refresh(); const timer = setInterval(() => void refresh(), 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);
  if (!data) return <main className="public-assistant"><p role="status">{error ? 'L’assistente non è disponibile in questo momento.' : 'Prepariamo l’assistente…'}</p><a href="https://www.incisoriasacchetti.it/pages/timbri" target="_top">Sfoglia i timbri</a></main>;
  return <Conversation data={data} offline={error}/>;
}
function Conversation({ data, offline }: { data: PublicBootstrap; offline: boolean }) {
  const [current, setCurrent] = useState(data);
  const catalog = useMemo(() => createCatalog(publicSnapshot(current), current.catalogVersion), [current]);
  const [state, dispatch] = useReducer((s: SelectionInteraction, a: SelectionAction) => selectionInteraction(s, a, catalog), undefined, () => initialInteraction(newSession(catalog)));
  const [busy, setBusy] = useState(false), [capability, setCapability] = useState(readCapability), [securityError, setSecurityError] = useState('');
  const [showCount, setShowCount] = useState(3), [retry, setRetry] = useState(0);
  const security = useRef<HTMLDivElement>(null), results = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!busy && data.catalogVersion !== current.catalogVersion) { setCurrent(data); dispatch({ type: 'catalog' }); } else if (data.catalogVersion === current.catalogVersion && data.checkedAt !== current.checkedAt) setCurrent(data); }, [data, current, busy]);
  useEffect(() => {
    if (capability || !data.aiReady || !data.siteKey || !security.current) return;
    let stopped = false, widget = '';
    const start = () => {
      if (stopped || !security.current || !window.turnstile) return;
      widget = window.turnstile.render(security.current, { sitekey: data.siteKey, action: 'assistant-start', theme: 'light', language: 'it',
        callback: async (token: string) => {
          try {
            const response = await fetch('/api/public/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: AbortSignal.timeout(10_000) });
            const result = await response.json();
            if (!response.ok || !/^[a-f0-9]{64}$/.test(result.token)) throw new Error(typeof result.error === 'string' ? result.error : 'Verifica non riuscita.');
            if (!stopped) { setCapability(result.token); setSecurityError(''); try { sessionStorage.setItem(storageKey, JSON.stringify({ token: result.token, expiresAt: result.expiresAt })); } catch { /* nessun dato della chat nello storage */ } }
          } catch (error) { if (!stopped) setSecurityError(error instanceof Error ? error.message : 'Verifica non riuscita.'); }
        }, 'error-callback': () => { if (!stopped) setSecurityError('La verifica di sicurezza non è riuscita. Riprova.'); } });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (script?.dataset.failed === 'true') { script.remove(); script = null; }
    const failed = () => { if (script) script.dataset.failed = 'true'; if (!stopped) setSecurityError('Non riesco a caricare la verifica. Riprova o continua dal catalogo.'); };
    if (window.turnstile) start();
    else {
      if (!script) { script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset.turnstile = 'true'; document.head.append(script); }
      script.addEventListener('load', start, { once: true });
      script.addEventListener('error', failed, { once: true });
    }
    return () => { stopped = true; script?.removeEventListener('load', start); script?.removeEventListener('error', failed); if (widget) window.turnstile?.remove(widget); };
  }, [capability, data.aiReady, data.siteKey, retry]);
  const stale = offline || data.stale || !data.checkedAt || Date.now() - Date.parse(data.checkedAt) > 600_000;
  const advice = adviseProducts(catalog, state.session.requirements, state.contentBrief);
  const showingAdvice = !state.session.candidates.length && advice.length > 0;
  const candidates = stale || state.clarificationBlocksSelection ? [] : state.session.candidates.length ? state.session.candidates : advice;
  const runtime: RuntimeState = { csrfToken: capability || 'pending'.repeat(8), ai: { mode: 'openai', ready: !!capability && data.aiReady && !stale, reason: null, model: '', budgetUsd: 0, reservedUsd: 0, requests: 0 },
    catalog: { version: catalog.version, snapshot: publicSnapshot(current), checkedAt: current.checkedAt, pending: [] }, sync: { configured: true, intervalSeconds: 300, lastError: null, refreshing: false, stale } };
  return <main className="public-assistant">
    {stale && <p className="notice" role="status">L’assistente sta aggiornando i modelli disponibili. Puoi continuare dal catalogo.</p>}
    <div className="selection-grid">
      <section className="panel chat-panel" aria-labelledby="assistant-title"><h2 id="assistant-title">Troviamo il timbro adatto a te</h2>
        <p className="intro-copy">Raccontaci come lo userai e cosa vuoi imprimere.</p>
        <p className="caption">Assistente AI: inviamo a OpenAI il testo protetto. Evita dati personali non necessari.</p>
        {!capability && data.aiReady && <div className="security-check"><div ref={security}/><p className="caption" role="status">{securityError || 'Un breve controllo di sicurezza prima di iniziare.'}</p>{securityError && <button onClick={() => { setSecurityError(''); setRetry(n => n + 1); }}>Riprova la verifica</button>}</div>}
        {!data.aiReady && !stale && <p role="status">L’assistente non è disponibile in questo momento. Puoi continuare dal catalogo.</p>}
        <SelectionChat publicMode session={state.session} feedback={state.feedbackRevision && state.feedback.includes('canvas') ? 'Ho aggiornato la scelta.' : state.feedback} feedbackRevision={state.feedbackRevision} clarification={state.clarification} clarificationBlocksSelection={state.clarificationBlocksSelection}
          contentBrief={state.contentBrief} catalog={catalog} runtime={runtime} mode="server" busy={busy} active dispatch={dispatch} onBusy={setBusy} onComplete={() => {}} onShowResults={() => results.current?.focus()}/>
      </section>
      <section className="results-panel" aria-labelledby="candidate-title"><h2 id="candidate-title" ref={results} tabIndex={-1}>I modelli per te</h2>
        {!candidates.length && <div className="empty panel"><h3>Partiamo dalle tue esigenze</h3><p>Ti aiutiamo a confrontare i modelli e proseguire con la personalizzazione.</p></div>}
        <div className="candidates">{candidates.slice(0, showCount).map(candidate => { const p = catalog.get(candidate.profileId ?? candidate.productId); return <article className="product-card panel" key={profileKey(p)}>
          <ProductPreview product={p}/><h3>{p.title}</h3>{p.variantLabel && <p className="variant-label">{p.variantLabel}</p>}
          <p className="imprint-size">Impronta {p.shape === 'round' ? 'Ø ' + p.nominalAreaMm.width : p.nominalAreaMm.width + ' × ' + p.nominalAreaMm.height} mm</p>
          <details><summary>Perché questo modello</summary><ul className="reasons">{candidate.reasons.filter(r => ['P1_CATALOG_USE', 'R2_MECHANISM'].includes(r.ruleId)).map(r => <li key={r.ruleId}>{r.explanation}</li>)}<li>Confronta le misure dell’impronta con lo spazio da timbrare.</li></ul></details>
          <p className="caption">{showingAdvice ? 'Una prima proposta: verifichiamo insieme misure e contenuto.' : 'Verifica grafica e margini prima di confermare la personalizzazione.'}</p>
          <a className="product-link primary" href={productPage(catalog, profileKey(p))} target="_top" onClick={() => dispatch({ type: showingAdvice ? 'acceptAdvice' : 'choose', productId: profileKey(p) })}>Visualizza e personalizza →</a>
          <p className="caption">Prezzo e disponibilità sulla scheda prodotto. La chat non trasferisce automaticamente testi o opzioni.</p>
        </article>; })}</div>
        {candidates.length > showCount && <button onClick={() => setShowCount(n => n + 3)}>Mostra altri modelli</button>}
        <p className="catalog-fallback"><a href="https://www.incisoriasacchetti.it/pages/timbri" target="_top">Preferisci scegliere da solo? Sfoglia i timbri →</a></p>
      </section>
    </div>
  </main>;
}
