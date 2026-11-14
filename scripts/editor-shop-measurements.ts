import {z} from 'zod';
import {ShopMeasurementsSchema,type ShopMeasurements} from '../src/editor-admin/shop-measurements';
import {ShopProductDetailSchema} from '../src/editor-admin/shop-catalog';
import {GRAPHIC_GEOMETRY_LIMITS} from '../src/editor/limits';
import type {ShopReadConfig} from './editor-shop-catalog';
export const EDITOR_SHOP_MEASUREMENTS_QUERY=`query EditorShopMeasurements($id: ID!, $after: String, $definitions: Boolean!) {
 widthDefinition: metafieldDefinitions(first: 2, ownerType: PRODUCTVARIANT, namespace: "custom", key: "larghezza") @include(if: $definitions) {
  nodes { namespace key description type { name } }
  pageInfo { hasNextPage }
 }
 heightDefinition: metafieldDefinitions(first: 2, ownerType: PRODUCTVARIANT, namespace: "custom", key: "altezza") @include(if: $definitions) {
  nodes { namespace key description type { name } }
  pageInfo { hasNextPage }
 }
 product(id: $id) {
  id title status
  variants(first: 50, after: $after) {
   nodes { id title width: metafield(namespace: "custom", key: "larghezza") { type jsonValue } height: metafield(namespace: "custom", key: "altezza") { type jsonValue } }
   pageInfo { hasNextPage endCursor }
  }
 }
}`;
const definition=z.object({nodes:z.array(z.object({namespace:z.string(),key:z.string(),description:z.string().nullable(),type:z.object({name:z.string()})})).max(2),pageInfo:z.object({hasNextPage:z.boolean()})});
const field=z.object({type:z.string(),jsonValue:z.unknown()}).nullable();
const page=z.object({widthDefinition:definition.optional(),heightDefinition:definition.optional(),product:z.object({id:ShopProductDetailSchema.shape.id,title:z.string(),status:ShopProductDetailSchema.shape.status,variants:z.object({nodes:z.array(z.object({id:ShopProductDetailSchema.shape.variants.element.shape.id,title:z.string(),width:field,height:field})).max(50),pageInfo:z.object({hasNextPage:z.boolean(),endCursor:z.string().nullable()})})}).nullable()});
function definitionStatus(value:z.infer<typeof definition>|undefined,key:string):ShopMeasurements['definitions']['width']{
 if(!value?.nodes.length)return'missing';const item=value.nodes[0]!;
 // A decimal has no intrinsic unit. Only the observed, explicit store contract is accepted.
 return !value.pageInfo.hasNextPage&&value.nodes.length===1&&item.namespace==='custom'&&item.key===key&&item.type.name==='number_decimal'&&item.description?.trim().replace(/\s+/g,' ').toLocaleLowerCase('it')==='valore espresso in millimetri.'?'verified-mm':'changed';
}
function dimension(value:z.infer<typeof field>,definition:ShopMeasurements['definitions']['width']):ShopMeasurements['variants'][number]['width']{
 if(!value)return{mm:null,issue:'missing'};if(definition!=='verified-mm')return{mm:null,issue:'unverified-unit'};if(value.type!=='number_decimal')return{mm:null,issue:'unsupported-type'};
 const raw=value.jsonValue,number=typeof raw==='number'||typeof raw==='string'&&/^\d+(?:\.\d+)?$/.test(raw)?Number(raw):NaN;
 return Number.isFinite(number)&&number>0&&number<=GRAPHIC_GEOMETRY_LIMITS.pageSideMm?{mm:number,issue:null}:{mm:null,issue:'invalid-value'};
}
export async function fetchEditorShopMeasurements(config:ShopReadConfig,id:string,fetcher:typeof fetch=fetch):Promise<ShopMeasurements>{
 if(config.domain!=='zqu2eg-72.myshopify.com'||!config.token)throw Error('Accesso Shopify in sola lettura non configurato.');
 if(!ShopProductDetailSchema.shape.id.safeParse(id).success)throw Error('ID prodotto non valido');
 const signal=AbortSignal.timeout(60000),seen=new Set<string>();let after:string|null=null,result:ShopMeasurements|undefined;
 for(let index=0;;index++){
  if(index>=40)throw Error('Prodotto oltre il limite locale di 2000 varianti.');let raw:unknown;
  for(let attempt=0;attempt<3;attempt++){
   const response=await fetcher(`https://${config.domain}/admin/api/2026-10/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':config.token},body:JSON.stringify({query:EDITOR_SHOP_MEASUREMENTS_QUERY,variables:{id,after,definitions:index===0}}),signal,redirect:'manual'});
   if(!response.ok)throw Error('Lettura delle misure Shopify non riuscita.');const text=await response.text();if(text.length>2000000)throw Error('Pagina misure troppo grande');
   const envelope=z.object({data:z.unknown().optional(),errors:z.array(z.object({extensions:z.object({code:z.string().optional()}).optional()})).optional()}).parse(JSON.parse(text));
   if(envelope.errors?.length){if(envelope.errors.every(error=>error.extensions?.code==='THROTTLED')&&attempt<2){await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));continue;}throw Error('Shopify non ha completato la lettura delle misure.');}raw=envelope.data;break;
  }
  const data=page.parse(raw),product=data.product;if(!product||product.id!==id)throw Error('Prodotto non più presente o risposta differente: aggiorna l’elenco.');
  if(result&&(product.title!==result.title||product.status!==result.status))throw Error('Prodotto cambiato durante la lettura delle misure: riprova.');
  result??={schemaVersion:1,source:'shopify',id,title:product.title,status:product.status,checkedAt:new Date().toISOString(),definitions:{width:definitionStatus(data.widthDefinition,'larghezza'),height:definitionStatus(data.heightDefinition,'altezza')},variants:[]};
  result.variants.push(...product.variants.nodes.map(item=>({id:item.id,title:item.title,width:dimension(item.width,result!.definitions.width),height:dimension(item.height,result!.definitions.height)})));
  const info=product.variants.pageInfo;if(!info.hasNextPage)break;if(!info.endCursor||seen.has(info.endCursor))throw Error('Paginazione misure incoerente: nessun dato parziale utilizzato.');seen.add(info.endCursor);after=info.endCursor;
 }
 result.checkedAt=new Date().toISOString();return ShopMeasurementsSchema.parse(result);
}
