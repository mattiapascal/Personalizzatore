import { useRef, useState } from 'react';
import { EditorButton } from './EditorButton';
import { exportDocumentPng } from './fabric-adapter';
import type { GraphicDocument } from './model';
import { PNG_EXPORT_DPI, pngExportSize, type PngDpi } from './png-export';
export function PngExportPanel({ document, snapshot: capture }: { document: GraphicDocument; snapshot?:()=>GraphicDocument|null }) {
  const current=useRef(document);current.current=document;
  const [dpi, setDpi] = useState<PngDpi>(300), [transparent, setTransparent] = useState(false), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  let size: ReturnType<typeof pngExportSize> | null = null, sizeError = '';
  try { size = pngExportSize(document.areaMm, dpi); } catch (error) { sizeError = error instanceof Error ? error.message : 'Formato non disponibile'; }
  const save = async () => {
    if (busy || !size) return;
    const snapshot = capture ? capture() : document; if(!snapshot)return;const outputSize=pngExportSize(snapshot.areaMm,dpi); setBusy(true); setStatus('Preparazione PNG…');
    try {
      const blob = await exportDocumentPng(snapshot, dpi, transparent);
      if(current.current.documentId!==snapshot.documentId||current.current.revision!==snapshot.revision)throw new Error('Il progetto è cambiato durante l’esportazione: ripeti il PNG.');
      const url = URL.createObjectURL(blob);
      try { const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = `bozza-r${snapshot.revision}-${outputSize.width}x${outputSize.height}-${dpi}dpi.TEST.png`; anchor.click(); }
      finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
      setStatus(`PNG della revisione ${snapshot.revision} pronto.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Esportazione PNG non riuscita'); }
    finally { setBusy(false); }
  };
  return <details className="png-export-panel"><summary>Esportazione PNG della bozza</summary>
    <label>Risoluzione PNG<select aria-label="Risoluzione PNG" value={dpi} disabled={busy} onChange={event => setDpi(Number(event.target.value) as PngDpi)}>{PNG_EXPORT_DPI.map(value => <option value={value} key={value}>{value} dpi</option>)}</select></label>
    <label className="ratio-toggle"><input type="checkbox" checked={transparent} disabled={busy} onChange={event => setTransparent(event.target.checked)}/> Sfondo PNG trasparente</label>
    <p className="caption">{size ? `${size.width} × ${size.height} px · revisione ${document.revision}` : sizeError}. Il PNG è una bozza raster; conserva JSON e SVG per modifiche e misure fisiche. Non aumenta il dettaglio delle immagini importate.</p>
    <EditorButton icon="download" badge="PNG" label="Esporta PNG" disabled={busy || !size} onClick={() => { void save(); }}/>
    {status && <p className="caption" role="status">{status}</p>}
  </details>;
}
