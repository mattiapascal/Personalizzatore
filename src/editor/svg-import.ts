import{extractSvgClips,type SvgWorldClip}from'./svg-clip-import';
import{ClipMasksSchema,maskedCommandCount,type ClipMask}from'./clip-masks';
import{embeddedSvgRaster}from'./svg-raster';
import{prepareRasterSource}from'./raster-cache';
import{checkedRasterCrop}from'./raster-geometry';
import{DEFAULT_RASTER}from'./raster-processing';
import { StrokeWidthSchema } from './stroke';
import { requestStrokeOutline } from './stroke-outline';
import {canonicalPaint} from './paint';
import { EDITOR_LIMITS,GRAPHIC_IMPORT_LIMITS } from './limits';
import { assertMinimumText } from './text-production';
import { compactVectors } from './vector-compaction';
import { loadSVGFromString, FabricImage, FabricText, Path, Rect, Circle, Ellipse, Line, Polyline, Polygon, util, type FabricObject, type TMat2D } from 'fabric';
import { importedFontFamily, renderFontFamily, canonicalFontFamily, fontAssetArguments } from './fonts';
import { measureFabric } from './fabric-adapter';
import { assertFontGeometry } from './verified-font-geometry';
import type { FontAsset } from './font-assets';
import { sanitizeSvg } from './svg-sanitize';
import { mapVector, vectorBounds, VectorCommandsSchema, VectorClipSchema, type VectorCommand } from './vector-geometry';
import { DocumentSchema, cloneSceneObject, type GraphicDocument, type GraphicCommand, type Measure, type SceneObject } from './model';
import { transformSelection, selectionBounds } from './selection';
type VectorObject = Extract<SceneObject, { type: 'vector' }>;
const PX_TO_MM = 25.4 / 96;
function shapeCommands(object: FabricObject | NonNullable<FabricObject['clipPath']>, matrix?: TMat2D, unitScale = PX_TO_MM): VectorCommand[] {
  let path: Path;
  if (object instanceof Path) path = object;
  else {
    let d: string;
    if (object instanceof Circle || object instanceof Ellipse) { const rx = object instanceof Circle ? object.radius : object.rx, ry = object instanceof Circle ? object.radius : object.ry; d = `M ${-rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0 A ${rx} ${ry} 0 1 1 ${-rx} 0 Z`; }
    else if (object instanceof Line) { const p = object.calcLinePoints(); d = `M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`; }
    else if (object instanceof Polyline) { d = object.points.map((p, i) => `${i ? 'L' : 'M'} ${p.x - object.pathOffset.x} ${p.y - object.pathOffset.y}`).join(' ') + (object instanceof Polygon ? ' Z' : ''); }
    else if (object instanceof Rect) { const w = object.width / 2, h = object.height / 2, rx = Math.min(object.rx || object.ry, w), ry = Math.min(object.ry || object.rx, h); d = rx && ry ? `M ${-w + rx} ${-h} H ${w - rx} A ${rx} ${ry} 0 0 1 ${w} ${-h + ry} V ${h - ry} A ${rx} ${ry} 0 0 1 ${w - rx} ${h} H ${-w + rx} A ${rx} ${ry} 0 0 1 ${-w} ${h - ry} V ${-h + ry} A ${rx} ${ry} 0 0 1 ${-w + rx} ${-h} Z` : `M ${-w} ${-h} H ${w} V ${h} H ${-w} Z`; }
    else throw new Error('Geometria SVG non rappresentabile'); path = new Path(d);
  }
  const simple = util.makePathSimpler(path.path), commands: VectorCommand[] = []; let x = 0, y = 0, startX = 0, startY = 0, closed = false;
  for (const c of simple) {
    if (closed && c[0] !== 'M' && c[0] !== 'Z') commands.push(['M', x, y]); closed = false;
    if (c[0] === 'Q') { const [_, cx, cy, ex, ey] = c; commands.push(['C', x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y), ex + 2 / 3 * (cx - ex), ey + 2 / 3 * (cy - ey), ex, ey]); x = ex; y = ey; }
    else { commands.push([...c] as VectorCommand); if (c[0] === 'M' || c[0] === 'L') { x = c[1]; y = c[2]; if (c[0] === 'M') { startX = x; startY = y; } } else if (c[0] === 'C') { x = c[5]; y = c[6]; } else if (c[0] === 'Z') { x = startX; y = startY; closed = true; } }
  }
  const cleaned: VectorCommand[] = []; let contour: VectorCommand[] = [];
  const flush = () => { if (contour.some(c => c[0] === 'L' || c[0] === 'C')) cleaned.push(...contour); contour = []; };
  for (const c of commands) { if (c[0] === 'M') { flush(); contour.push(c); } else if (c[0] === 'Z') { contour.push(c); flush(); } else contour.push(c); } flush();
  const offset = object instanceof Path ? object.pathOffset : { x: 0, y: 0 }, m = matrix ?? object.calcTransformMatrix();
  return mapVector(cleaned, (x, y) => ({ x: ((x - offset.x) * m[0] + (y - offset.y) * m[2] + m[4]) * unitScale, y: ((x - offset.x) * m[1] + (y - offset.y) * m[3] + m[5]) * unitScale }));
}
const paint = canonicalPaint;

