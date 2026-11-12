import{joinGraphicPages}from'./pages';
import {pitchprintTextIsBlank,prunePitchprintRefuse} from './pitchprint-refuse';
import {singleFillPitchprintOpacity} from './pitchprint-opacity';
import {pitchprintTextStroke} from './pitchprint-text-stroke';
import {DEFAULT_JUSTIFICATION} from './justification';
import{clippedPitchprintImageGeometry}from'./pitchprint-image-clip';
import{pngSourceWarnings}from'./png-source';
import{EDITOR_LIMITS}from'./limits';
import{pitchprintPageImages,convertPageImage,nativePageVector,type PageImagePolicy}from'./pitchprint-page-images';
import { emptyPitchprintPrimitive, unstrokedPitchprintPrimitive } from './pitchprint-primitives';
import { pitchprintImageGeometry, pitchprintImageUrl } from './pitchprint-image';
import { pitchprintTextStyles } from './pitchprint-text-styles';
import { assertFontGeometry } from './verified-font-geometry';
import { preciseIntermediateSvg } from './svg-precision';
import {canonicalPaint} from './paint';
import {checkedPitchprintFont,type PitchprintFontResult} from './pitchprint-font-resolution';
import {pitchprintNumber as numeric,pitchprintUnitMm} from './pitchprint-units';
import {pitchprintFontRequest} from './pitchprint-fonts';
import {checkedPitchprintEffects,pitchprintTree,pitchprintTransform,pitchprintPoint,multiplyPitchprintMatrices,type PitchprintMatrix} from './pitchprint-tree';
import {z} from 'zod';import {IText,Textbox,Rect,Circle,Ellipse,Line,Path,Polygon,Polyline,type FabricObject} from 'fabric';
import {createDocument,DocumentSchema,validateLayout,placeObjectAtCenter,type GraphicDocument,type SceneObject,type SceneGroup} from './model';import {loadFontAssets,renderFontFamily} from './fonts';import {FontAssetsSchema,type FontAsset} from './font-assets';import {measureFabric} from './fabric-adapter';import {prepareSvg} from './svg-import';import {rasterSourceFromBytes} from './raster-source';import {prepareRasterSource} from './raster-cache';import {DEFAULT_RASTER} from './raster-processing';import {defaultMountingFor} from './plaque';import type {ObjectProperties} from './object-properties';
const record=z.record(z.string(),z.unknown()),sourceSchema=z.object({title:z.string().max(1000).optional(),unit:z.string(),pages:z.array(z.object({canvas:z.object({objects:z.array(record).max(EDITOR_LIMITS.objects),clipPath:record}).passthrough(),pageData:record}).passthrough()).length(1)}).passthrough();
export interface PitchImportOptions {monochrome:boolean;excludeBackground:boolean;family?:'flat-plaque'|'doorplate'|'boxed-sign';pageImages?:{background:PageImagePolicy;foreground:PageImagePolicy};font:(family:string,weight:number,italic:boolean)=>Promise<PitchprintFontResult>;image:(url:string)=>Promise<Uint8Array>;}
export type PitchprintConversionOptions=Pick<PitchImportOptions,'monochrome'|'excludeBackground'|'family'|'pageImages'>;
export interface PitchImportResult {document:GraphicDocument;title:string;warnings:string[];sourceObjects:number;}
function properties(raw:Record<string,unknown>,warnings:string[]):ObjectProperties{
 const order=Number(raw.index??raw.idx??0);if(!Number.isInteger(order)||Math.abs(order)>10000)throw new Error('Ordine del campo non valido.');
 if(raw.dLocked||raw.eLocked)warnings.push('Blocchi dLocked/eLocked trasferiti in modo conservativo a selezione/eliminazione: ricontrollali.');
 if(raw.list||raw.chain||raw.tags&&JSON.stringify(raw.tags)!=='[]'||raw.hooks&&JSON.stringify(raw.hooks)!=='{}')warnings.push('Liste, catene, tag speciali o hook richiedono revisione; non vengono eseguiti nel nuovo editor.');
 return {label:typeof raw.title==='string'?raw.title.slice(0,120):'',order,includeInForm:raw.includeInForm===true,transformLocked:raw.tLocked===true,selectionLocked:raw.selectionLocked===true||raw.dLocked===true||raw.eLocked===true,deleteLocked:raw.deleteLocked===true||raw.dLocked===true||raw.eLocked===true,hideMenus:raw.hideContext===true,reference:raw.isReference===true};
}
const color=canonicalPaint;
/** Single-page native PitchPrint v10/Fabric 3 source. Never executes source scripts or silently drops objects. */
async function importSinglePitchPrint(raw:unknown,options:PitchImportOptions):Promise<PitchImportResult>{
 if(raw&&typeof raw==='object'&&Array.isArray((raw as any).pages)&&(raw as any).pages.length!==1)throw new Error('Il configuratore importa soltanto template a pagina singola.');
 const source=sourceSchema.parse(raw);const unitMm=pitchprintUnitMm(source.unit),page=source.pages[0]!,data=page.pageData,clip=page.canvas.clipPath,width=numeric(data.fWidth,'Larghezza')*unitMm,height=numeric(data.fHeight,'Altezza')*unitMm,cw=numeric(clip.width,'Area canvas'),ch=numeric(clip.height,'Area canvas');if(width<=0||height<=0||width>1000||height>1000||cw<=0||ch<=0)throw new Error('Formato fuori dai limiti del laboratorio.');
 const left=numeric(clip.left??0,'Origine canvas'),top=numeric(clip.top??0,'Origine canvas'),sx=width/cw,sy=height/ch,warnings:string[]=[],objects:SceneObject[]=[],assets:FontAsset[]=[],fontCache=new Map<string,Promise<PitchprintFontResult>>(),groupMembers=new Map<string,string[]>(),expandedGroups:SceneGroup[]=[];
 const pageMatrix:PitchprintMatrix=[sx,0,0,sy,-left*sx,-top*sy];
 let paperColor:string|undefined;
 if(page.canvas.background!==undefined&&page.canvas.background!==null&&page.canvas.background!==''){
  try{const paper=color(page.canvas.background,options.monochrome);if(paper!=='none'&&paper!=='#ffffff')paperColor=paper;}catch(e){if(!options.excludeBackground)throw e;warnings.push('Colore/riempimento del foglio escluso per scelta esplicita.');}
 }
 const pageImages=options.excludeBackground?[]:pitchprintPageImages(page.canvas,data,options.pageImages,warnings),pageObjects:SceneObject[]=[];
 if(options.excludeBackground){if(/https?:|data:image/.test(JSON.stringify([data.templateSource,data.foregroundSource,(data.fillData as any)?.assetData,page.canvas.backgroundImage,page.canvas.overlayImage]))||paperColor)warnings.push('Sfondo/materiale o primo piano escluso per scelta esplicita.');paperColor=undefined;}
 else if(paperColor)warnings.push('Colore del foglio conservato nella grafica e nelle esportazioni.');
 // Append native page vectors for one common tree/geometry conversion. Body IDs
 // remain unchanged. Their canonical layer order is restored after conversion.
 const roots=[...page.canvas.objects],vectorPages:{role:'background'|'foreground';policy:PageImagePolicy;prefix:string}[]=[],rasterPages:typeof pageImages=[];
 for(const input of pageImages){const policy=options.pageImages?.[input.role]??'review',label=input.role==='background'?'Sfondo':'Primo piano';if(!['review','print','reference','exclude'].includes(policy))throw Error('Utilizzo dell’immagine di pagina non riconosciuto.');if(policy==='review')throw Error(`${label}: scegli se è grafica da stampare, riferimento del materiale oppure da escludere.`);if(policy!=='exclude'&&input.native&&nativePageVector(input.native)){roots.push(input.native);vectorPages.push({role:input.role,policy,prefix:`pp-${roots.length}`});}else if(policy!=='exclude')rasterPages.push(input);warnings.push(`${label}: ${policy==='print'?'conservato nella grafica produttiva':policy==='reference'?'conservato come riferimento materiale, escluso da esportazioni e miniature produttive':'escluso per scelta esplicita'}.`);}
 const tree=pitchprintTree(roots,properties);warnings.push(...tree.warnings);
 for(const input of rasterPages)if(input.native)checkedPitchprintEffects(input.native,input.role==='background'?'Sfondo':'Primo piano');
 for(const input of rasterPages){const object=await convertPageImage(input,options.pageImages![input.role],{width,height},pageMatrix,options.monochrome,options.image,properties(input.native??{},warnings),warnings);if(object)pageObjects.push(object);}


 for(const {item,name,id,parent} of tree.leaves){
  const type=item.type,editor=properties(item,warnings),firstObject=objects.length;
  // Text has an early continue after conversion; collect its membership there.
  const rememberGroup=()=>{groupMembers.set(id,objects.slice(firstObject).map(object=>object.id));};
  const scaleX=numeric(item.scaleX??1,name),scaleY=numeric(item.scaleY??1,name),angle=numeric(item.angle??0,name);if(scaleX<=0||scaleY<=0)throw new Error(`${name}: scala negativa o nulla non supportata.`);
  const rawWidth=numeric(item.width,name),rawHeight=numeric(item.height,name),stroke=numeric(item.strokeWidth??0,name);
  // mtx is a cached PitchPrint/Fabric value and may be stale after an offline edit.
  const space=multiplyPitchprintMatrices(pageMatrix,parent),matrix=multiplyPitchprintMatrices(space,pitchprintTransform(item,name)),axisX=Math.hypot(matrix[0],matrix[1]),axisY=Math.hypot(matrix[2],matrix[3]),rotation=Math.atan2(matrix[1],matrix[0])*180/Math.PI,determinant=matrix[0]*matrix[3]-matrix[1]*matrix[2],orthogonal=Math.abs(matrix[0]*matrix[2]+matrix[1]*matrix[3])<=1e-7*axisX*axisY,center={xMm:matrix[4],yMm:matrix[5]};
  if(type==='i-text'||type==='text'||type==='textbox'){
   if(determinant<=0||!orthogonal)throw new Error(`${name}: testo riflesso o inclinato dal gruppo non rappresentabile senza alterare i caratteri.`);
   if(typeof item.text!=='string'||typeof item.fontFamily!=='string')throw new Error(`${name}: testo/font mancante.`);
   if(pitchprintTextIsBlank(item.text)){warnings.push(`${name}: box di testo senza caratteri visibili rimosso come refuso, secondo la regola di migrazione concordata.`);rememberGroup();continue;}
   if(item.textAlign&&!['left','right','center','justify'].includes(String(item.textAlign)))throw new Error(`${name}: allineamento testo da convertire.`);
   const justified=item.textAlign==='justify';
   const resolveFont=async(request:ReturnType<typeof pitchprintFontRequest>)=>{
    const key=JSON.stringify([request.family,request.weight,request.italic]);let pending=fontCache.get(key);
    if(!pending){pending=options.font(request.family,request.weight,request.italic);fontCache.set(key,pending);}
    const resolved=await checkedPitchprintFont(await pending,request),asset=resolved.asset;warnings.push(...resolved.warnings);
    if(!assets.some(existing=>existing.id===asset.id)){FontAssetsSchema.parse([...assets,asset]);assets.push(asset);}await loadFontAssets([asset]);return asset;
   };
   const asset=await resolveFont(pitchprintFontRequest(item)),fontFamily=asset.id,fontSize=numeric(item.fontSize,name),fontSizePt=fontSize*axisY*72/25.4;
   const {nativeStyles,characterStyles,ignoredInsertionStyles,ignoredDetachedStyles,ignoredTrailingStyles}=await pitchprintTextStyles(item,axisY,options.monochrome,resolveFont);
   if(ignoredInsertionStyles)warnings.push(`${name}: ${ignoredInsertionStyles} stili di inserimento a fine riga esclusi; nessun carattere visibile modificato.`);
   if(ignoredDetachedStyles)warnings.push(`${name}: ${ignoredDetachedStyles} stili residui di righe assenti esclusi; nessun carattere del testo corrente modificato.`);
   if(ignoredTrailingStyles)warnings.push(`${name}: ${ignoredTrailingStyles} stili residui oltre fine riga esclusi; nessun carattere visibile modificato.`);
   const fill=color(item.fill,options.monochrome);if(fill==='none')throw new Error(`${name}: testo senza riempimento non convertibile.`);
   const outline=pitchprintTextStroke(item,axisY,options.monochrome);
   const nativeOptions={left:numeric(item.left,name),top:numeric(item.top,name),originX:(item.originX??'left') as 'left'|'center'|'right',originY:(item.originY??'top') as 'top'|'center'|'bottom',scaleX,scaleY,angle,flipX:item.flipX===true,flipY:item.flipY===true,fontSize,fontFamily:renderFontFamily(fontFamily),fontWeight:'normal' as const,fontStyle:'normal' as const,lineHeight:numeric(item.lineHeight??1,name),charSpacing:numeric(item.charSpacing??0,name),textAlign:(item.textAlign??'left') as 'left'|'center'|'right'|'justify',fill,...outline.native,underline:item.underline===true,linethrough:item.linethrough===true,overline:item.overline===true,styles:nativeStyles};
   const object:Extract<SceneObject,{type:'text'}>={id,type:'text',xMm:0,yMm:0,text:item.text,fontFamily,fontSizePt,fill,...outline.canonical,rotationDeg:rotation,fontWeight:'normal',fontStyle:'normal',textAlign:justified?'justify-left':nativeOptions.textAlign as 'left'|'center'|'right',...(justified?{justification:{...DEFAULT_JUSTIFICATION,distribution:'word-space',justifyLastLine:true}}:{}),lineHeight:nativeOptions.lineHeight,textScaleX:axisX/axisY,letterSpacingPt:nativeOptions.charSpacing/1000*fontSizePt,underline:nativeOptions.underline,linethrough:nativeOptions.linethrough,overline:nativeOptions.overline,editor,...(characterStyles.length?{characterStyles}:{}),...(type==='textbox'?{textBox:{widthMm:rawWidth*axisX,heightMm:rawHeight*axisY,autoWidth:false,autoHeight:true}}:{})};
   await assertFontGeometry({objects:[object],fontAssets:assets});
   const native=type==='textbox'?new Textbox(item.text,{...nativeOptions,width:rawWidth,minWidth:.001}):new IText(item.text,nativeOptions);
   try{
    const measured=measureFabric({...object,rotationDeg:0}),layoutWidth=measured.textLayoutWidthMm??measured.widthMm,layoutHeight=measured.textLayoutHeightMm??measured.heightMm;object.textBox={widthMm:layoutWidth,heightMm:layoutHeight,autoWidth:type!=='textbox',autoHeight:true};
    const nativeCenter=native.getCenterPoint(),point=pitchprintPoint(space,nativeCenter.x,nativeCenter.y),dx=(layoutWidth-native.width*axisX)/2,dy=(layoutHeight-native.height*axisY)/2,a=rotation*Math.PI/180;
    objects.push(placeObjectAtCenter(object,{xMm:point.x+dx*Math.cos(a)-dy*Math.sin(a),yMm:point.y+dx*Math.sin(a)+dy*Math.cos(a)},measureFabric));
   }finally{native.dispose();}
   if(item.text.includes('\n')||type==='textbox')warnings.push('Box multiriga ricostruito: verificare interlinea e ritorni a capo.');
  }else if(type==='image'){
   if(stroke>0&&color(item.stroke,options.monochrome)!=='none')throw new Error(`${name}: contorno immagine da convertire senza perderne l’aspetto.`);
   if(!orthogonal)throw new Error(`${name}: immagine inclinata dal gruppo, da convertire senza approssimare la geometria.`);
   if(item.resizeFilter||item.filters!=null&&(!Array.isArray(item.filters)||item.filters.length))throw new Error(`${name}: filtri immagine da convertire.`);
   const url=pitchprintImageUrl(item),source=rasterSourceFromBytes(`pitch-${crypto.randomUUID()}`,url.startsWith('data:image/')?Uint8Array.from(atob(url.split(',')[1]??''),character=>character.charCodeAt(0)):await options.image(url));await prepareRasterSource(source);if(source.mime==='image/png')warnings.push(...pngSourceWarnings(source.dataUrl));
   const{center:imageCenter,...geometry}=clippedPitchprintImageGeometry(item,source,pitchprintImageGeometry(item,source,axisX,axisY),matrix);
   objects.push(placeObjectAtCenter({id,type:'image',xMm:0,yMm:0,...geometry,rotationDeg:rotation,source,raster:{...DEFAULT_RASTER,...(!options.monochrome?{mode:'original' as const}:{})},flipY:determinant<0,editor},imageCenter,measureFabric));
  }else{
   const shapeFill=color(item.fill,options.monochrome),shapeStroke=stroke===0?'none':color(item.stroke,options.monochrome);
   if(shapeStroke!=='none'&&item.strokeUniform===true)throw Error(`${name}: contorno uniforme indipendente dalla scala ancora da convertire.`);
   const empty=emptyPitchprintPrimitive(item,editor,tree.groups.some(group=>group.leafIds.includes(id)),shapeStroke);
   if(empty){warnings.push(`${name}: ${empty} senza area e senza contorno, privo di grafica visibile, escluso esplicitamente.`);rememberGroup();continue;}
   const primitive=orthogonal&&shapeStroke==='none'?unstrokedPitchprintPrimitive(item,id,editor,axisX,axisY,rotation,shapeFill):null;
   if(primitive){
    const opacity=singleFillPitchprintOpacity(item);if(opacity===null)throw Error(`${name}: opacità da convertire.`);if(opacity!==1){primitive.fillOpacity=opacity;warnings.push(`${name}: opacità del singolo riempimento conservata (${opacity*100}%).`);}
    if(type==='rect'&&shapeFill==='none'&&editor.includeInForm)warnings.push(`${name}: segnaposto trasparente conservato con label/proprietà; l’eventuale campo di caricamento foto PitchPrint richiede associazione esplicita all’immagine.`);
    objects.push(placeObjectAtCenter(primitive,center,measureFabric));rememberGroup();continue;
   }
   if(item.opacity!==undefined&&item.opacity!==1)throw Error(`${name}: opacità di una geometria affine non rappresentabile con il singolo riempimento.`);
   const safe:any={originX:item.originX??'left',originY:item.originY??'top',left:item.left,top:item.top,width:rawWidth,height:rawHeight,scaleX,scaleY,angle,flipX:item.flipX===true,flipY:item.flipY===true,fill:shapeFill==='none'?null:shapeFill,stroke:shapeStroke==='none'?null:shapeStroke,strokeWidth:stroke,strokeLineCap:item.strokeLineCap??'butt',strokeLineJoin:item.strokeLineJoin??'miter',strokeMiterLimit:item.strokeMiterLimit??4,fillRule:item.fillRule??'nonzero'};let object:FabricObject;
   if(type==='rect')object=new Rect({...safe,rx:item.rx??0,ry:item.ry??0});else if(type==='circle')object=new Circle({...safe,radius:numeric(item.radius,name)});else if(type==='ellipse')object=new Ellipse({...safe,rx:numeric(item.rx,name),ry:numeric(item.ry,name)});else if(type==='line')object=new Line([numeric(item.x1,name),numeric(item.y1,name),numeric(item.x2,name),numeric(item.y2,name)],safe);else if(type==='path'&&Array.isArray(item.path))object=new Path(item.path as any,safe);else if((type==='polygon'||type==='polyline')&&Array.isArray(item.points))object=type==='polygon'?new Polygon(item.points as any,safe):new Polyline(item.points as any,safe);else throw new Error(`${name}: tipo «${String(type)}» non supportato. Nessun elemento viene scartato.`);
   // The physical page axes are independent: legacy canvas dimensions can be
   // rounded pixels. SVG's default "meet" would add margins and move paths,
   // while texts/images already use the exact page matrix. Nonuniform strokes
   // are expanded locally instead of replacing their affine shape with an average.
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="${left} ${top} ${cw} ${ch}" preserveAspectRatio="none"><g transform="matrix(${parent.join(' ')})">${preciseIntermediateSvg(()=>object.toSVG())}</g></svg>`;try{const prepared=await prepareSvg(svg,false,'editable'),entries=prepared.objects.map((entry,n)=>({...entry,id:n?`${id}-${n}`:id,editor:{...editor}}));
    if(prepared.expandedStrokes){warnings.push(`${name}: contorno deformato espanso in tracciati per conservarne l’aspetto; lo spessore è ora geometria.`);if(entries.length>1){const parentId=tree.groups.filter(group=>group.leafIds.includes(id)).at(-1)?.id;expandedGroups.push({id:`${id}-outline-group`,...(parentId?{parentId}:{}),editor,objectIds:entries.map(entry=>entry.id)});for(const entry of entries)entry.editor={};}}
    objects.push(...entries);}catch(cause){throw new Error(`${name}: ${cause instanceof Error?cause.message:'geometria non convertibile'}`);}finally{object.dispose();}
  }
  rememberGroup();
 }
 const backgroundObject=pageObjects.find(object=>object.id==='pp-background');if(backgroundObject)objects.unshift(backgroundObject);const foregroundObject=pageObjects.find(object=>object.id==='pp-foreground');if(foregroundObject)objects.push(foregroundObject);
 if(unitMm!==1)warnings.push(`Misure convertite da ${source.unit} a millimetri senza ridimensionare il formato fisico.`);if(options.monochrome)warnings.push('Colori della grafica convertiti nella palette nero/bianco per scelta esplicita.');if(!objects.length&&!paperColor)throw new Error('Il template non contiene elementi convertibili.');
 let groups:SceneGroup[]=[...tree.groups.map(({id,parentId,editor,leafIds})=>({id,...(parentId?{parentId}:{}),editor,objectIds:leafIds.flatMap(id=>groupMembers.get(id)??[])})),...expandedGroups];
 let backgroundGroupId:string|undefined;
 for(const entry of vectorPages){
  const leafIds=tree.leaves.filter(leaf=>leaf.id===entry.prefix||leaf.id.startsWith(entry.prefix+'-')).map(leaf=>leaf.id),ids=new Set(leafIds.flatMap(id=>groupMembers.get(id)??[])),members=objects.filter(object=>ids.has(object.id));
  if(!members.length)throw Error('Sfondo/primo piano vettoriale privo di grafica convertibile.');
  const nested=groups.filter(group=>group.objectIds.some(id=>ids.has(id))),nestedIds=new Set(nested.map(group=>group.id)),groupId=`pp-${entry.role}-group`,reference=entry.policy==='reference',wrapper:SceneGroup={id:groupId,objectIds:members.map(object=>object.id),editor:{label:`${entry.role==='background'?'Sfondo':'Primo piano'} · ${reference?'riferimento materiale':'grafica'}`,includeInForm:false,...(reference?{reference:true,selectionLocked:true,transformLocked:true,deleteLocked:true}:{})}},owned=[wrapper,...nested.map(group=>({...group,...(!group.parentId?{parentId:groupId}:{})}))],others=groups.filter(group=>!nestedIds.has(group.id)),remaining=objects.filter(object=>!ids.has(object.id));
  objects.splice(0,objects.length,...(entry.role==='background'?[...members,...remaining]:[...remaining,...members]));groups=entry.role==='background'?[...owned,...others]:[...others,...owned];
  if(entry.role==='background')backgroundGroupId=groupId;
  warnings.push(`${entry.role==='background'?'Sfondo':'Primo piano'}: geometria vettoriale nativa e gerarchia conservate, senza rasterizzazione.`);
 }
 const cleaned=prunePitchprintRefuse({objects,groups,areaMm:{width,height}},measureFabric);objects.splice(0,objects.length,...cleaned.objects);groups=cleaned.groups??[];
 for(const item of cleaned.removed)warnings.push(`${item.id}: ${item.reason}, rimosso come refuso secondo la regola di migrazione concordata.`);
 if(backgroundGroupId&&!groups.some(g=>g.id===backgroundGroupId))backgroundGroupId=undefined;
 if(groups.length)warnings.push(`${groups.length} gruppi grafici conservati come unità di selezione e trasformazione.`);
 const document=DocumentSchema.parse({...createDocument(),colorMode:options.monochrome?'monochrome':'color',areaMm:{width,height},...(paperColor?{paperColor}:{}),...(backgroundObject&&objects.some(o=>o.id===backgroundObject.id)?{backgroundImageId:backgroundObject.id}:{}),...(backgroundGroupId?{backgroundGroupId}:{}),objects,...(groups.length?{groups}:{}),...(options.family?{plaque:defaultMountingFor(options.family)}:{}),...(assets.length?{fontAssets:assets}:{})});validateLayout(document,measureFabric,'edit');warnings.push('Controllare l’anteprima: la ricostruzione dei testi fra Fabric 3 e il nuovo motore richiede collaudo visivo.');return{document,title:source.title?.slice(0,120)||'Template PitchPrint importato',warnings:[...new Set(warnings)],sourceObjects:page.canvas.objects.length};
}

/** Convert every source page before exposing a canonical project. */
export async function importPitchPrint(raw:unknown,options:PitchImportOptions):Promise<PitchImportResult>{
 const source=raw as {pages?:unknown[];title?:unknown};if(!Array.isArray(source?.pages)||source.pages.length<=1)return importSinglePitchPrint(raw,options);
 if(source.pages.length>100)throw Error('Massimo 100 pagine per progetto');
 const converted:PitchImportResult[]=[],images=new Map<string,Promise<Uint8Array>>(),read=options.image;
 const shared={...options,image:(url:string)=>{let value=images.get(url);if(!value){value=read(url);images.set(url,value);}return value;}};
 for(const[index,page]of source.pages.entries()){try{converted.push(await importSinglePitchPrint({...source,pages:[page]},shared));}catch(error){throw Error(`Pagina ${index+1}: ${error instanceof Error?error.message:'conversione non riuscita'}. Nessuna pagina viene importata parzialmente.`);}}
 const names=source.pages.map((page:any,index)=>String(page.pageData?.name??page.pageData?.title??`Pagina ${index+1}`).slice(0,120)),document=joinGraphicPages(converted.map(page=>page.document),names);validateLayout(document,measureFabric,'edit');
 return{document,title:converted[0]!.title,sourceObjects:converted.reduce((n,page)=>n+page.sourceObjects,0),warnings:[`${converted.length} pagine conservate con formati indipendenti.`,...converted.flatMap((page,index)=>page.warnings.map(warning=>`Pagina ${index+1}: ${warning}`))]};
}
