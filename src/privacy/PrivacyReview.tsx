import { useEffect, useRef, useState } from 'react';
import type { PreparedPrivacy, PrivacyNature } from './redaction';

export function PrivacyReview({ prepared, onContinue, onCancel }: { prepared: PreparedPrivacy; onContinue: (choices: Record<string, PrivacyNature>) => void; onCancel: () => void }) {
  const [choices, setChoices] = useState<Record<string, PrivacyNature>>({});
  const [stage, setStage] = useState<'detection' | 'parts'>('detection');
  const [index, setIndex] = useState(0);
  const section = useRef<HTMLElement>(null);
  useEffect(() => { section.current?.focus({ preventScroll: true }); section.current?.scrollIntoView({ block: 'start' }); }, []);
  const part = prepared.parts[index]!;
  const classify = (nature: PrivacyNature) => {
    const next = { ...choices, [part.token]: nature }; setChoices(next);
    if (index + 1 === prepared.parts.length) onContinue(next); else setIndex(index + 1);
  };
  return <section ref={section} tabIndex={-1} className="privacy-preview privacy-compact notice" aria-label="Verifica privacy prima dell’invio">
    {stage === 'detection' ? <>
      <p>Potrei aver rilevato dati personali o aziendali nel tuo messaggio. Per proteggere la tua privacy, puoi confermare se è corretto?</p>
      <div className="button-row"><button className="primary" onClick={() => setStage('parts')}>Sì, controlliamo</button><button onClick={() => onContinue(Object.fromEntries(prepared.parts.map(value => [value.token, 'generic' as const])))}>No, è un falso allarme</button></div>
    </> : <>
      <p>È questa la parte contenente dati personali o aziendali?{prepared.parts.length > 1 && <span className="caption"> ({index + 1} di {prepared.parts.length})</span>}</p>
      <p className="privacy-original"><mark>{part.original}</mark></p>
      <div className="button-row"><button className="primary" onClick={() => classify('private')}>Sì, è riservata</button><button onClick={() => classify('generic')}>No, è testo generico</button></div>
      <p className="caption">L’originale resterà disponibile per il timbro; i dati riservati saranno oscurati verso l’AI.</p>
    </>}
    <button className="text-button" onClick={onCancel}>Annulla invio</button>
  </section>;
}
