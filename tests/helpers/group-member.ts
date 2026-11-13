import {createTestDocument} from './editor-fonts';
import {DocumentSchema} from '../../src/editor/model';
export function groupMemberFixture(){
 const doc=createTestDocument(),text=doc.objects.find(object=>object.type==='text')!;
 if(text.type!=='text')throw Error('Testo TEST assente');
 return DocumentSchema.parse({...doc,colorMode:'color',areaMm:{width:160,height:100},objects:[
  {id:'member-a',type:'rect',xMm:12,yMm:15,widthMm:22,heightMm:14,fill:'#000000',stroke:'none',strokeMm:.25},
  {...text,id:'member-text',text:'GRUPPO',xMm:50,yMm:17,fontSizePt:18,fill:'#000000'},
  {id:'member-outline',type:'rect',xMm:15,yMm:50,widthMm:35,heightMm:20,fill:'none',stroke:'#000000',strokeMm:.5},
  {id:'outside-group',type:'circle',xMm:110,yMm:55,radiusMm:9,fill:'#000000',stroke:'none',strokeMm:.25},
 ],groups:[{id:'test-group',objectIds:['member-a','member-text','member-outline'],editor:{label:'Gruppo TEST'}},{id:'test-subgroup',parentId:'test-group',objectIds:['member-a','member-text']}]});
}
