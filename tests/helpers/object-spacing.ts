import {selectionViewFixture} from './selection-view';
import {DocumentSchema} from '../../src/editor/model';
export function objectSpacingFixture(){
 const doc=selectionViewFixture({grouped:true});doc.documentId='21212121-2121-4121-8121-212121212121';doc.areaMm={width:120,height:80};
 Object.assign(doc.objects[0]!,{xMm:12,yMm:12,widthMm:16,heightMm:10});Object.assign(doc.objects[1]!,{xMm:18,yMm:25,widthMm:6,heightMm:4});Object.assign(doc.objects[2]!,{xMm:75,yMm:40,text:'TEST · Città'});Object.assign(doc.objects[3]!,{id:'photo',xMm:45,yMm:50});doc.groups=[{id:'spacing-group',objectIds:['main','small']}];
 return DocumentSchema.parse(doc);
}
