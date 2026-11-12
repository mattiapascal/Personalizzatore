import {createTestDocument} from './editor-fonts';
import {DEFAULT_PLAQUE_MOUNTING} from '../../src/editor/plaque';
import {joinGraphicPages,selectGraphicPage} from '../../src/editor/pages';
/** Public TEST artwork: a support underneath and a reference in front. */
export function adminReferencePreviewDocument(onlySupport=false){
 const doc=createTestDocument();Object.assign(doc,{productId:null,variantId:null,catalogVersion:null,catalogProductProfileVersion:null,colorMode:'color',areaMm:{width:100,height:60},fontAssets:[]});
 doc.objects=[{id:'support',type:'rect',xMm:0,yMm:0,widthMm:100,heightMm:60,fill:'#cc8800',stroke:'none',strokeMm:.1,editor:{reference:true}}];
 doc.groups=[{id:'support-layer',objectIds:['support'],editor:{reference:true}}];doc.backgroundGroupId='support-layer';
 if(!onlySupport){doc.objects.push({id:'art',type:'rect',xMm:10,yMm:10,widthMm:30,heightMm:20,fill:'#000000',stroke:'none',strokeMm:.1},{id:'front',type:'rect',xMm:30,yMm:15,widthMm:10,heightMm:10,fill:'#ff0000',stroke:'none',strokeMm:.1,editor:{reference:true}});doc.plaque={...DEFAULT_PLAQUE_MOUNTING,method:'holes',pattern:'four-corners',offsetXMm:8,offsetYMm:8,holeDiameterMm:4};}
 return doc;
}
export function adminReferencePreviewBook(){
 const first=adminReferencePreviewDocument(),back=createTestDocument();Object.assign(back,{productId:null,variantId:null,catalogVersion:null,catalogProductProfileVersion:null,colorMode:'color',areaMm:{width:80,height:40},fontAssets:[]});back.objects=[{id:'back',type:'rect',xMm:0,yMm:0,widthMm:80,heightMm:40,fill:'#00cc00',stroke:'none',strokeMm:.1}];
 return selectGraphicPage(joinGraphicPages([first,back],['Supporto TEST','Retro TEST']),'page-2');
}
