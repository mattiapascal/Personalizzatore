import { preserveTextPathGuide, textPathStyleChanged } from './text-path-model';
import { useEffect, useRef, useState } from 'react';
import { objectCenter, placeObjectAtCenter, type SceneObject } from './model';
import { measureFabric } from './fabric-adapter';

export interface InspectorSnapshot { object: SceneObject; revision: number; }
const draftFor = (snapshot: InspectorSnapshot) => ({ ...snapshot, object: structuredClone(snapshot.object), center: objectCenter(snapshot.object, measureFabric) });

export function useInspectorDraft(object: SceneObject, revision: number, onApply: (object: SceneObject, expectedRevision: number) => InspectorSnapshot | null, isFormValid: () => boolean) {
  const [draft, setDraft] = useState(() => draftFor({ object, revision }));
  const [status, setStatus] = useState('');
  const current = useRef(draft), saved = useRef<InspectorSnapshot>({ object, revision });
  const applying = useRef(false), ownRevision = useRef(-1), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apply = useRef(onApply), valid = useRef(isFormValid);
  apply.current = onApply; valid.current = isFormValid;
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const publish = (next: typeof draft) => { current.current = next; setDraft(next); };
  const flush = () => {
    cancel(); if (applying.current) return; const pending = current.current;
    if (JSON.stringify(pending.object) === JSON.stringify(saved.current.object)) { setStatus(''); return; }
    if (!valid.current()) { setStatus('Completa o correggi il valore. Esc ripristina.'); return; }
    const update = structuredClone(pending.object); update.rotationDeg ??= 0;
    applying.current = true;
    try {
      const result = apply.current(update, pending.revision);
      if (!result) { setStatus('Modifica non applicata. Correggi il valore o premi Esc.'); return; }
      ownRevision.current = result.revision; saved.current = result; publish(draftFor(result)); setStatus('Salvato nella bozza');
    } finally { applying.current = false; }

  };
  const queue = (next: typeof draft, immediate: boolean) => {
    cancel(); publish(next); setStatus('Aggiornamento…');
    if (immediate) flush(); else timer.current = setTimeout(flush, 250);
  };
  const patch = (changes: Partial<SceneObject>, immediate = false) => {
    const previous = current.current, next = Object.assign(structuredClone(previous.object), changes);
    try { queue({ ...previous, object: previous.object.type === 'text' && previous.object.textPath && next.type === 'text' && textPathStyleChanged(previous.object, next) ? preserveTextPathGuide(previous.object, next, measureFabric) : placeObjectAtCenter(next, previous.center, measureFabric) }, immediate); }
    catch { queue({ ...previous, object: next }, immediate); }
  };
  const moveCenter = (center: typeof draft.center) => {
    const previous = current.current;
    try { queue({ ...previous, center, object: placeObjectAtCenter(previous.object, center, measureFabric) }, false); }
    catch { queue({ ...previous, center }, false); }
  };
  const replaceObject = (replacement: SceneObject, immediate = false) => queue(draftFor({ object: replacement, revision: current.current.revision }), immediate);
  const reset = () => { cancel(); publish(draftFor(saved.current)); setStatus('Ripristinata la bozza'); };
  useEffect(() => {
    if (revision === ownRevision.current) return;
    cancel(); saved.current = { object, revision }; publish(draftFor(saved.current)); setStatus('');
  }, [object, revision]);
  useEffect(() => cancel, []);
  return { draft, status, patch, replaceObject, moveCenter, flush, reset, dirty: JSON.stringify(draft.object) !== JSON.stringify(object) };
}
