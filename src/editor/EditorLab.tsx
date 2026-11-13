import {ProductionProfilePanel} from './ProductionProfilePanel';
import {geometryFocusCurrent,geometryFocusFromReport,type GeometryFocus} from './geometry-focus';
import type {ProductionGeometryReport} from './production-geometry';
import {ToolbarMenu} from './ToolbarMenu';
import {TransformPanel} from './TransformPanel';
import {withObjectTargetScope} from './group-member';
import{hasReferenceLayers}from'./reference-layers';
import{exportReferenceSvg}from'./reference-export';
import{exportProjectSvgZip,currentPageName}from'./page-export';
import{graphicPageIds,graphicPages}from'./pages';
import{PageStrip}from'./PageStrip';
import{allGraphicObjects}from'./pages';
import{CanvasContextMenu}from'./CanvasContextMenu';
import {PaperColorPanel} from './PaperColorPanel';
import {MediaLibraryDialog} from './MediaLibraryDialog';
import {mediaRasterCommand} from './media-insertion';
import {librarySvgInsertion,librarySvgBackground} from './media-vector-insertion';
import {readMediaOriginal,mediaRasterSource} from './media-source';
import type {MediaAsset,MediaKind} from '../editor-admin/media-schema';
import {textGeometryVerified} from './font-measurement';
import { MAX_PROJECT_BYTES } from './project-limits';
import { assertFontGeometry } from './verified-font-geometry';
import { exportDocumentSvg } from './fabric-adapter';
import { missingCharacterFontCommand } from './font-repair';
import {useProjectFontPreparation} from './LegacyFontDialog';
import {legacyFontRequests} from './legacy-fonts';
import {CustomerFieldsPanel} from './CustomerFieldsPanel';
import {formEntries,selectableObjectIds,validateObjectInputs,effectiveObjectProperties,selectedRootGroups} from './object-properties';
import {rootGroupFor} from './scene-groups';
import {PlaqueConfigurationPanel} from './PlaqueConfigurationPanel';
import { copyArchiveTitle,editorMode,editorReturnUrl,metadataKey,sessionDocumentKey } from './design-session';
import type { ArchiveRecord } from '../editor-admin/schema';
import { ArchiveTagInput } from '../editor-admin/ArchiveTagInput';
import { archiveTagVocabulary,parseTags } from '../editor-admin/archive-tags';
import { ConfigurationPanel, type WorkflowEditorApi } from '../editor-workflow/ConfigurationPanel';
import { ProductPanel } from '../editor-workflow/ProductPanel';
import { DraftPanel,type DraftControl } from '../editor-workflow/DraftPanel';
import { preserveDraftSnapshot } from '../editor-workflow/drafts';
import { fitTemplate, templateCommand } from '../editor-workflow/template-fit';
import { profileKey } from '../catalog/schema';
import { FontCheckPanel } from './FontCheckPanel';
import { TextMaskCheckPanel } from './TextMaskCheckPanel';
import { InkPreviewFilter } from './InkPreviewFilter';
import { refreshLibraryFonts,initializeLibraryFonts,showProjectFontChoices } from '../editor-admin/library-fonts';
import { loadFontAssets, fontAssetArguments, defaultLibraryFont, registeredFontAsset } from './fonts';
import { readAdminSnapshot, readArchiveRecord, localAdminRequest } from '../editor-admin/api';
import { prepareSvg, svgInsertion } from './svg-import';
import { MAX_SVG_BYTES,SVG_SIZE_LABEL } from './svg-sanitize';
import { EditorButton, EditorIcon } from './EditorButton';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { FabricAdapter, measureFabric, measureTextFrame } from './fabric-adapter';
import { createDocument, DocumentStore, GraphicCommandSchema, parseGraphicDocument, cloneGraphicDocument, type GraphicDocument, type SceneObject } from './model';
import type { ProductProfile } from '../catalog/schema';
import './editor.css';
import { ObjectInspector,type InspectorSection } from './ObjectInspector';
import { minimumFontForDocument } from './text-production';
import {assertDocumentProduction} from './production-check';
import {browserBinaryRasterCheck} from './production-check-browser';
import { WorkspaceFrame } from './WorkspaceFrame';
import { LayersPanel } from './LayersPanel';
import type { CharacterSelection } from './text-style';
import { expandSelection,selectionUnits } from './selection';
import { SelectionInspector } from './SelectionInspector';
import { DEFAULT_GUIDES } from './guides';
import { primitiveFromEndpoints, type DrawingPrimitive } from './primitive-geometry';
import { strokeGeometry } from './path-geometry';
import { regularPolygonPoints, starPoints } from './polygon-geometry';
import { movePathNode } from './path-nodes';
import { rasterSourceFromBytes, MAX_RASTER_BYTES } from './raster-source';
import { prepareRasterSource } from './raster-cache';
import { panRasterContents } from './raster-crop-edit';
import { DEFAULT_RASTER } from './raster-processing';
import { captureSelection, clipboardInsertion, fittedClipboard } from './clipboard';
import {writeGraphicClipboard,readGraphicClipboard,graphicClipboardCount,subscribeGraphicClipboard,clearGraphicClipboard} from './clipboard-storage';
import { PngExportPanel } from './PngExportPanel';
import { normalizedBezier } from './bezier-geometry';
import { placeObjectAtCenter } from './model';

