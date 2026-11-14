import {profileShopBindings,type ProductionProfileData} from '../src/editor/production-profile';
import {ShopProductDetailSchema,type ShopProductDetail,type ShopProfileBinding} from '../src/editor-admin/shop-catalog';

/** Read every product before returning a new value. No archive mutation on partial failure. */
export async function verifyProfileShopBindings(data:ProductionProfileData,resolve?: (id:string)=>Promise<ShopProductDetail>):Promise<ProductionProfileData>{
 const bindings=profileShopBindings(data);if(!bindings.length)return data;
 if(!resolve)throw Error('Verifica del catalogo Shopify non disponibile: associazione non salvata.');
 const verified:ShopProfileBinding[]=new Array(bindings.length);let cursor=0;
 await Promise.all(Array.from({length:Math.min(3,bindings.length)},async()=>{
  while(cursor<bindings.length){const index=cursor++,binding=bindings[index]!,product=ShopProductDetailSchema.parse(await resolve(binding.productId));
   const requested=binding.allVariants?product.variants.map(item=>item.id):binding.variantIds??[binding.variantId];
   if(product.id!==binding.productId||product.source!==binding.source||!requested.length||new Set(requested).size!==requested.length||!requested.includes(binding.variantId)||requested.some(id=>!product.variants.some(item=>item.id===id)))throw Error('La variante non appartiene al prodotto Shopify scelto.');
   const variants=product.variants.filter(item=>requested.includes(item.id)),primary=variants.find(item=>item.id===binding.variantId)!;
   verified[index]={source:product.source,productId:product.id,variantId:primary.id,productTitle:product.title,variantTitle:primary.title,...(binding.variantIds||binding.allVariants?{variantIds:variants.map(item=>item.id),variantTitles:variants.map(item=>item.title),allVariants:binding.allVariants??false}:{}),checkedAt:product.checkedAt};
  }
 }));
 const ids=verified.flatMap(binding=>binding.variantIds??[binding.variantId]);
 if(new Set(ids).size!==ids.length)throw Error('Una variante compare in più prodotti del profilo.');
 if(data.variantAreas?.some(item=>!ids.includes(item.variantId)))throw Error('Misure associate a una variante rimossa o non compresa nel prodotto scelto.');
 return data.shopBindings?{...data,shopBindings:verified}:{...data,shopBinding:verified[0]};
}
