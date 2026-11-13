import{GraphicPageSchema,DocumentSchema,cloneGraphicDocument,cloneSceneObject,validateLayout,MAX_GRAPHIC_PAGES,type GraphicPage,type GraphicDocument,type GraphicCommand,type Measure}from'./model';
import{effectiveObjectProperties,type EditorRole}from'./object-properties';
import{cloneSceneGroup}from'./scene-groups';
const tools=['selectPage','addPage','duplicatePage','removePage','renamePage','reorderPage']as const;
export type PageCommand=Extract<GraphicCommand,{tool:typeof tools[number]}>;
export const isPageCommand=(command:GraphicCommand):command is PageCommand=>(tools as readonly string[]).includes(command.tool);
export const activeGraphicPageId=(document:Pick<GraphicDocument,'pageId'>)=>document.pageId??'page-1';
export function graphicPageIds(document:GraphicDocument):string[]{return document.pageOrder?[...document.pageOrder]:[activeGraphicPageId(document)];}
function sceneKeys():string[]{return Object.keys(GraphicPageSchema.shape).filter(key=>key!=='id'&&key!=='name');}
export function graphicPageScene(document:GraphicDocument):GraphicPage{
 const values=Object.fromEntries(sceneKeys().filter(key=>(document as unknown as Record<string,unknown>)[key]!==undefined).map(key=>[key,(document as unknown as Record<string,unknown>)[key]]));return{...values,id:activeGraphicPageId(document),name:document.pageName??'Pagina 1'}as GraphicPage;
}
function pageScenes(document:GraphicDocument):GraphicPage[]{const pages=[graphicPageScene(document),...document.otherPages??[]];return graphicPageIds(document).map(id=>{const page=pages.find(page=>page.id===id);if(!page)throw Error('Pagina inesistente');return page;});}
/** Read-only single-page projections: every scene exists once in the canonical document.
 * The active scene stays at the legacy root so old single-page files remain unchanged. */
