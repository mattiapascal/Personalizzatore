import {expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {ellipseFarthestDistance,regionFitsArea,ReservedRegionsSchema,type ReservedRegion} from '../src/editor/regions';
import {applyZoneCommand,ZoneHistory,resizeRegion} from '../src/editor-admin/zone-model';
import {defaultProductionProfile,validateProductionProfile} from '../src/editor-admin/production-profile';
const zone=(patch:Partial<ReservedRegion>={}):ReservedRegion=>({id:randomUUID(),label:'Zona TEST',xMm:10,yMm:10,widthMm:10,heightMm:10,shape:'rectangle',...patch});
it('contenimento fisico: rettangoli, cerchi ed ellissi senza usare il box al posto della sagoma',()=>{
 const area={width:40,height:40,shape:'round' as const};expect(regionFitsArea(zone({xMm:0,yMm:0,widthMm:40,heightMm:40,shape:'ellipse'}),area)).toBe(true);expect(regionFitsArea(zone({xMm:0,yMm:0,widthMm:40,heightMm:40}),area)).toBe(false);
 expect(regionFitsArea(zone({xMm:0,yMm:10,widthMm:40,heightMm:20,shape:'ellipse'}),area)).toBe(true);expect(regionFitsArea(zone({xMm:0,yMm:0,widthMm:30,heightMm:20,shape:'ellipse'}),area)).toBe(false);
 expect(regionFitsArea(zone({xMm:35}),{width:40,height:40,shape:'rectangle'})).toBe(false);expect(regionFitsArea(zone(),{...area,height:30})).toBe(false);
 const profile={...defaultProductionProfile('stamp-ink'),usableArea:{widthMm:40,heightMm:40,shape:'round' as const},reservedAreas:[zone({xMm:0,yMm:0})]};expect(()=>validateProductionProfile(profile)).toThrow('sagoma');
});
it('massimo ellittico analitico confrontato con campionamento fitto, anche tangenti e centrate',()=>{
 let seed=7;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let trial=0;trial<60;trial++){const cx=trial%4===0?0:(random()-.5)*100,cy=trial%5===0?0:(random()-.5)*100,rx=.01+random()*100,ry=.01+random()*100;let sampled=0;for(let i=0;i<20000;i++){const angle=Math.PI*2*i/20000;sampled=Math.max(sampled,Math.hypot(cx+rx*Math.cos(angle),cy+ry*Math.sin(angle)));}const exact=ellipseFarthestDistance(cx,cy,rx,ry);expect(exact).toBeGreaterThanOrEqual(sampled-1e-8);expect(exact-sampled).toBeLessThan(.00002);}
 expect(ellipseFarthestDistance(0,0,20,10)).toBe(20);expect(ellipseFarthestDistance(3,4,5,5)).toBe(10);
});
it('comandi zone condivisi: revisioni, ID, limiti, fallimento atomico e riparazione dopo cambio area',()=>{
 const first=zone(),history=new ZoneHistory([],{width:40,height:40,shape:'rectangle'});history.dispatch({tool:'addZone',expectedRevision:0,arguments:first});expect(history.state.zones).toEqual([first]);expect(()=>history.dispatch({tool:'updateZone',expectedRevision:0,arguments:first})).toThrow('cambiate');expect(()=>history.dispatch({tool:'addZone',expectedRevision:1,arguments:first})).toThrow('ID');expect(()=>history.dispatch({tool:'updateZone',expectedRevision:1,arguments:{...first,xMm:35}})).toThrow('completamente');expect(history.state.revision).toBe(1);
 history.dispatch({tool:'updateZone',expectedRevision:1,arguments:{...first,xMm:15}});history.undo();expect(history.state.zones[0]!.xMm).toBe(10);expect(history.state.revision).toBe(3);history.redo();expect(history.state.zones[0]!.xMm).toBe(15);history.undo();history.dispatch({tool:'removeZone',expectedRevision:5,arguments:{id:first.id}});expect(history.canRedo).toBe(false);expect(history.state.zones).toEqual([]);
 const bad=zone({xMm:35}),state={revision:0,zones:[first,bad]};expect(applyZoneCommand(state,{tool:'updateZone',expectedRevision:0,arguments:{...first,xMm:5}},{width:40,height:40,shape:'rectangle'}).zones[1]).toEqual(bad);expect(ReservedRegionsSchema.safeParse(Array.from({length:21},()=>zone())).success).toBe(false);
});
it('maniglie: angolo opposto fisso e proporzioni opzionali, senza capovolgimenti',()=>{
 const first=zone();expect(resizeRegion(first,'tl',{x:5,y:8})).toMatchObject({xMm:5,yMm:8,widthMm:15,heightMm:12});expect(resizeRegion(first,'br',{x:30,y:25})).toMatchObject({xMm:10,yMm:10,widthMm:20,heightMm:15});expect(resizeRegion(first,'ml',{x:8,y:0})).toMatchObject({xMm:8,yMm:10,widthMm:12,heightMm:10});expect(resizeRegion(first,'tr',{x:30,y:5},true)).toMatchObject({xMm:10,yMm:0,widthMm:20,heightMm:20});expect(resizeRegion(first,'tl',{x:25,y:25}).widthMm).toBeCloseTo(.001);
});
