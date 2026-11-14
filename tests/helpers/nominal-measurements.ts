import {sharedProfilesFixture} from './shared-profiles';
import {ShopMeasurementsSchema} from '../../src/editor-admin/shop-measurements';
import {applyNominalAreaImport} from '../../src/editor-admin/nominal-area-import';
import {ProductionProfileSchema,type ProductionProfile} from '../../src/editor/production-profile';
export function profileData(profile:ProductionProfile){const{id:_id,version:_v,archived:_a,createdAt:_c,updatedAt:_u,validatedForProduction:_p,...data}=structuredClone(profile);return data;}
export function nominalMeasurementsFixture(){
 const f=sharedProfilesFixture();f.profile.variantAreas=f.profile.variantAreas!.filter(area=>area.variantId!==f.detail.variants[0]!.id);f.profile.variantAreas.find(area=>area.variantId===f.second.variants[0]!.id)!.usableArea={widthMm:280,heightMm:null,shape:'rectangle'};f.profile.variantAreas.find(area=>area.variantId===f.second.variants[1]!.id)!.sizeMode='fixed';
 const readings=[f.detail,f.second].map((detail,index)=>ShopMeasurementsSchema.parse({schemaVersion:1,source:detail.source,id:detail.id,title:detail.title,status:detail.status,checkedAt:'2026-11-14T12:00:01.000Z',definitions:{width:'verified-mm',height:'verified-mm'},variants:detail.variants.map((item,position)=>({id:item.id,title:item.title,width:{mm:index?300:position?150:200,issue:null},height:{mm:index?150:position?80:100,issue:null}}))}));
 return {...f,readings};
}
export function importedNominalFixture(){const f=nominalMeasurementsFixture(),data=applyNominalAreaImport(profileData(f.profile),[f.detail,f.second],f.readings,[{variantId:f.detail.variants[0]!.id,shape:'rectangle'},{variantId:f.second.variants[0]!.id,shape:'rectangle'}]),profile=ProductionProfileSchema.parse({...f.profile,...data});return{...f,profile,state:{...f.state,productionProfiles:[profile]}};}
