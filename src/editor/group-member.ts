import type { GraphicDocument,SceneObject } from './model';
import { groupAncestors } from './scene-groups';
import {effectiveObjectProperties,effectiveGroupProperties,type EditorRole} from './object-properties';

const tools=new Set(['inclineObjects','reflectObjects','moveObject','transformObject','updateObject','setText','setObjectStyle','setTextPath','replaceImageSource','setObjectProperties','alignObject','reorderObject','duplicateObject','deleteObject']);
export function objectScopeTool(tool:string):boolean{return tools.has(tool);}
/** Selection is transient; the scope becomes explicit in the validated command. */
export function withObjectTargetScope(raw:unknown,id:string|null):unknown{
 if(!id||!raw||typeof raw!=='object')return raw;
 const command=raw as {objectId?:unknown;tool?:unknown;targetScope?:unknown};
 return command.targetScope===undefined&&command.objectId===id&&typeof command.tool==='string'&&objectScopeTool(command.tool)?{...raw,targetScope:'object'}:raw;
}
export function innermostGroup(document:GraphicDocument,id:string){return document.groups?.filter(group=>group.objectIds.includes(id)).sort((a,b)=>groupAncestors(document,b).length-groupAncestors(document,a).length)[0];}
function localUnits(document:GraphicDocument,id:string):SceneObject[][]{
 const group=innermostGroup(document,id);if(!group)return[];
 const children=document.groups?.filter(child=>child.parentId===group.id)??[],remaining=new Set(group.objectIds),units:SceneObject[][]=[];
 for(const object of document.objects){if(!remaining.has(object.id))continue;const members=children.find(child=>child.objectIds.includes(object.id))?.objectIds??[object.id],unit=document.objects.filter(item=>members.includes(item.id));unit.forEach(item=>remaining.delete(item.id));units.push(unit);}
 return units;
}
export function canReorderGroupMember(document:GraphicDocument,id:string,direction:'front'|'back'|'forward'|'backward'):boolean{
 const units=localUnits(document,id),at=units.findIndex(unit=>unit.some(object=>object.id===id));return at>=0&&(['front','forward'].includes(direction)?at<units.length-1:at>0);
}
export function reorderGroupMember(document:GraphicDocument,id:string,direction:'front'|'back'|'forward'|'backward'):void{
 const units=localUnits(document,id),at=units.findIndex(unit=>unit.some(object=>object.id===id));if(at<0)throw Error('Elemento del gruppo non trovato');
 const members=new Set(units.flat().map(object=>object.id)),start=document.objects.findIndex(object=>members.has(object.id)),target=direction==='front'?units.length-1:direction==='back'?0:direction==='forward'?Math.min(units.length-1,at+1):Math.max(0,at-1),[unit]=units.splice(at,1);units.splice(target,0,unit!);document.objects.splice(start,members.size,...units.flat());
}
export function deleteGroupMember(document:GraphicDocument,id:string):void{
 document.groups=document.groups?.map(group=>({...group,objectIds:group.objectIds.filter(member=>member!==id)})).filter(group=>group.objectIds.length);
 if(!document.groups?.length)delete document.groups;
}
export function duplicateGroupMember(document:GraphicDocument,id:string,copy:SceneObject):void{
 const at=document.objects.findIndex(object=>object.id===id);document.objects.splice(at+1,0,copy);
 for(const group of document.groups??[]){const index=group.objectIds.indexOf(id);if(index>=0)group.objectIds.splice(index+1,0,copy.id);}
}
export interface GroupMemberPlacement{parentGroupId:string|null;targetObjectId?:string;side:'above'|'below';}
/** Move one leaf between containers. All geometry and remaining hierarchy stay
 * intact; the final document validator also checks contiguous group ranges. */
export function placeGroupMember(document:GraphicDocument,id:string,args:GroupMemberPlacement,role:EditorRole):void{
 const object=document.objects.find(object=>object.id===id);if(!object)throw Error('Oggetto da spostare non trovato');
 const parent=args.parentGroupId?document.groups?.find(group=>group.id===args.parentGroupId):undefined;
 if(args.parentGroupId&&!parent)throw Error('Gruppo di destinazione non trovato');
 const owners=document.groups?.filter(group=>group.objectIds.includes(id))??[],destination=parent?[parent,...groupAncestors(document,parent)]:[],protectedKeys=['selectionLocked','transformLocked','deleteLocked','hideMenus','reference','includeInForm'] as const;
 const oldProperties=effectiveObjectProperties(document,id);
 const sameContainer=(innermostGroup(document,id)?.id??null)===args.parentGroupId;
 if(role==='customer'&&(oldProperties.selectionLocked||!sameContainer&&(protectedKeys.some(key=>oldProperties[key])||[...owners,...destination].some(group=>protectedKeys.some(key=>effectiveGroupProperties(document,group)[key])))))throw Error('Spostamento fra gruppi bloccato dalle proprietà del template');
 const remaining=document.objects.filter(item=>item.id!==id),siblings=document.groups?.filter(group=>group.parentId===(parent?.id??undefined))??[],allowed=new Set(parent?.objectIds??document.objects.map(item=>item.id));
 if(args.targetObjectId===id||args.targetObjectId&&!allowed.has(args.targetObjectId))throw Error('Destinazione esterna al contenitore scelto');
 let at:number;
 if(args.targetObjectId){
  const unit=siblings.find(group=>group.objectIds.includes(args.targetObjectId!))?.objectIds??[args.targetObjectId],indices=remaining.map((item,index)=>unit.includes(item.id)?index:-1).filter(index=>index>=0);
  if(!indices.length)throw Error('Livello di destinazione non trovato');at=args.side==='above'?Math.max(...indices)+1:Math.min(...indices);
 }else{
  const indices=remaining.map((item,index)=>allowed.has(item.id)?index:-1).filter(index=>index>=0);
  at=parent?indices.length?(args.side==='above'?Math.max(...indices)+1:Math.min(...indices)):document.objects.indexOf(object):args.side==='above'?remaining.length:0;
 }
 remaining.splice(at,0,object);document.objects=remaining;
 const included=new Set(destination.map(group=>group.id));
 document.groups=document.groups?.map(group=>({...group,objectIds:included.has(group.id)?group.objectIds.includes(id)?[...group.objectIds]:[...group.objectIds,id]:group.objectIds.filter(member=>member!==id)})).filter(group=>group.objectIds.length);
 if(!document.groups?.length)delete document.groups;
 // Extracting an admin reference must not silently make it printable/unlocked.
 const nextProperties=effectiveObjectProperties(document,id);
 for(const key of protectedKeys)if(oldProperties[key]&&!nextProperties[key])object.editor={...object.editor,[key]:true};
}
