import {createTestDocument} from './editor-fonts';
import {DocumentSchema} from '../../src/editor/model';
export function textPathPropertiesFixture(type:'ellipse'|'line'='ellipse'){
 const doc=createTestDocument();doc.documentId='26262626-2626-4626-8626-262626262626';doc.colorMode='color';doc.productId=doc.variantId=doc.catalogVersion=doc.catalogProductProfileVersion=null;doc.areaMm={width:100,height:70};
 doc.objects=[{id:'guide',xMm:20,yMm:28,stroke:'#ff0000',strokeMm:1,fill:'none',rotationDeg:15,skewXDeg:12,mirrorX:true,editor:{label:'Percorso TEST',order:2,reference:true},visible:true,...(type==='ellipse'?{type:'ellipse' as const,rxMm:27,ryMm:12}:{type:'line' as const,lengthMm:60,strokeLineCap:'square' as const})},{id:'text',type:'text',xMm:5,yMm:5,text:'TEST · Città',fontFamily:doc.fontAssets![0]!.id,fontSizePt:16,textAlign:'center',fill:'#000000',editor:{label:'Testo TEST',order:1,includeInForm:true}}];
 return DocumentSchema.parse(doc);
}
