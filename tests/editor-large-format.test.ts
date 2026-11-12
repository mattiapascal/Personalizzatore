import{it,expect}from'vitest';
import{GraphicAreaSchema}from'../src/editor/graphic-area';import{AreaSchema}from'../src/catalog/schema';
import{canvasZoomLimit,CANVAS_BITMAP_LIMITS,PX_PER_MM}from'../src/editor/canvas-size';
import{DocumentSchema,DocumentStore,GraphicCommandSchema,createDocument,type SceneObject}from'../src/editor/model';
import{defaultProductionProfile,ProductionProfileDataSchema}from'../src/editor-admin/production-profile';
import{DEFAULT_PLAQUE_MOUNTING,plaqueMountingPoints}from'../src/editor/plaque';import{pngExportSize}from'../src/editor/png-export';
const rectangle:SceneObject={id:'large',type:'rect',xMm:20,yMm:20,widthMm:1100,heightMm:300,stroke:'none',strokeMm:.1,fill:'#000000'};
const measure=(o:SceneObject)=>({widthMm:'widthMm'in o?o.widthMm:10,heightMm:'heightMm'in o?o.heightMm:10});
it('formati locali fino a 3 m, anche nelle altre pagine; il contratto pubblico conserva il suo limite',async()=>{
 expect(GraphicAreaSchema.parse({width:3000,height:3000})).toEqual({width:3000,height:3000});expect(AreaSchema.safeParse({width:1100,height:400}).success).toBe(false);
 const doc={...createDocument(),areaMm:{width:1100,height:400},objects:[rectangle]},s=new DocumentStore(doc,measure);s.dispatch({schemaVersion:1,tool:'addPage',objectId:'project',expectedRevision:0,arguments:{page:{id:'large-page',name:'Tre metri',productId:null,variantId:null,catalogVersion:null,areaMm:{width:3000,height:3000},shape:'rectangle',objects:[]}}},'manual');expect(DocumentSchema.parse(JSON.parse(JSON.stringify(s.document))).areaMm.width).toBe(3000);
 for(const width of[3000.001,Infinity,NaN,0,-1])expect(GraphicAreaSchema.safeParse({width,height:400}).success).toBe(false);
 const{importPitchPrint}=await import('../src/editor/pitchprint-import');let reads=0;for(const area of[{width:3000.001,height:400},{width:400,height:3000.001}])await expect(importPitchPrint({unit:'mm',pages:[{pageData:{fWidth:area.width,fHeight:area.height},canvas:{clipPath:{width:100,height:100},objects:[]}}]},{monochrome:false,excludeBackground:false,font:async()=>{reads++;throw Error('Non leggere');},image:async()=>{reads++;throw Error('Non leggere');}})).rejects.toThrow('Formato');expect(reads).toBe(0);
});
it('geometria e spostamenti manuali/AI condividono nuovi limiti, rifiuto atomico e Undo',()=>{
 const s=new DocumentStore({...createDocument(),areaMm:{width:3000,height:1000},objects:[rectangle]},measure);
 for(const[actor,xMm]of[['manual',1200],['ai-simulation',1400]]as const){s.dispatch({schemaVersion:1,tool:'moveObject',objectId:'large',expectedRevision:s.document.revision,arguments:{xMm,yMm:20}},actor);expect(s.document.objects[0]!.xMm).toBe(xMm);}
 const before=structuredClone(s.document);expect(()=>s.dispatch({schemaVersion:1,tool:'updateObject',objectId:'large',expectedRevision:s.document.revision,arguments:{object:{...rectangle,widthMm:3000.1}}},'manual')).toThrow();expect(s.document).toEqual(before);s.undo();expect(s.document.objects[0]!.xMm).toBe(1200);s.redo();expect(s.document.objects).toEqual(before.objects);
 expect(GraphicCommandSchema.safeParse({schemaVersion:1,tool:'moveObjects',objectId:'large',expectedRevision:0,arguments:{objectIds:['large'],deltaXmm:3000,deltaYmm:0}}).success).toBe(true);
});
it('profilo, zone riservate e fissaggi seguono il grande formato, senza certificazioni commerciali',()=>{
 const profile={...defaultProductionProfile('printed-plaque'),label:'Grande TEST',usableArea:{widthMm:3000,heightMm:2000,shape:'rectangle'},reservedAreas:[{id:'11111111-1111-4111-8111-111111111111',label:'Zona',shape:'rectangle',xMm:2700,yMm:1700,widthMm:200,heightMm:200}]};expect(ProductionProfileDataSchema.safeParse(profile).success).toBe(true);
 const mounting={...DEFAULT_PLAQUE_MOUNTING,method:'screws' as const};expect(plaqueMountingPoints({width:3000,height:2000},mounting).at(-1)).toEqual({xMm:2985,yMm:1985});
});
it('zoom massimo contiene lato e pixel del bitmap a DPR 1–4; formati piccoli conservano il 400%',()=>{
 expect(canvasZoomLimit({width:58,height:22},2)).toBe(4);
 for(const area of[{width:1100,height:400},{width:3000,height:3000},{width:3000,height:30},{width:30,height:3000}])for(const dpr of[1,1.25,2,3,4]){const zoom=canvasZoomLimit(area,dpr),w=area.width*PX_PER_MM*zoom*dpr,h=area.height*PX_PER_MM*zoom*dpr;expect(Math.max(w,h)).toBeLessThanOrEqual(CANVAS_BITMAP_LIMITS.side);expect(w*h).toBeLessThanOrEqual(CANVAS_BITMAP_LIMITS.pixels);expect(zoom).toBeGreaterThanOrEqual(.01);}
 for(const area of[{width:0,height:1},{width:NaN,height:1},{width:1,height:Infinity}])expect(()=>canvasZoomLimit(area)).toThrow();expect(()=>canvasZoomLimit({width:3000,height:3000},100)).toThrow();
});
it('PNG del cartello a 150 dpi entro budget; risoluzioni e tavole troppo grandi restano bloccate',()=>{
 expect(pngExportSize({width:1100,height:400},150)).toMatchObject({width:6496,height:2362});expect(()=>pngExportSize({width:1100,height:400},300)).toThrow('limite');expect(()=>pngExportSize({width:3000,height:3000},150)).toThrow('limite');
});
