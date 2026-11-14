import {z} from 'zod';
import {ShopProductDetailSchema,type ShopProductDetail} from '../editor-admin/shop-catalog';
import {profileShopBinding,type ProductionProfile} from './production-profile';
export const ShopSelectionSchema=z.strictObject({
 source:z.enum(['shopify','test']),productId:ShopProductDetailSchema.shape.id,variantId:ShopProductDetailSchema.shape.variants.element.shape.id,
 productTitle:z.string().min(1).max(1000),variantTitle:z.string().max(1000),checkedAt:z.string().datetime(),
 profileId:z.string().uuid(),profileVersion:z.number().int().positive(),
});
export type ShopSelection=z.infer<typeof ShopSelectionSchema>;
export function profileShopVariants(profile:ProductionProfile,product:ShopProductDetail){
 const binding=profileShopBinding(profile,product.id);if(profile.archived||!binding||binding.source!==product.source)return[];
 // A versioned technical profile uses the variants verified when it was saved.
 // Refreshing “all variants” in administration creates a new explicit version.
 const allowed=profile.kind.startsWith('stamp-')?[binding.variantId]:binding.variantIds??[binding.variantId];
 return product.variants.filter(item=>allowed.includes(item.id));
}
export function shopSelectionFor(profile:ProductionProfile,product:ShopProductDetail,variantId:string):ShopSelection{
 if(product.status!=='ACTIVE')throw Error('Il prodotto non è attivo: non è disponibile per una nuova personalizzazione.');
 const variant=profileShopVariants(profile,product).find(item=>item.id===variantId);if(!variant)throw Error('Variante non consentita dal profilo o non presente nella lettura corrente.');
 return ShopSelectionSchema.parse({source:product.source,productId:product.id,variantId:variant.id,productTitle:product.title,variantTitle:variant.title,checkedAt:product.checkedAt,profileId:profile.id,profileVersion:profile.version});
}
export function assertShopSelection(selection:ShopSelection,profile:ProductionProfile|undefined,legacyProductId:string|null){
 if(legacyProductId)throw Error('La scelta commerciale non si combina con una montatura del catalogo storico.');
 if(!profile||profile.archived||profile.id!==selection.profileId||profile.version!==selection.profileVersion)throw Error('La scelta prodotto richiede la stessa versione del profilo tecnico.');
 const binding=profileShopBinding(profile,selection.productId);if(!binding||binding.source!==selection.source)throw Error('Prodotto diverso dall’associazione del profilo tecnico.');
 if(profile.kind.startsWith('stamp-')?selection.variantId!==binding.variantId:!(binding.variantIds??[binding.variantId]).includes(selection.variantId))throw Error('Variante diversa da quelle ammesse nel profilo tecnico.');
}
