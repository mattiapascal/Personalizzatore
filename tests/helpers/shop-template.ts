import {variantAreasFixture} from './variant-areas';
import {createTestDocument} from './editor-fonts';
import {ArchiveRecordSchema} from '../../src/editor-admin/schema';
export function shopTemplateFixture(){
 const f=variantAreasFixture(),document=createTestDocument();document.productId=document.variantId=document.catalogVersion=document.catalogProductProfileVersion=null;document.colorMode='color';document.areaMm={width:100,height:60};const text=document.objects.find(object=>object.type==='text');if(!text)throw Error('Testo TEST assente');document.objects=[{id:'template-box',type:'rect',xMm:10,yMm:10,widthMm:80,heightMm:40,fill:'#0088cc',stroke:'none',strokeMm:.1},{...text,id:'template-text',xMm:30,yMm:20,fontSizePt:20,text:'TEST',fontWeight:'normal',fontStyle:'normal',textBox:{widthMm:30,heightMm:8,autoWidth:true,autoHeight:true},editor:{label:'Nome',includeInForm:true,order:1}}];document.groups=[{id:'template-group',objectIds:document.objects.map(object=>object.id)}];
 const record=ArchiveRecordSchema.parse({id:'63636363-6363-4636-8636-636363636363',kind:'template',title:'Template prodotto TEST',version:1,archived:false,createdAt:'2026-11-14T12:00:00.000Z',updatedAt:'2026-11-14T12:00:00.000Z',tags:['TEST','Azienda'],clientRef:'',document,shopProducts:[{...f.profile.shopBinding!,allVariants:true}]});
 return{...f,record,state:{...f.state,records:[record]}};
}
