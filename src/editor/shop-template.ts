import {cloneGraphicDocument,DocumentSchema,DocumentStore,validateLayout,type GraphicDocument,type GraphicCatalogContext,type Measure,type GraphicCommand} from './model';
import {graphicPages} from './pages';
import {adaptArtworkToPage} from './background';
import {assertDocumentTextProduction} from './text-production';
import {templateCommand} from './format-adaptation';
import {GEOMETRY_INSPECTION,geometryReportCurrent,type ProductionGeometryReport} from './production-geometry';
export const SHOP_TEMPLATE_SAMPLING_GUARD_MM=2/GEOMETRY_INSPECTION.pixelsPerMm;
import type {ArchiveRecord,AdminSnapshot} from '../editor-admin/schema';
import type {ShopSelection} from './shop-selection';
export type TemplateListing=AdminSnapshot['records'][number];
export function templateMatchesSelection(record:Pick<ArchiveRecord,'kind'|'archived'|'shopProducts'>,selection:Pick<ShopSelection,'source'|'productId'|'variantId'>){
 return record.kind==='template'&&!record.archived&&!!record.shopProducts?.some(binding=>binding.source===selection.source&&binding.productId===selection.productId&&(binding.allVariants||(binding.variantIds??[binding.variantId]).includes(selection.variantId)));
}
/** A new composition uses one existing source page and only its font files. */
export function shopTemplatePage(record:ArchiveRecord,pageId:string):GraphicDocument{
 const page=graphicPages(record.document).find(page=>(page.pageId??'page-1')===pageId);if(!page)throw Error('Pagina del template non disponibile.');
 const source=cloneGraphicDocument(page),ids=new Set(source.objects.flatMap(object=>object.type==='text'?[object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]:[]));
 if(source.fontAssets)source.fontAssets=source.fontAssets.filter(asset=>ids.has(asset.id));return source;
}
export interface ShopTemplateFit {document:GraphicDocument;scale:number;sourcePageId:string;}
/** Geometry only, followed by the same typed command and the asynchronous
 * production/paint checks in the browser. Never changes the source archive. */
export function fitShopTemplate(record:ArchiveRecord,pageId:string,target:GraphicDocument,context:GraphicCatalogContext,measure:Measure,allowShrink=true):ShopTemplateFit{
 if(!target.shopSelection||!templateMatchesSelection(record,target.shopSelection))throw Error('Template non associato al prodotto e alla variante scelti.');
 DocumentSchema.parse(record.document);DocumentSchema.parse(target);
 const source=shopTemplatePage(record,pageId);
 if(!source.objects.length&&!source.paperColor)throw Error('Il template è vuoto.');
 const adapt=(scale:number)=>{
  const document=cloneGraphicDocument(target);
  document.objects=adaptArtworkToPage(source,target.areaMm,measure,scale);document.groups=structuredClone(source.groups);document.fontAssets=structuredClone(source.fontAssets);
  if(source.paperColor)document.paperColor=source.paperColor;else delete document.paperColor;
  if(source.backgroundImageId)document.backgroundImageId=source.backgroundImageId;else delete document.backgroundImageId;
  if(source.backgroundGroupId)document.backgroundGroupId=source.backgroundGroupId;else delete document.backgroundGroupId;
  return document;
 };
 const validate=(document:GraphicDocument)=>{validateLayout(document,measure);assertDocumentTextProduction(document,context,true);return DocumentSchema.parse(document);};
 // Colour/font policy errors cannot be cured by shrinking. Check the original
 // candidate before searching only the containment geometry.
 const original=adapt(1);assertDocumentTextProduction(original,context,true);DocumentSchema.parse(original);
 try{return{document:validate(original),scale:1,sourcePageId:pageId};}catch(error){if(!allowShrink)throw error;if(target.productionProfile?.safeMarginMm==null)throw Error('Definisci il margine del profilo prima di proporre una riduzione automatica.');}
 let low=0,high=1;
 for(let step=0;step<32;step++){const scale=(low+high)/2;try{const trial=adapt(scale);validateLayout({...trial,productionProfile:{...trial.productionProfile!,safeMarginMm:trial.productionProfile!.safeMarginMm!+SHOP_TEMPLATE_SAMPLING_GUARD_MM}},measure);low=scale;}catch{high=scale;}}
 if(low<.00001)throw Error('Il template non entra in questo formato. Scegli un formato maggiore o modifica la grafica.');
 if(target.productionProfile?.kind==='engraved-plaque')throw Error('La riduzione automatica delle incisioni richiede il controllo della finezza dei particolari, ancora da completare. Scegli un formato maggiore o modifica il template.');
 const scale=low*(1-1e-8),document=validate(adapt(scale));return{document,scale,sourcePageId:pageId};
}
export function shopTemplateCommand(fit:ShopTemplateFit,record:Pick<ArchiveRecord,'id'|'version'>,revision:number):GraphicCommand{
 const command=templateCommand(fit,record.id,record.version,revision);if(command.tool!=='applyTemplate')throw Error('Comando template non valido.');return{...command,arguments:{...command.arguments,templatePageId:fit.sourcePageId}};
}
export function applyShopTemplate(target:GraphicDocument,context:GraphicCatalogContext,fit:ShopTemplateFit,record:Pick<ArchiveRecord,'id'|'version'>,measure:Measure){
 const store=new DocumentStore(target,measure,context);store.dispatch(shopTemplateCommand(fit,record,target.revision),'manual');return{document:store.document,context};
}
export function assertShopTemplateGeometry(report:ProductionGeometryReport,document:GraphicDocument){
 if(!geometryReportCurrent(report,document)||report.revision!==document.revision)throw Error('Controllo geometrico relativo a un’altra revisione: ripeti l’anteprima.');
 const issue=report.pages.flatMap(page=>page.rules).find(rule=>rule.status!=='clear');
 if(report.status!=='clear'||issue)throw Error(issue?`${issue.label}: ${issue.status==='overlap'?'la grafica entra nella zona riservata o nel margine':issue.status==='boundary'?'grafica al limite: modifica il template o il formato':issue.message??'controllo non completato'}.`:'Controllo geometrico non completato: nessuna compatibilità attribuita.');
}
