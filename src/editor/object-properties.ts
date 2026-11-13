import {objectIsVisible,groupIsVisible,visibleDocument} from './scene-visibility';
import {z} from 'zod';
import type {GraphicDocument,SceneObject,SceneGroup,GraphicCommand} from './model';
import {rootGroupFor,groupAncestors} from './scene-groups';
export const TEXT_INPUT_FORMATS={none:'Testo libero',email:'Indirizzo email',phone:'Numero di telefono',digits:'Solo cifre (0–9)','cap-it':'CAP italiano (5 cifre)'} as const;
export const ObjectPropertiesSchema=z.strictObject({
 label:z.string().max(120).optional(),order:z.number().int().min(-10000).max(10000).optional(),
 textInputFormat:z.enum(['none','email','phone','digits','cap-it']).optional(),maxCharacters:z.number().int().min(1).max(4000).optional(),
 transformLocked:z.boolean().optional(),selectionLocked:z.boolean().optional(),deleteLocked:z.boolean().optional(),hideMenus:z.boolean().optional(),includeInForm:z.boolean().optional(),reference:z.boolean().optional(),
});
export type ObjectProperties=z.infer<typeof ObjectPropertiesSchema>;
export const GroupPropertiesSchema=ObjectPropertiesSchema.omit({textInputFormat:true,maxCharacters:true});
export type GroupProperties=z.infer<typeof GroupPropertiesSchema>;
export type EditorRole='admin'|'customer';
const inherited=['transformLocked','selectionLocked','deleteLocked','hideMenus','reference'] as const;
export function effectiveGroupProperties(document:GraphicDocument,group:SceneGroup):GroupProperties{
 const result={...group.editor};for(const ancestor of groupAncestors(document,group))for(const key of inherited)if(ancestor.editor?.[key])result[key]=true;return result;
}
export function effectiveObjectProperties(document:Pick<GraphicDocument,'objects'|'groups'>,id:string):ObjectProperties{
 const result={...document.objects.find(object=>object.id===id)?.editor};for(const group of document.groups??[])if(group.objectIds.includes(id))for(const key of inherited)if(group.editor?.[key])result[key]=true;return result;
}
export function textInputProblem(object:SceneObject,complete=false):string|null{
 if(object.type!=='text'||object.editor?.reference)return null;
 const properties=object.editor,text=object.text;
 if(properties?.maxCharacters&&Array.from(text).length>properties.maxCharacters)return `Massimo ${properties.maxCharacters} caratteri per «${properties.label||object.id}».`;
 if(!complete||!text.trim())return null;
 const value=text.trim(),format=properties?.textInputFormat;
 const valid=format==='email'?/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value):format==='phone'?/^[+\d\s()./\-]+$/u.test(value)&&value.replace(/\D/g,'').length>=3:format==='digits'?/^[0-9]+$/.test(value):format==='cap-it'?/^[0-9]{5}$/.test(value):true;
 return valid?null:`Controlla «${properties?.label||object.id}»: formato ${TEXT_INPUT_FORMATS[format??'none'].toLocaleLowerCase('it')} richiesto.`;
}
export function validateObjectInputs(document:GraphicDocument):void{const error=document.objects.filter(object=>objectIsVisible(document,object)).map(object=>textInputProblem({...object,editor:effectiveObjectProperties(document,object.id)},true)).find(Boolean);if(error)throw new Error(error);}
export function formObjects(document:GraphicDocument):SceneObject[]{return document.objects.filter(object=>objectIsVisible(document,object)&&object.editor?.includeInForm&&object.editor.label?.trim()&&!effectiveObjectProperties(document,object.id).reference).sort((a,b)=>(a.editor?.order??0)-(b.editor?.order??0));}
export type FormEntry=SceneObject|({type:'group'}&SceneGroup);
export function formEntries(document:GraphicDocument):FormEntry[]{
 const groups=(document.groups??[]).filter(group=>groupIsVisible(document,group)&&group.objectIds.some(id=>document.objects.some(object=>object.id===id&&objectIsVisible(document,object)))&&group.editor?.includeInForm&&group.editor.label?.trim()&&!effectiveGroupProperties(document,group).reference).map(group=>({...group,type:'group' as const}));
 return[...groups,...formObjects(document)].sort((a,b)=>(a.editor?.order??0)-(b.editor?.order??0));
}
/** References remain editable guides in JSON; never enter artwork or customer previews. */
export function productionDocument(document:GraphicDocument):GraphicDocument{
 document=visibleDocument(document);
 if(document.layoutGuides){document={...document};delete document.layoutGuides;}
 const objects=document.objects.filter(object=>!effectiveObjectProperties(document,object.id).reference),ids=new Set(objects.map(object=>object.id));
 const groups=(document.groups??[]).map(group=>({...group,objectIds:group.objectIds.filter(id=>ids.has(id))})).filter(group=>group.objectIds.length>=2||group.objectIds.length===1&&(document.groups?.find(source=>source.id===group.id)?.objectIds.length===1||group.editor||document.groups?.some(child=>child.parentId===group.id)));
 const output={...document,objects,...(document.groups?{groups}:{})};if(output.backgroundImageId&&!ids.has(output.backgroundImageId))delete output.backgroundImageId;if(output.backgroundGroupId&&!groups.some(group=>group.id===output.backgroundGroupId))delete output.backgroundGroupId;return output;
}
export function selectableObjectIds(document:GraphicDocument,ids:readonly string[],role:EditorRole,direct=false):string[]{
 const requested=new Set(ids.filter(id=>{const object=document.objects.find(object=>object.id===id);return object&&objectIsVisible(document,object);})),blocked=new Set(document.objects.filter(object=>role==='customer'&&effectiveObjectProperties(document,object.id).selectionLocked).map(object=>object.id));
 for(const group of document.groups??[]){if(direct||group.parentId)continue;if(group.objectIds.some(id=>requested.has(id)))group.objectIds.forEach(id=>requested.add(id));if(group.objectIds.some(id=>blocked.has(id)))group.objectIds.forEach(id=>blocked.add(id));}
 return document.objects.filter(object=>requested.has(object.id)&&!blocked.has(object.id)).map(object=>object.id);
}
export function assertObjectPolicies(before:GraphicDocument,after:GraphicDocument,command:GraphicCommand,role:EditorRole,sameGeometry:(a:SceneObject,b:SceneObject)=>boolean):void{
 assertVisibilityChanges(before,after,role);
 if(role==='admin')return;
 const direct='targetScope'in command&&command.targetScope==='object';
 if(command.tool==='setObjectProperties'||command.tool==='setGroupProperties')throw new Error('Le proprietà del template si configurano in modalità amministrativa.');
 for(const group of before.groups??[]){
  const next=after.groups?.find(item=>item.id===group.id);
  if(next&&JSON.stringify(next.editor??{})!==JSON.stringify(group.editor??{}))throw new Error('Il cliente non può cambiare le proprietà del gruppo.');
  if(next&&(next.parentId!==group.parentId||command.tool!=='ungroupObjects'&&command.tool!=='placeGroupMember'&&!(direct&&['deleteObject','duplicateObject'].includes(command.tool))&&JSON.stringify(next.objectIds)!==JSON.stringify(group.objectIds)))throw new Error('Il cliente non può cambiare la struttura di un gruppo del template.');
  if(!next&&command.tool!=='placeGroupMember'&&group.editor&&Object.values(group.editor).some(Boolean)&&group.objectIds.some(id=>after.objects.some(object=>object.id===id)))throw new Error('Un gruppo con proprietà del template può essere separato solo in modalità amministrativa.');
 }
 const argumentsWithIds=command.arguments as {objectIds?:string[];groupIds?:string[];copies?:{objectId:string}[];objects?:SceneObject[]};
 const targets=new Set([...(command.tool==='setPaperColor'?[]:[command.objectId]),...argumentsWithIds.objectIds??[],...argumentsWithIds.copies?.map(copy=>copy.objectId)??[],...argumentsWithIds.objects?.map(object=>object.id)??[],...(before.groups??[]).filter(group=>argumentsWithIds.groupIds?.includes(group.id)).flatMap(group=>group.objectIds)]);
 for(const object of before.objects){
  const next=after.objects.find(item=>item.id===object.id),properties=effectiveObjectProperties(before,object.id);
  if(!next){if(properties?.deleteLocked||properties?.selectionLocked)throw new Error(`Eliminazione bloccata: ${properties.label||object.id}.`);continue;}
  if(JSON.stringify(object.editor??{})!==JSON.stringify(next.editor??{}))throw new Error('Il cliente non può cambiare le proprietà del template.');
  if(properties?.selectionLocked&&targets.has(object.id)&&!(properties.includeInForm&&(command.tool==='setText'||command.tool==='replaceImageSource')))throw new Error(`Selezione bloccata: ${properties.label||object.id}. Usa il modulo, se previsto.`);
  if(properties?.transformLocked&&command.tool!=='replaceImageSource'&&command.tool!=='setText'&&!sameGeometry(object,next))throw new Error(`Trasformazioni bloccate: ${properties.label||object.id}.`);
 }
 for(const object of after.objects){const previous=before.objects.find(item=>item.id===object.id);if(!previous||object.type==='text'&&previous.type==='text'&&object.text!==previous.text){const error=textInputProblem(object);if(error)throw new Error(error);}}
}
export function selectedRootGroups(document:GraphicDocument,ids:readonly string[]):SceneGroup[]{return(document.groups??[]).filter(group=>!group.parentId&&group.objectIds.every(id=>ids.includes(id)));}
export function formSelection(document:GraphicDocument,entry:FormEntry):{id:string;label:string;locked:boolean}{
 const root=rootGroupFor(document,entry.type==='group'?entry.objectIds[0]!:entry.id),id=root?.objectIds[0]??(entry.type==='group'?entry.objectIds[0]!:entry.id),label=root?.editor?.label||entry.editor?.label||entry.id;
 return{id,label,locked:!selectableObjectIds(document,[id],'customer').length};
}

