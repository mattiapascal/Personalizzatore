import {createTestDocument} from './editor-fonts';
import {DocumentSchema} from '../../src/editor/model';
export function strokeCapsFixture(){const doc=createTestDocument();doc.documentId='25252525-2525-4525-8525-252525252525';doc.colorMode='color';doc.productId=null;doc.variantId=null;doc.catalogVersion=null;doc.catalogProductProfileVersion=null;doc.areaMm={width:100,height:70};doc.objects=[
 {id:'flat',type:'line',xMm:12,yMm:10,lengthMm:26,stroke:'#0088cc',strokeMm:3,rotationDeg:0,strokeLineCap:'butt'},
 {id:'round',type:'line',xMm:10.5,yMm:25,lengthMm:26,stroke:'#0088cc',strokeMm:3,rotationDeg:0},
 {id:'square',type:'line',xMm:10.5,yMm:40,lengthMm:26,stroke:'#0088cc',strokeMm:3,rotationDeg:0,strokeLineCap:'square'},
 {id:'affine',type:'line',xMm:60,yMm:10,lengthMm:20,stroke:'#ff5500',strokeMm:2,rotationDeg:35,skewXDeg:12,mirrorX:true,strokeLineCap:'butt'},
 {id:'svg-open',type:'vector',xMm:60,yMm:35,widthMm:18,heightMm:12,commands:[['M',0,1],['L',.4,0],['L',1,.7]],fillRule:'nonzero',fill:'none',stroke:'#000000',strokeMm:2,strokeLineCap:'square',strokeLineJoin:'round',strokeMiterLimit:4},
 {id:'caption',type:'text',xMm:18,yMm:57,text:'TEST · Estremità delle linee',fontFamily:doc.fontAssets![0]!.id,fontSizePt:10,fill:'#000000',textAlign:'center',lineHeight:1},
 ];return DocumentSchema.parse(doc);}
