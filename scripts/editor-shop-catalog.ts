import { fetchEditorShopVariants } from './editor-shop-variants';
import type { ShopProductDetail } from '../src/editor-admin/shop-catalog';
import { z } from 'zod';
import { readFile,mkdir,writeFile,rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ShopBrowserCatalogSchema,type ShopBrowserCatalog,type ShopBrowserStatus } from '../src/editor-admin/shop-catalog';

// Read-only Admin 2026-10 operations; no prices, customer data or mutations.
export const EDITOR_SHOP_PRODUCTS_QUERY=`query EditorShopProducts($after: String) {
 products(first: 50, after: $after) {
  nodes { id title handle status tags onlineStoreUrl
   featuredMedia { preview { image { url altText } } }
   collections(first: 10) { nodes { id } pageInfo { hasNextPage endCursor } }
  }
  pageInfo { hasNextPage endCursor }
 }
}`;
export const EDITOR_SHOP_COLLECTIONS_QUERY=`query EditorShopCollections($after: String) {
 collections(first: 100, after: $after) { nodes { id title handle } pageInfo { hasNextPage endCursor } }
}`;
export const EDITOR_PRODUCT_COLLECTIONS_QUERY=`query EditorProductCollections($id: ID!, $after: String) {
 product(id: $id) { collections(first: 100, after: $after) { nodes { id } pageInfo { hasNextPage endCursor } } }
}`;
const pageInfo=z.object({hasNextPage:z.boolean(),endCursor:z.string().nullable()}),ids=z.object({nodes:z.array(z.object({id:z.string().regex(/^gid:\/\/shopify\/Collection\/\d+$/)})),pageInfo});
const rawProduct=ShopBrowserCatalogSchema.shape.products.element.omit({collectionIds:true,image:true}).extend({collections:ids,featuredMedia:z.object({preview:z.object({image:z.object({url:z.string(),altText:z.string().nullable()}).nullable()}).nullable()}).nullable()});
export interface ShopReadConfig {domain:string;token:string;}
export async function fetchEditorShopCatalog(config:ShopReadConfig,fetcher:typeof fetch=fetch):Promise<ShopBrowserCatalog>{
 if(config.domain!=='zqu2eg-72.myshopify.com'||!config.token)throw new Error('Accesso Shopify in sola lettura non configurato in questa installazione.');
 const signal=AbortSignal.timeout(120000);
 async function request(query:string,variables:Record<string,unknown>):Promise<unknown>{
  for(let attempt=0;attempt<3;attempt++){
   const response=await fetcher(`https://${config.domain}/admin/api/2026-10/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':config.token},body:JSON.stringify({query,variables}),signal,redirect:'manual'});
   if(!response.ok)throw new Error('Lettura del catalogo Shopify non riuscita. Verifica accesso read_products e connessione.');
   const text=await response.text();if(text.length>4000000)throw new Error('Una pagina del catalogo supera il limite locale.');
   const result=z.object({data:z.unknown().optional(),errors:z.array(z.object({extensions:z.object({code:z.string().optional()}).optional()})).optional()}).parse(JSON.parse(text));
   if(result.errors?.length){if(result.errors.every(error=>error.extensions?.code==='THROTTLED')&&attempt<2){await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));continue;}throw new Error('Shopify non ha completato la lettura. Il catalogo precedente è conservato.');}
   if(!result.data)throw new Error('Risposta catalogo Shopify incompleta.');return result.data;
  }throw new Error('Limite temporaneo di lettura Shopify: riprova tra poco.');
 }
 function next(info:z.infer<typeof pageInfo>,seen:Set<string>):string|null{if(!info.hasNextPage)return null;if(!info.endCursor||seen.has(info.endCursor))throw new Error('Paginazione Shopify incoerente: nessun catalogo parziale salvato.');seen.add(info.endCursor);return info.endCursor;}
 const collections:ShopBrowserCatalog['collections']=[],products:ShopBrowserCatalog['products']=[];let after:string|null=null;const seenCollections=new Set<string>(),seenProducts=new Set<string>();
 for(let page=0;;page++){if(page>=50)throw new Error('Catalogo oltre il limite locale di 5000 collezioni.');const result=z.object({collections:z.object({nodes:ShopBrowserCatalogSchema.shape.collections,pageInfo})}).parse(await request(EDITOR_SHOP_COLLECTIONS_QUERY,{after}));collections.push(...result.collections.nodes);after=next(result.collections.pageInfo,seenCollections);if(!after)break;}
 after=null;
 for(let page=0;;page++){
  if(page>=100)throw new Error('Catalogo oltre il limite locale di 5000 prodotti.');const result=z.object({products:z.object({nodes:z.array(rawProduct),pageInfo})}).parse(await request(EDITOR_SHOP_PRODUCTS_QUERY,{after}));
  for(const source of result.products.nodes){const collectionIds=source.collections.nodes.map(item=>item.id),seen=new Set<string>();let membershipAfter=next(source.collections.pageInfo,seen);
   for(let page=0;membershipAfter;page++){if(page>=50)throw new Error('Troppe associazioni alle collezioni per un prodotto.');const more=z.object({product:z.object({collections:ids}).nullable()}).parse(await request(EDITOR_PRODUCT_COLLECTIONS_QUERY,{id:source.id,after:membershipAfter}));if(!more.product)throw new Error('Un prodotto è cambiato durante la lettura: aggiorna il catalogo.');collectionIds.push(...more.product.collections.nodes.map(item=>item.id));membershipAfter=next(more.product.collections.pageInfo,seen);}
   const image=source.featuredMedia?.preview?.image;let safeImage:ShopBrowserCatalog['products'][number]['image']=null;try{const url=new URL(image?.url??'');if(url.protocol==='https:'&&url.hostname==='cdn.shopify.com')safeImage={url:url.href,alt:image?.altText??source.title};}catch{/* No usable image: retain the product. */}
   const {collections:_collections,featuredMedia:_media,...product}=source;products.push({...product,collectionIds:[...new Set(collectionIds)],image:safeImage});
  }
  after=next(result.products.pageInfo,seenProducts);if(!after)break;
 }
 if(new Set(products.map(item=>item.id)).size!==products.length||new Set(collections.map(item=>item.id)).size!==collections.length)throw new Error('Il catalogo è cambiato durante la paginazione: ripeti la lettura.');
 return ShopBrowserCatalogSchema.parse({schemaVersion:1,source:'shopify',shopDomain:config.domain,checkedAt:new Date().toISOString(),products,collections});
}
export class EditorShopCatalog {
 private cached:ShopBrowserCatalog|null=null;private loaded=false;private pending:Promise<ShopBrowserStatus>|null=null;private error:string|null=null;
 constructor(private config:ShopReadConfig,private path:string,private fetcher:typeof fetch=fetch){}
 private details=new Map<string,ShopProductDetail>();private detailPending=new Map<string,Promise<ShopProductDetail>>();
 async product(id:string,force=false):Promise<ShopProductDetail>{
  if(!this.configured)throw new Error('Accesso Shopify in sola lettura non configurato.');
  const cached=this.details.get(id);if(!force&&cached&&Date.now()-Date.parse(cached.checkedAt)<600000)return structuredClone(cached);
  if(this.detailPending.has(id))return structuredClone(await this.detailPending.get(id)!);
  const work=fetchEditorShopVariants(this.config,id,this.fetcher).then(detail=>{if(this.details.size>=200)this.details.delete(this.details.keys().next().value!);this.details.set(id,detail);return detail;}).finally(()=>this.detailPending.delete(id));this.detailPending.set(id,work);return structuredClone(await work);
 }
 get configured(){return this.config.domain==='zqu2eg-72.myshopify.com'&&!!this.config.token;}
 private status():ShopBrowserStatus{return{configured:this.configured,catalog:this.cached,lastError:this.error};}
 async read(force=false):Promise<ShopBrowserStatus>{
  if(!this.loaded){try{const stored=ShopBrowserCatalogSchema.parse(JSON.parse(await readFile(this.path,'utf8')));if(stored.source==='shopify')this.cached=stored;}catch{/* A bad/missing cache is never substituted with fixture products. */}this.loaded=true;}
  if(!this.configured){this.error='Credenziali Shopify in sola lettura non configurate.';return this.status();}
  if(!force&&this.cached&&Date.now()-Date.parse(this.cached.checkedAt)<10*60*1000)return this.status();if(this.pending)return !force&&this.cached?this.status():this.pending;
  this.pending=(async()=>{try{const catalog=await fetchEditorShopCatalog(this.config,this.fetcher),content=JSON.stringify(catalog);if(Buffer.byteLength(content)>20*1024*1024)throw new Error('Catalogo oltre il limite locale di 20 MB.');await mkdir(dirname(this.path),{recursive:true});const temporary=`${this.path}.${randomUUID()}.tmp`;await writeFile(temporary,content,{mode:0o600});await rename(temporary,this.path);this.cached=catalog;this.error=null;}catch{this.error='Non è stato possibile aggiornare il catalogo Shopify. Verifica connessione e accesso read_products; l’eventuale copia precedente è conservata.';}return this.status();})().finally(()=>{this.pending=null;});return !force&&this.cached?this.status():this.pending;
 }
}
