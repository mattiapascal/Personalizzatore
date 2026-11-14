import {createDocument,DocumentSchema,DocumentStore,type GraphicDocument,type GraphicCatalogContext,type Measure} from './model';
import {defaultMountingFor} from './plaque';
import {validateProductionProfile,type ProductionProfile} from './production-profile';
import type {ShopProductDetail} from '../editor-admin/shop-catalog';
import {shopSelectionFor} from './shop-selection';
export function shopProductDocument(product:ShopProductDetail,profile:ProductionProfile,variantId:string,area:GraphicDocument['areaMm'],measure:Measure){
 validateProductionProfile(profile);const selection=shopSelectionFor(profile,product,variantId),configured=profile.usableArea;
 if(!configured)throw Error('Definisci la sagoma e le misure utili nel profilo.');
 const document=DocumentSchema.parse({...createDocument(),objects:[],areaMm:{...area},shape:configured.shape,colorMode:profile.kind.startsWith('stamp-')?'monochrome':'color',productionProfile:structuredClone(profile),...(profile.kind.startsWith('stamp-')?{inkColor:'black'}:configured.shape==='rectangle'?{plaque:defaultMountingFor(profile.plaqueFamily??'flat-plaque')}:{})});
 const context:GraphicCatalogContext={version:'local-shop-selection-v1',products:[],shopProducts:[structuredClone(product)],shopProfiles:[structuredClone(profile)]},store=new DocumentStore(document,measure,context);
 store.dispatch({schemaVersion:1,tool:'setShopSelection',objectId:'project',expectedRevision:document.revision,arguments:{selection}},'manual');
 return{document:store.document,context};
}
