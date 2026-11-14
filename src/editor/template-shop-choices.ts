import {ProductionProfileSchema,profileShopBindings,profileAreaConfiguration,type ProductionProfile} from './production-profile';
import {ShopProductDetailSchema,type ShopProductDetail} from '../editor-admin/shop-catalog';
import type {ArchiveRecord} from '../editor-admin/schema';
import {profileShopVariants,shopSelectionFor} from './shop-selection';
import {templateMatchesSelection,fitShopTemplate,applyShopTemplate} from './shop-template';
import {shopProductDocument} from './shop-product-document';
import type {GraphicDocument,Measure} from './model';
export interface TemplateShopChoice{key:string;product:ShopProductDetail;profile:ProductionProfile;variantId:string;variantTitle:string;mode:'fixed'|'document'|'unconfigured';shape:'rectangle'|'square'|'round'|null;area:GraphicDocument['areaMm']|null;issue?:string;}
export function templateShopProductIds(record:Pick<ArchiveRecord,'shopProducts'|'kind'|'archived'>,profiles:readonly ProductionProfile[]):string[]{
 if(record.kind!=='template'||record.archived)return[];const configured=new Set(profiles.filter(profile=>!profile.archived).flatMap(profile=>profileShopBindings(profile).map(binding=>`${binding.source}:${binding.productId}`)));
 return[...new Set((record.shopProducts??[]).filter(binding=>configured.has(`${binding.source}:${binding.productId}`)).map(binding=>binding.productId))].sort();
}
/** Only explicit bindings and current variants; no names, prices or fallback areas. */
export function templateShopChoices(record:ArchiveRecord,rawProfiles:readonly ProductionProfile[],rawProducts:readonly ShopProductDetail[]):TemplateShopChoice[]{
 const profiles=rawProfiles.map(profile=>ProductionProfileSchema.parse(profile)).filter(profile=>!profile.archived),products=rawProducts.map(product=>ShopProductDetailSchema.parse(product)),choices:TemplateShopChoice[]=[];
 if(new Set(profiles.map(profile=>profile.id)).size!==profiles.length)throw Error('Profili attivi duplicati.');
 if(new Set(products.map(product=>product.id)).size!==products.length)throw Error('Prodotti duplicati nella lettura delle scelte.');
 for(const product of products){if(product.status!=='ACTIVE')continue;for(const profile of profiles)for(const variant of profileShopVariants(profile,product)){
  const selection=shopSelectionFor(profile,product,variant.id);if(!templateMatchesSelection(record,selection))continue;
  let mode:TemplateShopChoice['mode']='unconfigured',shape:TemplateShopChoice['shape']=null,area:TemplateShopChoice['area']=null,issue:string|undefined;
  try{const configuration=profileAreaConfiguration(profile,variant.id);shape=configuration.usableArea?.shape??null;if(!shape)throw Error('Sagoma e area utile non configurate.');mode=configuration.sizeMode??'fixed';const w=configuration.usableArea?.widthMm,h=configuration.usableArea?.heightMm;if(mode==='fixed'){if(w==null||h==null)throw Error('Misure utili della variante incomplete.');area={width:w,height:h};}}catch(cause){mode='unconfigured';issue=cause instanceof Error?cause.message:'Misure da configurare.';}
  choices.push({key:`${profile.id}:${profile.version}:${product.id}:${variant.id}`,product,profile,variantId:variant.id,variantTitle:variant.title,mode,shape,area,...(issue?{issue}:{})});
 }}
 for(const choice of choices.filter(choice=>choice.profile.kind.startsWith('stamp-'))){if(new Set(choices.filter(other=>other.product.id===choice.product.id&&other.profile.kind.startsWith('stamp-')).map(other=>other.variantId)).size>1){choice.mode='unconfigured';choice.issue='Più varianti primarie per la stessa montatura: il laboratorio deve definire una scelta unica del corpo.';}}
 const rank=(choice:TemplateShopChoice)=>choice.mode==='fixed'?0:choice.mode==='document'?1:2,physicalArea=(choice:TemplateShopChoice)=>choice.area!.width*choice.area!.height*(choice.shape==='round'?Math.PI/4:1);
 return choices.sort((a,b)=>rank(a)-rank(b)||(a.mode==='fixed'&&b.mode==='fixed'?physicalArea(a)-physicalArea(b)||Math.max(a.area!.width,a.area!.height)-Math.max(b.area!.width,b.area!.height):0)||a.key.localeCompare(b.key));
}
export function fitTemplateShopChoice(record:ArchiveRecord,pageId:string,choice:TemplateShopChoice,area:GraphicDocument['areaMm'],measure:Measure,allowShrink:boolean,documentId?:string){
 if(choice.mode==='unconfigured')throw Error(choice.issue??'Completa le misure nel profilo.');
 const base=shopProductDocument(choice.product,choice.profile,choice.variantId,area,measure);if(documentId)base.document={...base.document,documentId};
 const fit=fitShopTemplate(record,pageId,base.document,base.context,measure,allowShrink),opened=applyShopTemplate(base.document,base.context,fit,record,measure);
 return{...opened,scale:fit.scale,sourcePageId:pageId};
}
/** Bound to associated/configured IDs, independent from catalog size. */
export async function readTemplateShopProducts(ids:readonly string[],read:(id:string)=>Promise<unknown>,signal:AbortSignal):Promise<ShopProductDetail[]>{
 const unique=[...new Set(ids)],result=new Map<string,ShopProductDetail>();let next=0,failure:unknown;
 await Promise.all(Array.from({length:Math.min(3,unique.length)},async()=>{while(!failure&&next<unique.length){try{signal.throwIfAborted();const id=unique[next++]!,product=ShopProductDetailSchema.parse(await read(id));if(product.id!==id)throw Error('Risposta riferita a un altro prodotto.');signal.throwIfAborted();result.set(id,product);}catch(cause){failure=cause;return;}}}));if(failure)throw failure;signal.throwIfAborted();return unique.map(id=>result.get(id)!);
}
