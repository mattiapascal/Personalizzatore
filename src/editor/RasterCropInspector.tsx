import { useState } from 'react';
import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
import { cropFromInsets, rasterInsets, fullRasterCrop, type ImageObject, type RasterInsets } from './raster-geometry';
import { cropRasterInPlace } from './raster-crop-edit';
import { measureFabric } from './fabric-adapter';
export function RasterCropInspector({ object, revision, onChange }: { object: ImageObject; revision: number; onChange: (object: ImageObject, immediate?: boolean) => void }) {
  const inset = rasterInsets(object), [error, setError] = useState('');
  const change = (patch: Partial<RasterInsets>) => { try { setError(''); onChange(cropRasterInPlace(object, cropFromInsets(object, patch), measureFabric)); } catch { setError('Lascia almeno un pixel visibile; i bordi richiedono pixel interi dentro l’originale.'); } };
  return <>
    <div className="property-grid">
      <NumberField label="Sinistra ritaglio (px)" value={inset.left} revision={revision} min={0} max={object.source.pixelWidth - inset.right - 1} step={1} onChange={left => change({ left })}/>
      <NumberField label="Destra ritaglio (px)" value={inset.right} revision={revision} min={0} max={object.source.pixelWidth - inset.left - 1} step={1} onChange={right => change({ right })}/>
      <NumberField label="Alto ritaglio (px)" value={inset.top} revision={revision} min={0} max={object.source.pixelHeight - inset.bottom - 1} step={1} onChange={top => change({ top })}/>
      <NumberField label="Basso ritaglio (px)" value={inset.bottom} revision={revision} min={0} max={object.source.pixelHeight - inset.top - 1} step={1} onChange={bottom => change({ bottom })}/>
    </div>
    <EditorButton icon="refresh" label="Ripristina ritaglio completo" onClick={() => { setError(''); onChange(cropRasterInPlace(object, fullRasterCrop(object.source), measureFabric), true); }}/>
    <p className="caption">Pixel rimossi da ciascun bordo visibile dell’immagine orientata/riflessa ({object.source.pixelWidth} × {object.source.pixelHeight} px). Trascina le maniglie di ritaglio sul canvas, anche verso l’esterno per recuperare parti tagliate. I pixel rimasti mantengono posizione e scala. Geometria torna al ridimensionamento; Esc annulla il gesto.</p>
    {error && <p role="status" className="error">{error}</p>}
  </>;
}
