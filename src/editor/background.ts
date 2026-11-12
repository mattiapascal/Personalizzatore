import {cloneSceneObject,type GraphicDocument,type SceneObject,type SceneGroup,type Measure} from './model';
import {cloneSceneGroup} from './scene-groups';
import {selectionBounds,transformSelection} from './selection';

export function backgroundObjectIds(document:GraphicDocument):Set<string>{return new Set(document.backgroundGroupId?document.groups?.find(g=>g.id===document.backgroundGroupId)?.objectIds??[]:document.backgroundImageId?[document.backgroundImageId]:[]);}
export function foregroundObjects(document:GraphicDocument):SceneObject[]{const ids=backgroundObjectIds(document);return document.objects.filter(o=>!ids.has(o.id));}
/** A linked background covers the new sheet; the artwork keeps its page-relative
 * placement. Ordinary documents keep the existing ink-centred fit behaviour. */
export function adaptCompositionObjects(source:GraphicDocument,area:GraphicDocument['areaMm'],measure:Measure,artworkScale:number):SceneObject[]{
 const ids=backgroundObjectIds(source),center={xMm:area.width/2,yMm:area.height/2};
 if(!ids.size)return source.objects.length?transformSelection(source.objects,{scale:artworkScale,rotationDeg:0,center},measure):[];
 const adapt=(objects:SceneObject[],scale:number)=>{if(!objects.length)return[];const box=selectionBounds(objects,measure);return transformSelection(objects,{scale,rotationDeg:0,center:{xMm:center.xMm+(box.xMm+box.widthMm/2-source.areaMm.width/2)*scale,yMm:center.yMm+(box.yMm+box.heightMm/2-source.areaMm.height/2)*scale}},measure);};
 const mapped=new Map([...adapt(source.objects.filter(o=>ids.has(o.id)),Math.max(area.width/source.areaMm.width,area.height/source.areaMm.height)),...adapt(foregroundObjects(source),artworkScale)].map(o=>[o.id,o]));
 return source.objects.map(o=>mapped.get(o.id)!);
}

/** Called on the command's detached candidate. Final schema/policy/layout checks
 * still run in applyGraphicCommand, before the candidate can enter the store. */
export function clearBackground(document:GraphicDocument):void {
  const group=document.backgroundGroupId?document.groups?.find(g=>g.id===document.backgroundGroupId):undefined;
  const image=document.backgroundImageId;
  if(group?.parentId||image&&document.groups?.some(g=>g.objectIds.includes(image)))throw Error('Separa il gruppo dello sfondo prima di sostituirlo');
  const ids=new Set(group?.objectIds??(image?[image]:[]));
  document.objects=document.objects.filter(o=>!ids.has(o.id));
  if(group)document.groups=document.groups?.filter(g=>!g.objectIds.some(id=>ids.has(id)));
  delete document.backgroundImageId;delete document.backgroundGroupId;
}

export function replaceBackgroundObjects(document:GraphicDocument,objectId:string,input:{objects:SceneObject[];groups:SceneGroup[];backgroundGroupId?:string}):void {
  if(!input.objects.length){
    if(input.groups.length||input.backgroundGroupId)throw Error('Lo sfondo vuoto non può contenere gruppi o collegamenti');
    if(objectId!==(document.backgroundGroupId??document.backgroundImageId??'canvas'))throw Error('ID dello sfondo da rimuovere non coerente');
    clearBackground(document);return;
  }
  const group=input.groups.find(g=>g.id===input.backgroundGroupId),members=new Set(group?.objectIds);
  if(!group||group.parentId||group.id!==objectId||members.size!==input.objects.length||input.objects.some(o=>!members.has(o.id)))throw Error('Lo sfondo richiede un gruppo radice con tutti e soli i suoi oggetti');
  const existing=new Set([...document.objects.map(o=>o.id),...document.groups?.map(g=>g.id)??[]]);
  if([...input.objects,...input.groups].some(item=>existing.has(item.id)))throw Error('Lo sfondo nuovo richiede ID distinti dagli elementi esistenti');
  // Other roots would not belong to the linked background, even if their IDs
  // passed the general document group validation.
  if(input.groups.some(g=>g.id!==group.id&&!g.parentId))throw Error('Tutti i gruppi dello sfondo devono appartenere alla sua radice');
  clearBackground(document);
  document.objects.unshift(...input.objects.map(cloneSceneObject));
  document.groups=[...input.groups.map(cloneSceneGroup),...document.groups??[]];
  document.backgroundGroupId=group.id;
}
