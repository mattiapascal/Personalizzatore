import {expect,it} from 'vitest';
import {DocumentStore,DocumentSchema,createDocument,objectCenter,objectGeometry,type GraphicDocument,type Measure,type SceneObject} from '../src/editor/model';
import {frameToWorld,worldToFrame,objectInclination} from '../src/editor/object-affine';
import {selectionBounds} from '../src/editor/selection';
import {pathWorldPoints,movePathNode} from '../src/editor/path-nodes';
import {bezierWorldNodes,moveBezierPart} from '../src/editor/bezier-nodes';
import {cropRasterInPlace} from '../src/editor/raster-crop-edit';
import {DEFAULT_RASTER} from '../src/editor/raster-processing';
import {rasterSourceFromBytes} from '../src/editor/raster-source';
import {testPng} from './helpers/png';
const measure:Measure=o=>o.type==='circle'?{widthMm:o.radiusMm*2,heightMm:o.radiusMm*2}:o.type==='ellipse'?{widthMm:o.rxMm*2,heightMm:o.ryMm*2}:o.type==='line'?{widthMm:o.lengthMm,heightMm:.25}:o.type==='text'?{widthMm:12,heightMm:6}:{widthMm:o.widthMm,heightMm:o.heightMm};
const fixture=():GraphicDocument=>DocumentSchema.parse({...createDocument(),areaMm:{width:120,height:80},objects:[{id:'a',type:'rect',xMm:8,yMm:10,widthMm:20,heightMm:12,fill:'#000000',stroke:'none',strokeMm:.25},{id:'b',type:'rect',xMm:50,yMm:40,widthMm:30,heightMm:16,fill:'#000000',stroke:'none',strokeMm:.25},{id:'c',type:'rect',xMm:95,yMm:60,widthMm:8,heightMm:10,fill:'#000000',stroke:'none',strokeMm:.25}]});
const cmd=(tool:string,args:unknown,revision=0,extra={})=>({schemaVersion:1,tool,objectId:'a',expectedRevision:revision,arguments:args,...extra});
for(const alignment of ['left','centerX','right','top','centerY','bottom'] as const)it(`allineamento ${alignment} a un master fermo, revisione atomica e Undo`,()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);store.dispatch(cmd('alignObjects',{objectIds:['a','b','c'],alignment,referenceObjectId:'b'}),'manual');
 const objects=store.document.objects,b=objects[1]!;expect(b).toEqual(doc.objects[1]);
 const edge=(o:SceneObject)=>alignment==='left'?o.xMm:alignment==='right'?o.xMm+measure(o).widthMm:alignment==='centerX'?objectCenter(o,measure).xMm:alignment==='top'?o.yMm:alignment==='bottom'?o.yMm+measure(o).heightMm:objectCenter(o,measure).yMm;
 for(const o of objects)expect(edge(o)).toBeCloseTo(edge(b),9);expect(store.document.revision).toBe(1);store.undo();expect(store.document.objects).toEqual(doc.objects);
});
it('pagina: ogni oggetto arriva al bordo zero, i gruppi rimangono unità',()=>{
 const doc=fixture();doc.groups=[{id:'group',objectIds:['a','b']}];const store=new DocumentStore(doc,measure);store.dispatch(cmd('alignObjectsToArea',{objectIds:['a','b','c'],alignment:'right',marginMm:0,individually:true}),'ai-simulation');const [a,b,c]=store.document.objects;expect(selectionBounds([a!,b!],measure).xMm+selectionBounds([a!,b!],measure).widthMm).toBe(120);expect(c!.xMm+measure(c!).widthMm).toBe(120);expect(b!.xMm-a!.xMm).toBe(doc.objects[1]!.xMm-doc.objects[0]!.xMm);expect(store.document.groups).toEqual(doc.groups);
});
it('un solo oggetto può allinearsi alla pagina e i comandi storici mantengono il margine TEST',()=>{
 const store=new DocumentStore(fixture(),measure);store.dispatch(cmd('alignObject',{alignment:'left',marginMm:0}),'manual');expect(store.document.objects[0]!.xMm).toBe(0);store.dispatch(cmd('alignObject',{alignment:'left'},1),'ai-simulation');expect(store.document.objects[0]!.xMm).toBe(1);
});
it('master estraneo, gruppo parziale, revisione obsoleta e trasformazioni bloccate non modificano nulla',()=>{
 const doc=fixture();doc.groups=[{id:'group',objectIds:['a','b']}];const store=new DocumentStore(doc,measure);
 for(const raw of [cmd('alignObjects',{objectIds:['a','b','c'],alignment:'left',referenceObjectId:'outside'}),cmd('reflectObjects',{objectIds:['a'],axis:'horizontal'}),cmd('inclineObjects',{objectIds:['a','b'],angleDeg:90}),cmd('inclineObjects',{objectIds:['a','b'],angleDeg:10},1),cmd('inclineObjects',{objectIds:['a','b'],angleDeg:10},0,{targetScope:'object'})])expect(()=>store.dispatch(raw,'manual')).toThrow();expect(store.document).toEqual(doc);
 doc.groups[0]!.editor={transformLocked:true};const locked=new DocumentStore(doc,measure);expect(()=>locked.dispatch(cmd('reflectObjects',{objectIds:['a','b'],axis:'horizontal'}),'ai-simulation')).toThrow('bloccate');expect(locked.document).toEqual(doc);
});
it('un gruppo master resta fermo, gli altri elementi si allineano al suo ingombro',()=>{
 const doc=fixture();doc.groups=[{id:'group',objectIds:['a','b']}];const store=new DocumentStore(doc,measure);store.dispatch(cmd('alignObjects',{objectIds:['a','b','c'],alignment:'centerY',referenceObjectId:'a'}),'manual');expect(store.document.objects.slice(0,2)).toEqual(doc.objects.slice(0,2));const b=selectionBounds(doc.objects.slice(0,2),measure);expect(objectCenter(store.document.objects[2]!,measure).yMm).toBe(b.yMm+b.heightMm/2);
});
it('riflessione rispetto al foglio, anche di elementi ruotati/inclinati: punti speculari e doppia riflessione',()=>{
 const doc=fixture();doc.objects[0]={...doc.objects[0]!,rotationDeg:31,skewXDeg:18};const store=new DocumentStore(doc,measure),box=selectionBounds(doc.objects,measure),pivot=box.xMm+box.widthMm/2;
 const point=(o:SceneObject,x:number,y:number)=>{const c=objectCenter(o,measure),v=frameToWorld(o,x,y);return{x:c.xMm+v.x,y:c.yMm+v.y};},before=point(doc.objects[0]!,3,4);
 store.dispatch(cmd('reflectObjects',{objectIds:['a','b','c'],axis:'horizontal'}),'manual');const after=point(store.document.objects[0]!,3,4);expect(after.x).toBeCloseTo(2*pivot-before.x,9);expect(after.y).toBeCloseTo(before.y,9);
 store.dispatch(cmd('reflectObjects',{objectIds:['a','b','c'],axis:'horizontal'},1),'ai-simulation');const twice=point(store.document.objects[0]!,3,4);expect(twice.x).toBeCloseTo(before.x,9);expect(twice.y).toBeCloseTo(before.y,9);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toEqual(store.document.objects);
});
it('inclinazione mantiene i centri, converte la proprietà storica del testo e conserva la selezione diretta',()=>{
 const doc=fixture();doc.objects.push({id:'text',type:'text',xMm:4,yMm:4,text:'TEST',fontFamily:'Arial',fontSizePt:10,fill:'#000000',textSkewXDeg:12});const store=new DocumentStore(doc,measure);const centers=doc.objects.map(o=>objectCenter(o,measure));store.dispatch(cmd('inclineObjects',{objectIds:doc.objects.map(o=>o.id),angleDeg:24}),'manual');store.document.objects.forEach((o,i)=>{expect(objectCenter(o,measure).xMm).toBeCloseTo(centers[i]!.xMm,9);expect(objectCenter(o,measure).yMm).toBeCloseTo(centers[i]!.yMm,9);expect(objectInclination(o)).toBeCloseTo(24,9);});expect(store.document.objects.at(-1)).toMatchObject({textSkewXDeg:24});
 const grouped=fixture();grouped.groups=[{id:'g',objectIds:['a','b']}];const member=new DocumentStore(grouped,measure);member.dispatch(cmd('inclineObjects',{objectIds:['a'],angleDeg:10},0,{targetScope:'object'}),'manual');expect(member.document.objects.slice(1)).toEqual(grouped.objects.slice(1));expect(member.document.groups).toEqual(grouped.groups);
});
it('trasformazioni/inversa dei punti e nodi restano coerenti su poligoni e Bézier',()=>{
 const path:Extract<SceneObject,{type:'path'}>={id:'p',type:'path',xMm:10,yMm:10,widthMm:20,heightMm:12,rotationDeg:32,skewXDeg:21,mirrorX:true,points:[{x:0,y:0},{x:1,y:0},{x:1,y:1}],closed:false,stroke:'#000000',strokeMm:.25};
 const v=frameToWorld(path,4,5),inverse=worldToFrame(path,v.x,v.y);expect(inverse.x).toBeCloseTo(4,10);expect(inverse.y).toBeCloseTo(5,10);
 const p=pathWorldPoints(path,measure),next=movePathNode(path,1,{xMm:p[1]!.xMm+2,yMm:p[1]!.yMm+3},measure),points=pathWorldPoints(next,measure);expect(points[0]!.xMm).toBeCloseTo(p[0]!.xMm,7);expect(points[1]!.yMm).toBeCloseTo(p[1]!.yMm+3,7);
 const {points:_points,...base}=path,bezier={...base,type:'bezier' as const,nodes:[{x:0,y:0,out:{x:.2,y:.5}},{x:1,y:1,in:{x:.8,y:.5}}]};const nodes=bezierWorldNodes(bezier,measure),changed=moveBezierPart(bezier,0,'out',{x:nodes[0]!.out!.x+1,y:nodes[0]!.out!.y-2},measure),after=bezierWorldNodes(changed,measure);expect(after[0]!.x).toBeCloseTo(nodes[0]!.x,7);expect(after[0]!.out!.x).toBeCloseTo(nodes[0]!.out!.x+1,7);
});
it('ritaglio di un’immagine inclinata e riflessa mantiene fermi i pixel superstiti',()=>{
 const image:Extract<SceneObject,{type:'image'}>={id:'i',type:'image',xMm:10,yMm:10,widthMm:20,heightMm:10,rotationDeg:23,skewXDeg:19,mirrorY:true,flipX:true,source:rasterSourceFromBytes('asset-test',testPng(20,10)),raster:DEFAULT_RASTER};
 const next=cropRasterInPlace(image,{leftPx:2,topPx:1,widthPx:17,heightPx:8},measure),c=objectCenter(image,measure),n=objectCenter(next,measure),delta=frameToWorld(image,-.5,0);expect(n.xMm-c.xMm).toBeCloseTo(delta.x,8);expect(n.yMm-c.yMm).toBeCloseTo(delta.y,8);
});
it('misura i quattro angoli del parallelogramma e non una seconda rotazione del rettangolo già inclinato',()=>{
 const o={...fixture().objects[0]!,skewXDeg:25,rotationDeg:40,mirrorX:true},g=objectGeometry(o,measure),center=objectCenter(o,measure),local=[[-10,-6],[10,-6],[10,6],[-10,6]].map(([x,y])=>frameToWorld(o,x!,y!));expect(g.widthMm).toBeCloseTo(Math.max(...local.map(p=>p.x))-Math.min(...local.map(p=>p.x)),10);expect((Math.min(...g.corners.map(p=>p.x))+Math.max(...g.corners.map(p=>p.x)))/2).toBeCloseTo(center.xMm,10);
});
it('inclinazioni oltre il limite geometrico effettivo vengono rifiutate anche con frame nominale valido',()=>{
 const doc=fixture();doc.objects=[{id:'a',type:'rect',xMm:0,yMm:0,widthMm:3000,heightMm:3000,stroke:'none',strokeMm:.25}];const store=new DocumentStore(doc,measure);expect(()=>store.dispatch(cmd('inclineObjects',{objectIds:['a'],angleDeg:75}),'manual')).toThrow('Ingombro trasformato');expect(store.document).toEqual(doc);
});
it('azzera l’inclinazione di un cerchio ruotato senza perderne il centro o lasciargli una rotazione priva di significato',()=>{
 const doc=fixture();doc.objects=[{id:'a',type:'circle',xMm:5,yMm:5,radiusMm:10,skewXDeg:24,rotationDeg:17,stroke:'#000000',strokeMm:.25}];const center=objectCenter(doc.objects[0]!,measure),store=new DocumentStore(doc,measure);store.dispatch(cmd('inclineObjects',{objectIds:['a'],angleDeg:0}),'manual');expect(store.document.objects[0]).toMatchObject({skewXDeg:0,rotationDeg:0});expect(objectCenter(store.document.objects[0]!,measure).xMm).toBeCloseTo(center.xMm,8);expect(objectCenter(store.document.objects[0]!,measure).yMm).toBeCloseTo(center.yMm,8);
});
it('contorni inclinati con oltre 100 mila punti campionati rimangono verificabili senza eccedere la pila JavaScript',async()=>{
 const{objectIntersectsArea}=await import('../src/editor/model'),doc=fixture(),commands:Extract<SceneObject,{type:'vector'}>['commands']=[['M',0,0],['L',1,0],['L',1,1],['L',0,1],...Array.from({length:2200},()=>['C',0,0,1,1,0,0] as ['C',number,number,number,number,number,number]),['Z']];
 const object:Extract<SceneObject,{type:'vector'}>={id:'a',type:'vector',xMm:5,yMm:5,widthMm:20,heightMm:10,commands,skewXDeg:24,rotationDeg:17,fill:'#000000',fillRule:'nonzero',stroke:'none',strokeMm:.25,strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4};expect(objectIntersectsArea(doc,object,measure)).toBe(true);
});
