import {createTestDocument} from './editor-fonts';
import {fixtureCatalog} from '../../src/catalog/adapter';
import {DocumentSchema} from '../../src/editor/model';
import {linkedProfile} from './production-profile-link';
export function workflowCommitFixture(){
 const product=fixtureCatalog.list().find(p=>p.handle==='trodat-4915')!,doc=createTestDocument(product,fixtureCatalog.version);doc.documentId='99999999-9999-4999-8999-999999999999';
 doc.objects=[{id:'first',type:'rect',xMm:5,yMm:4,widthMm:10,heightMm:7,fill:'none',stroke:'#000000',strokeMm:.3},{id:'second',type:'rect',xMm:25,yMm:4,widthMm:10,heightMm:7,fill:'none',stroke:'#000000',strokeMm:.3},{id:'caption',type:'text',text:'TEST',fontFamily:doc.fontAssets![0]!.id,fontSizePt:10,xMm:5,yMm:15,fill:'#000000',textAlign:'center',editor:{label:'Intestazione TEST',includeInForm:true}}];doc.groups=[{id:'pair',objectIds:['first','second']}];return DocumentSchema.parse(doc);
}
export function workflowProfile(){const profile=linkedProfile('stamp-ink');profile.label='Profilo timbro TEST';profile.sizeMode='document';profile.minFontSizePt=7;return profile;}
