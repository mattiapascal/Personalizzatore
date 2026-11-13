import {productionProfileLinkFixture} from './production-profile-link';
import {DEFAULT_PLAQUE_MOUNTING} from '../../src/editor/plaque';
import {DocumentSchema} from '../../src/editor/model';
export function mountingGeometryFixture(){
 const doc=productionProfileLinkFixture();doc.documentId='73737373-7373-4373-a373-737373737373';doc.productionProfile!.label='Targa e fissaggi TEST';doc.productionProfile!.safeMarginMm=0;doc.productionProfile!.reservedAreas=[];
 doc.plaque={...DEFAULT_PLAQUE_MOUNTING,method:'holes',holeDiameterMm:4,clearanceMm:3};doc.objects=[{id:'safe-text',type:'text',xMm:36,yMm:25,text:'TEST · Città',fontFamily:doc.fontAssets![0]!.id,fontSizePt:12,fill:'#000000'}];return DocumentSchema.parse(doc);
}
