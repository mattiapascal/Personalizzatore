import{createTestDocument}from'./editor-fonts';
import type{SceneObject}from'../../src/editor/model';
export function largeScene(count=1000){
 const doc=createTestDocument();doc.documentId='abababab-abab-4bab-abab-abababababab';doc.fontAssets=[];doc.colorMode='color';doc.areaMm={width:110,height:70};
 doc.objects=Array.from({length:count},(_,i):SceneObject=>({id:`cell-${i}`,type:'rect',xMm:5+(i%50)*2,yMm:5+Math.floor(i/50)*2.5,widthMm:1.5,heightMm:1.5,fill:i%2?'#0088cc':'#cc3300',stroke:'none',strokeMm:.1}));return doc;
}
export function largeSceneSvg(count=1000,padding=0){const d=largeScene(count);return `<svg xmlns="http://www.w3.org/2000/svg" width="110mm" height="70mm" viewBox="0 0 110 70">${padding?`<title>${'TEST '.repeat(Math.ceil(padding/5))}</title>`:''}${d.objects.map(o=>{if(o.type!=='rect')throw Error('Fixture');return `<rect x="${o.xMm}" y="${o.yMm}" width="1.5" height="1.5" fill="${o.fill}"/>`;}).join('')}</svg>`;}
export function largePitchprintSource(count=600){const d=largeScene(count);return{title:'Molti oggetti TEST',unit:'mm',pages:[{pageData:{fWidth:110,fHeight:70},canvas:{clipPath:{left:0,top:0,width:1100,height:700},objects:d.objects.map(o=>{if(o.type!=='rect')throw Error('Fixture');return{type:'rect',left:o.xMm*10,top:o.yMm*10,width:15,height:15,fill:o.fill,stroke:null,strokeWidth:0};})}}]};}
