import{expect,it}from'vitest';
import{boundedBackingDensity,canvasWindow,sameCanvasWindow,canvasWindowContains}from'../src/editor/canvas-window';
it('piccolo foglio identico, indipendente dalla posizione e dallo zoom del documento',()=>{
 const full=canvasWindow({width:800,height:560},{x:300,y:100,width:500,height:400},2);expect(full).toEqual({paperWidth:800,paperHeight:560,x:0,y:0,width:800,height:560,windowed:false});expect(sameCanvasWindow(full,{...full})).toBe(true);expect(sameCanvasWindow(null,full)).toBe(false);
});
it('foglio 3 m al 400%: ritaglio con aria, senza allocare i 96.000 pixel del foglio',()=>{
 const frame=canvasWindow({width:96000,height:96000},{x:35000.4,y:71000.7,width:900,height:700},2);expect(frame).toMatchObject({x:34872,y:70872,width:1157,height:957,windowed:true});expect(frame.x+frame.width).toBeGreaterThanOrEqual(35900.4);expect(frame.y+frame.height).toBeGreaterThanOrEqual(71700.7);expect(boundedBackingDensity(frame.width,frame.height,2)).toBe(2);
});
it('bordi, viewport parziale e foglio totalmente spostato fuori vista restano finiti e limitati',()=>{
 const paper={width:96000,height:24000};expect(canvasWindow(paper,{x:-300,y:-200,width:900,height:700},2)).toMatchObject({x:0,y:0,width:728,height:628});expect(canvasWindow(paper,{x:95900,y:23900,width:900,height:700},2)).toMatchObject({x:95772,y:23772,width:228,height:228});expect(canvasWindow(paper,{x:100000,y:-3000,width:900,height:700},2)).toMatchObject({x:95999,y:0,width:1,height:1});
});
for(const ratio of[.5,1,1.25,2,3,10])it(`Retina ${ratio}: anche schermi molto grandi e cambi verticali/orizzontali entro il budget`,()=>{
 for(const[width,height]of[[1,1],[1200,900],[900,1200],[8192,8192],[16000,12000],[0,900],[900,0]]){const density=boundedBackingDensity(width!,height!,ratio),w=Math.floor(width!*density),h=Math.floor(height!*density);expect(density).toBeGreaterThan(0);expect(density).toBeLessThanOrEqual(ratio);expect(Math.max(w,h)).toBeLessThanOrEqual(8192);expect(w*h).toBeLessThanOrEqual(16_000_000);}
});
it('dati impossibili rifiutati prima dell’allocazione',()=>{
 for(const values of[[NaN,10,1],[10,-1,1],[1,1,0],[Infinity,1,2]])expect(()=>boundedBackingDensity(values[0]!,values[1]!,values[2]!)).toThrow();expect(()=>canvasWindow({width:10,height:0},{x:0,y:0,width:10,height:10},1)).toThrow();expect(()=>canvasWindow({width:10,height:10},{x:NaN,y:0,width:10,height:10},1)).toThrow();
});

it('riuso del buffer: piccoli PAN dentro il margine, prima dell’uscita visibile si ripianifica',()=>{
 const frame=canvasWindow({width:96000,height:96000},{x:1000,y:2000,width:900,height:700},2);expect(canvasWindowContains(frame,{x:1050,y:2050,width:900,height:700})).toBe(true);expect(canvasWindowContains(frame,{x:1100,y:2050,width:900,height:700})).toBe(false);expect(canvasWindowContains(frame,{x:-10000,y:2050,width:900,height:700})).toBe(false);const edge=canvasWindow({width:96000,height:96000},{x:0,y:0,width:900,height:700},2);expect(canvasWindowContains(edge,{x:-100,y:-100,width:900,height:700})).toBe(true);
});
