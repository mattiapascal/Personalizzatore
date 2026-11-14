import {DocumentSchema,cloneGraphicDocument,validateLayout,type GraphicDocument,type GraphicCommand,type GraphicCatalogContext,type Measure} from './model';
import {profileAreaConfiguration,validateProductionProfile,type ProductionProfile} from './production-profile';
import {shopSelectionFor} from './shop-selection';
import {adaptArtworkToPage} from './background';
import {assertDocumentTextProduction} from './text-production';
import {geometryReportCurrent,GEOMETRY_INSPECTION,type ProductionGeometryReport} from './production-geometry';
import {effectiveObjectProperties} from './object-properties';
import type {PlaqueMounting} from './plaque';
export type ShopProductChangeArguments=Extract<GraphicCommand,{tool:'changeShopProduct'}>['arguments'];
export interface ShopProductChangeFit{document:GraphicDocument;scale:number;}
export function activeShopPage(document:GraphicDocument):GraphicDocument{const{otherPages:_others,pageOrder:_order,...page}=cloneGraphicDocument(document);return page;}
export function sameShopCategory(a:ProductionProfile,b:ProductionProfile){return a.kind.startsWith('stamp-')===b.kind.startsWith('stamp-');}
export function preservedMountingMeasurements(source:GraphicDocument,profile:ProductionProfile,method:PlaqueMounting['method']){
 const same=source.productionProfile?.id===profile.id&&source.productionProfile.version===profile.version&&source.plaque?.method===method;
 return{holeDiameterMm:same?source.plaque!.holeDiameterMm:null,clearanceMm:same?source.plaque!.clearanceMm??null:null};
}
/** Resolve only trusted catalog context, then apply one deterministic global transform. */
export function fitShopProductChange(source:GraphicDocument,args:ShopProductChangeArguments,context:GraphicCatalogContext|undefined,measure:Measure):ShopProductChangeFit{
 DocumentSchema.parse(source);if(!source.shopSelection||!source.productionProfile)throw Error('Apri prima un prodotto reale con il suo profilo.');
 const selection=args.selection,product=context?.shopProducts?.find(item=>item.id===selection.productId),profile=context?.shopProfiles?.find(item=>item.id===selection.profileId&&item.version===selection.profileVersion);
 if(!product||!profile)throw Error('Prodotto o profilo non disponibili nel contesto: rileggi le scelte.');validateProductionProfile(profile);
 if(!sameShopCategory(source.productionProfile,profile)||source.shopSelection.source!==selection.source)throw Error('Scegli un prodotto della stessa categoria e fonte del progetto.');
 const verified=shopSelectionFor(profile,product,selection.variantId);if(JSON.stringify(verified)!==JSON.stringify(selection))throw Error('La lettura del prodotto è cambiata: ripeti la scelta.');
 const configuration=profileAreaConfiguration(profile,selection.variantId),shape=configuration.usableArea?.shape;if(!shape)throw Error('Sagoma e misure del prodotto non configurate.');
 const stamp=profile.kind.startsWith('stamp-');if(stamp&&args.mounting||!stamp&&!args.mounting)throw Error('Il fissaggio deve corrispondere alla categoria del prodotto.');
 if(args.mounting){const technical=preservedMountingMeasurements(source,profile,args.mounting.method);if((args.mounting.family??'flat-plaque')!==(profile.plaqueFamily??'flat-plaque'))throw Error('Fissaggio riferito a una famiglia diversa dal prodotto.');if(args.mounting.holeDiameterMm!==technical.holeDiameterMm||(args.mounting.clearanceMm??null)!==technical.clearanceMm)throw Error('Le misure tecniche dei fissaggi non si trasferiscono fra profili o metodi diversi.');}
 const candidate=(scale:number)=>{const document=cloneGraphicDocument(source);document.shopSelection={...verified};document.productionProfile=structuredClone(profile);document.areaMm={...args.areaMm};document.shape=shape;document.colorMode=stamp?'monochrome':'color';if(stamp){delete document.plaque;document.inkColor=args.inkColor??source.inkColor??'black';}else{if(args.inkColor!==undefined)throw Error('La tinta del tampone riguarda soltanto i timbri.');document.plaque={...args.mounting!};}document.objects=adaptArtworkToPage(source,document.areaMm,measure,scale);return document;};
 const validate=(document:GraphicDocument)=>{DocumentSchema.parse(document);const page=activeShopPage(document);validateLayout(page,measure);assertDocumentTextProduction(page,context,true);return document;},original=candidate(1);
 DocumentSchema.parse(original);assertDocumentTextProduction(activeShopPage(original),context,true);
 try{return{document:validate(original),scale:1};}catch(error){if(!args.allowShrink)throw error;}
 if(profile.safeMarginMm===null)throw Error('Definisci il margine del profilo prima di proporre una riduzione automatica.');
 if(profile.kind==='engraved-plaque')throw Error('La riduzione automatica delle incisioni richiede il controllo della finezza dei particolari. Scegli un formato maggiore o modifica la grafica.');
 let low=0,high=1;for(let step=0;step<32;step++){const scale=(low+high)/2;try{const page=activeShopPage(candidate(scale));page.productionProfile={...page.productionProfile!,safeMarginMm:profile.safeMarginMm+2/GEOMETRY_INSPECTION.pixelsPerMm};validateLayout(page,measure);low=scale;}catch{high=scale;}}
 if(low<.00001)throw Error('La composizione non entra nel nuovo formato. Scegli un formato maggiore o modifica la grafica.');const scale=low*(1-1e-8);return{document:validate(candidate(scale)),scale};
}
export function shopProductChangeWarnings(source:GraphicDocument,fit:ShopProductChangeFit,report:ProductionGeometryReport):string[]{
 const document=activeShopPage(fit.document);if(!geometryReportCurrent(report,document)||report.revision!==document.revision)throw Error('Controllo geometrico di un’altra revisione: ripeti l’anteprima.');
 const rules=report.pages.flatMap(page=>page.rules),bad=rules.find(rule=>['overlap','boundary','incomplete'].includes(rule.status));
 if(bad||report.status==='incomplete'||report.status==='overlap'||report.status==='boundary')throw Error(bad?`${bad.label}: ${bad.message??(bad.status==='overlap'?'la grafica entra nella zona riservata o nel margine':'controllo al limite o incompleto')}.`:'Controllo geometrico non completato.');
 const unknown=rules.filter(rule=>rule.status==='unconfigured');if(fit.scale<1&&(unknown.length||report.status!=='clear'))throw Error('La riduzione richiede margini e misure tecniche dei fissaggi verificati.');
 const warnings=[...new Set(unknown.map(rule=>rule.message??`${rule.label}: dato tecnico da verificare.`))];
 if(document.productionProfile?.kind==='engraved-plaque')warnings.push('Finezza dei particolari e distanza fra vernici richiedono ancora verifica del laboratorio.');
 if(source.objects.some(object=>effectiveObjectProperties(source,object.id).reference))warnings.push('I riferimenti grafici sono conservati: verifica che corrispondano al nuovo supporto.');
 return warnings;
}
