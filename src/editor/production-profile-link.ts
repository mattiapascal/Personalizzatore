import type {GraphicDocument,GraphicCatalogContext} from './model';
import {profileKey} from '../catalog/schema';
import {assertRegionsFit} from './regions';
import {validateProductionProfile,type ProductionProfile} from './production-profile';

/** Technical rules travel with each page. No resizing, scaling of physical
 * regions, product assignment, or silent refresh of an older profile version. */
export function profileForPage(profile:ProductionProfile,page:Pick<GraphicDocument,'areaMm'|'shape'>):ProductionProfile{
 const resolved=structuredClone(profile);
 if(profile.sizeMode==='document')resolved.usableArea={widthMm:page.areaMm.width,heightMm:page.areaMm.height,shape:profile.usableArea?.shape??page.shape};
 return resolved;
}
export function assertProfileForPage(profile:ProductionProfile,page:Pick<GraphicDocument,'areaMm'|'shape'|'plaque'|'productId'|'variantId'|'catalogVersion'|'catalogProductProfileVersion'|'colorMode'>,catalog?:GraphicCatalogContext,requireCatalog=false):void{
 if(profile.archived)throw Error('Il profilo archiviato non può essere collegato alla pagina.');
 validateProductionProfile(profile);
 if(!profile.usableArea)throw Error('Definisci la sagoma dell’area utile nel profilo prima di collegarlo.');
 const resolved=profileForPage(profile,page),area=resolved.usableArea!;
 if(area.widthMm===null||area.heightMm===null)throw Error('Completa le misure del profilo oppure scegli «Misure della pagina».');
 if(Math.abs(area.widthMm-page.areaMm.width)>1e-7||Math.abs(area.heightMm-page.areaMm.height)>1e-7||area.shape!==page.shape)throw Error('Area del profilo diversa dalla pagina: scegli un profilo compatibile o usa le misure della pagina. Nessuna grafica è stata ridimensionata.');
 validateProductionProfile({...resolved,fixings:[]});assertRegionsFit(profile.reservedAreas,{width:page.areaMm.width,height:page.areaMm.height,shape:page.shape});
 if(profile.kind.startsWith('stamp-')&&(page.colorMode==='color'||page.plaque))throw Error('Il profilo timbro richiede una pagina monocromatica, senza configurazione di targa.');
 if(page.productId&&!profile.kind.startsWith('stamp-'))throw Error('Una montatura timbro non può usare un profilo per targhe.');
 if(profile.plaqueFamily&&page.plaque&&(page.plaque.family??'flat-plaque')!==profile.plaqueFamily)throw Error('Famiglia del profilo diversa dalla targa corrente.');
 if(profile.shopBinding&&page.productId&&(profile.shopBinding.productId!==page.productId||!profile.shopBinding.allVariants&&!(profile.shopBinding.variantIds??[profile.shopBinding.variantId]).includes(page.variantId??'')))throw Error('Il profilo è associato a un altro prodotto o variante.');
 const model=catalog?.products.find(product=>product.productId===page.productId&&product.variantIds.includes(page.variantId??''));
 if(page.productId&&requireCatalog&&(!model||catalog!.version!==page.catalogVersion||model.profileVersion!==page.catalogProductProfileVersion))throw Error('Catalogo del modello non disponibile o cambiato: riapri la pagina prima di collegare il profilo.');
 if(model){
  if(page.areaMm.width>model.nominalAreaMm.width+1e-7||page.areaMm.height>model.nominalAreaMm.height+1e-7)throw Error('Area della pagina maggiore delle dimensioni nominali della montatura.');
  if(profile.kind==='stamp-emboss'&&model.mechanism!=='emboss'||profile.kind==='stamp-ink'&&model.mechanism==='emboss')throw Error('Lavorazione del profilo diversa dalla montatura.');
 }
 if(profile.binding){
  if(profile.binding.catalogVersion!==page.catalogVersion||!page.productId)throw Error('Associazione del profilo TEST diversa dalla pagina corrente.');
  if(requireCatalog&&!catalog)throw Error('Catalogo del profilo TEST non disponibile.');
  if(catalog){const product=catalog.products.find(product=>profileKey(product)===profile.binding!.profileKey);if(catalog.version!==profile.binding.catalogVersion||!product||product.productId!==page.productId||!product.variantIds.includes(page.variantId??''))throw Error('Associazione del profilo TEST non disponibile o cambiata.');if(profile.kind==='stamp-emboss'&&product.mechanism!=='emboss'||profile.kind==='stamp-ink'&&product.mechanism==='emboss')throw Error('Lavorazione del profilo diversa dalla montatura.');}
 }
}