export type ImportTextMode = 'outlines' | 'editable';
/** Interchange adapters may need invisible geometry as an editable placeholder
 * or group member. This never includes display:none/visibility:hidden nodes. */
export interface SvgPreparationOptions { preserveUnpainted?: boolean; }
export interface PreparedSvg { viewportMm?:{xMm:number;yMm:number;widthMm:number;heightMm:number}; monochrome: boolean; objects: SceneObject[]; fontAssets?: FontAsset[]; widthMm: number; heightMm: number; expandedStrokes?:number; }
function expandedFill(commands:VectorCommand[],fill:string,fillRule:'nonzero'|'evenodd'):VectorObject{
 const box=vectorBounds(commands);if(!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<=0||box.height<=0)throw Error('Contorno espanso privo di area');
 return{id:`svg-${crypto.randomUUID()}`,type:'vector',xMm:box.x,yMm:box.y,widthMm:box.width,heightMm:box.height,commands:VectorCommandsSchema.parse(mapVector(commands,(x,y)=>({x:(x-box.x)/box.width,y:(y-box.y)/box.height}))),fill,fillRule,stroke:'none',strokeMm:.25,strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4};
}
function canonicalMasks(clips:readonly SvgWorldClip[],map:(x:number,y:number)=>{x:number;y:number}):ClipMask[]|undefined{
 if(!clips.length)return;return ClipMasksSchema.parse(clips.map(clip=>{const commands=mapVector(clip.commands,map),box=vectorBounds(commands);if(!(box.width>0&&box.height>0))throw Error('Maschera SVG priva di area');return{fillRule:clip.fillRule,frame:{left:box.x,top:box.y,width:box.width,height:box.height},commands:mapVector(commands,(x,y)=>({x:(x-box.x)/box.width,y:(y-box.y)/box.height}))};}));
}
/** Fabric's SVG attribute parser does not consistently retain visibility.
 * display:none hides the whole subtree; visibility is inherited and may be
 * restored on a child. Definitions are resources, not painted scene objects. */
