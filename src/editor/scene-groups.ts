import type {GraphicDocument,SceneGroup} from './model';
type GroupDocument=Pick<GraphicDocument,'groups'>;
export const cloneSceneGroup=(group:SceneGroup):SceneGroup=>structuredClone(group);
export function rootGroupFor(document:GroupDocument,objectId:string):SceneGroup|undefined{return document.groups?.find(group=>!group.parentId&&group.objectIds.includes(objectId));}
export function groupAncestors(document:GroupDocument,group:SceneGroup):SceneGroup[]{
 const result:SceneGroup[]=[];let current=group;const seen=new Set([group.id]);
 while(current.parentId){const parent=document.groups?.find(item=>item.id===current.parentId);if(!parent||seen.has(parent.id))throw new Error('Gerarchia dei gruppi non valida');seen.add(parent.id);result.push(parent);current=parent;}
 return result;
}
export function remapSceneGroups(groups:readonly SceneGroup[],objectIds:ReadonlyMap<string,string>,groupIds:ReadonlyMap<string,string>):SceneGroup[]{
 return groups.map(group=>{const id=groupIds.get(group.id),parentId=group.parentId?groupIds.get(group.parentId):undefined;if(!id||group.parentId&&!parentId)throw new Error('Associazione della gerarchia dei gruppi incompleta');return{...cloneSceneGroup(group),id,...(parentId?{parentId}:{}),objectIds:group.objectIds.map(old=>{const next=objectIds.get(old);if(!next)throw new Error('Gruppo incompleto nella copia');return next;})};});
}
