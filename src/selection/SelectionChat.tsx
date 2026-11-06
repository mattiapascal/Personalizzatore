import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { interpret } from '../ai/contract';
import { mockProvider } from '../ai/mock-provider';
import { httpProvider } from '../ai/http-provider';
import type { RuntimeState } from '../runtime/schema';
import type { SelectionAction } from './interaction';
import type { Requirements, SelectionSession } from './schema';
import { adviseProducts } from './advisor';
import { nextSelectionPrompt, nextSelectionQuestion, modelQuestion } from './dialogue';
export { nextSelectionQuestion } from './dialogue';
import { ContentEstimate } from './ContentEstimate';
import type { ContentBrief } from './content';
import type { CatalogAdapter } from '../catalog/adapter';
import { PrivacyVault } from '../privacy/redaction';
import { AiRequestSchema, type AiRequest } from '../ai/request';
import type { SessionUsage } from '../ai/usage';

export function RequirementSummary({ requirements: r }: { requirements: Requirements }) {
  const rows = [
    { label: 'Prodotto', value: r.family ? r.family === 'stamp' ? 'Timbro' : 'Altro prodotto (fuori dal campione)' : null },
    { label: 'Montatura', value: r.mechanism ? { automatic: 'Autoinchiostrante', manual: 'Manuale', pocket: 'Tascabile', emboss: 'A secco (rilievo)' }[r.mechanism] : null },
    ...(r.mechanism === 'manual' || r.material ? [{ label: 'Materiale', value: r.material ? { wood: 'Legno', plastic: 'Plastica', metal: 'Metallo', any: 'Nessuna preferenza' }[r.material] : null }] : []),
    { label: 'Forma', value: r.shape ? { rectangle: 'Rettangolare', square: 'Quadrata', round: 'Rotonda' }[r.shape] : null },
    { label: 'Dimensioni', value: r.maximumAreaMm ? `Spazio max ${r.maximumAreaMm.width} × ${r.maximumAreaMm.height} mm` : r.diameterMm ? `Ø ${r.diameterMm} mm minimi` : r.minimumAreaMm ? `${r.minimumAreaMm.width} × ${r.minimumAreaMm.height} mm${r.sizeIsEstimate ? ' · stima' : ' minimi'}` : r.sizeUnknown ? 'Non note — da verificare' : null },
  ];
  return <section className="requirements-summary" aria-labelledby="requirements-title"><h3 id="requirements-title">Il tuo timbro, fin qui</h3>
    <p className="caption">Rosso: da chiarire · Verde: risposta raccolta</p>
    <dl>{rows.map(row => <div key={row.label} className={row.value ? 'requirement answered' : 'requirement missing'} data-testid={`field-${row.label.toLowerCase()}`}><dt><span aria-hidden="true">{row.value ? '✓' : '?'}</span> {row.label}</dt><dd><span className="field-status sr-only">{row.value ? 'Risposta raccolta' : 'Da chiarire'}</span>{row.value ?? 'Da chiarire'}</dd></div>)}</dl>
    {(r.lines || r.hasLogo !== undefined) && <p className="caption">Contenuto indicato: {r.lines ? `${r.lines} righe` : 'numero di righe non indicato'} · {r.hasLogo === undefined ? 'logo non indicato' : r.hasLogo ? 'con logo' : 'senza logo'}. Impaginazione da verificare.</p>}
  </section>;
}

