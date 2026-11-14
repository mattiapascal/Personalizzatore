import {ShopProductDetailSchema} from '../editor-admin/shop-catalog';
import {ProductionProfileSchema} from './production-profile';
import type {GraphicCatalogContext} from './model';
/** Adapter data is external to the command. A failed command never installs it. */
export function mergeShopProductContext(current:GraphicCatalogContext|undefined,incoming:GraphicCatalogContext):GraphicCatalogContext{
 if(current&&(current.version!==incoming.version||JSON.stringify(current.products)!==JSON.stringify(incoming.products)))throw Error('Il cambio prodotto non sostituisce il catalogo storico.');
 const products=(incoming.shopProducts??[]).map(item=>ShopProductDetailSchema.parse(item)),profiles=(incoming.shopProfiles??[]).map(item=>ProductionProfileSchema.parse(item));
 if(new Set(products.map(item=>item.id)).size!==products.length||new Set(profiles.map(item=>`${item.id}:${item.version}`)).size!==profiles.length)throw Error('Prodotti o versioni duplicate nel contesto del cambio.');
 const productMap=new Map(current?.shopProducts?.map(item=>[item.id,structuredClone(item)])),profileMap=new Map(current?.shopProfiles?.map(item=>[`${item.id}:${item.version}`,ProductionProfileSchema.parse(item)]));
 for(const product of products){const old=productMap.get(product.id);if(old&&old.source!==product.source)throw Error('Fonte del prodotto diversa dal contesto corrente.');productMap.set(product.id,product);}
 for(const profile of profiles){const key=`${profile.id}:${profile.version}`,old=profileMap.get(key);if(old&&JSON.stringify(old)!==JSON.stringify(profile))throw Error('Il profilo è cambiato senza una nuova versione: rileggi le scelte.');profileMap.set(key,profile);}
 return{version:current?.version??incoming.version,products:structuredClone(current?.products??incoming.products),shopProducts:[...productMap.values()],shopProfiles:[...profileMap.values()]};
}
