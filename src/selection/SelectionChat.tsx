import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { interpret } from '../ai/contract';
import { mockProvider } from '../ai/mock-provider';
import { httpProvider } from '../ai/http-provider';
import type { RuntimeState } from '../runtime/schema';
import type { SelectionAction } from './interaction';
import type { Requirements, SelectionSession } from './schema';
import { missingInformation, questions } from './rules';
import { ContentEstimate } from './ContentEstimate';
import type { ContentBrief } from './content';

export function nextSelectionQuestion(session: SelectionSession, brief?: ContentBrief): string {
  if (!session.requirements.family) return 'Che cosa vorresti mettere nel timbro: un testo, un logo o un’illustrazione, per esempio un ex-libris?';
  if (session.requirements.family === 'other') return 'Per ora posso guidarti nella scelta dei timbri. Vuoi scegliere un timbro?';
  if (brief?.purpose === 'exlibris' && !brief.graphicSubject) return 'Per il tuo ex-libris, quale soggetto vorresti raffigurare e quale nome o testo vuoi aggiungere?';
  if (brief?.kind === 'text' && !brief.text) return 'Scrivimi il testo che vuoi imprimere, andando a capo come preferisci: posso stimarne l’ingombro per aiutarti a scegliere.';
  if (!session.requirements.mechanism && !session.requirements.shape && !brief?.kind && !session.requirements.lines && session.requirements.hasLogo === undefined) return 'Che cosa vuoi imprimere? Puoi scrivere il testo, indicare le righe previste oppure descrivere la grafica che hai in mente.';
  const missing = missingInformation(session.requirements);
  if (missing[0]) return questions[missing[0]];
  return session.candidates.length
    ? `Ho trovato ${session.candidates.length} possibilità per il tuo timbro. Dai un’occhiata alle anteprime e scegli quale provare. Verificheremo la composizione nel canvas.`
    : 'Nessun modello corrisponde nei profili attualmente censiti. Vuoi cambiare forma, montatura o dimensioni? Il catalogo completo può contenere altre soluzioni.';
}

export function RequirementSummary({ requirements: r }: { requirements: Requirements }) {
  const rows = [
    { label: 'Prodotto', value: r.family ? r.family === 'stamp' ? 'Timbro' : 'Altro prodotto (fuori dal campione)' : null },
    { label: 'Montatura', value: r.mechanism ? { automatic: 'Autoinchiostrante', manual: 'Manuale', pocket: 'Tascabile', emboss: 'A secco (rilievo)' }[r.mechanism] : null },
    ...(r.mechanism === 'manual' || r.material ? [{ label: 'Materiale', value: r.material ? { wood: 'Legno', plastic: 'Plastica', metal: 'Metallo', any: 'Nessuna preferenza' }[r.material] : null }] : []),
    { label: 'Forma', value: r.shape ? { rectangle: 'Rettangolare', square: 'Quadrata', round: 'Rotonda' }[r.shape] : null },
    { label: 'Dimensioni', value: r.diameterMm ? `Ø ${r.diameterMm} mm minimi` : r.minimumAreaMm ? `${r.minimumAreaMm.width} × ${r.minimumAreaMm.height} mm${r.sizeIsEstimate ? ' · stima' : ' minimi'}` : r.sizeUnknown ? 'Non note — da verificare' : null },
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
  runtime: RuntimeState; mode: 'mock' | 'server'; busy: boolean; active: boolean;
  dispatch: (action: SelectionAction) => void; onBusy: (busy: boolean) => void; onComplete: () => void; onShowResults: () => void;
}
export function SelectionChat({ session, feedback, feedbackRevision, clarification, clarificationBlocksSelection, contentBrief, runtime, mode, busy, active, dispatch, onBusy, onComplete, onShowResults }: Props) {
  const [message, setMessage] = useState('');
  const [turns, setTurns] = useState<{ id: number; role: 'user' | 'assistant'; text: string }[]>(() => [{ id: 0, role: 'assistant', text: nextSelectionQuestion(session) }]);
  const counter = useRef(1), processed = useRef(feedbackRevision);
  const logRef = useRef<HTMLDivElement>(null), inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const scrollIntent = useRef(false);
  const [readingHistory, setReadingHistory] = useState(false);
  const question = clarification ?? nextSelectionQuestion(session, contentBrief);
  useEffect(() => {
    if (processed.current === feedbackRevision) return;
    processed.current = feedbackRevision;
    setTurns(previous => [...previous.slice(-39), { id: counter.current++, role: 'assistant', text: [feedback, question].filter(Boolean).join('\n\n') }]);
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
  const submit = async () => {
    if (busy || !message.trim() || (mode === 'server' && !runtime.ai.ready)) return;
    const value = message.trim(); setMessage('');
    followLatest.current = true; scrollIntent.current = false; setReadingHistory(false);
    setTurns(previous => [...previous.slice(-39), { id: counter.current++, role: 'user', text: value }]);
    onBusy(true);
    try {
      const provider = mode === 'mock' ? mockProvider : httpProvider(runtime.csrfToken, question.slice(0, 300), turns.slice(-6).map(turn => ({ role: turn.role, text: turn.text.slice(-400) })));
      const call = await interpret(provider, value, session);
      dispatch({ type: 'tool', call });
    } catch (error) { dispatch({ type: 'error', message: error instanceof Error ? `${error.message}. Riprova o seleziona esplicitamente la demo nelle impostazioni.` : 'Servizio non disponibile. Puoi riprovare.' }); }
    finally { onBusy(false); onComplete(); }
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
      <label htmlFor="request">Scrivi un messaggio</label><textarea ref={inputRef} id="request" rows={2} maxLength={1200} value={message} placeholder="Raccontami cosa vuoi mettere nel timbro…" onChange={event => setMessage(event.target.value)}/>
      <button type="submit" className="primary" disabled={busy || !message.trim() || (mode === 'server' && !runtime.ai.ready)}>{busy ? 'Attendi…' : 'Invia messaggio →'}</button>
    </form>
    <div className="chat-next">{!missingInformation(session.requirements).length && !clarificationBlocksSelection && !!session.candidates.length && <button onClick={onShowResults}>Mostra i modelli →</button>}</div>
    <RequirementSummary requirements={session.requirements}/>
    <ContentEstimate brief={contentBrief} onUse={patch => dispatch({ type: 'patch', patch })}/>
    <details className="chat-information"><summary>Informazioni sulla conversazione</summary><p>La chat resta in memoria e sparisce al ricaricamento. Nel browser salviamo solo requisiti strutturati e selezione per 24 ore. In modalità AI inviamo al provider messaggio, requisiti ed estratti degli ultimi sei scambi.</p><details><summary>Requisiti raccolti · revisione {session.revision}</summary><pre data-testid="requirements">{JSON.stringify(session.requirements, null, 2)}</pre></details></details>
    <button disabled={busy} className="text-button" onClick={() => { setTurns([]); dispatch({ type: 'reset' }); setMessage(''); }}>Azzera conversazione e requisiti</button>
  </>;
}
