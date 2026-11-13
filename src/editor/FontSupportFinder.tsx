import { useEffect, useRef, useState } from 'react';
import type { FontAsset } from './font-assets';
import { findSupportingFonts, type FontSupportProgress, type SupportingFont } from './font-support-client';
import { prepareLibraryFontChoice } from '../editor-admin/library-fonts';
import { fontVariantLabel, registeredFontAsset } from './fonts';

export function FontSupportFinder({ assets, characters, disabled, onChoose, onPreparing }: { assets: readonly FontAsset[]; characters: readonly string[]; disabled: boolean; onChoose: (id: string) => void; onPreparing:(busy:boolean)=>void }) {
  const [state, setState] = useState<FontSupportProgress | null>(null), [busy, setBusy] = useState(false), [choosing, setChoosing] = useState(false), [error, setError] = useState(''), [query, setQuery] = useState('');
  const controller = useRef<AbortController | null>(null);
  const preparing=useRef(onPreparing);preparing.current=onPreparing;
  useEffect(() => () => {controller.current?.abort();preparing.current(false);}, []);
  useEffect(()=>{if(disabled){controller.current?.abort();setBusy(false);setChoosing(false);preparing.current(false);}},[disabled]);
  const search = async () => {
    controller.current?.abort(); const current = new AbortController(); controller.current = current;
    setState(null); setError(''); setBusy(true); setQuery('');
    try { await findSupportingFonts(assets, characters, value => { if (controller.current === current && !current.signal.aborted) setState(value); }, current.signal); }
    catch (cause) { if (controller.current === current && !current.signal.aborted) setError(cause instanceof Error ? cause.message : 'Ricerca non disponibile.'); }
    finally { if (controller.current === current && !current.signal.aborted) setBusy(false); }
  };
  const choose = async (candidate: SupportingFont) => {
    if (busy || choosing || disabled) return;
    controller.current?.abort(); const current = new AbortController(); controller.current = current; setChoosing(true);preparing.current(true); setError('');
    try {
      const asset = candidate.source === 'document' ? registeredFontAsset(candidate.asset.id) : await prepareLibraryFontChoice(candidate.font.id, candidate.revision, candidate.fileHash, AbortSignal.any([current.signal,AbortSignal.timeout(15000)]));
      current.signal.throwIfAborted(); if (controller.current !== current) return;
      if (!asset) throw Error('Il file font non è disponibile. Ripeti la ricerca.');
      onChoose(asset.id);
    } catch (cause) { if (controller.current === current && !current.signal.aborted) setError(cause instanceof Error ? cause.message : 'File non disponibile.'); }
    finally { if (controller.current === current && !current.signal.aborted){setChoosing(false);preparing.current(false);} }
  };
  const name = (candidate: SupportingFont) => candidate.source === 'document' ? `${candidate.asset.familyGroup ?? candidate.asset.family} · ${fontVariantLabel(candidate.asset.id)}` : `${candidate.font.familyGroup ?? candidate.font.actualFamilyGroup ?? candidate.font.family} · ${candidate.font.styleName ?? candidate.font.actualStyleName ?? `${candidate.font.weight ?? candidate.font.actualWeight ?? 400}${candidate.font.italic ?? candidate.font.actualItalic ? ' Corsivo' : ''}`}`;
  const rows = state?.candidates.filter(candidate => name(candidate).toLocaleLowerCase('it').includes(query.toLocaleLowerCase('it'))) ?? [];
  return <section className="font-support-finder" aria-label="Ricerca font per i caratteri mancanti">
    <button type="button" disabled={disabled || choosing || busy} onClick={() => void search()}>{state || error ? 'Ripeti ricerca font compatibili' : 'Trova font compatibili'}</button>
    {busy && <button type="button" onClick={() => { controller.current?.abort(); setBusy(false); }}>Interrompi ricerca</button>}
    {state && <p className="caption" role="status">{state.complete ? 'Ricerca completata' : busy ? 'Controllo in corso' : 'Ricerca incompleta'} · {state.checked} di {state.total} file · {state.candidates.length} compatibili{state.unknown ? ` · ${state.unknown} non verificabili` : ''}</p>}
    {state?.candidates.length ? <>
      <p className="caption">Ogni file elencato contiene tutti i caratteri richiesti. Scegli per vedere l’anteprima; la grafica cambia solo con Applica.</p>
      <label>Filtra risultati<input value={query} onChange={event => setQuery(event.target.value)} type="search"/></label>
      <ul aria-label="Font compatibili verificati">{rows.map(candidate => { const id = candidate.source === 'document' ? candidate.asset.id : `font-${candidate.font.id}`, label = name(candidate); return <li key={id}><span>{label}<small>{candidate.source === 'document' ? 'Nel documento' : 'Nella libreria'}</small></span><button type="button" aria-label={`Scegli font compatibile ${label}`} disabled={busy || choosing || disabled} onClick={() => void choose(candidate)}>Scegli</button></li>; })}</ul>
      {!rows.length && <p className="caption">Nessun risultato per questo nome.</p>}
    </> : state?.complete && <p className="caption">Nessun file verificato contiene tutti questi caratteri. Puoi usare il menu Font o aggiungere un file alla libreria.</p>}
    {choosing && <><p role="status" className="caption">Preparazione del solo file scelto…</p><button type="button" onClick={()=>{controller.current?.abort();setChoosing(false);preparing.current(false);}}>Annulla preparazione font</button></>}
    {error && <p role="status" className="caption">{error}</p>}
  </section>;
}
