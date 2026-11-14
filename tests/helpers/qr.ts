import {createTestDocument} from './editor-fonts';
import {DocumentSchema,type SceneObject} from '../../src/editor/model';
import type {QrParameters} from '../../src/editor/qr-code';
export function qrFixture(){
 const doc=createTestDocument();doc.documentId='30303030-3030-4030-8030-303030303030';doc.colorMode='color';doc.productId=doc.variantId=doc.catalogVersion=doc.catalogProductProfileVersion=null;doc.areaMm={width:100,height:70};
 const qr=(id:string,xMm:number,content:string,kind:QrParameters['kind'],ecc:QrParameters['ecc']):SceneObject=>({id,type:'qr',xMm,yMm:10,widthMm:28,heightMm:28,qr:{encoding:'qr-v1',kind,content,ecc},fill:'#000000',stroke:'none',strokeMm:0});
 doc.objects=[{id:'backdrop',type:'rect',xMm:3,yMm:3,widthMm:94,heightMm:42,fill:'#0088cc',stroke:'none',strokeMm:.1},qr('web',9,'https://example.com/TEST?numero=13','url','M'),qr('unicode',60,'TEST · Città Ω 🚀\nNumero 15','text','Q'),{id:'caption',type:'text',xMm:13,yMm:52,text:'TEST · QR locali',fontFamily:doc.fontAssets![0]!.id,fontSizePt:12,fill:'#000000',textAlign:'center'}];return DocumentSchema.parse(doc);
}
