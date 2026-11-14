import {variantAreasFixture} from './variant-areas';
import {ProductionProfileSchema} from '../../src/editor/production-profile';
export function sharedProfilesFixture(){
 const f=variantAreasFixture(),second={...structuredClone(f.detail),id:'gid://shopify/Product/2',title:'Altro supporto TEST',variants:f.detail.variants.map((item,index)=>({...item,id:`gid://shopify/ProductVariant/${21+index}`}))};
 const binding={...f.profile.shopBinding!,productId:second.id,productTitle:second.title,variantId:second.variants[0]!.id,variantIds:second.variants.map(item=>item.id),variantTitles:second.variants.map(item=>item.title)};
 const profile=ProductionProfileSchema.parse({...f.profile,shopBinding:null,shopBindings:[f.profile.shopBinding,binding],variantAreas:[...f.profile.variantAreas!,...second.variants.map((item,index)=>({variantId:item.id,sizeMode:index===0?'fixed':'document',usableArea:{widthMm:300,heightMm:150,shape:'rectangle'}}))]});
 return {...f,second,profile,state:{...f.state,productionProfiles:[profile]}};
}