function createEditorDocument(product: ProductProfile|undefined, catalogVersion: string): GraphicDocument {
  const doc = createDocument(product, catalogVersion),font=defaultLibraryFont(),asset=font?registeredFontAsset(font):undefined;
  doc.objects=doc.objects.flatMap<SceneObject>(object=>object.type==='text'?(font?[{...object,fontFamily:font}]:[]):[object]);
  if(asset)doc.fontAssets=[asset];
  doc.objects = doc.objects.map(object => {
    if (object.type !== 'text' || object.textBox || !textGeometryVerified(object)) return object;
    const { widthMm, heightMm } = measureTextFrame(object);
    return { ...object, textBox: { widthMm, heightMm, autoWidth: true, autoHeight: true } };
  });
  return doc;
}
export function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function example(revision: number, objectId = 'text-1'): string {
  return JSON.stringify({ schemaVersion: 1, tool: 'moveObject', expectedRevision: revision, objectId, arguments: { xMm: 10, yMm: 8 } }, null, 2);
}
function EditorLabSession({ product, draftText, catalogVersion, catalogOutdated = false, autosave = false, availableProducts, onEditingChange, onKeepProduct, portable=false,onDocumentState,initialDocument,initialTitle,initialTags,initialKind='composition',initialSource }: { initialSource?:{record:ArchiveRecord;mode:'archive'|'template'};initialKind?:'composition'|'template';initialTitle?:string;initialTags?:string[];initialDocument?:GraphicDocument;onDocumentState?:(document:GraphicDocument)=>void;portable?:boolean;product?: ProductProfile; draftText?: string; catalogVersion: string; catalogOutdated?: boolean; autosave?: boolean; availableProducts?: readonly ProductProfile[]; onEditingChange: (editing: boolean) => void; onKeepProduct: (productId: string, variantId: string) => void }) {
  const projectFonts=useProjectFontPreparation();
  const mode=editorMode(),policyRole=mode==='customer'?'customer':'admin';const archiveBusyRef=useRef(false);
  const graphicCatalog=availableProducts||product?{version:catalogVersion,products:availableProducts??[product!]}:undefined;
  const inkFilterId=`editor-ink-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const pdfImportRef = useRef<HTMLInputElement>(null);
  const svgImportRef = useRef<HTMLInputElement>(null);
  const [mediaLibrary,setMediaLibrary]=useState<MediaKind|null>(null);
  const [contextPoint,setContextPoint]=useState<{x:number;y:number}|null>(null);
  const [importNotice, setImportNotice] = useState('');
  const [vectorMonochrome, setVectorMonochrome] = useState(initialDocument?.colorMode !== 'color');
  const [importTextMode,setImportTextMode]=useState<'outlines'|'editable'>('outlines');
  const [fontNotice, setFontNotice] = useState('');
  const [archiveTitle, setArchiveTitle] = useState(initialTitle??''), [archiveKind, setArchiveKind] = useState<'composition' | 'template'>(initialKind), [archiveBusy, setArchiveBusy] = useState(false);
  const [fieldsValid,setFieldsValid]=useState(true);
  const [pdfBusy,setPdfBusy]=useState(false),[customerPdfEnabled,setCustomerPdfEnabled]=useState(false);
  const [archiveTags,setArchiveTags]=useState(initialTags?.join(', ')??''),[archiveVocabulary,setArchiveVocabulary]=useState<string[]>([]);
  const imageImportRef = useRef<HTMLInputElement>(null), assetBusyRef = useRef(false);
  const adapter = useRef<FabricAdapter | null>(null);
  const storeRef = useRef<DocumentStore | null>(null);
  const [doc, setDoc] = useState<GraphicDocument>(() => initialDocument?parseGraphicDocument(initialDocument):createEditorDocument(product, catalogVersion));
  const [geometryFocus,setGeometryFocus]=useState<GeometryFocus|null>(null),geometryFocusSequence=useRef(0);
  const currentGeometryFocus=geometryFocus&&geometryFocusCurrent(geometryFocus,doc)?geometryFocus:null;
  useEffect(() => setVectorMonochrome(doc.colorMode !== 'color'), [doc.colorMode]);
  const firstProductEffect=useRef(true);
  const [trialArchive,setTrialArchive]=useState<{readOnly:boolean}|undefined>();
  const [sourceRecord,setSourceRecord]=useState<ArchiveRecord|null>(()=>initialSource?.mode==='archive'&&!(mode==='customer'&&initialSource.record.kind==='template')?initialSource.record:null),[sessionNotice,setSessionNotice]=useState(initialSource?`Aperto: ${initialTitle??initialSource.record.title}`:''),[sessionDialog,setSessionDialog]=useState<'reload'|'close'|null>(null),[savedStamp,setSavedStamp]=useState(()=>sessionDocumentKey(doc)),[savedMetadata,setSavedMetadata]=useState(()=>metadataKey(initialTitle??'',initialKind,initialTags?.join(', ')??''));
  const draftControl=useRef<DraftControl|null>(null),originalDocument=useRef<GraphicDocument>(structuredClone(doc)),leaving=useRef(false),sessionModal=useRef<HTMLDialogElement>(null);
  const dirty=sessionDocumentKey(doc)!==savedStamp||metadataKey(archiveTitle,archiveKind,archiveTags)!==savedMetadata;
  const [command, setCommand] = useState(example(0));
  const [editing, setEditing] = useState(false);
  const [assetBusy, setAssetBusy] = useState(false);
  const [drawingTool, setDrawingTool] = useState<DrawingPrimitive | 'freehand' | 'polyline' | 'bezier' | null>(null), [drawing, setDrawing] = useState(false);
  const [selectionEpoch, setSelectionEpoch] = useState(0), [nodeMode, setNodeMode] = useState(false), [cropMode, setCropMode] = useState(false);
  const inspectorSection=useRef<InspectorSection>('geometry');
  const cropContentsFocus = useRef<string | null>(null);
  const [polylineCount, setPolylineCount] = useState(0);
  const [error, setError] = useState('');
  const [fontRendering, setFontRendering] = useState<{blocked:readonly string[];pending:readonly string[]}>({blocked:[],pending:[]});
  const [eventLog, setEventLog] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds.length === 1 ? selectedIds[0]! : null;
  const [alignPage,setAlignPage]=useState(false),[masterId,setMasterId]=useState<string|null>(null),masterRef=useRef<string|null>(null);
  const chooseMaster=(id:string|null)=>{masterRef.current=id;setMasterId(id);adapter.current?.setMasterObject(id);if(id)setAlignPage(false);};
  const [multiple, setMultiple] = useState(false);
  const guidesTouched = useRef(false);
  const [guides, setGuides] = useState({ ...DEFAULT_GUIDES }), [gridRaw, setGridRaw] = useState('1');
  const [panTool, setPanTool] = useState(false), [temporaryPan, setTemporaryPan] = useState(false);
  useEffect(() => { if (drawingTool || nodeMode || cropMode) setPanTool(false); }, [drawingTool, nodeMode, cropMode]);
  const [trashVisible, setTrashVisible] = useState(false);
  const [characterSelection, setCharacterSelection] = useState<CharacterSelection | null>(null);
  useEffect(()=>{if(geometryFocus&&(editing||drawing||!geometryFocusCurrent(geometryFocus,doc)))setGeometryFocus(null);},[geometryFocus,doc,editing,drawing]);
  const selectedRef = useRef<string[]>([]),directRef=useRef<string|null>(null),selectionDocument=useRef('');
  const dispatch=(store:DocumentStore,raw:unknown,source:'manual'|'ai-simulation')=>store.dispatch(withObjectTargetScope(raw,store===storeRef.current?directRef.current:null),source);

  const clipboardWrite=useRef<Promise<void>|null>(null),[clipboardCount, setClipboardCount] = useState(0),[clipboardBusy,setClipboardBusy]=useState(false);
  useEffect(()=>{let live=true;const update=()=>{void graphicClipboardCount().then(count=>{if(live)setClipboardCount(count);}).catch(()=>{});};update();const stop=subscribeGraphicClipboard(update);return()=>{live=false;stop();};},[]);
  const select = (selection: string | readonly string[] | null,direct=false) => {
    const ids = typeof selection === 'string' ? [selection] : selection ?? [];
    const current=storeRef.current?.document,inside=direct&&ids.length===1&&!!current&&!!rootGroupFor(current,ids[0]!);
    const next = current ? selectableObjectIds(current,inside?ids:expandSelection(current,ids),policyRole,inside) : [...ids];
    if(next.join('\0')!==selectedRef.current.join('\0')||selectionDocument.current!==`${current?.documentId}:${current?.pageId??'page-1'}`)chooseMaster(null);
    directRef.current=inside&&next.length===1?next[0]!:null;
    selectedRef.current = next;selectionDocument.current=current?`${current.documentId}:${current.pageId??'page-1'}`:''; setSelectedIds(next);
    if(adapter.current?.setDirectObject(directRef.current)&&current)adapter.current.render(current,next);
  };
  const refresh = () => {
    const store = storeRef.current; if (!store) return;
    showProjectFontChoices(store.document.fontAssets);select(selectedRef.current,!!directRef.current&&selectionDocument.current===`${store.document.documentId}:${store.document.pageId??'page-1'}`);
    setDoc(cloneGraphicDocument(store.document)); adapter.current?.render(store.document, selectedRef.current);
    setEventLog(store.events.map(e => `r${e.revision}: ${e.source} ${e.objectId ?? ''}`).join('\n'));
  };
  const act = (action: () => void, selectAfter?: string | string[]) => {
    setDrawingTool(null);
    if(archiveBusyRef.current){setError('Attendi il salvataggio del design.');return false;}
    try { action(); if (selectAfter) select(selectAfter,!!directRef.current&&typeof selectAfter==='string'); setError(''); refresh(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Operazione rifiutata'); const store = storeRef.current; if (store) adapter.current?.render(store.document, selectedRef.current); return false; }
  };
  const objectArguments = (object: SceneObject) => fontAssetArguments(object, storeRef.current?.document.fontAssets);
  const prepareAndAct = async (prepare: (store: DocumentStore) => Promise<() => void>, selectAfter?: string | string[]) => {
    const store = storeRef.current; if (!store || assetBusyRef.current) return false;
    const revision = store.document.revision, documentId = store.document.documentId;
    assetBusyRef.current = true; setAssetBusy(true); setDrawingTool(null); onEditingChange(true);
    try {
      const commit = await prepare(store);
      if (storeRef.current !== store || store.document.revision !== revision || store.document.documentId !== documentId) throw new Error('Documento cambiato durante il caricamento: importazione annullata');
      return act(commit, selectAfter);
    } catch (e) { if (storeRef.current) setError(e instanceof Error ? e.message : 'Importazione non riuscita'); return false; }
    finally { assetBusyRef.current = false; if (storeRef.current) { setAssetBusy(false); onEditingChange(false); } }
  };
  const saveArchive = async (close=false,copy=true) => {
    const snapshot = structuredClone(storeRef.current!.document);archiveBusyRef.current=true;setArchiveBusy(true);setError('');setSessionNotice('');
    try {
      if(mode==='customer'){if(!fieldsValid)throw new Error('Correggi il campo del modulo non ancora applicato al design.');for(const page of graphicPages(snapshot)){try{validateObjectInputs(page);}catch(error){throw Error(`${page.pageName??'Pagina 1'}: ${error instanceof Error?error.message:'Dati non validi'}`);}}if(close)await assertDocumentProduction(snapshot,graphicCatalog,browserBinaryRasterCheck,true);}
      const state=await readAdminSnapshot();if(state.environment?.readOnly)throw new Error('Copia di prova in sola lettura: esporta il progetto per conservare le modifiche.');const title=archiveTitle.trim()||sourceRecord?.title||`Composizione ${new Date().toLocaleDateString('it-IT')}`;
      const replace=!copy&&sourceRecord&&(mode==='admin'||sourceRecord.kind==='composition');
      const saved=await localAdminRequest('',replace?{tool:'replaceRecord',expectedRevision:state.revision,arguments:{id:sourceRecord.id,recordVersion:sourceRecord.version,title,tags:parseTags(archiveTags),document:snapshot}}:{tool:'saveRecord',expectedRevision:state.revision,arguments:{kind:mode==='customer'?'composition':archiveKind,title,tags:parseTags(archiveTags),clientRef:'',document:snapshot}})as Awaited<ReturnType<typeof readAdminSnapshot>>;
      const id=replace?sourceRecord.id:saved.records.at(-1)!.id,record={...saved.records.find(item=>item.id===id)!,document:snapshot};
      setSourceRecord(record);setArchiveTitle(title);setArchiveKind(record.kind);setArchiveVocabulary(archiveTagVocabulary(saved));originalDocument.current=structuredClone(snapshot);setSavedStamp(sessionDocumentKey(snapshot));setSavedMetadata(metadataKey(title,record.kind,archiveTags));setSessionNotice(`Design salvato: ${title} · v${record.version}`);setImportNotice(`Design salvato: ${title} · v${record.version}`);
      if(close&&sessionDocumentKey(storeRef.current!.document)!==sessionDocumentKey(snapshot)){setSessionNotice('Design salvato, ma ci sono modifiche successive: l’editor resta aperto per conservarle.');return true;}if(close){await draftControl.current?.discard();leaving.current=true;window.location.assign(mode==='admin'?editorReturnUrl(mode,record.kind):`/editor/confirmed?project=${id}&mode=${mode}`);}
      return true;
    }catch(e){setError(e instanceof Error?e.message:'Salvataggio non riuscito. Il design rimane aperto.');return false;}finally{archiveBusyRef.current=false;setArchiveBusy(false);}
  };
  useEffect(()=>{const dialog=sessionModal.current;if(sessionDialog&&!dialog?.open)dialog?.showModal();else if(!sessionDialog&&dialog?.open)dialog.close();},[sessionDialog]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(!leaving.current&&dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const exportPdf=async(includeReferences=false)=>{const snapshot=structuredClone(storeRef.current!.document);setPdfBusy(true);setError('');try{const response=await fetch(`/__editor-local/export-pdf${includeReferences?'?references=1':''}`,{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Local':'1'},body:JSON.stringify(snapshot)});if(!response.ok){const data=await response.json();throw new Error(data.error??'PDF non esportato');}const blob=await response.blob();if(sessionDocumentKey(storeRef.current!.document)!==sessionDocumentKey(snapshot))throw new Error('Il design è cambiato durante l’esportazione: PDF non scaricato. Ripeti l’operazione.');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=includeReferences?'design-con-riferimenti.pdf':'design.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(cause){setError(cause instanceof Error?cause.message:'PDF non esportato');}finally{setPdfBusy(false);}};
  const importPdf = (file: File) => {
    void prepareAndAct(async store => {
      if (file.size > 2 * 1024 * 1024) throw new Error('PDF oltre 2 MB');
      const response = await fetch('/__editor-local/pdf', { method: 'POST', headers: { 'Content-Type': 'application/pdf', 'X-Editor-Local': '1', 'X-Editor-Text-Mode': importTextMode }, body: file });
      const converted = await response.json(); if (!response.ok) throw new Error(converted.error ?? 'Conversione PDF locale non disponibile');
      const prepared = await prepareSvg(converted.svg, vectorMonochrome, 'editable'), insertion = svgInsertion(prepared, store.document, measureFabric,minimumFontForDocument(store.document,graphicCatalog));
      return () => { dispatch(store,insertion.command, 'manual'); select(insertion.command.arguments.objects.map(object => object.id)); setImportNotice(insertion.report.replace('SVG importato:', 'PDF importato:') + (importTextMode==='editable' ? ` Ricostruite ${converted.textCount??0} righe editabili. Verifica font, spaziature e anteprima; le lettere già in contorni rimangono vettori.` : ' Conversione locale, testi trasformati in contorni.') + ' PDF originale eliminato dopo l’elaborazione.'); };
    });
  };
  const importSvg = (file: File) => {
    let ids: string[] = [];
    void prepareAndAct(async store => {
      if (file.size > MAX_SVG_BYTES) throw new Error(`SVG oltre ${SVG_SIZE_LABEL}`);
      const prepared = await prepareSvg(new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()), vectorMonochrome, importTextMode), insertion = svgInsertion(prepared, store.document, measureFabric,minimumFontForDocument(store.document,graphicCatalog)); ids = insertion.command.arguments.objects.map(object => object.id);
      return () => { dispatch(store,insertion.command, 'manual'); select(ids); setImportNotice(insertion.report); };
    });
  };
  const importImage = (file: File) => {
    const objectId = `object-${crypto.randomUUID()}`;
    void prepareAndAct(async store => {
      if (file.size > MAX_RASTER_BYTES) throw new Error('Immagine oltre 20 MB');
      const source = rasterSourceFromBytes(`asset-${crypto.randomUUID()}`, new Uint8Array(await file.arrayBuffer())); await prepareRasterSource(source);
      const area = store.document.areaMm, scale = Math.min(Math.min(30, area.width - 4) / source.pixelWidth, Math.min(12, area.height - 4) / source.pixelHeight);
      const widthMm = source.pixelWidth * scale, heightMm = source.pixelHeight * scale;
      const object: SceneObject = { id: objectId, type: 'image', source, raster: { ...DEFAULT_RASTER, ...(store.document.colorMode==='color'?{mode:'original' as const}:{}) }, widthMm, heightMm, xMm: (area.width - widthMm) / 2, yMm: (area.height - heightMm) / 2 };
      const expectedRevision = store.document.revision;
      return () => dispatch(store,{ schemaVersion: 1, tool: 'addObject', objectId, expectedRevision, arguments: objectArguments(object) }, 'manual');
    }, objectId);
  };
  const insertLibraryAsset=async(asset:MediaAsset,asRaster:boolean)=>{
    let failure:unknown;const ok=await prepareAndAct(async store=>{try{const bytes=await readMediaOriginal(asset);
      if(asset.mime==='image/svg+xml'&&!asRaster){const prepared=await prepareSvg(new TextDecoder('utf-8',{fatal:true}).decode(bytes),store.document.colorMode!=='color','outlines'),insertion=asset.kind==='background'?librarySvgBackground(prepared,store.document,asset.title,minimumFontForDocument(store.document,graphicCatalog)):librarySvgInsertion(prepared,store.document,asset.defaultWidthMm,minimumFontForDocument(store.document,graphicCatalog));return()=>{dispatch(store,insertion.command,'manual');select(insertion.command.arguments.objects.map(o=>o.id));setImportNotice(insertion.report);};}
      const source=await mediaRasterSource(asset,bytes);await prepareRasterSource(source);const command=mediaRasterCommand(store.document,source,asset.title,asset.kind==='background',asset.defaultWidthMm);return()=>{dispatch(store,command,'manual');select(command.objectId);};
    }catch(e){failure=e;throw e;}});if(!ok)throw failure??new Error('Inserimento annullato: il documento è cambiato o il contenuto non rispetta i vincoli.');return true;
  };
  const executeCommand = () => {
    try {
      const parsed = GraphicCommandSchema.parse(JSON.parse(command));
      const images = (parsed.tool === 'insertObjects'||parsed.tool==='setBackgroundObjects' ? parsed.arguments.objects : parsed.tool === 'addObject' || parsed.tool === 'updateObject' ? [parsed.arguments.object] : parsed.tool==='setBackgroundImage'&&parsed.arguments.object?[parsed.arguments.object] : []).filter(object => object.type === 'image');
      const sources=[...images.map(image=>image.source),...(parsed.tool==='replaceImageSource'?[parsed.arguments.source]:[])];
      const fontAssets = 'fontAssets' in parsed.arguments ? parsed.arguments.fontAssets ?? [] : [];
      if (sources.length || fontAssets.length || parsed.tool==='changeFormat' || parsed.tool==='applyTemplate') {
        void prepareAndAct(async store => { await Promise.all([loadFontAssets(fontAssets), ...sources.map(source => prepareRasterSource(source))]); if(parsed.tool==='changeFormat')await assertFontGeometry(store.document);if(parsed.tool==='applyTemplate')await assertFontGeometry({objects:parsed.arguments.objects,fontAssets:parsed.arguments.fontAssets}); return () => dispatch(store,parsed, 'ai-simulation'); });
      } else act(() => dispatch(storeRef.current!,parsed, 'ai-simulation'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Comando non valido'); }
  };
  const addObject = (type: Exclude<SceneObject['type'], 'path' | 'image' | 'bezier' | 'vector'>) => {
    const objectId = `object-${crypto.randomUUID()}`;
    act(() => {
      const store = storeRef.current!;
      const object: SceneObject = type === 'text'
        ? { id: objectId, type, xMm: 0, yMm: 0, text: 'TEST', fontSizePt: 7, fontFamily: defaultLibraryFont()??'', fill: '#000000', textAlign: 'center', textBox: { widthMm: Math.min(30, store.document.areaMm.width - 4), heightMm: 6, autoWidth: true, autoHeight: true } }
        : type === 'rect'
          ? { id: objectId, type, xMm: 0, yMm: 0, widthMm: 6, heightMm: 4, strokeMm: 0.25, stroke: '#000000' }
          : type === 'ellipse' ? { id: objectId, type, xMm: 0, yMm: 0, rxMm: 4, ryMm: 2, strokeMm: 0.25, stroke: '#000000' }
          : type === 'line' ? { id: objectId, type, xMm: 0, yMm: 0, lengthMm: 12, strokeMm: 0.25, stroke: '#000000' }
          : { id: objectId, type, xMm: 0, yMm: 0, radiusMm: 2, strokeMm: 0.25, stroke: '#000000' };
      if(object.type==='text'&&!object.fontFamily)throw new Error('Carica almeno un font nella libreria prima di aggiungere un testo.');
      if(object.type==='text'&&!textGeometryVerified(object)){object.xMm=store.document.areaMm.width/2;object.yMm=store.document.areaMm.height/2;}else{
      const box = measureFabric(object);
      object.xMm = (store.document.areaMm.width - box.widthMm) / 2;
      object.yMm = (store.document.areaMm.height - box.heightMm) / 2;}
      dispatch(store,{ schemaVersion: 1, tool: 'addObject', expectedRevision: store.document.revision, objectId, arguments: objectArguments(object) }, 'manual');
    }, objectId);
  };
  const addBezier = () => {
    const objectId = `object-${crypto.randomUUID()}`;
    act(() => {
      const store = storeRef.current!, object = placeObjectAtCenter({ id: objectId, type: 'bezier', ...normalizedBezier([{ x: 0, y: 3, out: { x: 3, y: -3 } }, { x: 12, y: 3, in: { x: 9, y: 9 } }], false), closed: false, strokeMm: 0.25, stroke: '#000000' }, { xMm: store.document.areaMm.width / 2, yMm: store.document.areaMm.height / 2 }, measureFabric);
      dispatch(store,{ schemaVersion: 1, tool: 'addObject', expectedRevision: store.document.revision, objectId, arguments: objectArguments(object) }, 'manual');
    }, objectId);
  };
  const addPolygon = (preset: 'triangle' | 'pentagon' | 'star') => {
    const objectId = `object-${crypto.randomUUID()}`;
    act(() => {
      const store = storeRef.current!, points = preset === 'star' ? starPoints(5, 4, 0.45) : regularPolygonPoints(preset === 'triangle' ? 3 : 5, 4);
      const object: SceneObject = { id: objectId, type: 'path', ...strokeGeometry(points), closed: true, strokeMm: 0.25, stroke: '#000000' };
      const bounds = measureFabric(object); object.xMm = (store.document.areaMm.width - bounds.widthMm) / 2; object.yMm = (store.document.areaMm.height - bounds.heightMm) / 2;
      dispatch(store,{ schemaVersion: 1, tool: 'addObject', objectId, expectedRevision: store.document.revision, arguments: objectArguments(object) }, 'manual');
    }, objectId);
  };
  const duplicate = () => {
    const selected = selectedRef.current, store = storeRef.current!;
    if (selected.length === 1&&(!!directRef.current||!rootGroupFor(store.document,selected[0]!))) {
      const object = store.document.objects.find(object => object.id === selected[0])!, newObjectId = `object-${crypto.randomUUID()}`;
      act(() => dispatch(store,{ schemaVersion: 1, tool: 'duplicateObject', expectedRevision: store.document.revision, objectId: object.id, arguments: { newObjectId, xMm: object.xMm, yMm: object.yMm } }, 'manual'), newObjectId);
    } else if (selected.length) {
      const copies = selected.map(objectId => ({ objectId, newObjectId: `object-${crypto.randomUUID()}` }));
      const groups = (store.document.groups ?? []).filter(group => group.objectIds.every(id => selected.includes(id))).map(group => ({ groupId: group.id, newGroupId: `group-${crypto.randomUUID()}` }));
      act(() => dispatch(store,{ schemaVersion: 1, tool: 'duplicateObjects', expectedRevision: store.document.revision, objectId: selected[0], arguments: { copies, groups } }, 'manual'), copies.map(copy => copy.newObjectId));
    }
  };
  const deleteSelection = () => act(() => {
    const store = storeRef.current!, ids = selectedRef.current;
    const single=ids.length===1&&(!!directRef.current||!rootGroupFor(store.document,ids[0]!));dispatch(store,{ schemaVersion: 1, tool: single ? 'deleteObject' : 'deleteObjects', expectedRevision: store.document.revision, objectId: ids[0], arguments: single ? {} : { objectIds: ids } }, 'manual');
  });
  const copySelection = (cut = false) => {
    if(clipboardWrite.current)return;
    try {
      const store=storeRef.current!,revision=store.document.revision,copied=captureSelection(store.document,selectedRef.current,!!directRef.current);
      setClipboardBusy(true);
      const pending=writeGraphicClipboard(copied).then(()=>{
        setClipboardCount(copied.objects.length);
        if(cut){if(storeRef.current!==store||store.document.revision!==revision)throw Error('Oggetti copiati; il documento è cambiato, quindi il taglio è stato annullato.');if(!deleteSelection())throw Error('Oggetti copiati; il taglio non è riuscito.');}
        setError('');setImportNotice(`${copied.objects.length} elementi copiati. Puoi incollarli anche in un altro template o documento.`);
      });clipboardWrite.current=pending;
      void pending.catch(error=>setError(error instanceof Error?error.message:'Copia non riuscita')).finally(()=>{clipboardWrite.current=null;setClipboardBusy(false);});
    } catch (e) { setError(e instanceof Error ? e.message : 'Copia non riuscita'); }
  };
  const pasteSelection = async (fit=false) => {
    try{
      if(clipboardWrite.current)await clipboardWrite.current;
      if(!storeRef.current||assetBusyRef.current)return;
      await prepareAndAct(async store=>{
        const clipboard=await readGraphicClipboard();if(!clipboard)throw Error('Gli appunti del configuratore sono vuoti. Copia prima gli oggetti.');
        await Promise.all([loadFontAssets(clipboard.fontAssets??[]),...clipboard.objects.filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source))]);
        const prepared=fit?fittedClipboard(clipboard,store.document,measureFabric):clipboard;
        const insertion=clipboardInsertion(prepared,store.document.revision),ids=insertion.arguments.objects.map(object=>object.id);
        return()=>{dispatch(store,insertion,'manual');select(ids);setImportNotice(fit?'Oggetti incollati e adattati proporzionalmente al foglio.':'Oggetti incollati con dimensioni e posizioni originali. Puoi ridimensionarli con le maniglie o nell’ispettore.');};
      });
    }catch(error){setError(error instanceof Error?error.message:'Incolla non riuscito');}
  };
  const selectionCommand = (tool: string, args: unknown, objectId = selectedRef.current[0]) => act(() => {
    const store = storeRef.current!; dispatch(store,{ schemaVersion: 1, tool, expectedRevision: store.document.revision, objectId, arguments: args }, 'manual');
  });
  const locateGeometry=(report:ProductionGeometryReport,pageId:string,ruleId:string)=>{
    const store=storeRef.current;if(!store)return;
    const focus=geometryFocusFromReport(store.document,report,pageId,ruleId,++geometryFocusSequence.current);
    if(!focus){setError('Il punto non è più valido per questo design: ripeti il controllo.');return;}
    if(pageId!==(store.document.pageId??'page-1')&&!act(()=>dispatch(store,{schemaVersion:1,tool:'selectPage',objectId:pageId,expectedRevision:store.document.revision,arguments:{pageId}},'manual'),[]))return;
    setContextPoint(null);setGeometryFocus(focus);
  };
  useEffect(() => {
    if (!canvasRef.current) return;
    const initial = structuredClone(doc);
    let store = new DocumentStore(initial, measureFabric, graphicCatalog,policyRole);
    if (draftText) {
      try {
        const text = initial.objects.find(o => o.type === 'text')!;
        const box = measureFabric({ ...text, text: draftText });
        const xMm = initial.shape === 'round' ? (initial.areaMm.width - box.widthMm) / 2 : 1;
        const yMm = initial.shape === 'round' ? (initial.areaMm.height - box.heightMm) / 2 : 1;
        dispatch(store,{ schemaVersion: 1, tool: 'moveObject', expectedRevision: 0, objectId: 'text-1', arguments: { xMm, yMm } }, 'manual');
        dispatch(store,{ schemaVersion: 1, tool: 'setText', expectedRevision: 1, objectId: 'text-1', arguments: { text: draftText } }, 'manual');
      } catch { store = new DocumentStore(initial, measureFabric, graphicCatalog,policyRole); setError('Il testo raccolto non entra nella bozza iniziale con i vincoli di prova. È conservato nella chat: scegli un formato più ampio o verifica l’impaginazione.'); }
    }
    storeRef.current = store;
    const view = new FabricAdapter(canvasRef.current, () => storeRef.current!.document.revision,
      (objectId, xMm, yMm, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'moveObject', expectedRevision, objectId, arguments: { xMm, yMm } }, 'manual')),
      (objectId, object, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', expectedRevision, objectId, arguments: objectArguments(object) }, 'manual')),
      value => { setEditing(value); onEditingChange(value); }, undefined,
      (objectId, args, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'transformObject', objectId, expectedRevision, arguments: args }, 'manual')),
      (objectId, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'deleteObject', objectId, expectedRevision, arguments: {} }, 'manual')), setTrashVisible, setCharacterSelection, ids=>select(ids,ids.length===1&&directRef.current===ids[0]),
      (objectIds, deltaXmm, deltaYmm, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'moveObjects', objectId: objectIds[0], expectedRevision, arguments: { objectIds, deltaXmm, deltaYmm } }, 'manual')),
      (objectIds, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'deleteObjects', objectId: objectIds[0], expectedRevision, arguments: { objectIds } }, 'manual')),
      (objectIds, args, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'transformObjects', objectId: objectIds[0], expectedRevision, arguments: { ...args, objectIds } }, 'manual')),id=>{
        setDrawingTool(null);setPanTool(false);setNodeMode(false);setCropMode(false);view.setNodeFocus(null);view.setRasterCropFocus(null);select(id,!!id);view.selectObjects(selectedRef.current);
      });
    view.setRole(policyRole);adapter.current = view;view.setMasterSelectionHandler(id=>{const current=storeRef.current?.document;if(current&&selectedRef.current.includes(id)&&selectionUnits(current,selectedRef.current).length>1)chooseMaster(id);});
    view.protectTextRendering((blocked,pending)=>setFontRendering(current=>current.blocked.join('\0')===blocked.join('\0')&&current.pending.join('\0')===pending.join('\0')?current:{blocked,pending}));
    view.setNodeDragHandlers((source, index, point, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', objectId: source.id, expectedRevision, arguments: { object: movePathNode(source, index, point, measureFabric) } }, 'manual')), active => { setDrawing(active); onEditingChange(active); });
    view.setTextPathHandler((object, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'setTextPath', objectId: object.id, expectedRevision, arguments: { offsetMm: object.textPath!.offsetMm } }, 'manual')));
    view.setRasterCropHandler((object, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision, arguments: objectArguments(object) }, 'manual')));
    view.setBezierDragHandler((object, expectedRevision) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision, arguments: objectArguments(object) }, 'manual')));
    showProjectFontChoices(store.document.fontAssets);view.render(store.document); setDoc(structuredClone(store.document));
    setEventLog(store.events.map(e => `r${e.revision}: ${e.source} ${e.objectId ?? ''}`).join('\n'));
    document.getElementById('lab-title')?.focus();
    return () => { view.dispose(); adapter.current = null; storeRef.current = null; };
  }, []);
  useEffect(() => {
    const initial=firstProductEffect.current;firstProductEffect.current=false;if(initial&&initialDocument)return;
    const store = storeRef.current;
    if (!product||!store || (store.document.productId === product.productId && store.document.variantId === product.variantIds[0] && store.document.catalogVersion === catalogVersion)) return;
    try { store.changeProduct(product, catalogVersion); setError(''); refresh(); }
    catch { setError('La composizione non entra nel modello richiesto. Il progetto precedente è conservato: scegli un modello più grande o torna al prodotto del progetto.'); }
  }, [product?.productId,product?.variantIds[0],product?.profileVersion,product?.nominalAreaMm.width,product?.nominalAreaMm.height,catalogVersion]);
  useEffect(() => {
    if (!import.meta.env.DEV) return; let active = true;
    const fonts = () => { void refreshLibraryFonts(storeRef.current?.document.fontAssets).then(() => { if (active) setFontNotice(''); }).catch(error => { if (active) setFontNotice(error.message); }); }; fonts(); window.addEventListener('focus', fonts);
    void readAdminSnapshot().then(state => { if(active){setTrialArchive(state.environment);setArchiveVocabulary(archiveTagVocabulary(state));setCustomerPdfEnabled(state.settings.customerPdfEnabled??false);} if (active && !guidesTouched.current) { setGuides({ gridMm: state.settings.gridMm, gridVisible: state.settings.gridVisible, snapEnabled: state.settings.snapEnabled }); setGridRaw(String(state.settings.gridMm)); } }).catch(() => {});
    return () => { active = false; window.removeEventListener('focus', fonts); };
  }, []);
  useEffect(()=>{if(availableProducts&&doc.productId&&doc.variantId&&(doc.productId!==product?.productId||doc.variantId!==product?.variantIds[0]))onKeepProduct(doc.productId,doc.variantId);},[doc.productId,doc.variantId]);
  useEffect(() => { adapter.current?.setGuides(guides); }, [guides]);
  useEffect(()=>{adapter.current?.setGeometryFocus(currentGeometryFocus);},[currentGeometryFocus]);
  useEffect(() => { adapter.current?.setDrawingTool(drawingTool, {
    onCurve: (nodes, closed, expectedRevision) => {
      const objectId = `object-${crypto.randomUUID()}`;
      act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'addObject', objectId, expectedRevision, arguments: { object: { id: objectId, type: 'bezier', ...normalizedBezier(nodes, closed), closed, strokeMm: 0.25, stroke: '#000000' } } }, 'manual'), objectId);
    },
    onPath: (points, closed, expectedRevision) => {
      const objectId = `object-${crypto.randomUUID()}`;
      act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'addObject', objectId, expectedRevision, arguments: { object: { id: objectId, type: 'path', ...strokeGeometry(points), closed, strokeMm: 0.25, stroke: '#000000' } } }, 'manual'), objectId);
    },
    onCount: setPolylineCount,
    onStroke: (points, expectedRevision) => {
      const objectId = `object-${crypto.randomUUID()}`;
      act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'addObject', objectId, expectedRevision, arguments: { object: { id: objectId, type: 'path', ...strokeGeometry(points), closed: false, strokeMm: 0.25, stroke: '#000000' } } }, 'manual'), objectId);
    },
    onPrimitive: (kind, start, end, expectedRevision) => {
      const objectId = `object-${crypto.randomUUID()}`;
      act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'addObject', objectId, expectedRevision, arguments: { object: primitiveFromEndpoints(kind, objectId, start, end) } }, 'manual'), objectId);
    },
    onActive: active => { setDrawing(active); onEditingChange(active); }, onExit: () => setDrawingTool(null),
  }); }, [drawingTool]);
  useEffect(()=>{onDocumentState?.(doc);},[doc.documentId,doc.productId,doc.variantId,doc.areaMm.width,doc.areaMm.height]);
  const displayedProduct=availableProducts?.find(item=>item.productId===doc.productId&&item.variantIds.includes(doc.variantId??''))??(product&&doc.productId===product.productId&&doc.variantId===product.variantIds[0]?product:null);
  const conflict = !!product && !portable && (doc.productId !== product.productId || doc.variantId !== product.variantIds[0] || doc.catalogVersion !== catalogVersion);
  const selectedObject = doc.objects.find(o => o.id === selectedId);
  const selectedGroups = selectedRootGroups(doc,selectedIds);
  const keyboard = useRef<(event: KeyboardEvent) => void>(() => {});
  keyboard.current = event => {
    const target = event.target, root = canvasRef.current?.closest('[data-testid="editor-workspace"]');
    if (event.defaultPrevented || event.isComposing || editing || drawing || assetBusy || conflict || catalogOutdated || !(target instanceof HTMLElement) || !root?.getClientRects().length || root.closest('[inert]')) return;
    if (target.closest('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], dialog[open]') || target !== window.document.body && !root.contains(target)) return;
    const ids = selectedRef.current, key = event.key.toLowerCase(), run = (action: () => void) => { event.preventDefault(); setDrawingTool(null); action(); };
    if ((event.metaKey || event.ctrlKey) && !event.altKey) {
      if (key === 'z') run(() => act(() => { if (event.shiftKey) storeRef.current!.redo(); else storeRef.current!.undo(); }));
      else if (key === 'y' && !event.shiftKey) run(() => act(() => storeRef.current!.redo()));
      else if (key === 'a' && !event.shiftKey) run(() => { select(storeRef.current!.document.objects.map(object => object.id)); adapter.current?.selectObjects(selectedRef.current); });
      else if (key === 'd' && !event.shiftKey && ids.length) run(duplicate);
      else if (key === 'c' && !event.shiftKey && ids.length) run(() => copySelection());
      else if (key === 'x' && !event.shiftKey && ids.length) run(() => copySelection(true));
      else if (key === 'v' && !event.shiftKey) run(()=>{void pasteSelection();});
      else if (key === 'g' && event.shiftKey && selectedGroups.length) run(() => selectionCommand('ungroupObjects', { groupIds: selectedGroups.map(group => group.id) }, selectedGroups[0]!.objectIds[0]));
      else if (key === 'g' && !event.shiftKey && ids.length > 1 && !selectedGroups.length) run(() => selectionCommand('groupObjects', { objectIds: ids, groupId: `group-${crypto.randomUUID()}` }));
      return;
    }
    if (event.metaKey || event.ctrlKey || !ids.length) return;
    if (target.closest('.page-strip')) return;
    if (key === 'delete' || key === 'backspace') { run(deleteSelection); return; }
    const direction = ({ arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] } as const)[key as 'arrowleft' | 'arrowright' | 'arrowup' | 'arrowdown'];
    if (!direction) return;
    const step = event.altKey ? 0.01 : event.shiftKey ? 1 : 0.1, deltaXmm = direction[0] * step, deltaYmm = direction[1] * step;
    run(() => act(() => {
      const store = storeRef.current!, object = store.document.objects.find(object => object.id === ids[0])!;
      if (ids.length === 1 && object.type === 'image' && cropContentsFocus.current === object.id) {
        const next = panRasterContents(object, deltaXmm, deltaYmm);
        if (next !== object) dispatch(store,{ schemaVersion: 1, tool: 'updateObject', expectedRevision: store.document.revision, objectId: object.id, arguments: objectArguments(next) }, 'manual');
        return;
      }
      const single=ids.length===1&&(!!directRef.current||!rootGroupFor(store.document,ids[0]!));dispatch(store,{ schemaVersion: 1, tool: single ? 'moveObject' : 'moveObjects', expectedRevision: store.document.revision, objectId: ids[0], arguments: single ? { xMm: object.xMm + deltaXmm, yMm: object.yMm + deltaYmm } : { objectIds: ids, deltaXmm, deltaYmm } }, 'manual');
    }));
  };
  useEffect(() => { const handle = (event: KeyboardEvent) => keyboard.current(event); window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle); }, []);
  const alignSelection=(alignment:import('./align-area').AreaAlignment)=>{
    const ids=selectedRef.current; if(alignPage){if(ids.length===1&&(!rootGroupFor(doc,ids[0]!)||directRef.current))act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'alignObject',objectId:ids[0],expectedRevision:doc.revision,arguments:{alignment,marginMm:0}},'manual'));else selectionCommand('alignObjectsToArea',{objectIds:ids,alignment,marginMm:0,individually:true});}
    else selectionCommand('alignObjects',{objectIds:ids,alignment,...(masterRef.current?{referenceObjectId:masterRef.current}:{})});
  };
  const workflowApi: WorkflowEditorApi = { document: doc, peek: () => cloneGraphicDocument(storeRef.current?.document ?? doc), busy: editing || drawing || assetBusy || conflict || catalogOutdated || graphicPageIds(doc).length>1, busyReason: graphicPageIds(doc).length>1 ? 'Il riepilogo prodotto è disponibile per progetti a pagina singola. Puoi salvare il progetto completo nell’archivio.' : editing ? 'Termina la scrittura con Esc o con il pulsante di conferma sul foglio.' : drawing ? 'Termina il disegno prima di controllare il progetto.' : assetBusy ? 'Attendi il caricamento della risorsa.' : 'Risolvi il cambio di formato prima di continuare.', capture: async () => { const store = storeRef.current; if (!store || !adapter.current) throw new Error('Editor non ancora disponibile'); const document = cloneGraphicDocument(store.document), svg = await exportDocumentSvg(document); if (storeRef.current !== store || store.document.documentId !== document.documentId || store.document.revision !== document.revision) throw new Error('Il progetto è cambiato durante il controllo dei font. Ripeti l’anteprima.'); return { document, svg }; }, open: next => prepareAndAct(async store => { if(autosave)await preserveDraftSnapshot(store.document); next=await projectFonts.prepare(next);await Promise.all([...allGraphicObjects(next).filter(o => o.type === 'image').map(o => prepareRasterSource(o.source))]); return () => {if(portable)store.open(next);else store.import(next);setSourceRecord(null);}; }) };
  return <>{contextPoint&&<CanvasContextMenu point={contextPoint} selected={!!selectedIds.length} canPaste={clipboardCount>0} busy={clipboardBusy||assetBusy||archiveBusy} onCopy={()=>copySelection()} onCut={()=>copySelection(true)} onPaste={fit=>{void pasteSelection(fit);}} onClose={()=>{setContextPoint(null);adapter.current?.canvas.upperCanvasEl.focus();}}/>}{mediaLibrary&&<MediaLibraryDialog kind={mediaLibrary} monochrome={doc.colorMode!=='color'} busy={assetBusy} onClose={()=>setMediaLibrary(null)} onInsert={insertLibraryAsset}/>}<WorkspaceFrame showForm={formEntries(doc).length>0} mode={mode} geometryFocus={currentGeometryFocus} onClearGeometryFocus={()=>setGeometryFocus(null)} actions={<>
      <span className="design-session-status" role="status">{trialArchive&&<span data-testid="archive-environment">{trialArchive.readOnly?'Copia di prova · sola lettura':'Copia di prova'} · </span>}{sessionNotice||sourceRecord?.title||archiveTitle||'Nuovo design'} · {dirty?'Modifiche da confermare':'Nessuna modifica da salvare'}</span>
      {(mode!=='customer'||customerPdfEnabled)&&<EditorButton icon="download" badge="PDF" label="Scarica PDF" disabled={pdfBusy||editing||drawing||assetBusy} onClick={()=>void exportPdf()}/>}
      <EditorButton icon="refresh" label="Ricarica design originale" disabled={archiveBusy||editing||drawing||assetBusy} onClick={()=>setSessionDialog('reload')}/>
      <EditorButton icon="close" label="Chiudi editor senza salvare" disabled={archiveBusy||assetBusy} onClick={()=>{adapter.current?.finishEditing();setSessionDialog('close');}}/>
      <EditorButton className="primary" icon="apply" label="Conferma design" disabled={trialArchive?.readOnly||mode==='customer'&&!fieldsValid||archiveBusy||editing||drawing||assetBusy||conflict} onClick={()=>void saveArchive(true,false)}/>
      <dialog ref={sessionModal} className="configuration-dialog" aria-label={sessionDialog==='reload'?'Ricaricare il design originale':'Chiudere senza salvare'} onCancel={event=>{event.preventDefault();setSessionDialog(null);}}><h2>{sessionDialog==='reload'?'Ricaricare il design originale?':'Chiudere senza salvare?'}</h2><p>{sessionDialog==='reload'?'Le modifiche non confermate verranno annullate. Il design salvato resta invariato.':'Le modifiche non confermate non saranno applicate al progetto salvato.'}</p><div className="button-row"><button type="button" onClick={()=>setSessionDialog(null)}>Continua a modificare</button><button type="button" onClick={()=>{void(async()=>{try{await draftControl.current?.discard();if(sessionDialog==='reload'){act(()=>storeRef.current!.open(originalDocument.current));setSavedStamp(sessionDocumentKey(storeRef.current!.document));const [title,kind,tags]=JSON.parse(savedMetadata);setArchiveTitle(title);setArchiveKind(kind);setArchiveTags(tags.join(', '));setSessionNotice('Design originale ricaricato');setSessionDialog(null);}else{leaving.current=true;window.location.assign(mode==='admin'?editorReturnUrl(mode,sourceRecord?.kind??archiveKind):'/editor/templates?mode=customer');}}catch(cause){setError(cause instanceof Error?cause.message:'Operazione non riuscita');setSessionDialog(null);}})();}}>{sessionDialog==='reload'?'Conferma ricarica originale':'Esci senza salvare'}</button></div></dialog>
    </>} panTool={panTool} onTemporaryPan={setTemporaryPan} document={doc} editing={editing || drawing || assetBusy} onZoom={zoom => { const store = storeRef.current; if (store) adapter.current?.setZoom(zoom, store.document); }}
    edit={<ToolbarMenu label="Modifica" icon="editMenu"><fieldset disabled={editing||drawing||assetBusy||archiveBusy||conflict||catalogOutdated} className="inspector-arrangement">      <h3>Selezione e oggetti</h3><div className="button-row"><EditorButton icon="multiSelect" label="Selezione multipla" aria-pressed={multiple} onClick={() => setMultiple(!multiple)}/><EditorButton icon="selectAll" label="Seleziona tutto" disabled={!doc.objects.length} onClick={() => { setDrawingTool(null); select(doc.objects.map(object => object.id)); adapter.current?.selectObjects(selectedRef.current); }}/><EditorButton icon="deselect" label="Deseleziona" disabled={!selectedIds.length} onClick={() => { setDrawingTool(null); select(null); adapter.current?.selectObjects([]); }}/><EditorButton disabled={!selectedIds.length} onClick={duplicate} icon="duplicate" label="Duplica selezionato"/><EditorButton disabled={!selectedIds.length} onClick={deleteSelection} icon="delete" label="Elimina selezionato"/></div>
      <h3>Appunti</h3><div className="button-row" role="group" aria-label="Appunti dell’editor"><EditorButton disabled={!selectedIds.length||clipboardBusy} onClick={() => copySelection()} icon="copy" label="Copia negli appunti dell’editor"/><EditorButton disabled={!selectedIds.length||clipboardBusy} onClick={() => copySelection(true)} icon="cut" label="Taglia negli appunti dell’editor"/><EditorButton disabled={!clipboardCount||clipboardBusy} onClick={()=>void pasteSelection()} icon="paste" label="Incolla dagli appunti dell’editor"/></div>
      {clipboardCount > 0 && <div className="button-row"><EditorButton disabled={clipboardBusy} onClick={()=>void pasteSelection(true)} icon="pasteFit" label="Incolla adattando al foglio"/><EditorButton disabled={clipboardBusy} onClick={()=>{void clearGraphicClipboard().catch(error=>setError(error.message));}} icon="clearClipboard" label="Svuota appunti del configuratore"/></div>}
      {clipboardCount > 0 && <p className="caption" role="status">Appunti dell’editor: {clipboardCount} elementi. Disponibili anche negli altri template e nelle altre schede di questo browser.</p>}
</fieldset></ToolbarMenu>}
    transforms={<TransformPanel document={doc} ids={selectedIds} masterId={masterId} page={alignPage} customer={mode==='customer'} busy={editing||drawing||assetBusy||archiveBusy||conflict||catalogOutdated} onPage={value=>{setAlignPage(value);if(value)chooseMaster(null);}} onAlign={alignSelection} onIncline={angleDeg=>selectionCommand('inclineObjects',{objectIds:selectedRef.current,angleDeg})} onReflect={axis=>selectionCommand('reflectObjects',{objectIds:selectedRef.current,axis})} onDistribute={axis=>selectionCommand('distributeObjects',{objectIds:selectedRef.current,axis})}/>}
    layers={<LayersPanel customer={mode==='customer'} actions={<>
      <p className="caption layer-selection-status" role="status">{selectedIds.length > 1 ? `Selezionati: ${selectedIds.length} elementi${selectedGroups.length ? ` · ${selectedGroups.length} gruppi` : ''}` : selectedId ? `Selezionato: ${selectedId}` : doc.objects.length ? 'Seleziona un oggetto nel canvas o nell’elenco.' : 'Il progetto è vuoto. Aggiungi un testo o una forma per iniziare.'}</p>
      <h3 className="layers-section-title">Gruppi</h3><div className="button-row"><EditorButton icon="group" label="Raggruppa selezione" disabled={selectedIds.length < 2 || !!selectedGroups.length} onClick={() => selectionCommand('groupObjects', { objectIds: selectedRef.current, groupId: `group-${crypto.randomUUID()}` })}/><EditorButton icon="ungroup" label="Separa gruppi selezionati" disabled={!selectedGroups.length} onClick={() => selectionCommand('ungroupObjects', { groupIds: selectedGroups.map(group => group.id) }, selectedGroups[0]?.objectIds[0])}/></div>
      <details className="layers-help"><summary>Aiuto livelli</summary><p className="caption">Maiusc + clic o riquadro nel canvas per selezioni multiple; il pulsante Selezione multipla serve anche su touch. Option/Alt + clic nel canvas o il pulsante Seleziona solo nella riga del livello selezionano un solo elemento del gruppo.</p></details>
    </>} document={doc} selectedIds={selectedIds} directObjectId={directRef.current} onSelectObject={id=>{setDrawingTool(null);setPanTool(false);adapter.current?.setNodeFocus(null);adapter.current?.setRasterCropFocus(null);setNodeMode(false);setCropMode(false);select(id,true);adapter.current?.selectObjects(selectedRef.current);}} disabled={editing || drawing || assetBusy || archiveBusy || conflict || catalogOutdated} multiple={multiple}
      onSelect={(id, additive) => {
        setDrawingTool(null); const unit = expandSelection(doc, [id]);
        const next = additive ? unit.every(id => selectedIds.includes(id)) ? selectedIds.filter(id => !unit.includes(id)) : [...selectedIds, ...unit] : unit;
        select([...new Set(next)]); adapter.current?.selectObjects(selectedRef.current);
      }} onReorder={position => !directRef.current&&(selectedIds.length > 1||selectedGroups.length) ? selectionCommand('reorderObjects', { objectIds: selectedRef.current, position }) : act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'reorderObject', objectId: selectedId, expectedRevision: doc.revision, arguments: { position } }, 'manual'))}
      onPlaceMember={(objectId,parentGroupId,targetObjectId,side,expectedRevision)=>{
        const saved=act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'placeGroupMember',objectId,expectedRevision,arguments:{parentGroupId,targetObjectId,side}},'manual'));
        if(saved){select(objectId,true);adapter.current?.selectObjects(selectedRef.current);}
      }}
      onPlace={(ids, targetObjectId, side, expectedRevision) => {
        const current = storeRef.current!.document, target = expandSelection(current, [targetObjectId]), ordered = current.objects.map(object => object.id), moving = ordered.filter(id => ids.includes(id)), remaining = ordered.filter(id => !ids.includes(id)), at = side === 'above' ? Math.max(...target.map(id => remaining.indexOf(id))) + 1 : Math.min(...target.map(id => remaining.indexOf(id)));
        const next = [...remaining.slice(0, at), ...moving, ...remaining.slice(at)];
        if (current.revision === expectedRevision && next.every((id, index) => id === ordered[index])) return;
        act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'placeObjects', objectId: ids[0], expectedRevision, arguments: { objectIds: ids, targetObjectId, side } }, 'manual'), ids);
      }}/>}
    context={<>
      <div className="section-heading"><div><span className="eyebrow">02 / Personalizzazione nel canvas</span><h2 id="lab-title" tabIndex={-1}>{conflict ? 'Cambio modello da risolvere' : displayedProduct?.title??(doc.plaque?'Targa a misure personalizzate':'Documento recuperato')}</h2></div><span className="badge">Bozza TEST</span></div>
      <p data-testid="editor-product">Area nominale del progetto: {doc.shape === 'round' ? `Ø ${doc.areaMm.width}` : `${doc.areaMm.width} × ${doc.areaMm.height}`} mm. {product?.variantLabel && <>Variante: {product?.variantLabel}. </>}{conflict && <>Modello richiesto: {product?.title}, {product?.nominalAreaMm.width} × {product?.nominalAreaMm.height} mm.</>}</p>
      <p>Doppio clic sul testo per scrivere direttamente nel canvas; Invio aggiunge una riga, Esc termina la modifica. Puoi trascinare testo e forme.</p>
      <p className="caption">{doc.productionProfile?`Profilo tecnico: ${doc.productionProfile.label} · v${doc.productionProfile.version}. Limiti testo/immagini attivi alla conferma; margine e zone come guide, collisioni e lavorabilità ancora da verificare.`:'Area utile da confermare. Margine TEST 1 mm, testo ≥ 7 pt e nero/bianco sono vincoli di laboratorio, non specifiche produttive del modello.'}</p>
    </>}
    stage={<>
      {!!(fontRendering.blocked.length||fontRendering.pending.length)&&<div className="notice canvas-font-warning" role="status" data-testid="font-render-warning"><p>{fontRendering.blocked.length?'I riquadri con la croce indicano testi con font da correggere. Il contenuto originale è conservato: scegli un font compatibile nell’ispettore o usa «Font del progetto» negli strumenti.':'Controllo dei font in corso. Il testo originale è conservato; comparirà quando il controllo sarà terminato.'}</p>{!!fontRendering.blocked.length&&<button type="button" disabled={assetBusy} onClick={()=>adapter.current?.retryTextRendering()}>Ricontrolla visualizzazione font</button>}</div>}
      <InkPreviewFilter id={inkFilterId} color={doc.inkColor??'black'}/>
      <div className="canvas-scroll" role="tabpanel" id={inkFilterId+'-pages-canvas'} aria-labelledby={inkFilterId+'-pages-'+(doc.pageId??'page-1')} onContextMenu={event=>{
        if(editing||drawing||assetBusy||archiveBusy||conflict)return;
        const ids=adapter.current?.contextObjectIds(event.nativeEvent);if(ids===null)return;
        event.preventDefault();setDrawingTool(null);if(ids?.length&&!ids.every(id=>selectedRef.current.includes(id))){select(ids);adapter.current?.selectObjects(selectedRef.current);}
        setContextPoint({x:event.clientX||event.currentTarget.getBoundingClientRect().left+40,y:event.clientY||event.currentTarget.getBoundingClientRect().top+40});
      }} style={{'--editor-imprint-filter':doc.colorMode!=='color'&&doc.inkColor&&doc.inkColor!=='black'?`url(#${inkFilterId})`:'none'}as CSSProperties} inert={conflict || assetBusy || archiveBusy} onPointerDown={event => {
        if (event.button !== 0 || assetBusy || conflict || (event.target instanceof Element && event.target.closest('.canvas-container'))) return;
        adapter.current?.activateSelectionTool(); setDrawingTool(null); setDrawing(false); setNodeMode(false); select(null); adapter.current?.selectObjects([]);
      }}><canvas ref={canvasRef} aria-label="Canvas grafico del laboratorio"/></div>
      {assetBusy && <div role="status" className="notice">Preparazione della risorsa locale…</div>}
      {trashVisible && <div className="drag-trash" role="status"><EditorIcon name="delete"/><strong>Rilascia per eliminare</strong><span>Esc annulla il trascinamento</span></div>}
      <div className="stage-messages">
        <PageStrip id={inkFilterId+'-pages'} document={doc} disabled={editing||drawing||assetBusy||archiveBusy||conflict||catalogOutdated} onCommand={(tool,args)=>{setNodeMode(false);setCropMode(false);setContextPoint(null);act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool,objectId:'pages',pageId:storeRef.current!.document.pageId??'page-1',expectedRevision:storeRef.current!.document.revision,arguments:args},'manual'),[]);}}/>
        <p className="caption" data-testid="revision">Revisione grafica: {doc.revision} · {doc.objects.length} oggetti · {doc.areaMm.width} × {doc.areaMm.height} mm · bozza TEST</p>
        {editing && <div role="status" className="notice editing-notice">Scrittura nel canvas in corso. Premi Esc o <EditorButton onClick={() => adapter.current?.finishEditing()} icon="apply" label="Termina modifica"/> per validare il testo.</div>}
        {conflict && product && <div className="notice"><p>Il documento è ancora associato al formato precedente. Puoi esportarne il JSON per conservarlo. Creando una nuova bozza sostituisci la composizione corrente.</p><EditorButton onClick={() => { setError(''); onKeepProduct(doc.productId!, doc.variantId!); }} icon="return" label="Torna al prodotto del progetto"/><EditorButton onClick={() => act(() => { const fresh = createEditorDocument(product, catalogVersion); fresh.revision = storeRef.current!.document.revision + 1; storeRef.current = new DocumentStore(fresh, measureFabric, graphicCatalog,policyRole); })} icon="newFile" label="Crea nuova bozza per questo formato"/></div>}
        {error && <p role="alert" className="error">{error}</p>}
      </div>
    </>}
    tools={<><h3 className="tools-title">Strumenti</h3><div className="tools-mode"><EditorButton icon="select" label="Strumento selezione" aria-pressed={!drawingTool && !editing && !nodeMode && !cropMode && !panTool && !temporaryPan} onClick={() => {
      adapter.current?.activateSelectionTool(); setDrawingTool(null); setDrawing(false); setMultiple(false); setNodeMode(false); setCropMode(false); setPanTool(false); setSelectionEpoch(value => value + 1);
    }}/><EditorButton icon="hand" label="Strumento Mano" aria-pressed={panTool || temporaryPan} onClick={() => { adapter.current?.activateSelectionTool(); setDrawingTool(null); setDrawing(false); setNodeMode(false); setCropMode(false); setSelectionEpoch(value => value + 1); setPanTool(value => !value); }}/>{drawingTool === 'polyline' || drawingTool === 'bezier' ? <div className="button-row path-drawing-actions" role="group" aria-label="Costruzione tracciato">
      <span className="caption" role="status" data-testid="pen-point-count">{polylineCount}/{drawingTool === 'bezier' ? 64 : 512} nodi</span>
      <EditorButton icon="apply" label="Termina tracciato aperto" disabled={polylineCount < 2} onClick={() => drawingTool === 'bezier' ? adapter.current?.finishBezier(false) : adapter.current?.finishPolyline(false)}/>
      <EditorButton icon="closePath" label="Chiudi tracciato disegnato" disabled={polylineCount < 3} onClick={() => drawingTool === 'bezier' ? adapter.current?.finishBezier(true) : adapter.current?.finishPolyline(true)}/>
      <EditorButton icon="return" label="Annulla costruzione tracciato" onClick={() => drawingTool === 'bezier' ? adapter.current?.cancelBezier() : adapter.current?.cancelPolyline()}/>
    </div> : null}</div><fieldset className="editor-actions" disabled={editing || drawing || assetBusy || archiveBusy || conflict || catalogOutdated}><legend className="sr-only">Disegno e oggetti</legend>
      <div className="button-row"><EditorButton onClick={() => addObject('text')} icon="addText" label="Aggiungi testo"/><EditorButton onClick={() => addObject('rect')} icon="addRect" label="Aggiungi rettangolo"/><EditorButton onClick={() => addObject('circle')} icon="addCircle" label="Aggiungi cerchio"/><EditorButton onClick={() => addObject('line')} icon="addLine" label="Aggiungi linea"/><EditorButton onClick={() => addObject('ellipse')} icon="addEllipse" label="Aggiungi ellisse"/><EditorButton onClick={() => addPolygon('triangle')} icon="addTriangle" label="Aggiungi triangolo"/><EditorButton onClick={() => addPolygon('pentagon')} icon="addPolygon" label="Aggiungi pentagono"/><EditorButton onClick={() => addPolygon('star')} icon="addStar" label="Aggiungi stella"/><EditorButton onClick={addBezier} icon="bezier" label="Aggiungi curva Bézier"/></div>
      <div className="button-row"><EditorButton icon="importImage" label="Importa immagine PNG o JPEG" onClick={() => imageImportRef.current?.click()}/></div>
      <div className="button-row"><EditorButton icon="pictures" label="Apri libreria immagini" onClick={()=>setMediaLibrary('picture')}/><EditorButton icon="background" label="Apri libreria sfondi" onClick={()=>setMediaLibrary('background')}/>{(doc.backgroundImageId||doc.backgroundGroupId)&&<EditorButton icon="delete" label="Rimuovi sfondo" onClick={()=>act(()=>{const current=storeRef.current!;current.dispatch(current.document.backgroundGroupId?{schemaVersion:1,tool:'setBackgroundObjects',objectId:current.document.backgroundGroupId,expectedRevision:current.document.revision,arguments:{objects:[],groups:[]}}:{schemaVersion:1,tool:'setBackgroundImage',objectId:current.document.backgroundImageId!,expectedRevision:current.document.revision,arguments:{object:null}},'manual');})}/>}</div>
      <PaperColorPanel document={doc} onChange={color=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'setPaperColor',objectId:'canvas',expectedRevision:storeRef.current!.document.revision,arguments:{color}},'manual'))}/>
      <label>Importa testi SVG/PDF come<select aria-label="Importa testi SVG/PDF come" value={importTextMode} disabled={assetBusy} onChange={event=>setImportTextMode(event.target.value as 'outlines'|'editable')}><option value="outlines">Contorni vettoriali</option><option value="editable">Testo editabile</option></select></label><p className="caption">Il testo editabile richiede il font nella libreria. Nei PDF la ricostruzione va controllata; le lettere già convertite in tracciati restano vettori.</p>
      <label className="ratio-toggle"><input type="checkbox" checked={vectorMonochrome} onChange={event => setVectorMonochrome(event.target.checked)}/> Converti colori SVG/PDF in nero</label>
      <div className="button-row"><EditorButton icon="importSvg" label="Importa SVG vettoriale" onClick={() => svgImportRef.current?.click()}/></div>
      {import.meta.env.DEV && <><div className="button-row"><EditorButton icon="importSvg" label="Importa PDF vettoriale locale" badge="PDF" onClick={() => pdfImportRef.current?.click()}/></div><label htmlFor="pdf-import" className="sr-only">File PDF vettoriale locale</label><input ref={pdfImportRef} id="pdf-import" className="sr-only" type="file" accept=".pdf,application/pdf" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) importPdf(file); }}/></>}
      <label htmlFor="svg-import" className="sr-only">File SVG locale</label><input ref={svgImportRef} id="svg-import" className="sr-only" type="file" accept=".svg,image/svg+xml" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) importSvg(file); }}/>
      {fontNotice && <p className="caption" role="status">{fontNotice}</p>}
      {importNotice && <p className="caption" role="status">{importNotice}</p>}
      <label htmlFor="png-import" className="sr-only">File immagine locale</label><input ref={imageImportRef} id="png-import" className="sr-only" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) importImage(file); }}/>
      <p className="caption">PNG/JPEG locali: massimo 20 MB e 24 milioni di pixel. Originale conservato; conversione bianco/nero modificabile nell’ispettore.</p>
      <div className="button-row"><EditorButton icon="drawLine" label="Disegna linea nel canvas" aria-pressed={drawingTool === 'line'} onClick={() => setDrawingTool(drawingTool === 'line' ? null : 'line')}/><EditorButton icon="drawRect" label="Disegna rettangolo nel canvas" aria-pressed={drawingTool === 'rect'} onClick={() => setDrawingTool(drawingTool === 'rect' ? null : 'rect')}/><EditorButton icon="drawCircle" label="Disegna cerchio nel canvas" aria-pressed={drawingTool === 'circle'} onClick={() => setDrawingTool(drawingTool === 'circle' ? null : 'circle')}/><EditorButton icon="drawEllipse" label="Disegna ellisse nel canvas" aria-pressed={drawingTool === 'ellipse'} onClick={() => setDrawingTool(drawingTool === 'ellipse' ? null : 'ellipse')}/><EditorButton icon="freehand" label="Disegna a mano libera" aria-pressed={drawingTool === 'freehand'} onClick={() => setDrawingTool(drawingTool === 'freehand' ? null : 'freehand')}/><EditorButton icon="pen" label="Disegna tracciato per punti" aria-pressed={drawingTool === 'polyline'} onClick={() => setDrawingTool(drawingTool === 'polyline' ? null : 'polyline')}/><EditorButton icon="bezier" label="Disegna curva Bézier" aria-pressed={drawingTool === 'bezier'} onClick={() => setDrawingTool(drawingTool === 'bezier' ? null : 'bezier')}/></div>
      {drawingTool && <p className="caption">{drawingTool === 'bezier' ? 'Clicca per un nodo angoloso; clicca e trascina per le maniglie simmetriche. Invio o doppio clic termina; clic sul primo nodo chiude. Maiusc vincola a 45°, Backspace elimina l’ultimo nodo. Usa anche i pulsanti nella barra in alto.' : drawingTool === 'polyline' ? 'Clicca i vertici. Invio o doppio clic termina; clic sul primo punto chiude. Maiusc vincola a 45°, Backspace rimuove l’ultimo nodo. Usa anche i pulsanti nella barra in alto.' : drawingTool === 'freehand' ? 'Trascina per disegnare un tracciato vettoriale. I punti vengono semplificati al rilascio.' : drawingTool === 'circle' ? 'Trascina dal centro alla circonferenza.' : drawingTool === 'rect' || drawingTool === 'ellipse' ? `Trascina tra due angoli opposti. Maiusc disegna ${drawingTool === 'rect' ? 'un quadrato' : 'un cerchio'}.` : 'Trascina tra due punti nel foglio. Maiusc vincola a 45°.'} Alt sospende gli agganci. Esc annulla. {drawingTool === 'bezier' || drawingTool === 'polyline' ? 'Al completamento torni alla selezione.' : 'Al rilascio torni alla selezione.'}</p>}
      <div className="inspector-content"><h3>Griglia e agganci</h3>
        <div className="button-row"><EditorButton icon="grid" label="Mostra griglia" aria-pressed={guides.gridVisible} onClick={() => { guidesTouched.current = true; setGuides(previous => ({ ...previous, gridVisible: !previous.gridVisible })); }}/><EditorButton icon="magnet" label="Aggancia alla griglia e agli oggetti" aria-pressed={guides.snapEnabled} onClick={() => { guidesTouched.current = true; setGuides(previous => ({ ...previous, snapEnabled: !previous.snapEnabled })); }}/></div>
        <label>Passo griglia (mm)<input type="number" min="0.1" max="10" step="0.1" value={gridRaw} aria-invalid={!gridRaw.trim() || !Number.isFinite(Number(gridRaw)) || Number(gridRaw) < 0.1 || Number(gridRaw) > 10} onChange={event => {
          guidesTouched.current = true; const value = event.target.value; setGridRaw(value);
          if (value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0.1 && Number(value) <= 10) setGuides(previous => ({ ...previous, gridMm: Number(value) }));
        }}/></label>
        <p className="caption">Agganci a griglia, bordi e centri durante il trascinamento. Alt li sospende. Griglia e guide sono escluse da JSON e SVG.</p>
      </div>
      <details><summary>Scorciatoie da tastiera</summary><p className="caption">Frecce: 0,1 mm · Maiusc: 1 mm · Alt: 0,01 mm. Cmd/Ctrl+A seleziona tutto, C copia, X taglia, V incolla dagli appunti dell’editor, D duplica, G raggruppa, Maiusc+G separa, Z annulla, Maiusc+Z ripristina. Canc o Backspace elimina. I campi e la scrittura del testo conservano i propri tasti.</p></details>
    </fieldset></>}
    properties={<fieldset className="editor-actions" disabled={assetBusy || drawing || archiveBusy || conflict || catalogOutdated}><legend>Ispettore</legend>
      {directRef.current&&selectedObject&&<div className="caption" data-testid="group-member-selection"><span>Elemento singolo del gruppo</span><EditorButton icon="group" label="Seleziona l’intero gruppo" onClick={()=>{select(selectedObject.id);adapter.current?.selectObjects(selectedRef.current);}}/></div>}
      {mode==='customer'&&doc.objects.some(object=>selectedIds.includes(object.id)&&effectiveObjectProperties(doc,object.id).hideMenus)?<p className="caption">I menu di questo elemento sono nascosti nel template.</p>:selectedIds.length > 1||!directRef.current&&selectedGroups.length ? <SelectionInspector document={doc} ids={selectedIds} onGroupProperties={mode!=='customer'?(id,properties)=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'setGroupProperties',objectId:id,expectedRevision:storeRef.current!.document.revision,arguments:properties},'manual')):undefined} onAttachText={(textId, pathObjectId) => act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'attachTextToPath', objectId: textId, expectedRevision: doc.revision, arguments: { pathObjectId } }, 'manual'), textId)} onMove={(deltaXmm, deltaYmm, expectedRevision) => {
        const store = storeRef.current!;
        return act(() => dispatch(store,{ schemaVersion: 1, tool: 'moveObjects', objectId: selectedRef.current[0], expectedRevision, arguments: { objectIds: selectedRef.current, deltaXmm, deltaYmm } }, 'manual')) ? store.document.revision : null;
      }} onTransform={(args, expectedRevision) => {
        const store = storeRef.current!;
        return act(() => dispatch(store,{ schemaVersion: 1, tool: 'transformObjects', objectId: selectedRef.current[0], expectedRevision, arguments: { ...args, objectIds: selectedRef.current } }, 'manual')) ? store.document.revision : null;
      }} onStyle={(style, expectedRevision) => act(() => {
        const store = storeRef.current!; dispatch(store,{ schemaVersion: 1, tool: 'styleObjects', objectId: selectedRef.current[0], expectedRevision, arguments: { objectIds: selectedRef.current, style } }, 'manual');
      })}/> : selectedObject ? <ObjectInspector sectionMemory={inspectorSection} minimumFontPt={effectiveObjectProperties(doc,selectedObject.id).reference?null:minimumFontForDocument(doc,graphicCatalog)} allowColor={doc.colorMode==='color'} key={`${selectedObject.id}-${selectionEpoch}`} object={selectedObject} effectiveProperties={effectiveObjectProperties(doc,selectedObject.id)} revision={doc.revision}
        onReplaceImage={(file,expectedRevision)=>{const objectId=selectedObject.id,documentId=doc.documentId;void prepareAndAct(async store=>{
          if(store.document.documentId!==documentId||store.document.revision!==expectedRevision)throw new Error('Documento cambiato durante la scelta del file: sostituzione annullata.');
          if(file.size>MAX_RASTER_BYTES)throw new Error('Immagine oltre 20 MB');
          const source=rasterSourceFromBytes(`asset-${crypto.randomUUID()}`,new Uint8Array(await file.arrayBuffer()));await prepareRasterSource(source);
          return()=>dispatch(store,{schemaVersion:1,tool:'replaceImageSource',objectId,expectedRevision,arguments:{source,fit:'cover'}},'manual');
        },objectId);}}
        onProperties={mode!=='customer'?properties=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'setObjectProperties',objectId:selectedObject.id,expectedRevision:storeRef.current!.document.revision,arguments:properties},'manual')):undefined}
        characterSelection={characterSelection}
        onFontMenuOpen={() => { if (import.meta.env.DEV) void refreshLibraryFonts(storeRef.current?.document.fontAssets).then(() => setFontNotice('')).catch(error => setFontNotice(error.message)); }}
        onDetachText={() => { if (selectedObject.type !== 'text' || !selectedObject.textPath) return; const preferred = selectedObject.textPath.originalPathId, pathObjectId = doc.objects.some(object => object.id === preferred) || doc.groups?.some(group => group.id === preferred) ? `path-${crypto.randomUUID()}` : preferred; act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'detachTextFromPath', objectId: selectedObject.id, expectedRevision: doc.revision, arguments: { pathObjectId } }, 'manual'), selectedObject.id); }}
        onCropFocus={(id,moveContents) => { cropContentsFocus.current = moveContents ? id : null; adapter.current?.setRasterCropFocus(id,moveContents); setCropMode(!!id); }}
        onNodeFocus={focus => { adapter.current?.setNodeFocus(focus); setNodeMode(!!focus); }}
        onKerning={value => act(() => {
          const update = adapter.current?.kernedText(value); if (update) dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', expectedRevision: update.revision, objectId: update.object.id, arguments: objectArguments(update.object) }, 'manual');
        })}
        onTextStretch={value => {
          const update = adapter.current?.stretchedText(value);
          if (update) act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', expectedRevision: update.revision, objectId: update.object.id, arguments: objectArguments(update.object) }, 'manual'));
        }}
        onLineAlignment={alignment => {
          const update = adapter.current?.alignedText(alignment);
          if (update) act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', expectedRevision: update.revision, objectId: update.object.id, arguments: objectArguments(update.object) }, 'manual'));
        }}
        onCharacterStyle={style => {
          const update = adapter.current?.styledText(style);
          if (update) act(() => dispatch(storeRef.current!,{ schemaVersion: 1, tool: 'updateObject', expectedRevision: update.revision, objectId: update.object.id, arguments: objectArguments(update.object) }, 'manual'));
        }}
        onApply={(object, expectedRevision) => {
          const store = storeRef.current!;
          if (!act(() => { const update = adapter.current?.mergeEditingObject(object) ?? object; dispatch(store,{ schemaVersion: 1, tool: 'updateObject', objectId: selectedObject.id, expectedRevision, arguments: objectArguments(update) }, 'manual'); })) return null;
          return { object: store.document.objects.find(item => item.id === object.id)!, revision: store.document.revision };
        }}

      /> : <p className="caption">Seleziona un oggetto per visualizzarne le proprietà nell’ispettore.</p>}
      <TextMaskCheckPanel document={doc} busy={editing||drawing||assetBusy||archiveBusy||conflict||catalogOutdated} onLocate={(pageId,objectId)=>{
        if(pageId!==(doc.pageId??'page-1'))act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'selectPage',objectId:pageId,expectedRevision:storeRef.current!.document.revision,arguments:{pageId}},'manual'),[]);
        select(objectId);adapter.current?.selectObjects(selectedRef.current);
      }}/>
    </fieldset>}
    workflow={<>
      <CustomerFieldsPanel document={doc} onValidity={setFieldsValid} disabled={editing||drawing||assetBusy||archiveBusy} onText={(objectId,text)=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'setText',objectId,expectedRevision:storeRef.current!.document.revision,arguments:{text}},'manual'))} onSelect={id=>{select(id);adapter.current?.selectObjects(selectedRef.current);}} onImage={(objectId,file)=>{void prepareAndAct(async store=>{if(file.size>MAX_RASTER_BYTES)throw new Error('Immagine oltre 20 MB');const source=rasterSourceFromBytes(`asset-${crypto.randomUUID()}`,new Uint8Array(await file.arrayBuffer()));await prepareRasterSource(source);return()=>dispatch(store,{schemaVersion:1,tool:'replaceImageSource',objectId,expectedRevision:store.document.revision,arguments:{source}},'manual');});}}/>

      {doc.plaque&&<PlaqueConfigurationPanel document={doc} disabled={editing||drawing||assetBusy} onChange={(areaMm,mounting)=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'configurePlaque',objectId:'project',expectedRevision:storeRef.current!.document.revision,arguments:{areaMm,mounting}},'manual'))}/>}

      {import.meta.env.DEV && autosave && <DraftPanel api={workflowApi} leaving={leaving} emergency={mode!=='test'} dirty={dirty} control={draftControl}/>}
      {import.meta.env.DEV && availableProducts && !doc.plaque && <ProductPanel api={workflowApi} products={availableProducts} catalogVersion={catalogVersion} onInk={color=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'setInkColor',objectId:'project',expectedRevision:storeRef.current!.document.revision,arguments:{color}},'manual'))} onConfirm={(key,revision)=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'changeFormat',objectId:'project',expectedRevision:revision,arguments:{profileKey:key,catalogVersion,allowShrink:true}},'manual'))}/>}
      {import.meta.env.DEV && (new URLSearchParams(window.location.search).has('configurations') || new URLSearchParams(window.location.search).has('configuration')) && <ConfigurationPanel api={workflowApi}/>}
    </>}
    project={<>
      <ProductionProfilePanel document={doc} onLocate={locateGeometry} onResetFocus={()=>setGeometryFocus(null)} catalog={graphicCatalog} admin={mode!=='customer'} disabled={editing||drawing||assetBusy||archiveBusy||conflict||catalogOutdated} onSet={(profile,expectedRevision)=>act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'setProductionProfile',objectId:'page',expectedRevision,arguments:{profile}},'manual'))}/>
      {projectFonts.dialog}{(mode!=='customer'||!!fontRendering.blocked.length)&&<FontCheckPanel onPage={pageId=>{setNodeMode(false);setCropMode(false);setContextPoint(null);act(()=>dispatch(storeRef.current!,{schemaVersion:1,tool:'selectPage',objectId:pageId,expectedRevision:storeRef.current!.document.revision,arguments:{pageId}},'manual'),[]);}} document={doc} busy={editing || drawing || assetBusy || archiveBusy} onOpen={() => { void refreshLibraryFonts(storeRef.current?.document.fontAssets).catch(cause => setError(cause.message)); }} onRepair={(issue, fontId, expectedRevision) => prepareAndAct(async store => {
        if (store.document.revision !== expectedRevision) throw new Error('Revisione grafica obsoleta: rileggi la segnalazione.');
        const asset = registeredFontAsset(fontId); if (!asset) throw new Error('File font non caricato dalla libreria.');
        const command = await missingCharacterFontCommand(store.document, issue, asset);
        return () => dispatch(store,command, 'manual');
      }, issue.objectId)}/>}
      {mode!=='customer'&&<EditorButton disabled={editing || drawing || assetBusy} onClick={() => download('progetto.TEST.json', JSON.stringify(storeRef.current!.document, null, 2), 'application/json')} icon="download" label="Esporta JSON" badge="JSON"/>}
      <fieldset className="editor-actions" disabled={editing || drawing || assetBusy || archiveBusy || conflict || catalogOutdated}><legend>Progetto</legend>
        {import.meta.env.DEV&&product&&<p className="caption"><a href={`/editor/templates?mode=${mode}&model=${encodeURIComponent(profileKey(product))}`}>Scegli un template per questo modello</a></p>}
        {import.meta.env.DEV && mode!=='customer' && <details onToggle={event=>{if(event.currentTarget.open)void readAdminSnapshot().then(state=>setArchiveVocabulary(archiveTagVocabulary(state))).catch(()=>{});}}><summary>Archivio locale di template e composizioni</summary><label>Nome copia in archivio<input aria-label="Nome copia in archivio" maxLength={120} value={archiveTitle} onChange={event => setArchiveTitle(event.target.value)}/></label><label>Tipo di archivio<select aria-label="Tipo di archivio" value={archiveKind} onChange={event => setArchiveKind(event.target.value as 'composition' | 'template')}><option value="composition">Composizione cliente</option><option value="template">Template</option></select></label><ArchiveTagInput label="Tag della copia in archivio" value={archiveTags} onChange={setArchiveTags} vocabulary={archiveVocabulary}/><button type="button" disabled={trialArchive?.readOnly||!archiveTitle.trim() || archiveBusy} onClick={() => void saveArchive()}>Salva copia nell’archivio locale</button><p className="caption"><a href="/editor/admin">Apri gestione configuratore</a></p>{sessionNotice&&<p role="status">{sessionNotice}</p>}</details>}



        <div className="button-row"><EditorButton onClick={() => act(() => storeRef.current!.undo())} icon="undo" label="Annulla"/><EditorButton onClick={() => act(() => storeRef.current!.redo())} icon="redo" label="Ripristina"/></div>
        {mode!=='customer'&&<><div className="button-row">{graphicPages(doc).some(hasReferenceLayers)&&<><EditorButton icon="download" badge="SVG" label="Esporta SVG tecnico con riferimenti" onClick={()=>void prepareAndAct(async store=>{const svg=await exportReferenceSvg(store.document);return()=>download(`${currentPageName(store.document)}-riferimenti.svg`,svg,'image/svg+xml');})}/>{import.meta.env.DEV&&<EditorButton icon="download" badge="PDF" label="Scarica PDF con livelli di riferimento" disabled={pdfBusy} onClick={()=>void exportPdf(true)}/>}</>}<EditorButton onClick={() => { void prepareAndAct(async store => { const svg = await exportDocumentSvg(store.document); return () => download(graphicPageIds(store.document).length>1?`${currentPageName(store.document)}.svg`:'impronta.TEST.svg', svg, 'image/svg+xml'); }); }} icon="download" label={graphicPageIds(doc).length>1?'Esporta SVG pagina corrente':'Esporta SVG'} badge="SVG"/>{graphicPageIds(doc).length>1&&<EditorButton icon="download" badge="ZIP" label="Esporta tutte le pagine SVG" onClick={()=>{void prepareAndAct(async store=>{const bytes=await exportProjectSvgZip(store.document);return()=>{const url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'})),link=document.createElement('a');link.href=url;link.download='pagine-svg.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};});}}/>}</div>
        <PngExportPanel document={doc}/>
        <EditorButton icon="upload" label="Apri file JSON" badge="JSON" onClick={() => importRef.current?.click()}/>
        <label htmlFor="json-import" className="sr-only">Riapri progetto JSON (max 120 MB)</label><input ref={importRef} className="sr-only" id="json-import" type="file" accept=".json,application/json" onChange={async e => {
          const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (!file) return;
          void prepareAndAct(async store => {
            if (file.size > MAX_PROJECT_BYTES) throw new Error('File oltre 120 MB');
            let next = parseGraphicDocument(JSON.parse(await file.text()));
            next=await projectFonts.prepare(next);await Promise.all([...allGraphicObjects(next).filter(object => object.type === 'image').map(object => prepareRasterSource(object.source))]);
            return () => {if(portable)store.open(next);else store.import(next);setSourceRecord(null);originalDocument.current=structuredClone(store.document);setSavedStamp(sessionDocumentKey(store.document));const title=file.name.replace(/\.json$/i,'').slice(0,120);setArchiveTitle(title);setArchiveKind('composition');setArchiveTags('');setSavedMetadata(metadataKey(title,'composition',''));setSessionNotice(`Aperto file: ${file.name}`);};
          });
        }}/>
        {mode==='test'&&<details><summary>Strumenti sviluppatore · comandi strutturati di prova</summary>
          <label htmlFor="graphic-command">Comando AI simulato (JSON)</label><textarea id="graphic-command" rows={11} value={command} onChange={e => setCommand(e.target.value)}/>
          <div className="button-row"><EditorButton disabled={!doc.objects.length} onClick={() => setCommand(JSON.stringify(withObjectTargetScope(JSON.parse(example(storeRef.current!.document.revision, selectedRef.current[0] ?? doc.objects.find(o => o.type === 'text')?.id ?? doc.objects[0]!.id)),directRef.current),null,2))} icon="refresh" label="Prepara comando aggiornato"/><EditorButton className="primary" onClick={executeCommand} icon="play" label="Esegui comando"/></div>
        </details>}</>}
      </fieldset>
    </>}
    diagnostics={<details hidden={mode!=='test'}><summary>Stato e storico del documento</summary><pre data-testid="graphic-state">{JSON.stringify(doc, null, 2)}</pre><pre>{eventLog || 'Nessuna modifica'}</pre></details>}
  /></>;
}

