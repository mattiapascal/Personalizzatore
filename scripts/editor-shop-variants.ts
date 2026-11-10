import { z } from 'zod';
import { ShopProductDetailSchema,type ShopProductDetail } from '../src/editor-admin/shop-catalog';
import type { ShopReadConfig } from './editor-shop-catalog';
// Read-only, lazy per-product variants. Never derive physical dimensions from titles/options.
export const EDITOR_SHOP_VARIANTS_QUERY=`query EditorShopVariants($id: ID!, $after: String) {
 product(id: $id) {
  id title status
  variants(first: 50, after: $after) {
   nodes { id title sku selectedOptions { name value } }
   pageInfo { hasNextPage endCursor }
  }
 }
}`;
export async function fetchEditorShopVariants(config:ShopReadConfig,id:string,fetcher:typeof fetch=fetch):Promise<ShopProductDetail>{
 if(config.domain!=='zqu2eg-72.myshopify.com'||!config.token)throw new Error('Accesso Shopify in sola lettura non configurato.');
 if(!/^gid:\/\/shopify\/Product\/\d+$/.test(id))throw new Error('ID prodotto non valido');
 const page=z.object({product:z.object({id:z.string(),title:z.string(),status:ShopProductDetailSchema.shape.status,variants:z.object({nodes:ShopProductDetailSchema.shape.variants,pageInfo:z.object({hasNextPage:z.boolean(),endCursor:z.string().nullable()})})}).nullable()});
 let after:string|null=null,detail:ShopProductDetail|null=null;const seen=new Set<string>(),signal=AbortSignal.timeout(60000);
 for(let index=0;;index++){
  if(index>=40)throw new Error('Prodotto oltre il limite locale di 2000 varianti.');
  let raw:unknown;for(let attempt=0;attempt<3;attempt++){
   const response=await fetcher(`https://${config.domain}/admin/api/2026-10/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':config.token},body:JSON.stringify({query:EDITOR_SHOP_VARIANTS_QUERY,variables:{id,after}}),signal,redirect:'manual'});
   if(!response.ok)throw new Error('Lettura delle varianti Shopify non riuscita.');const text=await response.text();if(text.length>2000000)throw new Error('Pagina varianti troppo grande');
   const result=z.object({data:z.unknown().optional(),errors:z.array(z.object({extensions:z.object({code:z.string().optional()}).optional()})).optional()}).parse(JSON.parse(text));
   if(result.errors?.length){if(result.errors.every(error=>error.extensions?.code==='THROTTLED')&&attempt<2){await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));continue;}throw new Error('Shopify non ha completato la lettura delle varianti.');}raw=result.data;break;
  }
  const {product}=page.parse(raw);if(!product||product.id!==id)throw new Error('Prodotto non più presente: aggiorna l’elenco.');
  if(detail&&(detail.title!==product.title||detail.status!==product.status))throw new Error('Prodotto cambiato durante la lettura: riprova.');
  detail??={source:'shopify',checkedAt:new Date().toISOString(),id,title:product.title,status:product.status,variants:[]};detail.variants.push(...product.variants.nodes);
  const info=product.variants.pageInfo;if(!info.hasNextPage)break;if(!info.endCursor||seen.has(info.endCursor))throw new Error('Paginazione varianti incoerente: nessun dato parziale utilizzato.');seen.add(info.endCursor);after=info.endCursor;
 }
 return ShopProductDetailSchema.parse(detail);
}
