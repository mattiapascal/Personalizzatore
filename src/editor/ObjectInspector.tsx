import { textGeometryVerified } from './font-measurement';
import { fontCoverageVersion, subscribeFontCoverage } from './font-coverage-cache';
import { UnverifiedTextInspector } from './UnverifiedTextInspector';
import {textFontToggle,textFontFamily,commonTextFontFamily} from './text-font-toggle';
import {ObjectPropertiesPanel} from './ObjectPropertiesPanel';
import type {ObjectProperties} from './object-properties';
import { EDITOR_LIMITS } from './limits';
import { fontVariantChoices, fontVariantLabel, renderFontFamily, chooseFontStyle, fontChoices, registeredFontAsset, fontCatalogVersion, subscribeFonts } from './fonts';
import { transformSelection } from './selection';
import { resizeTextHeight, textHeightLimits } from './text-sizing';
import { DEFAULT_JUSTIFICATION } from './justification';
import { useSyncExternalStore, useEffect, useRef, useState, type ReactNode } from 'react';
import { EditorButton, type EditorIconName } from './EditorButton';
import { PaintPicker } from './PaintPicker';
import { type SceneObject, type CharacterStyle, type TextAlignment } from './model';
import { measureFabric, measureTextFrame } from './fabric-adapter';
import { applyCharacterStyle, selectionStyle, type CharacterSelection } from './text-style';
import { useInspectorDraft, type InspectorSnapshot } from './use-inspector-draft';
import { FontPicker } from './FontPicker';
import { NumberField } from './InspectorNumberField';
import { PathNodeInspector } from './PathNodeInspector';
import { BezierNodeInspector } from './BezierNodeInspector';
import { DEFAULT_RASTER, type RasterParameters } from './raster-processing';
import { checkedRasterCrop } from './raster-geometry';
import { RasterCropInspector } from './RasterCropInspector';
import { jpegInfo } from './jpeg-source';
import { rasterAnalysis } from './raster-cache';
import { ObjectIdentity } from './ObjectIdentity';
import { smallestPrintedFontPt } from './text-production';
import { SelectedTextFontNotice } from './SelectedTextFontNotice';

type Section = 'geometry' | 'text' | 'fill' | 'stroke' | 'nodes' | 'image' | 'crop' | 'arrange' | 'template';

