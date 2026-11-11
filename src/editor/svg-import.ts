import { StrokeWidthSchema } from './stroke';
import {canonicalPaint} from './paint';
import { EDITOR_LIMITS,TEST_MIN_FONT_SIZE_PT } from './limits';
import { compactVectors } from './vector-compaction';
import { loadSVGFromString, FabricText, Path, Rect, Circle, Ellipse, Line, Polyline, Polygon, util, type FabricObject, type TMat2D } from 'fabric';
import { importedFontFamily, renderFontFamily, canonicalFontFamily, fontAssetArguments } from './fonts';
import { measureFabric } from './fabric-adapter';
import { assertFontGeometry } from './verified-font-geometry';
import type { FontAsset } from './font-assets';
import { sanitizeSvg } from './svg-sanitize';
import { mapVector, vectorBounds, VectorCommandsSchema, type VectorCommand } from './vector-geometry';
import { DocumentSchema, cloneSceneObject, type GraphicDocument, type GraphicCommand, type Measure, type SceneObject } from './model';
import { transformSelection, selectionBounds } from './selection';
type VectorObject = Extract<SceneObject, { type: 'vector' }>;
const PX_TO_MM = 25.4 / 96;
function shapeCommands(object: FabricObject | NonNullable<FabricObject['clipPath']>, matrix?: TMat2D): VectorCommand[] {
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
  return mapVector(cleaned, (x, y) => ({ x: ((x - offset.x) * m[0] + (y - offset.y) * m[2] + m[4]) * PX_TO_MM, y: ((x - offset.x) * m[1] + (y - offset.y) * m[3] + m[5]) * PX_TO_MM }));
}
const paint = canonicalPaint;

