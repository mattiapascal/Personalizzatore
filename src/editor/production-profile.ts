import{GRAPHIC_GEOMETRY_LIMITS}from'./limits';
import {PlaqueFamilySchema} from './plaque';
import { z } from 'zod';
import { ShopProfileBindingSchema } from '../editor-admin/shop-catalog';
import { ReservedRegionsSchema,assertRegionsFit } from './regions';
const nullableMm=z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.pageSideMm).nullable(),label=z.string().trim().min(1).max(120);
export const FixingProfileSchema=z.strictObject({id:z.string().uuid(),label,kind:z.enum(['holes-only','kit']),drilling:z.strictObject({diameterMm:nullableMm,offsetXMm:nullableMm,offsetYMm:nullableMm,clearanceMm:z.number().finite().min(0).max(100).nullable(),pattern:z.enum(['top-pair','bottom-pair','four-corners'])}).nullable()});
export const ProfileAreaSchema=z.strictObject({widthMm:nullableMm,heightMm:nullableMm,shape:z.enum(['rectangle','square','round'])});
export const VariantAreaSchema=z.strictObject({variantId:ShopProfileBindingSchema.shape.variantId,sizeMode:z.enum(['fixed','document']),usableArea:ProfileAreaSchema});
export const ProductionProfileDataSchema=z.strictObject({
 plaqueFamily:PlaqueFamilySchema.optional(),
 sizeMode:z.enum(['fixed','document','variant']).optional(),
 variantAreas:z.array(VariantAreaSchema).max(2000).optional(),
 label,kind:z.enum(['stamp-ink','stamp-emboss','engraved-plaque','printed-plaque']),
 binding:z.strictObject({profileKey:z.string().min(1).max(200),catalogVersion:z.string().min(1)}).nullable(),
 shopBinding:ShopProfileBindingSchema.nullable().optional(),
 usableArea:ProfileAreaSchema.nullable(),
 safeMarginMm:z.number().finite().min(0).max(100).nullable(),
 minFontSizePt:z.number().finite().positive().max(1000).nullable(),
 minEngravedFeatureMm:nullableMm,minDifferentPaintGapMm:z.number().finite().min(0).max(1000).nullable(),
 rasterMode:z.enum(['binary','color','unconfigured']),
 reservedAreas:ReservedRegionsSchema,
 fixings:z.array(FixingProfileSchema).max(20),notes:z.string().max(4000),
});
export const ProductionProfileSchema=ProductionProfileDataSchema.extend({id:z.string().uuid(),version:z.number().int().positive(),archived:z.boolean(),createdAt:z.string().datetime(),updatedAt:z.string().datetime(),validatedForProduction:z.literal(false)});
export type ProductionProfile=z.infer<typeof ProductionProfileSchema>;
export type ProductionProfileData=z.infer<typeof ProductionProfileDataSchema>;
/** Resolve geometry only. The versioned source profile is never rewritten. */
export function profileAreaConfiguration(profile:ProductionProfileData,variantId?:string){
 if(profile.sizeMode!=='variant')return{sizeMode:profile.sizeMode??'fixed',usableArea:profile.usableArea};
 const area=profile.variantAreas?.find(item=>item.variantId===variantId);
 if(!area)throw Error('Misure della variante non configurate nel profilo.');
 return{sizeMode:area.sizeMode,usableArea:area.usableArea};
}
export const profileKindLabel=(kind:ProductionProfileData['kind'])=>({'stamp-ink':'Timbro inchiostrato','stamp-emboss':'Timbro a secco','engraved-plaque':'Targa incisa','printed-plaque':'Targa o cartello stampato'})[kind];
export function defaultProductionProfile(kind:ProductionProfileData['kind']):ProductionProfileData{return{label:'',kind,binding:null,usableArea:null,safeMarginMm:null,minFontSizePt:kind==='stamp-ink'?7:null,minEngravedFeatureMm:kind==='engraved-plaque'?.5:null,minDifferentPaintGapMm:kind==='engraved-plaque'?30:null,rasterMode:kind==='stamp-ink'?'binary':kind==='printed-plaque'?'color':'unconfigured',reservedAreas:[],fixings:[],notes:''};}
/** Profile compilation checks; never a certification of glyph/logo manufacturability. */
export function validateProductionProfile(data:ProductionProfileData):void {
 if(data.binding&&data.shopBinding)throw new Error('Scegli un’associazione TEST oppure Shopify, non entrambe.');
 if(data.sizeMode==='variant'&&!data.shopBinding)throw Error('Le misure per variante richiedono un prodotto Shopify associato.');
 if(new Set(data.variantAreas?.map(item=>item.variantId)).size!==(data.variantAreas?.length??0))throw Error('Misure duplicate per la stessa variante.');
 if(data.variantAreas?.length){const binding=data.shopBinding;if(!binding||data.variantAreas.some(item=>!binding.allVariants&&!(binding.variantIds??[binding.variantId]).includes(item.variantId)))throw Error('Le misure devono appartenere alle varianti associate al profilo.');}
 if(data.kind!=='engraved-plaque'&&(data.minEngravedFeatureMm!==null||data.minDifferentPaintGapMm!==null))throw new Error('I limiti della punta e della distanza fra vernici riguardano soltanto le targhe incise.');
 if(data.kind==='engraved-plaque'&&(data.minEngravedFeatureMm!==null&&data.minEngravedFeatureMm<.5||data.minDifferentPaintGapMm!==null&&data.minDifferentPaintGapMm<30))throw new Error('Regole confermate: punta minima 0,5 mm e distanza fra colori differenti 30 mm.');
 if(data.kind==='stamp-ink'&&(data.minFontSizePt!==null&&data.minFontSizePt<7||data.rasterMode!=='binary'))throw new Error('Per i timbri inchiostrati: testo minimo 7 pt e immagini B/N.');
 const area=data.sizeMode==='variant'?null:data.usableArea;
 if(data.sizeMode==='variant')for(const variant of data.variantAreas??[])validateProductionProfile({...data,sizeMode:variant.sizeMode,usableArea:variant.usableArea,variantAreas:undefined,fixings:[]});
 if(area?.widthMm&&area.heightMm){if(area.shape!=='rectangle'&&area.widthMm!==area.heightMm)throw new Error('Area quadrata/tonda: larghezza e altezza devono coincidere.');if(data.safeMarginMm!==null&&data.safeMarginMm*2>=Math.min(area.widthMm,area.heightMm))throw new Error('Il margine occupa tutta l’area utile.');assertRegionsFit(data.reservedAreas,{width:area.widthMm,height:area.heightMm,shape:area.shape});}
 if(new Set(data.fixings.map(item=>item.id)).size!==data.fixings.length||new Set(data.reservedAreas.map(item=>item.id)).size!==data.reservedAreas.length)throw new Error('ID duplicati nei fissaggi o nelle zone riservate.');
 if(data.kind.startsWith('stamp-')&&data.fixings.length)throw new Error('I fissaggi di questa sezione riguardano targhe e cartelli.');
 for(const fixing of data.fixings){if(fixing.kind==='holes-only'&&!fixing.drilling)throw new Error('La sola foratura richiede uno schema di fori.');const drilling=fixing.drilling;if(drilling?.diameterMm&&area?.widthMm&&area.heightMm&&drilling.offsetXMm&&drilling.offsetYMm)fixingPositions(data,fixing.id);}
}
export function missingProductionData(data:ProductionProfileData):string[]{
 const missing:string[]=[];if(!data.binding&&!data.shopBinding)missing.push('associazione prodotto/variante');
 if(data.sizeMode==='variant'){
  const ids=data.kind.startsWith('stamp-')?[data.shopBinding?.variantId]:data.shopBinding?.variantIds??[data.shopBinding?.variantId];
  if(ids.some(id=>!data.variantAreas?.some(item=>item.variantId===id)))missing.push('misure delle varianti associate');
  if(data.variantAreas?.some(item=>item.sizeMode==='fixed'&&(!item.usableArea.widthMm||!item.usableArea.heightMm)))missing.push('area utile verificata delle varianti');
 }else if(!data.usableArea||data.sizeMode!=='document'&&(!data.usableArea.widthMm||!data.usableArea.heightMm))missing.push('area utile verificata');
 if(data.safeMarginMm===null)missing.push('margine verificato');if(data.kind==='stamp-ink'&&data.minFontSizePt===null)missing.push('corpo minimo del testo');if(data.kind==='engraved-plaque'&&(data.minEngravedFeatureMm===null||data.minDifferentPaintGapMm===null))missing.push('limiti incisione e vernici');if(data.rasterMode==='unconfigured')missing.push('regole immagini');for(const fixing of data.fixings)if(fixing.drilling&&[fixing.drilling.diameterMm,fixing.drilling.offsetXMm,fixing.drilling.offsetYMm,fixing.drilling.clearanceMm].some(value=>value===null))missing.push(`misure complete di «${fixing.label}»`);return missing;
}
export function fixingPositions(profile:ProductionProfileData,fixingId:string):{xMm:number;yMm:number;diameterMm:number}[]{
 const fixing=profile.fixings.find(item=>item.id===fixingId),area=profile.usableArea,drill=fixing?.drilling;
 if(!fixing)throw new Error('Fissaggio non presente nel profilo');if(!drill)return[];
 if(!area?.widthMm||!area.heightMm||drill.diameterMm===null||drill.offsetXMm===null||drill.offsetYMm===null)throw new Error('Completa le misure di area e foratura prima del posizionamento.');
 const left=drill.offsetXMm,right=area.widthMm-left,top=drill.offsetYMm,bottom=area.heightMm-top,diameterMm=drill.diameterMm;
 const points=drill.pattern==='top-pair'?[[left,top],[right,top]]:drill.pattern==='bottom-pair'?[[left,bottom],[right,bottom]]:[[left,top],[right,top],[left,bottom],[right,bottom]];
 if(new Set(points.map(point=>point.join(':'))).size!==points.length||points.some(([x,y])=>x!-diameterMm/2<0||y!-diameterMm/2<0||x!+diameterMm/2>area.widthMm!||y!+diameterMm/2>area.heightMm!))throw new Error('Schema fori incompatibile con le dimensioni del supporto.');
 if(area.shape==='round'&&points.some(([x,y])=>Math.hypot(x!-area.widthMm!/2,y!-area.heightMm!/2)+diameterMm/2>area.widthMm!/2))throw new Error('Un foro esce dal supporto circolare.');
 if(points.some(([x,y],index)=>points.slice(index+1).some(([otherX,otherY])=>Math.hypot(x!-otherX!,y!-otherY!)<diameterMm)))throw new Error('Lo schema contiene fori sovrapposti.');
 return points.map(([x,y])=>({xMm:x!,yMm:y!,diameterMm}));
}
