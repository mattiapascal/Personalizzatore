import {CompositionPrivacy} from './privacy';
import {cloneGraphicDocument,cloneSceneObject,DocumentStore,objectCenter,objectGeometry,placeObjectAtCenter,type GraphicDocument,type GraphicCommand,type SceneObject,type Measure,type GraphicCatalogContext} from '../editor/model';
import {objectIsVisible} from '../editor/scene-visibility';
import {effectiveObjectProperties,type EditorRole} from '../editor/object-properties';
import type {FontAsset} from '../editor/font-assets';
import type {RasterSource} from '../editor/raster-source';
import {DEFAULT_RASTER} from '../editor/raster-processing';
import {minimumFontForDocument} from '../editor/text-production';
import {EDITOR_LIMITS} from '../editor/limits';
import {geometryReportCurrent,pageGeometryRules,type ProductionGeometryReport} from '../editor/production-geometry';
import {GraphicalArgumentsSchema,GraphicalRequestSchema,type GraphicalRequest,type GraphicalArguments} from './contract';
export interface AssistantFont {asset:Pick<FontAsset,'id'|'family'|'label'|'weight'|'italic'>;fileHash?:string;libraryId?:string;revision?:number;}
export interface AssistantCapture {source:GraphicDocument;request:GraphicalRequest;objects:Map<string,string>;fonts:Map<string,AssistantFont>;images:Map<string,RasterSource>;restore:(text:string)=>string;}
export function captureAssistant(source:GraphicDocument,message:string,selected:readonly string[],fonts:AssistantFont[],images:RasterSource[],measure:Measure,catalog?:GraphicCatalogContext,sessionId=crypto.randomUUID()):AssistantCapture{
 if(message.length>2000||!message.trim())throw Error('Scrivi da 1 a 2000 caratteri.');if(source.objects.filter(object=>objectIsVisible(source,object)).length>200)throw Error('Questa bozza contiene più di 200 oggetti: per ora usa l’editor manuale.');
 if(!fonts.length)throw Error('Scegli almeno un font della libreria prima della richiesta.');
 const vault=new CompositionPrivacy(fonts.map(font=>font.asset.label??font.asset.family)),protect=(value:string)=>vault.protect(value,true);
 const objects=new Map<string,string>(),fontMap=new Map(fonts.map((font,index)=>[`f${index+1}`,font])),imageMap=new Map(images.map((image,index)=>[`i${index+1}`,image])),fontHandle=(id:string)=>[...fontMap].find(([,font])=>font.asset.id===id)?.[0]??null;
 const summaries=source.objects.map((object,index)=>{if(!objectIsVisible(source,object))return null;const id=`o${index+1}`,box=objectGeometry(object,measure),center=objectCenter(object,measure),props=effectiveObjectProperties(source,object.id);objects.set(id,object.id);return{id,type:object.type==='text'?'text' as const:object.type==='image'?'image' as const:'other' as const,label:vault.protect(props.label??object.type),selected:selected.includes(object.id),protected:props.selectionLocked||props.hideMenus||props.reference||false,textEditable:object.type==='text'&&!props.reference&&(!props.selectionLocked||!!props.includeInForm),movable:!props.selectionLocked&&!props.hideMenus&&!props.reference&&!props.transformLocked,xMm:center.xMm,yMm:center.yMm,widthMm:box.widthMm,heightMm:box.heightMm,textToken:object.type==='text'&&object.text?protect(object.text):null,characters:object.type==='text'?Array.from(object.text).length:0,lines:object.type==='text'?object.text.split('\n').length:0,fontId:object.type==='text'?fontHandle(object.fontFamily):null,fontSizePt:object.type==='text'?object.fontSizePt:null,fill:object.type==='text'?object.fill:null,alignment:object.type==='text'&&object.textAlign!=='justify-left'?object.textAlign??'center':null};}).filter(item=>item!==null);
 // Quoted content is opaque even when the heuristic would consider it generic.
 const quoted=message.replace(/"([^"\n]+)"|«([^»]+)»|“([^”]+)”/g,(_match,a,b,c)=>`«${protect(a??b??c)}»`),protectedMessage=vault.protect(quoted);
 // Keep the restoration table local; no original scene text or bytes in request.
 const request=GraphicalRequestSchema.parse({schemaVersion:1,sessionId,requestId:crypto.randomUUID(),revision:source.revision,message:protectedMessage,canvas:{widthMm:source.areaMm.width,heightMm:source.areaMm.height,shape:source.shape,monochrome:source.colorMode==='monochrome',minFontSizePt:minimumFontForDocument(source,catalog)??EDITOR_LIMITS.minFontSizePt,safeMarginMm:source.productionProfile?.safeMarginMm??null},exclusions:pageGeometryRules(source).flatMap(rule=>rule.region?[{shape:rule.region.shape==='ellipse'?'ellipse':'rect',xMm:rule.region.xMm,yMm:rule.region.yMm,widthMm:rule.region.widthMm,heightMm:rule.region.heightMm}]:[]),objects:summaries,fonts:[...fontMap].map(([id,font])=>({id,name:font.asset.label??font.asset.family,weight:font.asset.weight??400,italic:font.asset.italic??false})),images:[...imageMap].map(([id,image])=>({id,pixelWidth:image.pixelWidth,pixelHeight:image.pixelHeight}))});
 // protect() can produce individual names/codes in the instruction as well.
 const restore=(text:string)=>vault.restoreContent(text);
 return{source:cloneGraphicDocument(source),request,objects,fonts:fontMap,images:imageMap,restore};
}
export function compileAssistant(capture:AssistantCapture,raw:GraphicalArguments,assets:readonly FontAsset[],measure:Measure,catalog:GraphicCatalogContext|undefined,role:EditorRole):{document:GraphicDocument;commands:GraphicCommand[]}{
 const proposal=GraphicalArgumentsSchema.parse(raw);if(proposal.clarification&&proposal.actions.length)throw Error('La proposta contiene sia una domanda sia modifiche: ripeti la richiesta.');if(!proposal.actions.length)throw Error(proposal.clarification??'Nessuna modifica proposta.');
 const store=new DocumentStore(capture.source,measure,catalog,role),commands:GraphicCommand[]=[],push=(tool:GraphicCommand['tool'],objectId:string,args:unknown,direct=false)=>{const command={schemaVersion:1,tool,objectId,expectedRevision:store.document.revision,...(direct?{targetScope:'object'}:{}),arguments:args} as GraphicCommand;store.dispatch(command,'ai');commands.push(command);};
 const font=(handle:string)=>{const choice=capture.fonts.get(handle);const asset=choice&&assets.find(asset=>asset.id===choice.asset.id);if(!choice||!asset)throw Error('Font non disponibile nella proposta: nessun fallback applicato.');return asset;};
 for(const action of proposal.actions){
  if(action.type==='addText'){
   const asset=font(action.fontId),object:SceneObject={id:`text-${crypto.randomUUID()}`,type:'text',xMm:0,yMm:0,text:capture.restore(action.text),fontSizePt:action.fontSizePt,fontFamily:asset.id,fill:action.fill,textAlign:action.alignment,lineHeight:1,textBox:{widthMm:action.widthMm,heightMm:6,autoWidth:true,autoHeight:true}};Object.assign(object,placeObjectAtCenter(object,{xMm:action.xMm,yMm:action.yMm},measure));push('addObject',object.id,{object,fontAssets:[asset]});
  }else if(action.type==='addImage'){
   const source=capture.images.get(action.imageId);if(!source)throw Error('Immagine non caricata in questa richiesta.');const object:SceneObject={id:`image-${crypto.randomUUID()}`,type:'image',source,raster:{...DEFAULT_RASTER,mode:capture.source.colorMode==='monochrome'?'binary':'original'},xMm:action.xMm-action.widthMm/2,yMm:action.yMm-action.widthMm*source.pixelHeight/source.pixelWidth/2,widthMm:action.widthMm,heightMm:action.widthMm*source.pixelHeight/source.pixelWidth};push('addObject',object.id,{object});
  }else{
   const id=capture.objects.get(action.objectId),object=id&&store.document.objects.find(object=>object.id===id);if(!object)throw Error('Oggetto non presente nella richiesta.');
   const summary=capture.request.objects.find(item=>item.id===action.objectId);if(!summary)throw Error('Oggetto non presente nel contesto visibile.');
   if(action.type==='moveObject'){if(!summary.movable)throw Error('Posizione dell’oggetto protetta.');const placed=placeObjectAtCenter(object,{xMm:action.xMm,yMm:action.yMm},measure);push('moveObject',object.id,{xMm:placed.xMm,yMm:placed.yMm},true);continue;}
   if(object.type!=='text')throw Error('Le proprietà tipografiche richiedono un testo.');if(!summary.textEditable||summary.protected&&[action.fontId,action.fontSizePt,action.fill,action.alignment].some(value=>value!==null))throw Error('Questo campo consente soltanto le modifiche previste dal modulo.');
   if(action.text!==null)push('setText',object.id,{text:capture.restore(action.text)},true);
   const current=cloneSceneObject(store.document.objects.find(object=>object.id===id)!) as Extract<SceneObject,{type:'text'}>,center=objectCenter(current,measure),clear:string[]=[];let asset:FontAsset|undefined;
   if(action.fontId!==null){asset=font(action.fontId);current.fontFamily=asset.id;current.fontWeight='normal';current.fontStyle='normal';clear.push('fontFamily','fontWeight','fontStyle');}
   if(action.fontSizePt!==null){current.fontSizePt=action.fontSizePt;clear.push('fontSizePt');}if(action.fill!==null){current.fill=action.fill;clear.push('fill');}
   if(action.alignment!==null){current.textAlign=action.alignment;delete current.lineStyles;}
   if(clear.length&&current.characterStyles){current.characterStyles=current.characterStyles.map(run=>({...run,style:Object.fromEntries(Object.entries(run.style).filter(([key])=>!clear.includes(key)))})).filter(run=>Object.keys(run.style).length);if(!current.characterStyles.length)delete current.characterStyles;}
   if(clear.length||action.alignment!==null){Object.assign(current,placeObjectAtCenter(current,center,measure));push('updateObject',current.id,{object:current,...(asset?{fontAssets:[asset]}:{})},true);}
  }
 }
 return{document:store.document,commands};
}
export function assistantGeometryWarnings(document:GraphicDocument,report:ProductionGeometryReport):string[]{
 const bad=new Set(['overlap','boundary','incomplete']);if(!geometryReportCurrent(report,document)||report.revision!==document.revision||bad.has(report.status)||report.pages.some(page=>bad.has(page.status)||page.rules.some(rule=>bad.has(rule.status))))throw Error('La bozza non supera il controllo di margini, zone o fissaggi. Modifica la richiesta o usa l’editor manuale.');
 const warnings=[...new Set(report.pages.flatMap(page=>page.rules.filter(rule=>rule.status==='unconfigured').map(rule=>rule.message??`${rule.label}: dato da verificare.`)))];if(report.status==='unconfigured'&&!warnings.length)warnings.push('Profilo produttivo non configurato: bozza da verificare.');if(document.productionProfile?.kind==='engraved-plaque')warnings.push('Finezza dei particolari e distanza fra vernici richiedono verifica del laboratorio.');return warnings;
}
