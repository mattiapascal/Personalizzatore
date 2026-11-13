import { createTestDocument } from './editor-fonts';
import { rectangularTextMask,type TextClipMask } from '../../src/editor/text-clip-masks';
import type { TextObject } from '../../src/editor/text-style';
export function textMasksFixture(){
 const doc=createTestDocument();doc.areaMm={width:160,height:110};doc.colorMode='color';const base=doc.objects.find(o=>o.type==='text')! as TextObject;
 const hole:TextClipMask={...rectangularTextMask(70,32),fillRule:'evenodd',commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z'],['M',.4,.3],['L',.6,.3],['L',.6,.7],['L',.4,.7],['Z']]};
 const circle:TextClipMask={frameMm:{x:-36,y:-16,width:72,height:32},fillRule:'nonzero',commands:[['M',1,.5],['C',1,.776142374915,.776142374915,1,.5,1],['C',.223857625085,1,0,.776142374915,0,.5],['C',0,.223857625085,.223857625085,0,.5,0],['C',.776142374915,0,1,.223857625085,1,.5],['Z']]};
 doc.objects=[{...base,id:'masked-auto',text:'TEST · Città',xMm:15,yMm:15,fontSizePt:30,fill:'#0088cc',underline:true,textScaleX:1.2,textSkewXDeg:22,rotationDeg:-12,textClipMasks:[rectangularTextMask(28,18)]},{...base,id:'masked-fixed',text:'MASCHERA\nTesto editabile\nCittà',xMm:50,yMm:60,fontSizePt:22,fill:'#000000',lineHeight:1,textSkewXDeg:-18,rotationDeg:9,textBox:{widthMm:65,heightMm:30,autoWidth:false,autoHeight:true},textClipMasks:[hole,circle]}];return doc;
}
