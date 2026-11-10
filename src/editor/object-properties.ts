import {z} from 'zod';
import type {GraphicDocument,SceneObject,GraphicCommand} from './model';
export const TEXT_INPUT_FORMATS={none:'Testo libero',email:'Indirizzo email',phone:'Numero di telefono',digits:'Solo cifre (0–9)','cap-it':'CAP italiano (5 cifre)'} as const;
export const ObjectPropertiesSchema=z.strictObject({
 label:z.string().max(120).optional(),order:z.number().int().min(-10000).max(10000).optional(),
 textInputFormat:z.enum(['none','email','phone','digits','cap-it']).optional(),maxCharacters:z.number().int().min(1).max(4000).optional(),
 transformLocked:z.boolean().optional(),selectionLocked:z.boolean().optional(),deleteLocked:z.boolean().optional(),hideMenus:z.boolean().optional(),includeInForm:z.boolean().optional(),reference:z.boolean().optional(),
});
export type ObjectProperties=z.infer<typeof ObjectPropertiesSchema>;
export type EditorRole='admin'|'customer';
export function textInputProblem(object:SceneObject,complete=false):string|null{
 if(object.type!=='text'||object.editor?.reference)return null;
 const properties=object.editor,text=object.text;
 if(properties?.maxCharacters&&Array.from(text).length>properties.maxCharacters)return `Massimo ${properties.maxCharacters} caratteri per «${properties.label||object.id}».`;
 if(!complete||!text.trim())return null;
 const value=text.trim(),format=properties?.textInputFormat;
 const valid=format==='email'?/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value):format==='phone'?/^[+\d\s()./\-]+$/u.test(value)&&value.replace(/\D/g,'').length>=3:format==='digits'?/^[0-9]+$/.test(value):format==='cap-it'?/^[0-9]{5}$/.test(value):true;
 return valid?null:`Controlla «${properties?.label||object.id}»: formato ${TEXT_INPUT_FORMATS[format??'none'].toLocaleLowerCase('it')} richiesto.`;
}
export function validateObjectInputs(document:GraphicDocument):void{const error=document.objects.map(object=>textInputProblem(object,true)).find(Boolean);if(error)throw new Error(error);}
export function formObjects(document:GraphicDocument):SceneObject[]{return document.objects.filter(object=>object.editor?.includeInForm&&object.editor.label?.trim()&&!object.editor.reference).sort((a,b)=>(a.editor?.order??0)-(b.editor?.order??0));}
/** References remain editable guides in JSON; never enter artwork or customer previews. */
export function productionDocument(document:GraphicDocument):GraphicDocument{
 const objects=document.objects.filter(object=>!object.editor?.reference),ids=new Set(objects.map(object=>object.id));
 const groups=(document.groups??[]).map(group=>({...group,objectIds:group.objectIds.filter(id=>ids.has(id))})).filter(group=>group.objectIds.length>=2);
 return {...document,objects,...(document.groups?{groups}:{})};
}
export function selectableObjectIds(document:GraphicDocument,ids:readonly string[],role:EditorRole):string[]{
 const requested=new Set(ids),blocked=new Set(document.objects.filter(object=>role==='customer'&&object.editor?.selectionLocked).map(object=>object.id));
 for(const group of document.groups??[]){if(group.objectIds.some(id=>requested.has(id)))group.objectIds.forEach(id=>requested.add(id));if(group.objectIds.some(id=>blocked.has(id)))group.objectIds.forEach(id=>blocked.add(id));}
 return document.objects.filter(object=>requested.has(object.id)&&!blocked.has(object.id)).map(object=>object.id);
}
export function assertObjectPolicies(before:GraphicDocument,after:GraphicDocument,command:GraphicCommand,role:EditorRole,sameGeometry:(a:SceneObject,b:SceneObject)=>boolean):void{
 if(role==='admin')return;
 if(command.tool==='setObjectProperties')throw new Error('Le proprietà del template si configurano in modalità amministrativa.');
 const argumentsWithIds=command.arguments as {objectIds?:string[];groupIds?:string[]};
 const targets=new Set([command.objectId,...argumentsWithIds.objectIds??[],...(before.groups??[]).filter(group=>argumentsWithIds.groupIds?.includes(group.id)).flatMap(group=>group.objectIds)]);
 for(const object of before.objects){
  const next=after.objects.find(item=>item.id===object.id),properties=object.editor;
  if(!next){if(properties?.deleteLocked||properties?.selectionLocked)throw new Error(`Eliminazione bloccata: ${properties.label||object.id}.`);continue;}
  if(JSON.stringify(properties??{})!==JSON.stringify(next.editor??{}))throw new Error('Il cliente non può cambiare le proprietà del template.');
  if(properties?.selectionLocked&&targets.has(object.id)&&!(properties.includeInForm&&(command.tool==='setText'||command.tool==='replaceImageSource')))throw new Error(`Selezione bloccata: ${properties.label||object.id}. Usa il modulo, se previsto.`);
  if(properties?.transformLocked&&command.tool!=='replaceImageSource'&&command.tool!=='setText'&&!sameGeometry(object,next))throw new Error(`Trasformazioni bloccate: ${properties.label||object.id}.`);
 }
 for(const object of after.objects){const previous=before.objects.find(item=>item.id===object.id);if(!previous||object.type==='text'&&previous.type==='text'&&object.text!==previous.text){const error=textInputProblem(object);if(error)throw new Error(error);}}
}