/** Wait for file-backed fonts before creating or measuring the first composition. */
export function EditorLab(props:Parameters<typeof EditorLabSession>[0]){
 const projectFonts=useProjectFontPreparation(),[prepared,setPrepared]=useState<GraphicDocument|undefined>(undefined);
 const recoveryInput=useRef<HTMLInputElement>(null),[recoveryTitle,setRecoveryTitle]=useState<string|undefined>(),[openingFile,setOpeningFile]=useState(false);
 const [ready,setReady]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0),[initialSource,setInitialSource]=useState<{record:ArchiveRecord;mode:'archive'|'template'}|undefined>();
 useEffect(()=>{let active=true;const controller=new AbortController();setReady(false);setFailed(false);setMessage('');
  void(async()=>{
   const parameters=new URLSearchParams(window.location.search),archive=parameters.get('archive'),template=parameters.get('template');
   let source=props.initialDocument,loaded:typeof initialSource;
   if(!source&&(archive||template)){
    setMessage('Caricamento del progetto…');
    const record=await readArchiveRecord((archive??template)!,AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]));
    source=parseGraphicDocument(record.document);loaded={record,mode:archive?'archive':'template'};
   }
   const assets=source?.fontAssets??[];await loadFontAssets(assets);
   // A portable project already has every file needed for rendering. The library
   // is refreshed by the session, without delaying or changing its composition.
   if(!source||legacyFontRequests(source).length){
    try{await initializeLibraryFonts(assets,AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]));}
    catch(cause){if(controller.signal.aborted)throw cause;throw new Error(cause instanceof DOMException&&cause.name==='TimeoutError'?'La libreria font non risponde. Controlla che il server locale sia attivo e premi Riprova.':cause instanceof Error?cause.message:'Libreria font non disponibile');}
   }else showProjectFontChoices(assets);
   let next=source?await projectFonts.prepare(source):undefined;
   if(next)await Promise.all(allGraphicObjects(next).filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source)));
   if(loaded?.mode==='archive'&&next)next={...next,revision:1,...(next.contentRevision!==undefined?{contentRevision:1}:{})};
   if(loaded?.mode==='template'&&next){
    const record=loaded.record,product=props.product;
    if(!product||record.kind!=='template'||record.archived||record.version!==Number(parameters.get('templateVersion'))||!record.templateProducts?.profileKeys.includes(profileKey(product)))throw new Error('Template o associazioni cambiati: torna alla galleria e controlla nuovamente l’anteprima.');
    await assertFontGeometry(next);
    const fit=fitTemplate(next,product,props.catalogVersion,measureFabric,parameters.get('shrink')==='1'),store=new DocumentStore(createEditorDocument(product,props.catalogVersion),measureFabric,undefined,editorMode()==='customer'?'customer':'admin');
    store.dispatch(templateCommand(fit,record.id,record.version,store.document.revision),'manual');next=store.document;
   }
   if(active){setInitialSource(loaded);setPrepared(next);setMessage(!source&&!defaultLibraryFont()?'La libreria è vuota: carica un font nel pannello amministrativo per aggiungere testi.':'');setReady(true);}
  })().catch(cause=>{if(active){setMessage(cause instanceof Error?cause.message:'Font del progetto non caricabili');setFailed(true);}});
  return()=>{active=false;controller.abort();};
 },[attempt]);
 if(!ready)return <><section className="editor-lab" aria-label="Caricamento editor"><p role={failed&&!openingFile?'alert':'status'}>{message||'Caricamento dei font della libreria…'}</p>{failed&&<><button disabled={openingFile} onClick={()=>setAttempt(value=>value+1)}>Riprova</button><button disabled={openingFile} onClick={()=>recoveryInput.current?.click()}>Apri progetto JSON</button><label className="sr-only">Riapri progetto JSON (max 120 MB)<input ref={recoveryInput} type="file" accept=".json,application/json" disabled={openingFile} onChange={event=>{
  const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(!file)return;setOpeningFile(true);setMessage('Apertura progetto…');void(async()=>{
   try{if(file.size>MAX_PROJECT_BYTES)throw new Error('File oltre 120 MB');const next=await projectFonts.prepare(parseGraphicDocument(JSON.parse(await file.text())));await Promise.all(allGraphicObjects(next).filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source)));showProjectFontChoices(next.fontAssets);setPrepared(next);setRecoveryTitle(file.name.replace(/\.json$/i,'').slice(0,120));setInitialSource(undefined);setFailed(false);setMessage('');setReady(true);}
   catch(cause){setMessage(cause instanceof Error?cause.message:'Progetto non caricabile');setFailed(true);}finally{setOpeningFile(false);}
  })();
 }}/></label>{props.initialDocument&&<button onClick={()=>download('progetto-originale.json',JSON.stringify(props.initialDocument,null,2),'application/json')}>Scarica progetto originale</button>}<a href="/editor/admin?section=fonts">Apri libreria font</a></>}</section>{projectFonts.dialog}</>;
 const record=initialSource?.record,copy=initialSource?.mode==='template'||editorMode()==='customer'&&record?.kind==='template';
 return <>{message&&<p role="status">{message}</p>}<EditorLabSession {...props} initialSource={initialSource} initialDocument={prepared??props.initialDocument} initialTitle={recoveryTitle??(record?(copy?copyArchiveTitle(record.title):record.title):props.initialTitle)} initialKind={record?(copy?'composition':record.kind):props.initialKind} initialTags={record?.tags??props.initialTags}/></>;
}
