import {shopSelectionFixture} from './shop-selection';
import {ProductionProfileSchema} from '../../src/editor/production-profile';
export function variantAreasFixture(){
 const f=shopSelectionFixture();f.detail.variants[0]!.title='Formato standard TEST';f.detail.variants[1]!.title='Misure personalizzate TEST';f.profile.shopBinding!.variantTitle=f.detail.variants[0]!.title;f.profile.shopBinding!.variantTitles=f.detail.variants.map(item=>item.title);const profile=ProductionProfileSchema.parse({...f.profile,sizeMode:'variant',variantAreas:[{variantId:f.detail.variants[0]!.id,sizeMode:'fixed',usableArea:{widthMm:200,heightMm:100,shape:'rectangle'}},{variantId:f.detail.variants[1]!.id,sizeMode:'document',usableArea:{widthMm:150,heightMm:80,shape:'rectangle'}}]});
 return{...f,profile,state:{...f.state,productionProfiles:[profile]}};
}