export function visibilityProblem(scene: Pick<GraphicDocument,'objects'|'groups'>, kind: 'object' | 'group', id: string, role: EditorRole): string | null {
  const target = kind === 'group' ? scene.groups?.find(group => group.id === id) : scene.objects.find(object => object.id === id);
  if (!target) return 'Livello sconosciuto.';
  if (role === 'admin') return null;
  const ids = kind === 'group' ? (target as SceneGroup).objectIds : [id];
  for (const objectId of ids) {
    const properties = effectiveObjectProperties(scene, objectId);
    if (properties.selectionLocked || properties.deleteLocked) return `Visibilità bloccata dal template: ${properties.label || objectId}.`;
  }
  return null;
}
/** Generic object updates must obey the same rule as the eye command. */
export function assertVisibilityChanges(before: GraphicDocument, after: GraphicDocument, role: EditorRole): void {
  if (role === 'admin') return;
  for (const object of before.objects) {
    const next = after.objects.find(item => item.id === object.id);
    if (next && (next.visible !== false) !== (object.visible !== false)) { const problem = visibilityProblem(before, 'object', object.id, role); if (problem) throw Error(problem); }
  }
  for (const group of before.groups ?? []) {
    const next = after.groups?.find(item => item.id === group.id);
    if (next && (next.visible !== false) !== (group.visible !== false)) { const problem = visibilityProblem(before, 'group', group.id, role); if (problem) throw Error(problem); }
  }
}