interface Props {
  session: SelectionSession; feedback: string; feedbackRevision: number; clarification?: string | null; clarificationBlocksSelection?: boolean;
  contentBrief?: ContentBrief;
  catalog: CatalogAdapter;
  runtime: RuntimeState; mode: 'mock' | 'server'; busy: boolean; active: boolean;
  dispatch: (action: SelectionAction) => void; onBusy: (busy: boolean) => void; onComplete: () => void; onShowResults: () => void;
}
export function SelectionChat({ session, feedback, feedbackRevision, clarification, clarificationBlocksSelection, contentBrief, catalog, runtime, mode, busy, active, dispatch, onBusy, onComplete, onShowResults }: Props) {
  const [message, setMessage] = useState('');
  const vault = useRef(new PrivacyVault(catalog.list().map(p => p.title)));
  useEffect(() => { vault.current.allowCatalogTitles(catalog.list().map(p => p.title)); }, [catalog]);
  const [pending, setPending] = useState<{ original: string; request: AiRequest; localText?: string } | null>(null);
  const [protectedMessage, setProtectedMessage] = useState('');
  const [usage, setUsage] = useState<SessionUsage | null>(null);
  const [turns, setTurns] = useState<{ id: number; role: 'user' | 'assistant'; text: string; contextText?: string }[]>(() => [{ id: 0, role: 'assistant', text: nextSelectionQuestion(session) }]);
  const counter = useRef(1), processed = useRef(feedbackRevision);
  const logRef = useRef<HTMLDivElement>(null), inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const scrollIntent = useRef(false);
  const [readingHistory, setReadingHistory] = useState(false);
  const prompt = nextSelectionPrompt(session, contentBrief, catalog);
  const hasSuggestions = session.candidates.length > 0 || adviseProducts(catalog, session.requirements, contentBrief).length > 0;
  const question = clarification ?? prompt.text;
  useEffect(() => {
    if (processed.current === feedbackRevision) return;
    processed.current = feedbackRevision;
    setTurns(previous => [...previous.slice(-39), { id: counter.current++, role: 'assistant', text: [feedback, question].filter(Boolean).join('\n\n'), contextText: clarification ?? modelQuestion(prompt) }]);
    inputRef.current?.focus({ preventScroll: true });
  }, [feedbackRevision, feedback, question]);
  useLayoutEffect(() => { const log = logRef.current; if (log && active && followLatest.current) { scrollIntent.current = false; log.scrollTop = log.scrollHeight; } }, [turns, busy, active]);
  useLayoutEffect(() => {
    const log = logRef.current, content = contentRef.current;
    if (!log || !content) return;
    const observer = new ResizeObserver(() => { if (log.clientHeight && followLatest.current) { scrollIntent.current = false; log.scrollTop = log.scrollHeight; } });
    observer.observe(log); observer.observe(content);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    // Due resize rapidi possono tornare alle stesse dimensioni osservate prima
    // che ResizeObserver notifichi; scrollTop può invece essere stato ridotto.
    // Segui la viewport anche dopo il layout, solo se si stava già leggendo il fondo.
    let first = 0, second = 0;
    const follow = () => { const log = logRef.current; if (active && log && followLatest.current) { scrollIntent.current = false; log.scrollTop = log.scrollHeight; } };
    const resize = () => {
      cancelAnimationFrame(first); cancelAnimationFrame(second);
      first = requestAnimationFrame(() => { follow(); second = requestAnimationFrame(follow); });
    };
    window.addEventListener('resize', resize); window.visualViewport?.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); };
  }, [active]);
  const send = async (value: string, protectedRequest?: AiRequest, localText?: string) => {
    if (busy || !message.trim() || (mode === 'server' && !runtime.ai.ready)) return;
    if (protectedRequest && (protectedRequest.sessionId !== session.sessionId || protectedRequest.revision !== session.revision)) { setPending(null); dispatch({ type: 'error', message: 'I prodotti sono stati aggiornati durante la verifica. Invia nuovamente il messaggio per usare i dati correnti.' }); return; }
    setMessage(''); setPending(null);
    followLatest.current = true; scrollIntent.current = false; setReadingHistory(false);
    setTurns(previous => [...previous.slice(-39), { id: counter.current++, role: 'user', text: value }]);
    onBusy(true);
    try {
      const provider = mode === 'mock' ? mockProvider : protectedRequest ? httpProvider(runtime.csrfToken, protectedRequest) : null;
      if (!provider) throw new Error('Prepara il testo protetto prima dell’invio');
      const response = await interpret(provider, value, session);
      const call = mode === 'mock' ? response : vault.current.restoreCall(response, localText);
      if (call.sessionUsage) setUsage(call.sessionUsage);
      dispatch({ type: 'tool', call });
    } catch (error) { dispatch({ type: 'error', message: error instanceof Error ? `${error.message}. Riprova o seleziona esplicitamente la demo nelle impostazioni.` : 'Servizio non disponibile. Puoi riprovare.' }); }
    finally { onBusy(false); onComplete(); }
  };
  const submit = async () => {
    if (busy || pending || !message.trim()) return;
    const original = message.trim();
    if (mode === 'mock') { await send(original); return; }
    try {
      const input = AiRequestSchema.parse({ message: original, sessionId: session.sessionId, revision: session.revision, requirements: session.requirements, lastQuestion: (clarification ?? modelQuestion(prompt)).slice(0, 300), recentMessages: turns.slice(-6).map(turn => ({ role: turn.role, text: (turn.role === 'user' ? turn.text : turn.contextText ?? 'Proseguiamo con i dati mancanti del timbro.').slice(-400) })), contentBrief, lastQuestionField: prompt.field });
      const prepared = vault.current.prepare(input);
      if (prepared.needsReview) { setPending({ original, request: prepared.request, localText: prepared.localText }); setProtectedMessage(prepared.request.message); }
      else await send(original, prepared.request, prepared.localText);
    } catch { dispatch({ type: 'error', message: 'Non riesco a preparare il testo protetto. Riduci il messaggio e verifica i dati da imprimere (massimo 480 caratteri).' }); }
  };
  return <>
    <div ref={logRef} role="log" tabIndex={0} aria-label="Conversazione di selezione" aria-live="polite" aria-relevant="additions" className="chat-log" data-testid="chat-log" onWheel={() => { scrollIntent.current = true; }} onPointerDown={() => { scrollIntent.current = true; }} onKeyDown={e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) scrollIntent.current = true; }} onScroll={() => { if (!scrollIntent.current) return; scrollIntent.current = false; const el = logRef.current!; followLatest.current = el.scrollHeight - el.clientHeight - el.scrollTop < 48; setReadingHistory(!followLatest.current); }}>
      <div ref={contentRef}>
      {turns.map((turn, index) => <div key={turn.id} className={`chat-message ${turn.role}`} data-testid={turn.role === 'assistant' && index === turns.length - 1 ? 'selection-feedback' : undefined}><span className="chat-speaker">{turn.role === 'user' ? 'Tu' : 'Assistente'}</span><p>{turn.text}</p></div>)}
      {busy && <p role="status">Sto leggendo la tua risposta…</p>}
      </div>
    </div>
    {readingHistory && <button className="latest-message" onClick={() => { followLatest.current = true; logRef.current!.scrollTop = logRef.current!.scrollHeight; setReadingHistory(false); }}>Ultimo messaggio ↓</button>}
    <form className="chat-composer" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <label htmlFor="request">Scrivi un messaggio</label><textarea ref={inputRef} id="request" rows={2} maxLength={1200} disabled={!!pending} value={message} placeholder="Raccontami cosa vuoi mettere nel timbro…" onChange={event => setMessage(event.target.value)}/>
      <button type="submit" className="primary" disabled={busy || !!pending || !message.trim() || (mode === 'server' && !runtime.ai.ready)}>{busy ? 'Attendi…' : 'Invia messaggio →'}</button>
    </form>
    {pending && <section className="privacy-preview notice" aria-label="Verifica privacy prima dell’invio">
      <h3>Controlla il testo protetto</h3><p>Questa anteprima è ancora nel browser. Ho oscurato i dati riconosciuti e le parole dubbie. Controlla che non restino nomi, aziende, recapiti o altri dati identificativi; puoi sostituirli con [DATO]. I contenuti originali restano disponibili per il timbro.</p>
      <label htmlFor="protected-message">Testo protetto da inviare a OpenAI</label><textarea id="protected-message" rows={4} maxLength={1200} value={protectedMessage} onChange={e => setProtectedMessage(e.target.value)}/>
      <details><summary>Contesto protetto incluso nell’invio</summary>
        {pending.request.lastQuestion && <p>Domanda precedente: {pending.request.lastQuestion}</p>}
        <ul>{pending.request.recentMessages.map((turn, index) => <li key={index}>{turn.role === 'user' ? 'Tu' : 'Assistente'}: {turn.text}</li>)}</ul>
        {pending.request.contentBrief?.text && <p>Testo da imprimere: {pending.request.contentBrief.text}</p>}
        {pending.request.contentBrief?.graphicSubject && <p>Grafica: {pending.request.contentBrief.graphicSubject}</p>}
      </details>
      <div className="button-row"><button className="primary" disabled={!protectedMessage.trim()} onClick={() => {
        try { const reviewed = AiRequestSchema.parse({ ...pending.request, message: vault.current.protect(protectedMessage), privacyReviewed: true }); void send(pending.original, reviewed, pending.localText); }
        catch { dispatch({ type: 'error', message: 'Controlla lunghezza e segnaposto del testo protetto prima di inviare.' }); }
      }}>Conferma e invia testo protetto</button><button onClick={() => setPending(null)}>Torna al messaggio</button></div>
    </section>}
    {mode === 'server' && <p className="caption" aria-live="polite">Costo stimato di questa chat: {usage ? usage.estimatedUsd.toFixed(4) + ' USD' : 'non ancora disponibile'} · tetto {usage?.budgetUsd.toFixed(2) ?? runtime.ai.sessionBudgetUsd?.toFixed(2) ?? '0.05'} USD. Dati originali conservati solo in memoria nel browser.</p>}
    <div className="chat-next">{!clarificationBlocksSelection && hasSuggestions && <button onClick={onShowResults}>Mostra i modelli →</button>}</div>
    <RequirementSummary requirements={session.requirements}/>
    <ContentEstimate brief={contentBrief} onUse={patch => dispatch({ type: 'patch', patch })}/>
    <details className="chat-information"><summary>Informazioni sulla conversazione</summary><p>La chat e la mappa dei segnaposto restano in memoria e spariscono al ricaricamento. Nel browser salviamo solo requisiti strutturati e selezione per 24 ore. In modalità AI inviamo testo protetto, requisiti, brief protetto ed estratti degli ultimi sei scambi. Il filtro è prudenziale: nei casi dubbi la verifica locale è necessaria. I dati account OpenAI seguono le impostazioni del titolare; store:false non equivale a conservazione zero.</p><details><summary>Requisiti raccolti · revisione {session.revision}</summary><pre data-testid="requirements">{JSON.stringify(session.requirements, null, 2)}</pre></details></details>
    <button disabled={busy} className="text-button" onClick={() => { vault.current.clear(); setPending(null); setUsage(null); setTurns([]); dispatch({ type: 'reset' }); setMessage(''); }}>Azzera conversazione e requisiti</button>
  </>;
}
