import { z } from 'zod';
const productId=z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),collectionId=z.string().regex(/^gid:\/\/shopify\/Collection\/\d+$/);
export const ShopBrowserProductSchema=z.strictObject({id:productId,title:z.string(),handle:z.string(),status:z.enum(['ACTIVE','ARCHIVED','DRAFT','UNLISTED']),tags:z.array(z.string()),collectionIds:z.array(collectionId),onlineStoreUrl:z.url().nullable(),image:z.strictObject({url:z.url(),alt:z.string()}).nullable()});
export const ShopBrowserCatalogSchema=z.strictObject({schemaVersion:z.literal(1),source:z.enum(['shopify','test']),shopDomain:z.literal('zqu2eg-72.myshopify.com'),checkedAt:z.string().datetime(),products:z.array(ShopBrowserProductSchema).max(5000),collections:z.array(z.strictObject({id:collectionId,title:z.string(),handle:z.string()})).max(5000)});
export type ShopBrowserCatalog=z.infer<typeof ShopBrowserCatalogSchema>;
export const ShopBrowserStatusSchema=z.strictObject({configured:z.boolean(),catalog:ShopBrowserCatalogSchema.nullable(),lastError:z.string().nullable()});
export type ShopBrowserStatus=z.infer<typeof ShopBrowserStatusSchema>;
export interface ShopBrowserFilters {query:string;collection:string;tags:string[];tagMode:'all'|'any';status:string;}
const key=(value:string)=>value.normalize('NFC').trim().toLocaleLowerCase('it');
export function shopBrowserProducts(catalog:ShopBrowserCatalog,filters:ShopBrowserFilters):ShopBrowserCatalog['products']{
 const query=key(filters.query),tags=filters.tags.map(key),collator=new Intl.Collator('it',{numeric:true,sensitivity:'base'});
 return catalog.products.filter(product=>{if(filters.status!=='all'&&product.status!==filters.status||filters.collection&&!product.collectionIds.includes(filters.collection)||query&&!key(`${product.title} ${product.handle} ${product.tags.join(' ')}`).includes(query))return false;const found=new Set(product.tags.map(key));return !tags.length||(filters.tagMode==='all'?tags.every(tag=>found.has(tag)):tags.some(tag=>found.has(tag)));}).sort((a,b)=>collator.compare(a.title,b.title)||a.id.localeCompare(b.id));
}
export function shopBrowserTags(catalog:ShopBrowserCatalog):string[]{const tags=new Map<string,string>();for(const product of catalog.products)for(const tag of product.tags)if(!tags.has(key(tag)))tags.set(key(tag),tag);return [...tags.values()].sort((a,b)=>a.localeCompare(b,'it'));}

export const ShopProductDetailSchema=z.strictObject({source:z.enum(['shopify','test']),checkedAt:z.string().datetime(),id:productId,title:z.string(),status:ShopBrowserProductSchema.shape.status,variants:z.array(z.strictObject({id:z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),title:z.string(),sku:z.string().nullable(),selectedOptions:z.array(z.strictObject({name:z.string(),value:z.string()}))})).max(2000)}).refine(value=>new Set(value.variants.map(item=>item.id)).size===value.variants.length,'Varianti duplicate');
export type ShopProductDetail=z.infer<typeof ShopProductDetailSchema>;
export const ShopProfileBindingSchema=z.strictObject({source:z.enum(['shopify','test']),productId,variantId:z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),productTitle:z.string().max(1000),variantTitle:z.string().max(1000),variantIds:z.array(z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/)).min(1).max(2000).optional(),variantTitles:z.array(z.string().max(1000)).min(1).max(2000).optional(),allVariants:z.boolean().optional(),checkedAt:z.string().datetime()});
export type ShopProfileBinding=z.infer<typeof ShopProfileBindingSchema>;
