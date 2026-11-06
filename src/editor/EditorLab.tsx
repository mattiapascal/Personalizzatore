import { useEffect, useRef, useState } from 'react';
import { FabricAdapter, measureFabric } from './fabric-adapter';
import { createDocument, DocumentStore, type GraphicDocument } from './model';
import type { ProductProfile } from '../catalog/schema';

export function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function example(revision: number): string {
  return JSON.stringify({ schemaVersion: 1, tool: 'moveObject', expectedRevision: revision, objectId: 'text-1', arguments: { xMm: 10, yMm: 8 } }, null, 2);
}
export function EditorLab({ product, draftText, catalogVersion, catalogOutdated = false, onEditingChange, onKeepProduct }: { product: ProductProfile; draftText?: string; catalogVersion: string; catalogOutdated?: boolean; onEditingChange: (editing: boolean) => void; onKeepProduct: (productId: string, variantId: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const adapter = useRef<FabricAdapter | null>(null);
  const storeRef = useRef<DocumentStore | null>(null);
  const [doc, setDoc] = useState<GraphicDocument>(() => createDocument(product, catalogVersion));
  const [command, setCommand] = useState(example(0));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [eventLog, setEventLog] = useState('');
  const refresh = () => {
    const store = storeRef.current; if (!store) return;
    setDoc(structuredClone(store.document)); adapter.current?.render(store.document);
    setEventLog(store.events.map(e => `r${e.revision}: ${e.source} ${e.objectId ?? ''}`).join('\n'));
  };
  const act = (action: () => void) => {
    try { action(); setError(''); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Operazione rifiutata'); const store = storeRef.current; if (store) adapter.current?.render(store.document); }
  };
  useEffect(() => {
    if (!canvasRef.current) return;
    const initial = createDocument(product, catalogVersion);
    let store = new DocumentStore(initial, measureFabric);
    if (draftText) {
      try {
        const text = initial.objects.find(o => o.type === 'text')!;
        const box = measureFabric({ ...text, text: draftText });
        const xMm = initial.shape === 'round' ? (initial.areaMm.width - box.widthMm) / 2 : 1;
        const yMm = initial.shape === 'round' ? (initial.areaMm.height - box.heightMm) / 2 : 1;
        store.dispatch({ schemaVersion: 1, tool: 'moveObject', expectedRevision: 0, objectId: 'text-1', arguments: { xMm, yMm } }, 'manual');
        store.dispatch({ schemaVersion: 1, tool: 'setText', expectedRevision: 1, objectId: 'text-1', arguments: { text: draftText } }, 'manual');
      } catch { store = new DocumentStore(initial, measureFabric); setError('Il testo raccolto non entra nella bozza iniziale con i vincoli di prova. È conservato nella chat: scegli un formato più ampio o verifica l’impaginazione.'); }
    }
    storeRef.current = store;
    const view = new FabricAdapter(canvasRef.current, () => storeRef.current!.document.revision,
      (objectId, xMm, yMm, expectedRevision) => act(() => storeRef.current!.dispatch({ schemaVersion: 1, tool: 'moveObject', expectedRevision, objectId, arguments: { xMm, yMm } }, 'manual')),
      (objectId, text, expectedRevision) => act(() => storeRef.current!.dispatch({ schemaVersion: 1, tool: 'setText', expectedRevision, objectId, arguments: { text } }, 'manual')),
      value => { setEditing(value); onEditingChange(value); });
    adapter.current = view; view.render(store.document); setDoc(structuredClone(store.document));
    setEventLog(store.events.map(e => `r${e.revision}: ${e.source} ${e.objectId ?? ''}`).join('\n'));
    document.getElementById('lab-title')?.focus();
    return () => { view.dispose(); adapter.current = null; storeRef.current = null; };
  }, []);
  useEffect(() => {
    const store = storeRef.current;
    if (!store || (store.document.productId === product.productId && store.document.variantId === product.variantIds[0] && store.document.catalogVersion === catalogVersion)) return;
    try { store.changeProduct(product, catalogVersion); setError(''); refresh(); }
    catch { setError('La composizione non entra nel modello richiesto. Il progetto precedente è conservato: scegli un modello più grande o torna al prodotto del progetto.'); }
  }, [product, catalogVersion]);
  const conflict = doc.productId !== product.productId || doc.variantId !== product.variantIds[0] || doc.catalogVersion !== catalogVersion;
  return <section className="lab panel" aria-labelledby="lab-title">
    <div className="section-heading"><div><span className="eyebrow">02 / Personalizzazione nel canvas</span><h2 id="lab-title" tabIndex={-1}>{conflict ? 'Cambio modello da risolvere' : product.title}</h2></div><span className="badge">Bozza TEST</span></div>
    <p data-testid="editor-product">Area nominale del progetto: {doc.shape === 'round' ? `Ø ${doc.areaMm.width}` : `${doc.areaMm.width} × ${doc.areaMm.height}`} mm. {product.variantLabel && <>Variante: {product.variantLabel}. </>}{conflict && <>Modello richiesto: {product.title}, {product.nominalAreaMm.width} × {product.nominalAreaMm.height} mm.</>}</p>
    <p>Doppio clic sul testo per scrivere direttamente nel canvas; Invio aggiunge una riga, Esc termina la modifica. Puoi trascinare testo e bordo. Il testo deve entrare nell’area: altrimenti viene ripristinata la versione precedente.</p>
    <p className="caption">Area utile da confermare. Margine TEST 1 mm, Arial ≥ 7 pt e nero/bianco sono vincoli di laboratorio, non specifiche produttive del modello.</p>
    <div className="canvas-scroll" inert={conflict}><canvas ref={canvasRef} aria-label="Canvas grafico del laboratorio"/></div>
    {editing && <div role="status" className="notice">Scrittura nel canvas in corso. Premi Esc o <button onClick={() => adapter.current?.finishEditing()}>Termina modifica</button> per validare il testo.</div>}
    {conflict && <div className="notice"><p>Il documento è ancora associato al formato precedente. Puoi esportarne il JSON per conservarlo. Creando una nuova bozza sostituisci la composizione corrente.</p><button onClick={() => { setError(''); onKeepProduct(doc.productId!, doc.variantId!); }}>Torna al prodotto del progetto</button><button onClick={() => act(() => { const fresh = createDocument(product, catalogVersion); fresh.revision = storeRef.current!.document.revision + 1; storeRef.current = new DocumentStore(fresh, measureFabric); })}>Crea nuova bozza per questo formato</button></div>}
    <p className="caption" data-testid="revision">Revisione grafica: {doc.revision} · oggetto stabile text-1 · esportazione non approvata per produzione</p>
    <button disabled={editing} onClick={() => download('progetto.TEST.json', JSON.stringify(storeRef.current!.document, null, 2), 'application/json')}>Esporta JSON</button>
    <fieldset className="editor-actions" disabled={editing || conflict || catalogOutdated}><legend>Progetto</legend>
      <div className="button-row"><button onClick={() => act(() => storeRef.current!.undo())}>Annulla</button><button onClick={() => act(() => storeRef.current!.redo())}>Ripristina</button></div>
      <div className="button-row"><button onClick={() => act(() => download('impronta.TEST.svg', adapter.current!.exportSvg(storeRef.current!.document), 'image/svg+xml'))}>Esporta SVG</button></div>
      <label htmlFor="json-import">Riapri progetto JSON (max 100 KB)</label><input id="json-import" type="file" accept=".json,application/json" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 100_000) { setError('File oltre 100 KB'); return; }
        try { const raw: unknown = JSON.parse(await file.text()); act(() => storeRef.current!.import(raw)); } catch { setError('JSON non valido'); }
        e.target.value = '';
      }}/>
    <details><summary>Strumenti sviluppatore · comandi strutturati di prova</summary>
      <label htmlFor="graphic-command">Comando AI simulato (JSON)</label><textarea id="graphic-command" rows={11} value={command} onChange={e => setCommand(e.target.value)}/>
      <div className="button-row"><button onClick={() => setCommand(example(storeRef.current!.document.revision))}>Prepara comando aggiornato</button><button className="primary" onClick={() => act(() => storeRef.current!.dispatch(JSON.parse(command), 'ai-simulation'))}>Esegui comando</button></div>
    </details></fieldset>
    {error && <p role="alert" className="error">{error}</p>}
    <details><summary>Stato e storico del documento</summary><pre data-testid="graphic-state">{JSON.stringify(doc, null, 2)}</pre><pre>{eventLog || 'Nessuna modifica'}</pre></details>
  </section>;
}
