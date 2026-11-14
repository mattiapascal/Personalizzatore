import {createTestDocument} from './editor-fonts';
import {DocumentSchema} from '../../src/editor/model';
export function inspectorCommitFixture(){
 const doc=createTestDocument();doc.documentId='50505050-5050-4050-8050-505050505050';doc.colorMode='color';doc.productId=doc.variantId=doc.catalogVersion=doc.catalogProductProfileVersion=null;doc.areaMm={width:120,height:80};
 doc.objects=[{id:'first',type:'rect',xMm:10,yMm:15,widthMm:24,heightMm:20,fill:'#0088cc',stroke:'#000000',strokeMm:.4},{id:'second',type:'rect',xMm:50,yMm:20,widthMm:30,heightMm:20,fill:'#cc3300',stroke:'#000000',strokeMm:.8},{id:'caption',type:'text',xMm:10,yMm:55,text:'TEST · Conferma della selezione',fontFamily:doc.fontAssets![0]!.id,fontSizePt:12,fill:'#000000',textAlign:'center'}];doc.groups=[{id:'pair',objectIds:['first','second']}];return DocumentSchema.parse(doc);
}
