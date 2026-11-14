import {AdminStateSchema,ArchiveRecordSchema,DEFAULT_ADMIN_SETTINGS} from '../../src/editor-admin/schema';
import {ShopBrowserCatalogSchema,ShopProductDetailSchema,ShopProfileBindingSchema} from '../../src/editor-admin/shop-catalog';
import {PitchprintAssociationsSchema} from '../../src/editor-admin/pitchprint-associations';
import {textPathCommitFixture} from './text-path-commit';
import {linkedProfile} from './production-profile-link';
const time='2026-11-14T12:00:00.000Z';
export function productIntegrationFixture(){
 const detail=ShopProductDetailSchema.parse({source:'test',checkedAt:time,id:'gid://shopify/Product/1',title:'Targa TEST',status:'ACTIVE',variants:[{id:'gid://shopify/ProductVariant/11',title:'100 × 70 mm',sku:null,selectedOptions:[]},{id:'gid://shopify/ProductVariant/12',title:'150 × 100 mm',sku:null,selectedOptions:[]}]}),binding=ShopProfileBindingSchema.parse({source:'test',checkedAt:time,productId:detail.id,productTitle:detail.title,variantId:detail.variants[0]!.id,variantTitle:detail.variants[0]!.title,variantIds:[detail.variants[0]!.id],variantTitles:[detail.variants[0]!.title],allVariants:false});
 const make=(n:number,sourceId:string|undefined,title:string)=>ArchiveRecordSchema.parse({id:`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`,createdAt:time,updatedAt:time,archived:false,version:1,kind:'template',title,tags:['TEST'],clientRef:'',document:textPathCommitFixture(),...(sourceId?{pitchprintSource:{sourceId:'pitchprint:'+sourceId,sourceHash:'a'.repeat(64),converterVersion:1,warnings:[]}}:{})});
 const records=[make(1,'source-a','Template recuperabile TEST'),make(2,'source-b','Template parziale TEST'),make(3,undefined,'Nome simile TEST'),make(4,'source-c','Template archiviato TEST'),make(5,'source-d','Composizione cliente TEST')];records[1]!.shopProducts=[binding];records[3]!.archived=true;records[4]!.kind='composition';
 const other={...binding,productId:'gid://shopify/Product/2',productTitle:'Altro prodotto TEST',variantId:'gid://shopify/ProductVariant/21',variantIds:['gid://shopify/ProductVariant/21']};records[0]!.shopProducts=[other];
 const profile=linkedProfile();profile.shopBinding=binding;profile.safeMarginMm=null;
 const state=AdminStateSchema.parse({schemaVersion:1,revision:4,settings:DEFAULT_ADMIN_SETTINGS,fonts:[],records,productionProfiles:[profile]});
 const catalog=ShopBrowserCatalogSchema.parse({schemaVersion:1,source:'test',shopDomain:'zqu2eg-72.myshopify.com',checkedAt:time,collections:[{id:'gid://shopify/Collection/1',title:'Targhe TEST',handle:'targhe-test'}],products:[{id:detail.id,title:detail.title,status:'ACTIVE',handle:'targa-test',tags:['targhe'],collectionIds:['gid://shopify/Collection/1'],onlineStoreUrl:null,image:null},{id:other.productId,title:other.productTitle,status:'ACTIVE',handle:'altro-test',tags:['timbri'],collectionIds:[],onlineStoreUrl:null,image:null}]});
 const associations=PitchprintAssociationsSchema.parse({source:'shopify-global-pprint',checkedAt:time,productsScanned:2,configuredProducts:1,links:['source-a','source-b','source-c','source-d','not-imported'].map(designId=>({designId,productId:detail.id,productTitle:detail.title,via:'design'})),issues:[]});
 return{state,catalog,associations,detail};
}