export type ImportTextMode = 'outlines' | 'editable';
export interface PreparedSvg { monochrome: boolean; objects: SceneObject[]; fontAssets?: FontAsset[]; widthMm: number; heightMm: number; }
export async function prepareSvg(source: string, monochrome = false, textMode: ImportTextMode = 'outlines'): Promise<PreparedSvg> {
  let safe = sanitizeSvg(source, monochrome, true);
  const xml = new DOMParser().parseFromString(safe, 'image/svg+xml'), hasText = !!xml.querySelector('text');
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
      return { ...await prepareSvg(result.svg, false, 'editable'), monochrome };
    }
  }
  const textLengths=new WeakMap<FabricObject,number>(),textAnchors=new WeakMap<FabricObject,string>();
  const parsed = await loadSVGFromString(safe,(element,object)=>{if(object instanceof FabricText){for(let node:Element|null=element;node;node=node.parentElement)if(node.hasAttribute('text-anchor')){textAnchors.set(object,node.getAttribute('text-anchor')!);break;}}if(element.hasAttribute('textLength')){if(element.getAttribute('lengthAdjust')!=='spacingAndGlyphs'||!['start',null].includes(element.getAttribute('text-anchor')))throw new Error('Dilatazione SVG supportata solo con testo ancorato a sinistra');textLengths.set(object,Number(element.getAttribute('textLength')));}}); let objects: SceneObject[] = [];
  if (parsed.objects.length > 500) throw new Error('SVG oltre il limite di elaborazione di 500 elementi sorgente');
  for (const object of parsed.objects) {
    if (!object || !object.visible) continue; const fill = paint(object.fill), stroke = paint(object.stroke); if (fill === 'none' && stroke === 'none') continue;
    const m = object.calcTransformMatrix(), sx = Math.hypot(m[0], m[1]), sy = Math.hypot(m[2], m[3]);
    if (object instanceof FabricText) {
      if (object.clipPath || stroke !== 'none' || fill === 'none' || object.path || m[0]*m[3]-m[1]*m[2] <= 0 || Math.abs(m[0]*m[2]+m[1]*m[3]) > 1e-7*sx*sy) throw new Error('Testo SVG con contorno, riflessione, ritaglio o inclinazione non supportato in modalità editabile');
      object.set({strokeWidth:0}); object.setCoords();
      const family=canonicalFontFamily(object.fontFamily)!, fontSizePt=object.fontSize*sy*.75, box=object.getBoundingRect();
      if(fontSizePt<TEST_MIN_FONT_SIZE_PT-1e-7||fontSizePt>EDITOR_LIMITS.maxFontSizePt+1e-7)throw new Error(`Corpo del testo fuori dall’intervallo ${TEST_MIN_FONT_SIZE_PT}–${EDITOR_LIMITS.maxFontSizePt} pt del laboratorio: usare un altro formato o importare come contorni`);
      const length=textLengths.get(object);if(length&&Math.abs(m[1])>1e-7)throw new Error('Testo SVG ruotato con dilatazione non ancora supportato');
      const text:SceneObject={id:`svg-${crypto.randomUUID()}`,type:'text',xMm:box.left*PX_TO_MM,yMm:box.top*PX_TO_MM,rotationDeg:Math.atan2(m[1],m[0])*180/Math.PI,text:object.text,fontFamily:family,fontSizePt,textScaleX:sx/sy*(length?length/object.width:1),fill,fontWeight:object.fontWeight==='bold'||object.fontWeight===700?'bold':'normal',fontStyle:object.fontStyle==='italic'?'italic':'normal',textAlign:textAnchors.get(object)==='middle'?'center':textAnchors.get(object)==='end'?'right':'left',lineHeight:1,...(object.charSpacing?{letterSpacingPt:object.charSpacing/1000*fontSizePt}: {})};
      const measured=measureFabric(text); text.textBox={widthMm:measured.widthMm,heightMm:measured.heightMm,autoWidth:true,autoHeight:true};objects.push(text);continue;
    }
    if (stroke !== 'none' && (Math.abs(sx - sy) > 1e-7 * Math.max(sx, sy) || Math.abs(m[0] * m[2] + m[1] * m[3]) > 1e-7 * sx * sy)) throw new Error('Contorno SVG con deformazione non uniforme: espandilo in tracciati prima di importare');
    const commands = shapeCommands(object); if (!commands.length && stroke === 'none') continue; const box = vectorBounds(commands); if (!Number.isFinite(box.width) || !Number.isFinite(box.height) || !box.width && !box.height) throw new Error('Tracciato SVG degenere');
    const strokeMm = stroke === 'none' ? .25 : object.strokeWidth * sx * PX_TO_MM; if (!StrokeWidthSchema.safeParse(strokeMm).success) throw new Error(`Contorno SVG fuori dal limite di capacità del laboratorio: deve essere positivo e non superare ${EDITOR_LIMITS.maxStrokeMm} mm`);
    let clipRect: VectorObject['clipRect'];
    if (object.clipPath) {
      if (!box.width || !box.height || object.clipPath.clipPath) throw new Error('Ritaglio SVG non rappresentabile');
      const clip = shapeCommands(object.clipPath, util.multiplyTransformMatrices(object.calcTransformMatrix(), object.clipPath.calcTransformMatrix())), bounds = vectorBounds(clip), points = clip.filter(c=>c[0]==='M'||c[0]==='L');
      if (clip.some(c=>c[0]==='C') || clip.filter(c=>c[0]==='M').length!==1 || points.length!==4 || clip.at(-1)?.[0]!=='Z' || points.some(p=>(Math.min(Math.abs((p[1] as number)-bounds.x),Math.abs((p[1] as number)-bounds.x-bounds.width))>1e-6 || Math.min(Math.abs((p[2] as number)-bounds.y),Math.abs((p[2] as number)-bounds.y-bounds.height))>1e-6))) throw new Error('Ritaglio SVG non rettangolare: supporto in sviluppo');
      clipRect = { left:(bounds.x-box.x)/box.width,top:(bounds.y-box.y)/box.height,right:(bounds.x+bounds.width-box.x)/box.width,bottom:(bounds.y+bounds.height-box.y)/box.height };
      if (stroke === 'none' && clipRect.left <= 1e-8 && clipRect.top <= 1e-8 && clipRect.right >= 1-1e-8 && clipRect.bottom >= 1-1e-8) clipRect = undefined;
    }
    objects.push({ id: `svg-${crypto.randomUUID()}`, type: 'vector', xMm: box.x - (stroke === 'none' ? 0 : strokeMm / 2), yMm: box.y - (stroke === 'none' ? 0 : strokeMm / 2), widthMm: box.width, heightMm: box.height, ...(clipRect ? { clipRect } : {}), commands: VectorCommandsSchema.parse(mapVector(commands, (x, y) => ({ x: box.width ? (x - box.x) / box.width : 0, y: box.height ? (y - box.y) / box.height : 0 }))), fill, fillRule: object.fillRule, stroke, strokeMm, strokeLineCap: object.strokeLineCap, strokeLineJoin: object.strokeLineJoin, strokeMiterLimit: object.strokeMiterLimit });
  }
  if (objects.length > EDITOR_LIMITS.objects && objects.every((o):o is VectorObject=>o.type==='vector')) objects = compactVectors(objects);
  if (!objects.length) throw new Error('SVG senza elementi visibili'); const bounds=selectionBounds(objects,measureFabric);return { monochrome, objects, ...(fontAssets.length?{fontAssets}:{}),widthMm:bounds.widthMm,heightMm:bounds.heightMm };
}
export function svgInsertion(prepared: PreparedSvg, doc: GraphicDocument, measure: Measure): { command: Extract<GraphicCommand, { tool: 'insertObjects' }>; report: string } {
  if (doc.objects.length + prepared.objects.length > EDITOR_LIMITS.objects) throw new Error(`L’importazione supera i ${EDITOR_LIMITS.objects} oggetti del laboratorio`);
  const bounds = selectionBounds(prepared.objects, measure), scale = Math.min(1, (doc.areaMm.width - 4) / bounds.widthMm, (doc.areaMm.height - 4) / bounds.heightMm);
  const objects = transformSelection(prepared.objects.map(cloneSceneObject), { scale, rotationDeg: 0, center: { xMm: doc.areaMm.width / 2, yMm: doc.areaMm.height / 2 } }, measure), groups = objects.length > 1 ? [{ id: `svg-group-${crypto.randomUUID()}`, objectIds: objects.map(o => o.id) }] : [];
  if(objects.some(o=>o.type==='text'&&o.fontSizePt<7))throw new Error('L’adattamento porterebbe il testo sotto i 7 pt del profilo TEST. Scegli un formato più grande oppure importa come contorni.');
  const fontAssets=[...doc.fontAssets??[]];for(const asset of prepared.fontAssets??[])if(!fontAssets.some(a=>a.id===asset.id))fontAssets.push(asset);
  DocumentSchema.parse({ ...doc, ...(fontAssets.length?{fontAssets}:{}), objects: [...doc.objects, ...objects], ...(groups.length ? { groups: [...doc.groups ?? [], ...groups] } : {}) });
  const command: Extract<GraphicCommand, { tool: 'insertObjects' }> = { schemaVersion: 1, tool: 'insertObjects', objectId: objects[0]!.id, expectedRevision: doc.revision, arguments: { objects, groups, ...(prepared.fontAssets?.length?{fontAssets:prepared.fontAssets}:{}) } };
  const texts=objects.filter(o=>o.type==='text').length;
  return { command, report: `SVG importato: ${objects.length} elementi${texts?`, di cui ${texts} testi editabili`:' vettoriali'}; ingombro originale ${bounds.widthMm.toFixed(2)} × ${bounds.heightMm.toFixed(2)} mm${scale < 1 ? `, adattato al ${(scale * 100).toFixed(1)}% per l’area di prova` : ', scala originale'}.${prepared.monochrome ? ' Importazione nella palette nero/bianco: colori diversi convertiti in nero.' : ''}` };
}
