import { useState } from 'react';
import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
import { cropFromInsetsMm, rasterInsetsMm, fullRasterCrop, checkedRasterCrop, type ImageObject, type RasterInsets } from './raster-geometry';
import { cropRasterInPlace } from './raster-crop-edit';
import { measureFabric } from './fabric-adapter';
export function RasterCropInspector({ object, revision, onChange }: { object: ImageObject; revision: number; onChange: (object: ImageObject, immediate?: boolean) => void }) {
  const inset = rasterInsetsMm(object),crop=checkedRasterCrop(object.source,object.crop),sx=object.widthMm/crop.widthPx,sy=object.heightMm/crop.heightPx,[error, setError] = useState('');
  const change = (patch: Partial<RasterInsets>) => { try { setError(''); onChange(cropRasterInPlace(object, cropFromInsetsMm(object, patch), measureFabric)); } catch { setError('Il ritaglio deve restare dentro l’originale e lasciare almeno un pixel visibile per lato.'); } };
  return <>
    <div className="property-grid">
      <NumberField label="Sinistra ritaglio (mm)" value={inset.left} revision={revision} min={0} max={Math.max(inset.left,(object.source.pixelWidth-1)*sx-inset.right)} step={.1} onChange={left => change({ left })}/>
      <NumberField label="Destra ritaglio (mm)" value={inset.right} revision={revision} min={0} max={Math.max(inset.right,(object.source.pixelWidth-1)*sx-inset.left)} step={.1} onChange={right => change({ right })}/>
      <NumberField label="Alto ritaglio (mm)" value={inset.top} revision={revision} min={0} max={Math.max(inset.top,(object.source.pixelHeight-1)*sy-inset.bottom)} step={.1} onChange={top => change({ top })}/>
      <NumberField label="Basso ritaglio (mm)" value={inset.bottom} revision={revision} min={0} max={Math.max(inset.bottom,(object.source.pixelHeight-1)*sy-inset.top)} step={.1} onChange={bottom => change({ bottom })}/>
    </div>
    <EditorButton icon="refresh" label="Ripristina ritaglio completo" onClick={() => { setError(''); onChange(cropRasterInPlace(object, fullRasterCrop(object.source), measureFabric), true); }}/>
    <p className="caption">Millimetri rimossi dai quattro bordi dell’immagine orientata/riflessa. Trascina le maniglie anche verso l’esterno per recuperare parti tagliate. Le parti rimaste mantengono posizione e scala; il file originale è conservato. Esc annulla il gesto.</p>
    {error && <p role="status" className="error">{error}</p>}
  </>;
}
