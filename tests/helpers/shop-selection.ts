import {productIntegrationFixture} from './product-integration';
import {AdminStateSchema,AdminFontSchema} from '../../src/editor-admin/schema';
import {defaultProductionProfile,ProductionProfileSchema,type ProductionProfileData} from '../../src/editor/production-profile';
import {TEST_DEFAULT_FONT} from './editor-fonts';
export function shopSelectionFixture(kind:ProductionProfileData['kind']='printed-plaque',custom=false){
 const f=productIntegrationFixture(),binding={...f.state.productionProfiles![0]!.shopBinding!,allVariants:true,variantIds:f.detail.variants.map(v=>v.id),variantTitles:f.detail.variants.map(v=>v.title)},profile=ProductionProfileSchema.parse({...f.state.productionProfiles![0],...defaultProductionProfile(kind),label:`Formato ${kind} TEST`,shopBinding:binding,usableArea:{widthMm:100,heightMm:60,shape:'rectangle'},safeMarginMm:2,...(custom?{sizeMode:'document'}:{})});
 const asset=TEST_DEFAULT_FONT,font=AdminFontSchema.parse({id:asset.id.slice(5),title:'Arimo TEST',createdAt:'2026-11-14T12:00:00.000Z',updatedAt:'2026-11-14T12:00:00.000Z',archived:false,family:'Arimo',familyGroup:'Arimo',styleName:'Regular',weight:400,italic:false,format:asset.format,notes:'Font OFL TEST',dataBase64:asset.dataBase64});
 return{...f,profile,font,state:AdminStateSchema.parse({...f.state,records:[],fonts:[font],productionProfiles:[profile]})};
}