function discardHiddenSvgPaint(xml:Document):void{
 for(const element of xml.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,image,text')){
  if(element.closest('defs,clipPath'))continue;
  let visibility:string|undefined,hidden=false;
  for(let node:Element|null=element;node;node=node.parentElement){
   if(node.getAttribute('display')==='none')hidden=true;
   visibility??=node.getAttribute('visibility')??undefined;
  }
  if(hidden||visibility==='hidden'||visibility==='collapse')element.remove();
 }
}
export async function prepareSvg(source: string, monochrome = false, textMode: ImportTextMode = 'outlines', options:SvgPreparationOptions={}): Promise<PreparedSvg> {
  let safe = sanitizeSvg(source, monochrome, true);
  const xml = new DOMParser().parseFromString(safe, 'image/svg+xml');discardHiddenSvgPaint(xml);const hasText = !!xml.querySelector('text');
  if(hasText&&textMode==='outlines'&&xml.querySelector('image'))throw Error('SVG con immagini e testo: scegli testo editabile per conservare i pixel originali; conversione dei soli testi in contorni ancora da aggiungere');
  const fontAssets: FontAsset[] = [],fontProbes: SceneObject[] = [];
  if (hasText) {
    for (const element of xml.querySelectorAll('text')) {
      const inherited=(name:string)=>{for(let node:Element|null=element;node;node=node.parentElement){const value=node.getAttribute(name);if(value)return value;}return null;};
      const declared=inherited('font-family');if(!declared)throw new Error('Il testo SVG non specifica un font: scegli un file della libreria nel documento sorgente oppure converti il testo in contorni.');
      const weight=inherited('font-weight'),italic=inherited('font-style')==='italic';
      const family = importedFontFamily(declared,weight==='bold'?700:weight&&weight!=='normal'?Number(weight):400,italic); element.setAttribute('font-family',renderFontFamily(family));element.setAttribute('font-weight','normal');element.setAttribute('font-style','normal');
      const asset = fontAssetArguments({ id:'font-probe',type:'text',xMm:0,yMm:0,text:'A',fontFamily:family,fontSizePt:9,fill:'#000000' }).fontAssets?.[0];
      if (asset && !fontAssets.some(a=>a.id===asset.id)) fontAssets.push(asset);
      fontProbes.push({id:`font-probe-${fontProbes.length}`,type:'text',xMm:0,yMm:0,text:element.textContent??'',fontFamily:family,fontSizePt:9,fill:'#000000'});
    }
    // Fabric and the outline converter must not measure substituted glyphs.
    await assertFontGeometry({objects:fontProbes,fontAssets});
    safe = new XMLSerializer().serializeToString(xml);
    if (textMode === 'outlines') {
      const response = await fetch('/__editor-local/svg-outlines', { method:'POST',headers:{'Content-Type':'application/json','X-Editor-Local':'1'},body:JSON.stringify({svg:safe,fontAssets}) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Conversione dei testi SVG in contorni non riuscita');
      return { ...await prepareSvg(result.svg, false, 'editable',options), monochrome };
    }
  }
  const bitmaps=new Map<string,ReturnType<typeof embeddedSvgRaster>>();for(const element of xml.querySelectorAll('image')){const href=element.getAttribute('xlink:href')!;if(!bitmaps.has(href))bitmaps.set(href,embeddedSvgRaster(href,`svg-${crypto.randomUUID()}`));}
  await Promise.all([...bitmaps.values()].map(source=>prepareRasterSource(source)));
  const worldClips=await extractSvgClips(xml,shapeCommands);safe=new XMLSerializer().serializeToString(xml);
  const objectClips=new WeakMap<FabricObject,SvgWorldClip[]>(),objectSources=new WeakMap<FabricObject,ReturnType<typeof embeddedSvgRaster>>();
  const textLengths=new WeakMap<FabricObject,number>(),textAnchors=new WeakMap<FabricObject,string>();
  // Only visible paint survived the DOM pass, including children restoring visibility.
  const parsed = await loadSVGFromString(safe,(element,object)=>{object.set('visible',true);objectClips.set(object,worldClips.get(element.id)??[]);if(object instanceof FabricImage){const source=bitmaps.get(element.getAttribute('xlink:href')!);if(!source)throw Error('Immagine SVG non verificata');objectSources.set(object,source);}if(object instanceof FabricText){for(let node:Element|null=element;node;node=node.parentElement)if(node.hasAttribute('text-anchor')){textAnchors.set(object,node.getAttribute('text-anchor')!);break;}}if(element.hasAttribute('textLength')){if(element.getAttribute('lengthAdjust')!=='spacingAndGlyphs'||!['start',null].includes(element.getAttribute('text-anchor')))throw new Error('Dilatazione SVG supportata solo con testo ancorato a sinistra');textLengths.set(object,Number(element.getAttribute('textLength')));}}); let objects: SceneObject[] = [],expandedStrokes=0;
  if (parsed.objects.length > GRAPHIC_IMPORT_LIMITS.sourceElements) throw new Error(`SVG oltre il limite di elaborazione di ${GRAPHIC_IMPORT_LIMITS.sourceElements} elementi sorgente`);
  for (const object of parsed.objects) {
    if (!object)throw Error('Il parser SVG non ha importato tutti gli elementi');if(!object.visible)continue; const fill = paint(object.fill), stroke = paint(object.stroke); if (!options.preserveUnpainted&&!(object instanceof FabricImage)&&fill === 'none' && stroke === 'none') continue;
    const m = object.calcTransformMatrix(), sx = Math.hypot(m[0], m[1]), sy = Math.hypot(m[2], m[3]);
    const clips=objectClips.get(object)??[];
    if(object instanceof FabricImage){
      if(sx<=0||sy<=0||Math.abs(m[0]*m[2]+m[1]*m[3])>1e-7*sx*sy)throw Error('Immagine SVG inclinata: trasformazione non rappresentabile senza alterare i pixel');
      if(stroke!=='none'&&object.strokeWidth>0)throw Error('Immagine SVG con contorno non ancora rappresentabile');
      const source=objectSources.get(object);if(!source)throw Error('Immagine SVG non verificata');
      object.set({strokeWidth:0});object.setCoords();const box=object.getBoundingRect(),inverse=util.invertTransform(m),crop=checkedRasterCrop(source,{leftPx:object.cropX,topPx:object.cropY,widthPx:object.width,heightPx:object.height});
      const masks=canonicalMasks(clips,(x,y)=>{const px=x/PX_TO_MM,py=y/PX_TO_MM;return{x:(inverse[0]*px+inverse[2]*py+inverse[4])/object.width+.5,y:(inverse[1]*px+inverse[3]*py+inverse[5])/object.height+.5};});
      objects.push({id:`svg-${crypto.randomUUID()}`,type:'image',xMm:box.left*PX_TO_MM,yMm:box.top*PX_TO_MM,widthMm:object.width*sx*PX_TO_MM,heightMm:object.height*sy*PX_TO_MM,rotationDeg:Math.atan2(m[1],m[0])*180/Math.PI,pixelAspectRatio:sx/sy,flipY:m[0]*m[3]-m[1]*m[2]<0,source,raster:{...DEFAULT_RASTER,mode:monochrome?'binary':'original'},crop,...(masks?{clipMasks:masks}:{})});continue;
    }
    if (object instanceof FabricText) {
      if (clips.length || object.clipPath || stroke !== 'none' || fill === 'none' || object.path || m[0]*m[3]-m[1]*m[2] <= 0 || Math.abs(m[0]*m[2]+m[1]*m[3]) > 1e-7*sx*sy) throw new Error('Testo SVG con contorno, riflessione, ritaglio o inclinazione non supportato in modalità editabile');
      object.set({strokeWidth:0}); object.setCoords();
      const family=canonicalFontFamily(object.fontFamily)!, fontSizePt=object.fontSize*sy*.75, box=object.getBoundingRect();
      if(fontSizePt<EDITOR_LIMITS.minFontSizePt-1e-7||fontSizePt>EDITOR_LIMITS.maxFontSizePt+1e-7)throw new Error(`Corpo del testo fuori dall’intervallo ${EDITOR_LIMITS.minFontSizePt}–${EDITOR_LIMITS.maxFontSizePt} pt del laboratorio: usare un altro formato o importare come contorni`);
      const length=textLengths.get(object);if(length&&Math.abs(m[1])>1e-7)throw new Error('Testo SVG ruotato con dilatazione non ancora supportato');
      const text:SceneObject={id:`svg-${crypto.randomUUID()}`,type:'text',xMm:box.left*PX_TO_MM,yMm:box.top*PX_TO_MM,rotationDeg:Math.atan2(m[1],m[0])*180/Math.PI,text:object.text,fontFamily:family,fontSizePt,textScaleX:sx/sy*(length?length/object.width:1),fill,fontWeight:object.fontWeight==='bold'||object.fontWeight===700?'bold':'normal',fontStyle:object.fontStyle==='italic'?'italic':'normal',textAlign:textAnchors.get(object)==='middle'?'center':textAnchors.get(object)==='end'?'right':'left',lineHeight:1,...(object.charSpacing?{letterSpacingPt:object.charSpacing/1000*fontSizePt}: {})};
      const measured=measureFabric(text); text.textBox={widthMm:measured.widthMm,heightMm:measured.heightMm,autoWidth:true,autoHeight:true};objects.push(text);continue;
    }
    if (stroke !== 'none' && (Math.abs(sx - sy) > 1e-7 * Math.max(sx, sy) || Math.abs(m[0] * m[2] + m[1] * m[3]) > 1e-7 * sx * sy)) {
      if(clips.length||object.clipPath)throw Error('Contorno deformato con ritaglio: espansione combinata ancora da convertire');
      const outlined=await requestStrokeOutline({schemaVersion:1,commands:shapeCommands(object,[1,0,0,1,0,0],1),matrix:m.map(v=>v*PX_TO_MM) as TMat2D,strokeWidth:object.strokeWidth,lineCap:object.strokeLineCap,lineJoin:object.strokeLineJoin,miterLimit:object.strokeMiterLimit}),commands=shapeCommands(object),bounds=vectorBounds(commands);
      if(fill!=='none'&&!(object instanceof Line)&&bounds.width>0&&bounds.height>0)objects.push(expandedFill(commands,fill,object.fillRule));
      // Keep the entire compound stroke in one path. Inner contours must never
      // be split away from their outer contour, which would fill the holes.
      objects.push(expandedFill(outlined.commands,stroke,'nonzero'));expandedStrokes++;continue;
    }
    const commands = shapeCommands(object); if (!commands.length && stroke === 'none') continue; const box = vectorBounds(commands); if (!Number.isFinite(box.width) || !Number.isFinite(box.height) || !box.width && !box.height) throw new Error('Tracciato SVG degenere');
    const strokeMm = stroke === 'none' ? .25 : object.strokeWidth * sx * PX_TO_MM; if (!StrokeWidthSchema.safeParse(strokeMm).success) throw new Error(`Contorno SVG fuori dal limite di capacità del laboratorio: deve essere positivo e non superare ${EDITOR_LIMITS.maxStrokeMm} mm`);
    let clipRect:VectorObject['clipRect'];let masks=canonicalMasks(clips,(x,y)=>({x:(x-box.x)/box.width,y:(y-box.y)/box.height}));
    if(masks?.length===1){const mask=masks[0]!,points=mask.commands.filter(c=>c[0]==='M'||c[0]==='L');if(mask.commands.length===5&&points.length===4&&points.every(p=>[0,1].some(x=>Math.abs(p[1]-x)<1e-7)&&[0,1].some(y=>Math.abs(p[2]-y)<1e-7))){const f=mask.frame;clipRect={left:f.left,top:f.top,right:f.left+f.width,bottom:f.top+f.height};if(stroke==='none'&&clipRect.left<=1e-8&&clipRect.top<=1e-8&&clipRect.right>=1-1e-8&&clipRect.bottom>=1-1e-8){clipRect=undefined;masks=undefined;}else if(VectorClipSchema.safeParse(clipRect).success)masks=undefined;else clipRect=undefined;}}
    objects.push({ id: `svg-${crypto.randomUUID()}`, type: 'vector', xMm: box.x - (stroke === 'none' ? 0 : strokeMm / 2), yMm: box.y - (stroke === 'none' ? 0 : strokeMm / 2), widthMm: box.width, heightMm: box.height, ...(clipRect ? { clipRect } : {}),...(masks?{clipMasks:masks}:{}), commands: VectorCommandsSchema.parse(mapVector(commands, (x, y) => ({ x: box.width ? (x - box.x) / box.width : 0, y: box.height ? (y - box.y) / box.height : 0 }))), fill, fillRule: object.fillRule, stroke, strokeMm, strokeLineCap: object.strokeLineCap, strokeLineJoin: object.strokeLineJoin, strokeMiterLimit: object.strokeMiterLimit });
  }
  if (objects.length > EDITOR_LIMITS.objects && objects.every((o):o is VectorObject=>o.type==='vector')) objects = compactVectors(objects);
  if(objects.reduce((sum,object)=>sum+maskedCommandCount(object),0)>EDITOR_LIMITS.vectorCommands)throw Error('SVG oltre il budget di comandi vettoriali, incluse le maschere');
  if (!objects.length) throw new Error('SVG senza elementi visibili'); const bounds=selectionBounds(objects,measureFabric);return { monochrome, objects, ...(typeof parsed.options.width==='number'&&typeof parsed.options.height==='number'&&parsed.options.width>0&&parsed.options.height>0?{viewportMm:{xMm:0,yMm:0,widthMm:parsed.options.width*PX_TO_MM,heightMm:parsed.options.height*PX_TO_MM}}:{}), ...(fontAssets.length?{fontAssets}:{}),...(expandedStrokes?{expandedStrokes}:{}),widthMm:bounds.widthMm,heightMm:bounds.heightMm };
}
export function svgInsertion(prepared: PreparedSvg, doc: GraphicDocument, measure: Measure, minimumFontPt: number | null = null): { command: Extract<GraphicCommand, { tool: 'insertObjects' }>; report: string } {
  if (doc.objects.length + prepared.objects.length > EDITOR_LIMITS.objects) throw new Error(`L’importazione supera i ${EDITOR_LIMITS.objects} oggetti del laboratorio`);
  const bounds = selectionBounds(prepared.objects, measure), scale = Math.min(1, (doc.areaMm.width - 4) / bounds.widthMm, (doc.areaMm.height - 4) / bounds.heightMm);
  const objects = transformSelection(prepared.objects.map(cloneSceneObject), { scale, rotationDeg: 0, center: { xMm: doc.areaMm.width / 2, yMm: doc.areaMm.height / 2 } }, measure), groups = objects.length > 1 ? [{ id: `svg-group-${crypto.randomUUID()}`, objectIds: objects.map(o => o.id) }] : [];
  if(scale<1)assertMinimumText({...doc,objects,groups},minimumFontPt);
  const fontAssets=[...doc.fontAssets??[]];for(const asset of prepared.fontAssets??[])if(!fontAssets.some(a=>a.id===asset.id))fontAssets.push(asset);
  DocumentSchema.parse({ ...doc, ...(fontAssets.length?{fontAssets}:{}), objects: [...doc.objects, ...objects], ...(groups.length ? { groups: [...doc.groups ?? [], ...groups] } : {}) });
  const command: Extract<GraphicCommand, { tool: 'insertObjects' }> = { schemaVersion: 1, tool: 'insertObjects', objectId: objects[0]!.id, expectedRevision: doc.revision, arguments: { objects, groups, ...(prepared.fontAssets?.length?{fontAssets:prepared.fontAssets}:{}) } };
  const texts=objects.filter(o=>o.type==='text').length,images=objects.filter(o=>o.type==='image').length;
  return { command, report: `SVG importato: ${objects.length} elementi${images?`, di cui ${images} immagini incorporate`:''}${texts?`, di cui ${texts} testi editabili`:images?'':' vettoriali'}; ingombro originale ${bounds.widthMm.toFixed(2)} × ${bounds.heightMm.toFixed(2)} mm${scale < 1 ? `, adattato al ${(scale * 100).toFixed(1)}% per l’area di prova` : ', scala originale'}.${prepared.monochrome ? ' Importazione nella palette nero/bianco: colori diversi convertiti in nero.' : ''}${prepared.expandedStrokes?` ${prepared.expandedStrokes} contorni deformati convertiti in forme per conservarne l’aspetto.`:''}` };
}