export function graphicPages(document:GraphicDocument):GraphicDocument[]{
 if(!document.otherPages&&!document.pageOrder)return[document];
 const{otherPages:_others,pageOrder:_order,...base}=document,globals={...base}as unknown as Record<string,unknown>;for(const key of sceneKeys())delete globals[key];
 return pageScenes(document).map(page=>{const{id,name,...scene}=page;return{...globals,...scene,pageId:id,pageName:name}as GraphicDocument;});
}
function assembled(document:GraphicDocument,pages:GraphicPage[],active:string,order:string[]):GraphicDocument{
 const selected=pages.find(page=>page.id===active);if(!selected)throw Error('Pagina inesistente');const next={...document}as unknown as Record<string,unknown>;for(const key of sceneKeys())delete next[key];delete next.otherPages;delete next.pageOrder;
 const{id,name,...scene}=selected;Object.assign(next,scene,{pageId:id,pageName:name});const others=order.filter(id=>id!==active).map(id=>{const page=pages.find(page=>page.id===id);if(!page)throw Error('Pagina inesistente');return page;});if(others.length)Object.assign(next,{otherPages:others,pageOrder:[...order]});return next as GraphicDocument;
}
export function selectGraphicPage(document:GraphicDocument,pageId:string):GraphicDocument{if(pageId===activeGraphicPageId(document))return document;return assembled(document,pageScenes(document),pageId,graphicPageIds(document));}
export function blankGraphicPage(document:GraphicDocument,id:string,name:string):GraphicPage{
 const current=graphicPageScene(document);delete current.groups;delete current.backgroundImageId;delete current.backgroundGroupId;delete current.templateOrigin;return GraphicPageSchema.parse({...current,id,name,objects:[]});
}
function clonedPage(page:GraphicPage,id:string,name:string):GraphicPage{const{objects,groups,...rest}=page;return{...structuredClone(rest),id,name,objects:objects.map(cloneSceneObject),...(groups?{groups:groups.map(cloneSceneGroup)}:{})};}
export function applyPageCommand(document:GraphicDocument,command:PageCommand,measure:Measure,role:EditorRole):GraphicDocument{
 const copy=cloneGraphicDocument(document),pages=pageScenes(copy),order=graphicPageIds(copy);let active=activeGraphicPageId(copy);
 const get=(id:string)=>{const page=pages.find(page=>page.id===id);if(!page)throw Error('Pagina inesistente');return page;};
 if(command.tool==='selectPage'){get(command.arguments.pageId);active=command.arguments.pageId;}
 else if(command.tool==='addPage'){
  const page=command.arguments.page;if(pages.some(current=>current.id===page.id))throw Error('ID pagina già presente');if(pages.length>=MAX_GRAPHIC_PAGES)throw Error('Limite delle pagine raggiunto');
  if(role==='customer'&&JSON.stringify(page.productionProfile)!==JSON.stringify(document.productionProfile))throw Error('Il profilo della nuova pagina si configura in modalità amministrativa.');
  const fonts=[...copy.fontAssets??[]];for(const asset of command.arguments.fontAssets??[]){const old=fonts.find(font=>font.id===asset.id);if(old&&(old.dataBase64!==asset.dataBase64||old.format!==asset.format||old.family!==asset.family))throw Error('La risorsa originale del font è immutabile');if(!old)fonts.push({...asset});}if(fonts.length)copy.fontAssets=fonts;
  pages.push(clonedPage(page,page.id,page.name));order.push(page.id);active=page.id;
 }else if(command.tool==='duplicatePage'){
  const original=get(command.arguments.pageId);if(pages.some(page=>page.id===command.arguments.newPageId))throw Error('ID pagina già presente');if(pages.length>=MAX_GRAPHIC_PAGES)throw Error('Limite delle pagine raggiunto');pages.push(clonedPage(original,command.arguments.newPageId,command.arguments.name));order.splice(order.indexOf(original.id)+1,0,command.arguments.newPageId);active=command.arguments.newPageId;
 }else if(command.tool==='removePage'){
  if(pages.length===1)throw Error('Il progetto deve conservare almeno una pagina');const page=get(command.arguments.pageId),projection=graphicPages(copy).find(current=>activeGraphicPageId(current)===page.id)!;
  if(role==='customer'&&page.objects.some(object=>{const properties=effectiveObjectProperties(projection,object.id);return properties.deleteLocked||properties.selectionLocked;}))throw Error('La pagina contiene elementi protetti dall’eliminazione');const index=order.indexOf(page.id);order.splice(index,1);pages.splice(pages.indexOf(page),1);if(active===page.id)active=order[Math.min(index,order.length-1)]!;
 }else if(command.tool==='renamePage'){get(command.arguments.pageId).name=command.arguments.name;}
 else{get(command.arguments.pageId);if(command.arguments.index>=order.length)throw Error('Posizione pagina non valida');order.splice(order.indexOf(command.arguments.pageId),1);order.splice(command.arguments.index,0,command.arguments.pageId);}
 const next=assembled(copy,pages,active,order);next.revision=document.revision+1;next.contentRevision=(document.contentRevision??document.revision)+(command.tool==='selectPage'?0:1);const parsed=DocumentSchema.parse(next);validateLayout(parsed,measure,'edit');return parsed;
}
/** Join fully converted pages atomically; never retain a partially converted book. */
export function joinGraphicPages(documents:readonly GraphicDocument[],names:readonly string[]=[]):GraphicDocument{
 if(!documents.length||documents.length>MAX_GRAPHIC_PAGES)throw Error('Numero di pagine non valido');if(documents.length===1)return cloneGraphicDocument(documents[0]!);
 const fonts:NonNullable<GraphicDocument['fontAssets']>=[];for(const doc of documents){if(graphicPageIds(doc).length!==1)throw Error('Una pagina non può contenere altre pagine');for(const asset of doc.fontAssets??[]){const old=fonts.find(font=>font.id===asset.id);if(old&&(old.dataBase64!==asset.dataBase64||old.format!==asset.format||old.family!==asset.family))throw Error('File font discordanti fra pagine');if(!old)fonts.push({...asset});}}
 const first=cloneGraphicDocument(documents[0]!),pages=documents.map((doc,index)=>clonedPage(graphicPageScene(doc),`page-${index+1}`,names[index]?.trim()||`Pagina ${index+1}`));first.fontAssets=fonts;const joined=assembled(first,pages,pages[0]!.id,pages.map(page=>page.id));joined.contentRevision=first.revision;return DocumentSchema.parse(joined);
}

export function allGraphicObjects(document:Pick<GraphicDocument,'objects'>&Partial<Pick<GraphicDocument,'otherPages'>>){return[...document.objects,...document.otherPages?.flatMap(page=>page.objects)??[]];}
