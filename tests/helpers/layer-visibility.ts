import {createTestDocument} from './editor-fonts';
import {DocumentSchema,type GraphicDocument} from '../../src/editor/model';
export function layerVisibilityFixture():GraphicDocument {
 const document=createTestDocument();document.documentId='88888888-2222-4222-a222-222222222222';document.areaMm={width:100,height:60};document.colorMode='color';
 document.objects=[
  {id:'back',type:'rect',xMm:5,yMm:5,widthMm:40,heightMm:30,stroke:'none',strokeMm:.25,fill:'#0088cc'},
  {id:'front',type:'rect',xMm:15,yMm:12,widthMm:10,heightMm:10,stroke:'none',strokeMm:.25,fill:'#ff0000'},
  {id:'caption',type:'text',xMm:50,yMm:10,text:'TEST · Città',fontFamily:document.fontAssets![0]!.id,fontSizePt:12,fill:'#000000'},
  {id:'outside',type:'circle',xMm:72,yMm:32,radiusMm:4,stroke:'none',strokeMm:.25,fill:'#00aa00'},
 ];document.groups=[{id:'root',objectIds:['back','front','caption']},{id:'inner',parentId:'root',objectIds:['front','caption']}];return DocumentSchema.parse(document);
}
