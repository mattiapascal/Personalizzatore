import { useEffect, useRef, useState } from 'react';
import { FabricAdapter, measureFabric } from './fabric-adapter';
import { createDocument, DocumentStore, type GraphicDocument } from './model';

export function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function example(revision: number): string {
  return JSON.stringify({ schemaVersion: 1, tool: 'moveObject', expectedRevision: revision, objectId: 'text-1', arguments: { xMm: 10, yMm: 8 } }, null, 2);
}
export function EditorLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const adapter = useRef<FabricAdapter | null>(null);
  const storeRef = useRef<DocumentStore | null>(null);
  const [doc, setDoc] = useState<GraphicDocument>(createDocument);
  const [command, setCommand] = useState(example(0));
  const [text, setText] = useState('TEST · Città');
  const [error, setError] = useState('');
  const [eventLog, setEventLog] = useState('');
  const refresh = () => {
    const store = storeRef.current; if (!store) return;
    setDoc(structuredClone(store.document)); adapter.current?.render(store.document);
    const object = store.document.objects.find(o => o.id === 'text-1');
    if (object?.type === 'text') setText(object.text);
    setEventLog(store.events.map(e => `r${e.revision}: ${e.source} ${e.objectId ?? ''}`).join('\n'));
  };
  const act = (action: () => void) => {
    try { action(); setError(''); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Operazione rifiutata'); const store = storeRef.current; if (store) adapter.current?.render(store.document); }
  };
  useEffect(() => {
    if (!canvasRef.current) return;
    const store = new DocumentStore(createDocument(), measureFabric); storeRef.current = store;
    const view = new FabricAdapter(canvasRef.current, () => store.document.revision, (objectId, xMm, yMm, expectedRevision) => act(() => store.dispatch({ schemaVersion: 1, tool: 'moveObject', expectedRevision, objectId, arguments: { xMm, yMm } }, 'manual')));
    adapter.current = view; view.render(store.document); setDoc(structuredClone(store.document));
    return () => { view.dispose(); adapter.current = null; storeRef.current = null; };
  }, []);
  return <section className="lab panel" aria-labelledby="lab-title">
    <div className="section-heading"><div><span className="eyebrow">02 / Laboratorio Fabric.js</span><h2 id="lab-title">Un documento, due modi di modificarlo</h2></div><span className="badge">Profilo TEST</span></div>
    <p>Trascina il testo o il bordo. UI e comandi strutturati passano dallo stesso motore. Area 58 × 22 mm, margine TEST 1 mm, Arial ≥ 7 pt, nero/bianco: valori di prova, da validare per ogni prodotto.</p>
    <div className="canvas-scroll"><canvas ref={canvasRef} aria-label="Canvas grafico del laboratorio"/></div>
    <p className="caption" data-testid="revision">Revisione grafica: {doc.revision} · oggetto stabile text-1 · esportazione non approvata per produzione</p>
    <div className="editor-columns"><div>
      <form onSubmit={e => { e.preventDefault(); act(() => { const store = storeRef.current!; store.dispatch({ schemaVersion: 1, tool: 'setText', expectedRevision: store.document.revision, objectId: 'text-1', arguments: { text } }, 'manual'); }); }}>
        <label htmlFor="manual-text">Testo di text-1</label><input id="manual-text" value={text} onChange={e => setText(e.target.value)} maxLength={120}/><button type="submit">Applica testo manuale</button>
      </form>
      <div className="button-row"><button onClick={() => act(() => storeRef.current!.undo())}>Annulla</button><button onClick={() => act(() => storeRef.current!.redo())}>Ripristina</button></div>
      <div className="button-row"><button onClick={() => download('progetto.TEST.json', JSON.stringify(storeRef.current!.document, null, 2), 'application/json')}>Esporta JSON</button><button onClick={() => act(() => download('impronta.TEST.svg', adapter.current!.exportSvg(storeRef.current!.document), 'image/svg+xml'))}>Esporta SVG</button></div>
      <label htmlFor="json-import">Riapri progetto JSON (max 100 KB)</label><input id="json-import" type="file" accept=".json,application/json" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 100_000) { setError('File oltre 100 KB'); return; }
        try { const raw: unknown = JSON.parse(await file.text()); act(() => storeRef.current!.import(raw)); } catch { setError('JSON non valido'); }
        e.target.value = '';
      }}/>
    </div><div>
      <label htmlFor="graphic-command">Comando AI simulato (JSON)</label><textarea id="graphic-command" rows={11} value={command} onChange={e => setCommand(e.target.value)}/>
      <div className="button-row"><button onClick={() => setCommand(example(storeRef.current!.document.revision))}>Prepara comando aggiornato</button><button className="primary" onClick={() => act(() => storeRef.current!.dispatch(JSON.parse(command), 'ai-simulation'))}>Esegui comando</button></div>
    </div></div>
    {error && <p role="alert" className="error">{error}</p>}
    <details><summary>Stato e storico del documento</summary><pre data-testid="graphic-state">{JSON.stringify(doc, null, 2)}</pre><pre>{eventLog || 'Nessuna modifica'}</pre></details>
  </section>;
}
