import { pitchprintTextStyles } from './pitchprint-text-styles';
import { preciseIntermediateSvg } from './svg-precision';
import {canonicalPaint} from './paint';
import {checkedPitchprintFont,type PitchprintFontResult} from './pitchprint-font-resolution';
import {pitchprintNumber as numeric,pitchprintUnitMm} from './pitchprint-units';
import {pitchprintFontRequest} from './pitchprint-fonts';
import {pitchprintTree,pitchprintTransform,pitchprintPoint,multiplyPitchprintMatrices,type PitchprintMatrix} from './pitchprint-tree';
import {z} from 'zod';import {IText,Textbox,Rect,Circle,Ellipse,Line,Path,Polygon,Polyline,type FabricObject} from 'fabric';
import {createDocument,DocumentSchema,placeObjectAtCenter,type GraphicDocument,type SceneObject} from './model';import {loadFontAssets,renderFontFamily} from './fonts';import {FontAssetsSchema,type FontAsset} from './font-assets';import {measureFabric} from './fabric-adapter';import {prepareSvg} from './svg-import';import {rasterSourceFromBytes} from './raster-source';import {prepareRasterSource} from './raster-cache';import {DEFAULT_RASTER} from './raster-processing';import {defaultMountingFor} from './plaque';import type {ObjectProperties} from './object-properties';
const record=z.record(z.string(),z.unknown()),sourceSchema=z.object({title:z.string().max(1000).optional(),unit:z.string(),pages:z.array(z.object({canvas:z.object({objects:z.array(record).max(200),clipPath:record}).passthrough(),pageData:record}).passthrough()).length(1)}).passthrough();
export interface PitchImportOptions {monochrome:boolean;excludeBackground:boolean;family?:'flat-plaque'|'doorplate'|'boxed-sign';font:(family:string,weight:number,italic:boolean)=>Promise<PitchprintFontResult>;image:(url:string)=>Promise<Uint8Array>;}
export interface PitchImportResult {document:GraphicDocument;title:string;warnings:string[];sourceObjects:number;}
function properties(raw:Record<string,unknown>,warnings:string[]):ObjectProperties{
 const order=Number(raw.index??raw.idx??0);if(!Number.isInteger(order)||Math.abs(order)>10000)throw new Error('Ordine del campo non valido.');
 if(raw.dLocked||raw.eLocked)warnings.push('Blocchi dLocked/eLocked trasferiti in modo conservativo a selezione/eliminazione: ricontrollali.');
 if(raw.list||raw.chain||raw.tags&&JSON.stringify(raw.tags)!=='[]'||raw.hooks&&JSON.stringify(raw.hooks)!=='{}')warnings.push('Liste, catene, tag speciali o hook richiedono revisione; non vengono eseguiti nel nuovo editor.');
 return {label:typeof raw.title==='string'?raw.title.slice(0,120):'',order,includeInForm:raw.includeInForm===true,transformLocked:raw.tLocked===true,selectionLocked:raw.selectionLocked===true||raw.dLocked===true||raw.eLocked===true,deleteLocked:raw.deleteLocked===true||raw.dLocked===true||raw.eLocked===true,hideMenus:raw.hideContext===true,reference:raw.isReference===true};
}
const color=canonicalPaint;
/** Single-page native PitchPrint v10/Fabric 3 source. Never executes source scripts or silently drops objects. */
export async function importPitchPrint(raw:unknown,options:PitchImportOptions):Promise<PitchImportResult>{
 if(raw&&typeof raw==='object'&&Array.isArray((raw as any).pages)&&(raw as any).pages.length!==1)throw new Error('Il configuratore importa soltanto template a pagina singola.');
 const source=sourceSchema.parse(raw);const unitMm=pitchprintUnitMm(source.unit),page=source.pages[0]!,data=page.pageData,clip=page.canvas.clipPath,width=numeric(data.fWidth,'Larghezza')*unitMm,height=numeric(data.fHeight,'Altezza')*unitMm,cw=numeric(clip.width,'Area canvas'),ch=numeric(clip.height,'Area canvas');if(width<=0||height<=0||width>1000||height>1000||cw<=0||ch<=0)throw new Error('Formato fuori dai limiti del laboratorio.');
 const left=numeric(clip.left??0,'Origine canvas'),top=numeric(clip.top??0,'Origine canvas'),sx=width/cw,sy=height/ch,tree=pitchprintTree(page.canvas.objects,properties),warnings:string[]=[...tree.warnings],objects:SceneObject[]=[],assets:FontAsset[]=[],fontCache=new Map<string,Promise<PitchprintFontResult>>(),groupMembers=new Map<string,string[]>();
 const pageMatrix:PitchprintMatrix=[sx,0,0,sy,-left*sx,-top*sy];
 let paperGraphics=false;if(page.canvas.background!==undefined&&page.canvas.background!==null&&page.canvas.background!==''){try{const paper=color(page.canvas.background,false);paperGraphics=paper!=='none'&&paper!=='#ffffff';}catch{paperGraphics=true;}}const background=/https?:|data:image/.test(JSON.stringify([data.templateSource,data.foregroundSource,(data.fillData as any)?.assetData]))||paperGraphics;
 if(background&&!options.excludeBackground)throw new Error('Lo sfondo/materiale o il primo piano richiede revisione. Abilita la sua esclusione soltanto se non fa parte della grafica da produrre.');if(background)warnings.push('Sfondo/materiale o primo piano escluso per scelta esplicita.');
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
   if(item.textAlign&&!['left','right','center'].includes(String(item.textAlign)))throw new Error(`${name}: allineamento testo da convertire.`);
   const resolveFont=async(request:ReturnType<typeof pitchprintFontRequest>)=>{
    const key=JSON.stringify([request.family,request.weight,request.italic]);let pending=fontCache.get(key);
    if(!pending){pending=options.font(request.family,request.weight,request.italic);fontCache.set(key,pending);}
    const resolved=await checkedPitchprintFont(await pending,request),asset=resolved.asset;warnings.push(...resolved.warnings);
    if(!assets.some(existing=>existing.id===asset.id)){FontAssetsSchema.parse([...assets,asset]);assets.push(asset);}await loadFontAssets([asset]);return asset;
   };
   const asset=await resolveFont(pitchprintFontRequest(item)),fontFamily=asset.id,fontSize=numeric(item.fontSize,name),fontSizePt=fontSize*axisY*72/25.4;
   const {nativeStyles,characterStyles}=await pitchprintTextStyles(item,axisY,options.monochrome,resolveFont);
   const fill=color(item.fill,options.monochrome);if(fill==='none')throw new Error(`${name}: testo senza riempimento non convertibile.`);
   const nativeOptions={left:numeric(item.left,name),top:numeric(item.top,name),originX:(item.originX??'left') as 'left'|'center'|'right',originY:(item.originY??'top') as 'top'|'center'|'bottom',scaleX,scaleY,angle,flipX:item.flipX===true,flipY:item.flipY===true,fontSize,fontFamily:renderFontFamily(fontFamily),fontWeight:'normal' as const,fontStyle:'normal' as const,lineHeight:numeric(item.lineHeight??1,name),charSpacing:numeric(item.charSpacing??0,name),textAlign:(item.textAlign??'left') as 'left'|'center'|'right',fill,stroke:null,strokeWidth:0,underline:item.underline===true,linethrough:item.linethrough===true,overline:item.overline===true,styles:nativeStyles};
   const native=type==='textbox'?new Textbox(item.text,{...nativeOptions,width:rawWidth,minWidth:.001}):new IText(item.text,nativeOptions);
   try{
    const object:Extract<SceneObject,{type:'text'}>={id,type:'text',xMm:0,yMm:0,text:item.text,fontFamily,fontSizePt,fill,rotationDeg:rotation,fontWeight:'normal',fontStyle:'normal',textAlign:nativeOptions.textAlign,lineHeight:nativeOptions.lineHeight,textScaleX:axisX/axisY,letterSpacingPt:nativeOptions.charSpacing/1000*fontSizePt,underline:nativeOptions.underline,linethrough:nativeOptions.linethrough,overline:nativeOptions.overline,editor,...(characterStyles.length?{characterStyles}:{}),...(type==='textbox'?{textBox:{widthMm:rawWidth*axisX,heightMm:rawHeight*axisY,autoWidth:false,autoHeight:true}}:{})};
    const measured=measureFabric({...object,rotationDeg:0});object.textBox={widthMm:measured.widthMm,heightMm:measured.heightMm,autoWidth:type!=='textbox',autoHeight:true};
    const nativeCenter=native.getCenterPoint(),point=pitchprintPoint(space,nativeCenter.x,nativeCenter.y),dx=(measured.widthMm-native.width*axisX)/2,dy=(measured.heightMm-native.height*axisY)/2,a=rotation*Math.PI/180;
    objects.push(placeObjectAtCenter(object,{xMm:point.x+dx*Math.cos(a)-dy*Math.sin(a),yMm:point.y+dx*Math.sin(a)+dy*Math.cos(a)},measureFabric));
   }finally{native.dispose();}
   if(item.text.includes('\n')||type==='textbox')warnings.push('Box multiriga ricostruito: verificare interlinea e ritorni a capo.');
  }else if(type==='image'){
   const url=typeof item.src==='string'?item.src:typeof item.url==='string'?item.url:'';if(!url)throw new Error(`${name}: immagine priva di sorgente.`);if(item.cropX||item.cropY||Array.isArray(item.filters)&&item.filters.length)throw new Error(`${name}: ritaglio/filtri immagine da convertire.`);const source=rasterSourceFromBytes(`pitch-${crypto.randomUUID()}`,url.startsWith('data:image/')?Uint8Array.from(atob(url.split(',')[1]??''),character=>character.charCodeAt(0)):await options.image(url));await prepareRasterSource(source);
   const w=rawWidth*axisX,h=rawHeight*axisY;if(!orthogonal||Math.abs(w/h-source.pixelWidth/source.pixelHeight)>1e-5)throw new Error(`${name}: immagine deformata, inclinata o ritagliata, da adattare senza perdere proporzioni.`);objects.push(placeObjectAtCenter({id,type:'image',xMm:0,yMm:0,widthMm:w,heightMm:h,rotationDeg:rotation,source,raster:{...DEFAULT_RASTER,...(!options.monochrome?{mode:'original' as const}:{})},flipY:determinant<0,editor},center,measureFabric));
  }else{
   const shapeFill=color(item.fill,options.monochrome),shapeStroke=color(item.stroke,options.monochrome);const safe:any={originX:item.originX??'left',originY:item.originY??'top',left:item.left,top:item.top,width:rawWidth,height:rawHeight,scaleX,scaleY,angle,flipX:item.flipX===true,flipY:item.flipY===true,fill:shapeFill==='none'?null:shapeFill,stroke:shapeStroke==='none'?null:shapeStroke,strokeWidth:stroke,strokeLineCap:item.strokeLineCap??'butt',strokeLineJoin:item.strokeLineJoin??'miter',strokeMiterLimit:item.strokeMiterLimit??4,fillRule:item.fillRule??'nonzero'};let object:FabricObject;
   if(type==='rect')object=new Rect({...safe,rx:item.rx??0,ry:item.ry??0});else if(type==='circle')object=new Circle({...safe,radius:numeric(item.radius,name)});else if(type==='ellipse')object=new Ellipse({...safe,rx:numeric(item.rx,name),ry:numeric(item.ry,name)});else if(type==='line')object=new Line([numeric(item.x1,name),numeric(item.y1,name),numeric(item.x2,name),numeric(item.y2,name)],safe);else if(type==='path'&&Array.isArray(item.path))object=new Path(item.path as any,safe);else if((type==='polygon'||type==='polyline')&&Array.isArray(item.points))object=type==='polygon'?new Polygon(item.points as any,safe):new Polyline(item.points as any,safe);else throw new Error(`${name}: tipo «${String(type)}» non supportato. Nessun elemento viene scartato.`);
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="${left} ${top} ${cw} ${ch}"><g transform="matrix(${parent.join(' ')})">${preciseIntermediateSvg(()=>object.toSVG())}</g></svg>`;try{const prepared=await prepareSvg(svg,false,'editable');objects.push(...prepared.objects.map((entry,n)=>({...entry,id:n?`${id}-${n}`:id,editor:{...editor}})));}catch(cause){throw new Error(`${name}: ${cause instanceof Error?cause.message:'geometria non convertibile'}`);}finally{object.dispose();}
  }
  rememberGroup();
 }
 if(unitMm!==1)warnings.push(`Misure convertite da ${source.unit} a millimetri senza ridimensionare il formato fisico.`);if(options.monochrome)warnings.push('Colori della grafica convertiti nella palette nero/bianco per scelta esplicita.');if(!objects.length)throw new Error('Il template non contiene elementi convertibili.');
 const groups=tree.groups.map(({id,parentId,editor,leafIds})=>({id,...(parentId?{parentId}:{}),editor,objectIds:leafIds.flatMap(id=>groupMembers.get(id)??[])}));
 if(groups.length)warnings.push(`${groups.length} gruppi grafici conservati come unità di selezione e trasformazione.`);
 const document=DocumentSchema.parse({...createDocument(),colorMode:options.monochrome?'monochrome':'color',areaMm:{width,height},objects,...(groups.length?{groups}:{}),...(options.family?{plaque:defaultMountingFor(options.family)}:{}),...(assets.length?{fontAssets:assets}:{})});warnings.push('Controllare l’anteprima: la ricostruzione dei testi fra Fabric 3 e il nuovo motore richiede collaudo visivo.');return{document,title:source.title?.slice(0,120)||'Template PitchPrint importato',warnings:[...new Set(warnings)],sourceObjects:page.canvas.objects.length};
}
