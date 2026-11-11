import { useState } from 'react';
import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
import { cropFromInsetsMm, rasterInsetsMm, fullRasterCrop, checkedRasterCrop, type ImageObject, type RasterInsets } from './raster-geometry';
import { cropRasterInPlace, rasterContentOffsetMm,positionRasterContents } from './raster-crop-edit';
import { measureFabric } from './fabric-adapter';
export function RasterCropInspector({ object, revision, onChange,moveContents=false,onMoveContents }: { object: ImageObject; revision: number; onChange: (object: ImageObject, immediate?: boolean) => void;moveContents?:boolean;onMoveContents?:(value:boolean)=>void }) {
  const inset = rasterInsetsMm(object),crop=checkedRasterCrop(object.source,object.crop),sx=object.widthMm/crop.widthPx,sy=object.heightMm/crop.heightPx,[error, setError] = useState('');
  const change = (patch: Partial<RasterInsets>) => { try { setError(''); onChange(cropRasterInPlace(object, cropFromInsetsMm(object, patch), measureFabric)); } catch { setError('Il ritaglio deve restare dentro l’originale e lasciare almeno un pixel visibile per lato.'); } };
  const offset=rasterContentOffsetMm(object),maxX=Math.max(0,(object.source.pixelWidth-crop.widthPx)/2)*sx,maxY=Math.max(0,(object.source.pixelHeight-crop.heightPx)/2)*sy;
  return <>
    {onMoveContents&&<><EditorButton icon="panImage" label="Sposta foto nella cornice" aria-pressed={moveContents} disabled={!moveContents&&maxX<1e-9&&maxY<1e-9} onClick={()=>{setError('');onMoveContents(!moveContents);}}/><p className="caption">{moveContents?'Trascina dentro la foto per spostare il contenuto. La cornice resta ferma. Esc annulla il gesto; premi di nuovo il pulsante per tornare ai bordi.':maxX<1e-9&&maxY<1e-9?'Per spostare la foto nella cornice, ritaglia prima almeno un bordo.':'Puoi anche spostare la foto dentro il ritaglio mantenendo ferma la cornice.'}</p></>}
    {moveContents?<>
      <div className="property-grid">
        <NumberField label="Orizzontale foto (mm)" value={offset.x} revision={revision} min={-maxX} max={maxX} step={.1} disabled={maxX<1e-9} onChange={x=>onChange(positionRasterContents(object,{x}))}/>
        <NumberField label="Verticale foto (mm)" value={offset.y} revision={revision} min={-maxY} max={maxY} step={.1} disabled={maxY<1e-9} onChange={y=>onChange(positionRasterContents(object,{y}))}/>
      </div>
      <EditorButton icon="centerX" label="Centra foto nella cornice" onClick={()=>onChange(positionRasterContents(object,{x:0,y:0}),true)}/>
      <p className="caption">Zero centra la foto. I valori positivi la spostano a destra e in basso lungo gli assi della cornice. Dimensioni e scala non cambiano; il movimento si ferma ai bordi dell’originale.</p>
    </>:<>
    <div className="property-grid">
      <NumberField label="Sinistra ritaglio (mm)" value={inset.left} revision={revision} min={0} max={Math.max(inset.left,(object.source.pixelWidth-1)*sx-inset.right)} step={.1} onChange={left => change({ left })}/>
      <NumberField label="Destra ritaglio (mm)" value={inset.right} revision={revision} min={0} max={Math.max(inset.right,(object.source.pixelWidth-1)*sx-inset.left)} step={.1} onChange={right => change({ right })}/>
      <NumberField label="Alto ritaglio (mm)" value={inset.top} revision={revision} min={0} max={Math.max(inset.top,(object.source.pixelHeight-1)*sy-inset.bottom)} step={.1} onChange={top => change({ top })}/>
      <NumberField label="Basso ritaglio (mm)" value={inset.bottom} revision={revision} min={0} max={Math.max(inset.bottom,(object.source.pixelHeight-1)*sy-inset.top)} step={.1} onChange={bottom => change({ bottom })}/>
    </div>
    <EditorButton icon="refresh" label="Ripristina ritaglio completo" onClick={() => { setError(''); onChange(cropRasterInPlace(object, fullRasterCrop(object.source), measureFabric), true); }}/>
    <p className="caption">Millimetri rimossi dai quattro bordi dell’immagine orientata/riflessa. Trascina le maniglie anche verso l’esterno per recuperare parti tagliate. Le parti rimaste mantengono posizione e scala; il file originale è conservato. Esc annulla il gesto.</p>
    </>}
    {error && <p role="status" className="error">{error}</p>}
  </>;
}