function MeasuredObjectInspector({ minimumFontPt = null, allowColor = false, onProperties, object, revision, arrangement, onApply, characterSelection, onCharacterStyle, onKerning, onLineAlignment, onTextStretch, onCropFocus, onNodeFocus, onDetachText, onFontMenuOpen }: { minimumFontPt?:number|null;allowColor?:boolean; onProperties?:(properties:ObjectProperties)=>void;object: SceneObject; revision: number; arrangement: ReactNode; onFontMenuOpen: () => void; onDetachText: () => void; onApply: (object: SceneObject, expectedRevision: number) => InspectorSnapshot | null; characterSelection: CharacterSelection | null; onCharacterStyle: (style: CharacterStyle) => void; onKerning: (value: number) => void; onLineAlignment: (alignment: TextAlignment) => void; onTextStretch: (value: number) => void; onCropFocus: (id: string | null) => void; onNodeFocus: (focus: { objectId: string; index: number } | null) => void }) {
  const form = useRef<HTMLFormElement>(null);
  const { draft, status, patch, replaceAppearance, replaceObject, moveCenter, flush, reset, dirty } = useInspectorDraft(object, revision, onApply, () => form.current?.checkValidity() ?? true);
  const [section, setSection] = useState<Section>('geometry');
  const [ratioLocked, setRatioLocked] = useState(false);
  useEffect(() => {
    if ((object.type === 'text' || object.type === 'image') && section === 'stroke' || object.type !== 'text' && section === 'text' || (object.type === 'line' || (object.type === 'path' || object.type === 'bezier') && !object.closed) && section === 'fill' || object.type !== 'path' && object.type !== 'bezier' && section === 'nodes' || object.type === 'image' && section === 'fill' || object.type !== 'image' && (section === 'image' || section === 'crop')) setSection('geometry');
  }, [object, revision]);
  useEffect(() => { onCropFocus(section === 'crop' && object.type === 'image' ? object.id : null); return () => onCropFocus(null); }, [object.id, object.type, section]);
  const current = characterSelection?.object ?? draft.object;
  const analysis = current.type === 'image' ? rasterAnalysis(current.source) : null;
  const visiblePixels = current.type === 'image' ? checkedRasterCrop(current.source, current.crop) : null;
  const characterScope = current.type === 'text' ? characterSelection ?? selectionStyle(current, 0, Array.from(current.text).length) : null;
  const character = characterScope?.style;
  const noCharacters = !!characterSelection && characterSelection.start === characterSelection.end;
  const characterPatch = (style: CharacterStyle, immediate = false) => {
    if (current.type !== 'text') return;
    if (characterSelection) { if (!noCharacters) onCharacterStyle(style); }
    else replaceAppearance(applyCharacterStyle(current, style), immediate);
  };
  useSyncExternalStore(subscribeFonts,fontCatalogVersion);
  const activeFont=current.type==='text'?(character?.fontFamily??current.fontFamily):'',variants=fontVariantChoices(activeFont);
  const styleIds=new Set([...fontChoices(),...(current.type==='text'?[current.fontFamily,...current.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]:[])]),styleAssets=[...styleIds].flatMap(id=>{const asset=registeredFontAsset(id);return asset?[asset]:[];});
  const boldToggle=current.type==='text'?textFontToggle(current,'bold',styleAssets,characterSelection??undefined):null,italicToggle=current.type==='text'?textFontToggle(current,'italic',styleAssets,characterSelection??undefined):null;
  const commonFamily=current.type==='text'?commonTextFontFamily(current,styleAssets,characterSelection??undefined):undefined;
  const [fontNotice,setFontNotice]=useState<{objectId:string;revision:number;message:string}|null>(null);
  const fontError=fontNotice?.objectId===object.id&&fontNotice.revision===revision?fontNotice.message:'';
  const setFontError=(message:string,nextRevision=revision)=>setFontNotice(message?{objectId:object.id,revision:nextRevision,message}:null);
  const toggleFace=(next:Extract<SceneObject,{type:'text'}>|null|undefined)=>{if(next){setFontError('');replaceAppearance(next,true);}};
  const fontSizeField = current.type === 'text' ? <NumberField {...{ revision: revision + (characterSelection?.start ?? 0) + (characterSelection?.end ?? 0) }} label="Corpo testo (pt)" value={character?.fontSizePt ?? current.fontSizePt} mixed={characterScope?.mixed.includes('fontSizePt')} disabled={noCharacters} min={EDITOR_LIMITS.minFontSizePt} max={EDITOR_LIMITS.maxFontSizePt} onChange={fontSizePt => { if (fontSizePt >= EDITOR_LIMITS.minFontSizePt && fontSizePt <= EDITOR_LIMITS.maxFontSizePt) characterPatch({ fontSizePt }); }}/> : null;
  const textScaleField = current.type === 'text' ? <NumberField revision={draft.revision} label="Dilataz. Orizz. (%)" value={(current.textScaleX ?? 1) * 100} min={10} max={1000} step={1} onChange={value => { if (value >= 10 && value <= 1000) { if (characterSelection) onTextStretch(value / 100); else patch({ textScaleX: value / 100 }); } }}/> : null;
  let frame: ReturnType<typeof measureTextFrame> | null = null;
  if (current.type === 'text') { try { frame = measureTextFrame(current); } catch { if (object.type === 'text') frame = measureTextFrame(object); } }
  const heightLimits = current.type === 'text' && frame ? textHeightLimits(current, frame.heightMm) : null;
  const patchFrame = (change: Partial<NonNullable<Extract<SceneObject, { type: 'text' }>['textBox']>>) => {
    if (current.type !== 'text' || !frame) return;
    patch({ textBox: { widthMm: frame.widthMm, heightMm: frame.heightMm, autoWidth: current.textBox?.autoWidth ?? true, autoHeight: current.textBox?.autoHeight ?? true, ...change } });
  };
  const alignText = (alignment: TextAlignment) => {
    if (current.type !== 'text' || !frame) return;
    if (characterSelection) { onLineAlignment(alignment); return; }
    if (current.textPath) { patch({ textAlign: alignment === 'justify-left' ? 'center' : alignment }, true); return; }
    patch({ textAlign: alignment, lineStyles: undefined, ...(alignment === 'justify-left' ? { textBox: { widthMm: frame.widthMm, heightMm: frame.heightMm, autoWidth: false, autoHeight: true } } : {}) }, true);
  };
  const alignmentValue = characterSelection?.line?.value ?? (current.type === 'text' ? current.textAlign ?? 'left' : 'left'), alignmentMixed = !!characterSelection?.line?.mixed;
  const justified = current.type === 'text' && (current.textAlign === 'justify-left' || !!current.lineStyles?.some(run => run.alignment === 'justify-left'));
  const geometryLocked=!onProperties&&!!object.editor?.transformLocked;
  const fields = { revision: draft.revision };
  const tabs: { id: Section; label: string; icon: EditorIconName }[] = [
    { id: 'geometry', label: 'Geometria', icon: 'geometry' },
    ...(current.type === 'text' ? [{ id: 'text' as const, label: 'Testo', icon: 'text' as const }] : []),
    ...(current.type === 'image' || current.type === 'line' || (current.type === 'path' || current.type === 'bezier') && !current.closed ? [] : [{ id: 'fill' as const, label: 'Riempimento', icon: 'fill' as const }]),
    ...(current.type !== 'text' && current.type !== 'image' ? [{ id: 'stroke' as const, label: 'Contorno', icon: 'stroke' as const }] : []),
    ...(current.type === 'path' || current.type === 'bezier' ? [{ id: 'nodes' as const, label: 'Nodi', icon: 'nodes' as const }] : []),
    ...(current.type === 'image' ? [{ id: 'image' as const, label: 'Immagine', icon: 'image' as const }, { id: 'crop' as const, label: 'Ritaglio', icon: 'crop' as const }] : []),
    { id: 'arrange', label: 'Disposizione', icon: 'centerX' },
    ...(onProperties?[{id:'template' as const,label:'Proprietà template',icon:'properties' as const}]:[]),
  ];
  const title = tabs.find(tab => tab.id === section)?.label ?? 'Geometria';
  return <form ref={form} className="object-inspector" aria-label="Proprietà oggetto" onSubmit={event => { event.preventDefault(); flush(); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) flush(); }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); reset(); } }}>
    <div className="inspector-selection"><ObjectIdentity object={current}/></div>
    <div role="tablist" aria-label="Sezioni dell’ispettore" className="inspector-tabs" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const index = tabs.findIndex(tab => tab.id === section);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      const tab = tabs[next]!; setSection(tab.id); document.getElementById(`inspector-tab-${tab.id}`)?.focus();
    }}>
      {tabs.map(tab => <EditorButton key={tab.id} role="tab" tabIndex={section === tab.id ? 0 : -1} id={`inspector-tab-${tab.id}`} aria-selected={section === tab.id} aria-controls="inspector-content" icon={tab.icon} label={tab.label} onClick={() => setSection(tab.id)}/>)}
    </div>
    <div id="inspector-content" role="tabpanel" aria-labelledby={`inspector-tab-${section}`} className="inspector-content">
      <h3>{title}</h3>
      {section==='template'&&onProperties&&<ObjectPropertiesPanel object={object} revision={revision} onChange={onProperties}/>}
      {current.type === 'text' && <p className="caption" data-testid="character-scope">{characterSelection ? noCharacters ? 'Seleziona i caratteri da formattare. Esc torna al box.' : `${characterSelection.end - characterSelection.start} caratteri selezionati${characterSelection.mixed.length ? ' · stile misto' : ''}` : 'Box selezionato · le modifiche ai caratteri agiscono su tutto il testo.'}</p>}
      {section === 'geometry' && <>{geometryLocked&&<p className="caption">Posizione e dimensioni bloccate dal template.</p>}
        <fieldset disabled={geometryLocked} className="inspector-arrangement"><div className="property-grid">
          <NumberField {...fields} label="X (mm)" value={draft.center.xMm} min={-1000} max={1000} onChange={xMm => moveCenter({ ...draft.center, xMm })}/>
          <NumberField {...fields} label="Y (mm)" value={draft.center.yMm} min={-1000} max={1000} onChange={yMm => moveCenter({ ...draft.center, yMm })}/>
          {current.type === 'text' && current.textPath && frame && <>
            <NumberField {...fields} label="Larghezza (mm)" value={frame.widthMm} min={0.01} max={1000} onChange={width => { if (width > 0) replaceObject(transformSelection([current], { scale: width / frame.widthMm, rotationDeg: 0, center: draft.center }, measureFabric)[0]!); }}/>
            <NumberField {...fields} label="Altezza (mm)" value={frame.heightMm} min={0.01} max={1000} onChange={height => { if (height > 0) replaceObject(transformSelection([current], { scale: height / frame.heightMm, rotationDeg: 0, center: draft.center }, measureFabric)[0]!); }}/>
          </>}
          {current.type === 'text' && !current.textPath && frame && <>
            <NumberField {...fields} label="Larghezza box (mm)" value={frame.widthMm} min={0.01} max={1000} onChange={widthMm => { if (widthMm <= 0 || widthMm > 1000) return; if (current.textBox?.autoWidth ?? true) { const value = (current.textScaleX ?? 1) * widthMm / frame.widthMm; if (value < .1 || value > 10) return; if (characterSelection) onTextStretch(value); else patch({ textScaleX: value }); } else patchFrame({ widthMm }); }}/>
            <NumberField {...fields} label="Altezza testo (mm)" value={frame.heightMm} min={Math.floor(heightLimits!.min * 1000) / 1000} max={Math.ceil(heightLimits!.max * 1000) / 1000} onChange={heightMm => { if (heightMm >= heightLimits!.min && heightMm <= heightLimits!.max) replaceObject(resizeTextHeight(current, heightMm, measureFabric)); }}/>
          </>}
          {current.type === 'circle' && <NumberField {...fields} label="Diametro (mm)" value={current.radiusMm * 2} min={0.01} max={1000} onChange={diameter => patch({ radiusMm: diameter / 2 })}/>}
          {current.type === 'line' && <NumberField {...fields} label="Lunghezza linea (mm)" value={current.lengthMm} min={0.01} max={1000} step={0.1} onChange={lengthMm => patch({ lengthMm })}/>}
          {current.type === 'ellipse' && <>
            <NumberField {...fields} label="Larghezza (mm)" value={current.rxMm * 2} min={0.01} max={1000} onChange={width => patch({ rxMm: width / 2, ...(ratioLocked ? { ryMm: width / 2 * current.ryMm / current.rxMm } : {}) })}/>
            <NumberField {...fields} label="Altezza (mm)" value={current.ryMm * 2} min={0.01} max={1000} onChange={height => patch({ ryMm: height / 2, ...(ratioLocked ? { rxMm: height / 2 * current.rxMm / current.ryMm } : {}) })}/>
          </>}
          {(current.type === 'path' || current.type === 'bezier' || current.type === 'vector') && <>
            <NumberField {...fields} label="Larghezza (mm)" value={current.widthMm} min={0.01} max={1000} disabled={current.widthMm === 0} onChange={widthMm => patch({ widthMm, ...(ratioLocked ? { heightMm: widthMm * current.heightMm / current.widthMm } : {}) })}/>
            <NumberField {...fields} label="Altezza (mm)" value={current.heightMm} min={0.01} max={1000} disabled={current.heightMm === 0} onChange={heightMm => patch({ heightMm, ...(ratioLocked ? { widthMm: heightMm * current.widthMm / current.heightMm } : {}) })}/>
          </>}
          {current.type === 'image' && visiblePixels && <>
            <NumberField {...fields} label="Larghezza (mm)" value={current.widthMm} min={0.001} max={1000} onChange={widthMm => patch({ widthMm, heightMm: widthMm * current.heightMm / current.widthMm })}/>
            <NumberField {...fields} label="Altezza (mm)" value={current.heightMm} min={0.001} max={1000} onChange={heightMm => patch({ heightMm, widthMm: heightMm * current.widthMm / current.heightMm })}/>
          </>}
          {current.type === 'rect' && <>
            <NumberField {...fields} label="Larghezza (mm)" value={current.widthMm} min={0.01} max={1000} onChange={widthMm => patch({ widthMm, ...(ratioLocked ? { heightMm: widthMm * current.heightMm / current.widthMm } : {}) })}/>
            <NumberField {...fields} label="Altezza (mm)" value={current.heightMm} min={0.01} max={1000} onChange={heightMm => patch({ heightMm, ...(ratioLocked ? { widthMm: heightMm * current.widthMm / current.heightMm } : {}) })}/>
            <NumberField {...fields} label="Raggio angoli (mm)" value={current.cornerRadiusMm ?? 0} min={0} max={Math.min(current.widthMm, current.heightMm) / 2} onChange={cornerRadiusMm => patch({ cornerRadiusMm })}/>
          </>}
          {current.type !== 'circle' && <NumberField {...fields} className="property-wide" label="Rotazione (°)" value={current.rotationDeg ?? 0} min={-180} max={180} onChange={rotationDeg => patch({ rotationDeg })}/>}
        </div>
        {current.type === 'text' && !current.textPath && <><label className="ratio-toggle"><input type="checkbox" checked={current.textBox?.autoWidth ?? true} disabled={justified} onChange={event => patchFrame({ autoWidth: event.target.checked })}/> Larghezza automatica</label><p className="caption">Altezza dal contenuto: il valore numerico cambia il corpo, senza nascondere testo. Con larghezza automatica le maniglie cambiano corpo e dilatazione orizzontale; con larghezza fissa cambiano solo il box.{justified && ' Per attivare la larghezza automatica scegli prima un altro allineamento sull’intero box.'}</p></>}
        {(current.type === 'rect' || current.type === 'ellipse' || current.type === 'path' || current.type === 'bezier') && <label className="ratio-toggle"><input type="checkbox" checked={ratioLocked} onChange={event => setRatioLocked(event.target.checked)}/> Mantieni proporzioni</label>}
        </fieldset>
        {current.type === 'path' && <><label className="ratio-toggle"><input type="checkbox" checked={current.closed} disabled={current.points.length < 3 || current.widthMm === 0 || current.heightMm === 0} onChange={event => patch({ closed: event.target.checked, ...(!event.target.checked ? { fill: 'none' } : {}) }, true)}/> Chiudi tracciato</label><p className="caption">{current.points.length} punti vettoriali · giunzioni ed estremità arrotondate.</p></>}
        {current.type === 'image' && visiblePixels && <p className="caption">Proporzioni dell’immagine mantenute. Risoluzione effettiva: {(visiblePixels.widthPx / current.widthMm * 25.4).toFixed(0)} dpi. Pixel orientati {current.source.pixelWidth} × {current.source.pixelHeight} px. {current.source.mime === 'image/jpeg' ? `Originale JPEG · orientamento EXIF ${jpegInfo(current.source.dataUrl).orientation}, normalizzato localmente.` : 'Originale PNG.'}</p>}
        <p className="caption inspector-anchor"><span aria-hidden="true">⊙</span> Ancoraggio al centro · X/Y del centro. Dimensioni delle forme senza contorno.</p>
      </>}
      {section === 'text' && current.type === 'text' && <>
        <SelectedTextFontNotice object={current}/>
        <FontPicker onOpen={onFontMenuOpen} disabled={noCharacters} value={commonFamily??''} onChange={fontFamily => {const exact=textFontFamily(current,fontFamily,styleAssets,characterSelection??undefined),next=exact??textFontFamily(current,fontFamily,styleAssets,characterSelection??undefined,true);if(next){toggleFace(next);if(!exact)setFontError('Alcune varianti non sono disponibili: applicato lo stile originale del font scelto.',revision+1);}else setFontError('Il file font scelto non è disponibile. Aggiorna la libreria e riprova.');}}/>
        <div role="group" aria-label="Stile del testo" className="button-row"><fieldset className="inspector-arrangement" disabled={noCharacters}>
          <EditorButton icon="bold" label="Grassetto" disabled={!boldToggle?.object} aria-pressed={boldToggle?.pressed??false} onClick={()=>toggleFace(boldToggle?.object)}/>
          <EditorButton icon="italic" label="Corsivo" disabled={!italicToggle?.object} aria-pressed={italicToggle?.pressed??false} onClick={()=>toggleFace(italicToggle?.object)}/>
          <EditorButton icon="underline" label="Sottolineato" aria-pressed={characterScope?.mixed.includes('underline') ? 'mixed' : character?.underline ?? false} onClick={() => characterPatch({ underline: !character?.underline }, true)}/>
          <EditorButton icon="strikethrough" label="Barrato" aria-pressed={characterScope?.mixed.includes('linethrough') ? 'mixed' : character?.linethrough ?? false} onClick={() => characterPatch({ linethrough: !character?.linethrough }, true)}/>
          <EditorButton icon="overline" label="Sopralineato" aria-pressed={characterScope?.mixed.includes('overline') ? 'mixed' : character?.overline ?? false} onClick={() => characterPatch({ overline: !character?.overline }, true)}/>
        </fieldset>
        </div>
        {fontError&&<p role="status">{fontError}</p>}
        {variants.length>1&&<details className="font-other-styles"><summary>Altri stili</summary><label>Variante font<select aria-label="Variante font" disabled={noCharacters||!commonFamily} value={activeFont} onChange={event=>characterPatch(chooseFontStyle(event.target.value),true)}>{variants.map(face=><option key={face.id} value={face.id} style={{fontFamily:renderFontFamily(face.id)}}>{fontVariantLabel(face.id)}</option>)}</select></label></details>}
        <div className="property-grid">{fontSizeField}{textScaleField}</div>
        {minimumFontPt!==null&&<p role="status" data-testid="minimum-font-notice" className="caption">{(smallestPrintedFontPt(current)??Infinity)<minimumFontPt-1e-7?`Questo testo contiene caratteri sotto ${minimumFontPt} pt: correggili prima di confermare il timbro.`:`Per questo modello il corpo minimo è ${minimumFontPt} pt.`}</p>}
        <div className="property-grid">{!current.textPath && <NumberField {...fields} label="Interlinea" value={current.lineHeight ?? 1} min={EDITOR_LIMITS.minLineHeight} max={EDITOR_LIMITS.maxLineHeight} step={0.1} onChange={lineHeight => patch({ lineHeight })}/> }
        <NumberField {...fields} label={characterSelection ? 'Crenatura (pt)' : 'Spaziatura (pt)'} value={characterSelection?.spacing?.value ?? current.letterSpacingPt ?? 0} min={EDITOR_LIMITS.minTrackingPt} max={EDITOR_LIMITS.maxTrackingPt} step={0.1} mixed={characterSelection?.spacing?.mixed} disabled={!!characterSelection && !characterSelection.spacing?.indices.length} onChange={value => { if (value >= EDITOR_LIMITS.minTrackingPt && value <= EDITOR_LIMITS.maxTrackingPt) { if (characterSelection) onKerning(value); else patch({ letterSpacingPt: value }); } }}/>
        </div>
        <fieldset className="inspector-arrangement"><div role="group" aria-label="Allineamento testo" className="button-row">
          {(['left', 'center', 'right'] as const).map((align, index) => <EditorButton key={align} icon={(['textLeft', 'textCenter', 'textRight'] as const)[index]!} label={['Testo a sinistra', 'Testo centrato', 'Testo a destra'][index]!} aria-pressed={alignmentMixed ? 'mixed' : alignmentValue === align} onClick={() => alignText(align)}/>)}
          <EditorButton icon="textJustify" label="Testo giustificato" aria-pressed={alignmentMixed ? 'mixed' : alignmentValue === 'justify-left'} onClick={() => alignText('justify-left')}/>
        </div>
        {!current.textPath && (current.textBox?.autoWidth ?? true) && <p className="caption">Giustifica fissa la larghezza attuale del box; l’altezza resta automatica.</p>}
        </fieldset>
        {!current.textPath && <details className="justification-settings"><summary>Parametri giustificazione</summary>
          <p className="caption">Percentuali dello spazio normale del font; si aggiungono a spaziatura e crenature. Impostazioni per l’intero box.</p>
          {(['word', 'letter'] as const).map(kind => <fieldset key={kind}><legend>{kind === 'word' ? 'Tra parole (%)' : 'Tra lettere (%)'}</legend><div className="property-grid">
            {(['min', 'desired', 'max'] as const).map((key, index) => <NumberField key={key} {...fields} label={`${kind === 'word' ? 'Parole' : 'Lettere'} ${['minima', 'desiderata', 'massima'][index]} (%)`} value={(current.justification ?? DEFAULT_JUSTIFICATION)[kind][key]} min={kind === 'word' ? 0 : -100} max={kind === 'word' ? 1000 : 500} step={1} onChange={value => { const settings = current.justification ?? DEFAULT_JUSTIFICATION; patch({ justification: { ...settings, [kind]: { ...settings[kind], [key]: value } } }); }}/>)}</div></fieldset>)}
        </details>}
        {frame?.justificationLimited && <p className="caption" data-testid="justification-limits">Una o più righe non raggiungono i margini entro i limiti di spaziatura impostati.</p>}
        {characterSelection && <p className="caption">{characterSelection.spacing?.mode === 'pair' ? 'Correzione della coppia ai lati del cursore.' : 'Correzione degli intervalli interni alla selezione.'} Si somma alla spaziatura generale di {characterSelection.spacing?.base ?? 0} pt. {characterSelection.spacing?.indices.length === 0 && 'Posiziona il cursore tra due caratteri o selezionane almeno due.'}</p>}
        {characterSelection && !current.textPath && <p className="caption" data-testid="line-scope">{characterSelection.line?.indices.length ?? 0} righe interessate · anche una selezione parziale modifica tutta la riga.</p>}
        {current.textPath && <fieldset className="inspector-arrangement"><legend>Testo su tracciato</legend>
          <label>Posizione sul tracciato<select aria-label="Posizione sul tracciato" value={current.textPath.baseline} onChange={event => patch({ textPath: { ...current.textPath!, baseline: event.target.value as 'baseline' | 'ascender' | 'descender' } }, true)}><option value="baseline">Linea di base</option><option value="ascender">Ascendente</option><option value="descender">Discendente</option></select></label>
          <NumberField {...fields} label="Scostamento verticale (mm)" value={current.textPath.normalOffsetMm ?? 0} min={-1000} max={1000} step={0.1} onChange={normalOffsetMm => patch({ textPath: { ...current.textPath!, normalOffsetMm } })}/>
          <p className="caption">Positivo sopra, negativo sotto: segue l’orientamento del testo e si somma al riferimento scelto.</p>
          <NumberField {...fields} label="Scorrimento sul tracciato (mm)" value={current.textPath.offsetMm} min={-10000} max={10000} step={0.1} onChange={offsetMm => patch({ textPath: { ...current.textPath!, offsetMm } })}/>
          <label className="ratio-toggle"><input type="checkbox" checked={current.textPath.reversed} onChange={event => patch({ textPath: { ...current.textPath!, reversed: event.target.checked } }, true)}/> Inverti direzione</label>
          <label className="ratio-toggle"><input type="checkbox" checked={current.textPath.showGuide} onChange={event => patch({ textPath: { ...current.textPath!, showGuide: event.target.checked } }, true)}/> Mostra tracciato nel disegno</label>
          <EditorButton icon="detachText" label="Separa testo dal tracciato" disabled={!!characterSelection || dirty} onClick={onDetachText}/>
          <p className="caption">Trascina la maniglia sul percorso per far scorrere il testo. Il testo segue una sola riga; Giustifica usa l’allineamento centrato.</p>
        </fieldset>}
        {!current.textPath && <p className="caption">Interlinea sul box; allineamento su tutto il box oppure sulle righe interessate durante l’editing; spaziatura generale e crenature locali si sommano. Limite di capacità: {EDITOR_LIMITS.textLines} righe esplicite, {EDITOR_LIMITS.textCharacters} caratteri Unicode per box. Scrivi e modifica il contenuto direttamente sul canvas.</p>}
      </>}
      {section === 'fill' && current.type !== 'image' && <><fieldset className="inspector-arrangement" disabled={current.type === 'text' && noCharacters}><PaintPicker allowColor={allowColor} label="Riempimento" value={current.type === 'text' ? characterScope?.mixed.includes('fill') ? 'mixed' : character?.fill ?? current.fill : current.fill ?? 'none'} allowNone={current.type !== 'text'} onChange={fill => { if (current.type === 'text') { if (fill !== 'none') characterPatch({ fill }, true); } else patch({ fill }, true); }}/></fieldset><p className="caption">{allowColor ? 'Colori RGB del progetto.' : 'Palette del profilo TEST: nero e bianco.'}</p></>}
      {section === 'stroke' && current.type !== 'text' && current.type !== 'image' && <>
        <PaintPicker allowColor={allowColor} label="Contorno" value={current.stroke} allowNone={current.type !== 'line' && current.type !== 'path' && current.type !== 'bezier'} onChange={stroke => { if (current.type !== 'line' && current.type !== 'path' && current.type !== 'bezier' || stroke !== 'none') patch({ stroke }, true); }}/>
        <NumberField {...fields} label="Spessore contorno (mm)" value={current.strokeMm} min={0.01} max={EDITOR_LIMITS.maxStrokeMm} step={0.05} disabled={current.stroke === 'none'} onChange={strokeMm => patch({ strokeMm })}/>
        <label>Tipo di contorno<select disabled={current.stroke === 'none'} value={current.strokeDash ?? 'solid'} onChange={event => patch({ strokeDash: event.target.value as 'solid' | 'dashed' | 'dotted' }, true)}><option value="solid">Continuo</option><option value="dashed">Tratteggiato</option><option value="dotted">Punteggiato</option></select></label>
      </>}
      {section === 'image' && current.type === 'image' && <>
        <p className="caption" data-testid="raster-analysis">{analysis?.kind === 'grayscale' ? 'Riconosciuta automaticamente: scala di grigi (canali R, G e B uguali).' : analysis?.kind === 'near-grayscale' ? 'Canali quasi uguali: possibile grigio con artefatti JPEG. Conversione automatica sospesa per non eliminare tinte reali.' : analysis?.kind === 'empty' ? 'Immagine completamente trasparente.' : 'Immagine a colori: rimozione automatica dello sfondo da valutare separatamente.'}</p>
        {allowColor && <label className="ratio-toggle"><input type="checkbox" checked={current.raster.mode === 'original'} onChange={event => patch({ raster: { ...DEFAULT_RASTER, ...(event.target.checked ? { mode: 'original' as const } : {}) } }, true)}/> Mantieni colori originali</label>}
        {current.raster.mode === 'original' ? <p className="caption">Pixel e trasparenza originali conservati. Disattiva per elaborare in bianco/nero.</p> : <>
        <EditorButton icon="removeBackground" label="Rimuovi sfondo bianco" aria-pressed={!!current.raster.backgroundRemoval} disabled={analysis?.kind !== 'grayscale'} onClick={() => { const raster = { ...current.raster }; if (raster.backgroundRemoval) delete raster.backgroundRemoval; else raster.backgroundRemoval = 'luminance'; patch({ raster }, true); }}/>
        {current.raster.backgroundRemoval && <p className="caption">Bianco trasparente, nero opaco. I grigi diventano nero con opacità proporzionale: 70% nero = 70% opaco. L’alpha originale è conservato. Premi di nuovo per tornare alla conversione binaria.</p>}
        <fieldset className="inspector-arrangement" disabled={!!current.raster.backgroundRemoval}>
        <label>Metodo bianco/nero<select aria-label="Metodo bianco/nero" value={current.raster.method ?? 'threshold'} onChange={event => patch({ raster: { ...current.raster, method: event.target.value as RasterParameters['method'] } }, true)}><option value="threshold">Soglia uniforme</option><option value="ordered">Mezzitoni ordinati</option><option value="diffusion">Diffusione dell’errore</option></select></label>
        </fieldset><div className="property-grid"><NumberField {...fields} label="Luminosità" value={current.raster.brightness ?? 0} min={-100} max={100} step={1} onChange={brightness => patch({ raster: { ...current.raster, brightness } })}/><NumberField {...fields} label="Contrasto" value={current.raster.contrast ?? 0} min={-100} max={100} step={1} onChange={contrast => patch({ raster: { ...current.raster, contrast } })}/></div>
        <fieldset className="inspector-arrangement" disabled={!!current.raster.backgroundRemoval}><NumberField {...fields} label="Soglia bianco/nero" value={current.raster.threshold} min={0} max={255} step={1} onChange={threshold => patch({ raster: { ...current.raster, threshold } })}/></fieldset>
        <label className="ratio-toggle"><input type="checkbox" checked={current.raster.invert} onChange={event => patch({ raster: { ...current.raster, invert: event.target.checked } }, true)}/> Inverti bianco e nero</label>
        <label className="ratio-toggle"><input type="checkbox" disabled={!!current.raster.backgroundRemoval} checked={current.raster.whiteTransparent} onChange={event => patch({ raster: { ...current.raster, whiteTransparent: event.target.checked } }, true)}/> Bianco trasparente</label>
        <EditorButton icon="refresh" label="Ripristina conversione immagine" onClick={() => patch({ raster: { ...DEFAULT_RASTER } }, true)}/></>}
        <div className="button-row"><EditorButton icon="flipX" label="Rifletti immagine orizzontalmente" aria-pressed={current.flipX ?? false} onClick={() => patch({ flipX: !current.flipX }, true)}/><EditorButton icon="flipY" label="Rifletti immagine verticalmente" aria-pressed={current.flipY ?? false} onClick={() => patch({ flipY: !current.flipY }, true)}/></div>
        <p className="caption">{current.raster.mode === 'original' ? 'Lo SVG contiene l’immagine con colori e trasparenza originali, mantenendo ritaglio e trasformazioni. Nessuna vettorializzazione.' : 'Conversione locale del profilo TEST. I mezzitoni riproducono le sfumature con punti bianchi/neri: la resa fisica richiede una prova di lavorazione. L’immagine originale resta nel progetto; lo SVG contiene il raster convertito. Nessuna vettorializzazione.'}</p>
      </>}
      {section === 'crop' && current.type === 'image' && <RasterCropInspector object={current} revision={draft.revision} onChange={(next, immediate) => replaceObject(next, immediate)}/>}
      {section === 'nodes' && current.type === 'bezier' && <BezierNodeInspector object={current} revision={draft.revision} onChange={replaceObject} onFocusNode={onNodeFocus}/>}
      {section === 'nodes' && current.type === 'path' && <PathNodeInspector object={current} revision={draft.revision} onChange={replaceObject} onFocusNode={onNodeFocus}/>}
      {section === 'arrange' && <><fieldset className="inspector-arrangement" disabled={dirty || !!characterSelection}>{arrangement}</fieldset>{dirty && <p className="caption">Aggiornamento in corso o valore da correggere.</p>}</>}
      {frame?.overflow && <p role="status" className="inspector-overflow">{current.type === 'text' && current.textPath ? 'Il testo supera la lunghezza del tracciato. Il contenuto completo è conservato.' : 'Testo più largo del box: aumenta la larghezza o abilita la larghezza automatica. Il contenuto completo è conservato.'}</p>}
    </div>
    <div className="inspector-footer"><span role="status">{status}</span></div>
  </form>;
}

export function ObjectInspector(props: Parameters<typeof MeasuredObjectInspector>[0]) {
 useSyncExternalStore(subscribeFontCoverage,fontCoverageVersion);useSyncExternalStore(subscribeFonts,fontCatalogVersion);
 const object=props.characterSelection?.object??props.object;
 return object.type==='text'&&!textGeometryVerified(object)?<UnverifiedTextInspector object={object} revision={props.revision} onApply={props.onApply} onFontMenuOpen={props.onFontMenuOpen}/>:<MeasuredObjectInspector {...props}/>;
}
