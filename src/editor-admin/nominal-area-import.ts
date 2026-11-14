import {ProductionProfileDataSchema,profileShopBindings,validateProductionProfile,type ProductionProfileData} from '../editor/production-profile';
import {ShopMeasurementsSchema,measurementIssueLabel,type ShopMeasurements} from './shop-measurements';
import type {ShopProductDetail} from './shop-catalog';
type Shape=NonNullable<ProductionProfileData['usableArea']>['shape'];
export interface NominalAreaProposal{productId:string;productTitle:string;variantId:string;variantTitle:string;widthMm:number|null;heightMm:number|null;shape:Shape|null;status:'new'|'incomplete'|'configured'|'custom'|'unavailable';reason:string;reading:ShopMeasurements;}
/** Exact source/ID matching. Neither names nor equal sides imply a shape or usable area. */
export function nominalAreaImportPlan(profile:ProductionProfileData,products:ShopProductDetail[],readings:ShopMeasurements[]):NominalAreaProposal[]{
 if(profile.sizeMode!=='variant')throw Error('Scegli prima le misure per variante Shopify.');const bindings=profileShopBindings(profile);
 if(!bindings.length||products.length!==bindings.length||readings.length!==bindings.length||new Set(products.map(item=>item.id)).size!==products.length||new Set(readings.map(item=>item.id)).size!==readings.length)throw Error('Lettura incompleta o duplicata dei prodotti: ricarica le varianti.');
 return bindings.flatMap(binding=>{
  const product=products.find(item=>item.id===binding.productId),raw=readings.find(item=>item.id===binding.productId);if(!product||!raw)throw Error('Misure riferite a un altro prodotto.');const reading=ShopMeasurementsSchema.parse(raw);
  if(product.source!==binding.source||reading.source!==binding.source||product.title!==reading.title||product.status!==reading.status||JSON.stringify(product.variants.map(item=>[item.id,item.title]).sort())!==JSON.stringify(reading.variants.map(item=>[item.id,item.title]).sort()))throw Error('Prodotto o varianti cambiati durante la lettura delle misure: ricarica le varianti.');
  if(Date.parse(reading.checkedAt)<Date.parse(product.checkedAt))throw Error('Le misure sono precedenti alla lettura delle varianti: rileggile.');
  const allowed=profile.kind.startsWith('stamp-')?[binding.variantId]:binding.allVariants?product.variants.map(item=>item.id):binding.variantIds??[binding.variantId];
  return reading.variants.filter(item=>allowed.includes(item.id)).map(item=>{
   const current=profile.variantAreas?.find(area=>area.variantId===item.id),complete=item.width.mm!==null&&item.height.mm!==null;
   const status=current?.sizeMode==='document'?'custom':current?.usableArea.widthMm!==null&&current?.usableArea.widthMm!==undefined&&current.usableArea.heightMm!==null?'configured':!complete?'unavailable':current?'incomplete':'new';
   return{productId:product.id,productTitle:product.title,variantId:item.id,variantTitle:item.title,widthMm:current?.usableArea.widthMm??item.width.mm,heightMm:current?.usableArea.heightMm??item.height.mm,shape:current?.usableArea.shape??null,status,reason:status==='custom'?'Misure personalizzate: conservate.':status==='configured'?'Area già configurata: conservata.':status==='unavailable'?[measurementIssueLabel(item.width.issue),measurementIssueLabel(item.height.issue)].filter(Boolean).join(' · '):status==='incomplete'?'Solo i valori mancanti saranno precompilati.':'Nuova area: scegli la sagoma e verifica le misure.',reading};
  });
 });
}
export function applyNominalAreaImport(profile:ProductionProfileData,products:ShopProductDetail[],readings:ShopMeasurements[],choices:{variantId:string;shape:Shape}[]):ProductionProfileData{
 if(!choices.length||new Set(choices.map(item=>item.variantId)).size!==choices.length)throw Error('Scegli almeno una variante, senza duplicati.');
 const proposals=nominalAreaImportPlan(profile,products,readings),areas=structuredClone(profile.variantAreas??[]);
 for(const choice of choices){
  const row=proposals.find(item=>item.variantId===choice.variantId);if(!row||!['new','incomplete'].includes(row.status)||row.widthMm===null||row.heightMm===null)throw Error('Variante non precompilabile: nessuna area modificata.');
  if(row.shape&&row.shape!==choice.shape)throw Error('La sagoma già configurata deve essere conservata.');const original=row.reading.variants.find(item=>item.id===row.variantId)!;
  const area={variantId:row.variantId,sizeMode:'fixed' as const,usableArea:{widthMm:row.widthMm,heightMm:row.heightMm,shape:choice.shape},nominalSource:{kind:'shopify-variant-metafields' as const,contractVersion:1 as const,source:row.reading.source,productId:row.productId,checkedAt:row.reading.checkedAt,widthMm:original.width.mm!,heightMm:original.height.mm!}},index=areas.findIndex(item=>item.variantId===choice.variantId);
  if(index<0)areas.push(area);else areas[index]=area;
 }
 const next=ProductionProfileDataSchema.parse({...profile,variantAreas:areas});validateProductionProfile(next);return next;
}
