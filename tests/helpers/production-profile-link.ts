import {createTestDocument} from './editor-fonts';
import {ProductionProfileSchema,defaultProductionProfile,type ProductionProfileData} from '../../src/editor/production-profile';
import {DocumentSchema} from '../../src/editor/model';
export function linkedProfile(kind:ProductionProfileData['kind']='printed-plaque'){
 return ProductionProfileSchema.parse({...defaultProductionProfile(kind),id:'14141414-1414-4414-8414-141414141414',label:'Regole TEST',version:1,archived:false,createdAt:'2026-11-13T00:00:00.000Z',updatedAt:'2026-11-13T00:00:00.000Z',validatedForProduction:false,usableArea:{widthMm:100,heightMm:60,shape:'rectangle'},safeMarginMm:2});
}
export function productionProfileLinkFixture(){
 const doc=createTestDocument();doc.documentId='15151515-1515-4515-8515-151515151515';doc.areaMm={width:100,height:60};doc.colorMode='color';doc.objects=[{id:'title',type:'text',text:'Profilo locale',fontFamily:doc.fontAssets![0]!.id,fontSizePt:12,xMm:8,yMm:7,fill:'#000000'},{id:'box',type:'rect',xMm:8,yMm:25,widthMm:28,heightMm:18,stroke:'#0088cc',strokeMm:.5,fill:'none'}];
 const profile=linkedProfile();profile.sizeMode='document';profile.minFontSizePt=10;profile.reservedAreas=[{id:'16161616-1616-4616-8616-161616161616',label:'Zona TEST',xMm:60,yMm:20,widthMm:20,heightMm:15,shape:'ellipse'}];doc.productionProfile=profile;return DocumentSchema.parse(doc);
}
