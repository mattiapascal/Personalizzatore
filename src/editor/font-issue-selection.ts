import type{GraphicDocument}from'./model';import type{FontIssue}from'./font-preflight';import{activeGraphicPageId,graphicPages}from'./pages';import{selectableObjectIds,type EditorRole}from'./object-properties';
/** Diagnostic navigation never measures a substituted glyph or alters a scene. */
export function fontIssueSelectionTarget(document:GraphicDocument,issue:FontIssue,role:EditorRole){
 const pageId=issue.pageId??activeGraphicPageId(document),page=graphicPages(document).find(page=>activeGraphicPageId(page)===pageId),object=page?.objects.find(object=>object.id===issue.objectId);
 if(!page||object?.type!=='text')return null;
 return{pageId,object,selectable:selectableObjectIds(page,[object.id],role,true).includes(object.id)};
}
export interface InspectorRequest{documentId:string;pageId:string;objectId:string;sequence:number;focusInvalid?:boolean;}
