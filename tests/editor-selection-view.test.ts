import {expect,it} from 'vitest';
import {selectionViewBounds,selectionViewFit} from '../src/editor/selection-view';
import {canvasZoomLimit} from '../src/editor/canvas-size';
import {createDocument,type Measure,type SceneObject} from '../src/editor/model';
import {UnverifiedTextGeometryError} from '../src/editor/unverified-text-geometry';
const rect=(id:string,xMm:number,yMm:number,widthMm:number,heightMm:number):Extract<SceneObject,{type:'rect'}>=>({id,type:'rect',xMm,yMm,widthMm,heightMm,stroke:'none',strokeMm:.25,fill:'#000000'});
const measure:Measure=object=>object.type==='rect'?{widthMm:object.widthMm+(object.stroke==='none'?0:object.strokeMm),heightMm:object.heightMm+(object.stroke==='none'?0:object.strokeMm)}:{widthMm:5,heightMm:5};
it('ingombro della selezione esatta, senza cambiare il documento o espandere un membro al gruppo',()=>{
 const doc=createDocument();doc.objects=[rect('small',12,8,6,4),rect('far',70,40,20,10)];doc.groups=[{id:'group',objectIds:['small','far']}];const before=structuredClone(doc);
 expect(selectionViewBounds(doc,['small'],measure)).toEqual({xMm:12,yMm:8,widthMm:6,heightMm:4});expect(selectionViewBounds(doc,['small','far'],measure)).toEqual({xMm:12,yMm:8,widthMm:78,heightMm:42});expect(doc).toEqual(before);
 expect(selectionViewBounds(doc,[],measure)).toBeNull();expect(()=>selectionViewBounds(doc,['missing'],measure)).toThrow('Selezione');expect(()=>selectionViewBounds(doc,['small','small'],measure)).toThrow('Selezione');
});
it('contorno, rotazione e coordinate esterne fanno parte dell’ingombro, senza limitare al foglio',()=>{
 const doc=createDocument();doc.objects=[{...rect('rotated',100,50,20,10),rotationDeg:90,stroke:'#000000',strokeMm:1},rect('outside',-5,-10,2,3)];const bounds=selectionViewBounds(doc,['rotated','outside'],measure)!;
 expect(bounds.xMm).toBe(-5);expect(bounds.yMm).toBe(-10);expect(bounds.widthMm).toBeCloseTo(116,9);expect(bounds.heightMm).toBeCloseTo(81,9);
});
it('la geometria di un font non verificato viene rifiutata senza un riquadro stimato',()=>{
 const doc=createDocument();expect(()=>selectionViewBounds(doc,[doc.objects[1]!.id],()=>{throw new UnverifiedTextGeometryError('Font TEST non verificato');})).toThrow(UnverifiedTextGeometryError);
});
it('scala con margine e centro indipendenti da posizione della tavola o scala precedente',()=>{
 const bounds={xMm:100,yMm:-10,widthMm:200,heightMm:50};expect(selectionViewFit(bounds,{width:800,height:600},4)).toEqual({zoom:.44,center:{xMm:200,yMm:15},fits:true});
 const tall=selectionViewFit({xMm:0,yMm:0,widthMm:20,heightMm:100},{width:800,height:600},4);expect(tall.zoom).toBe(.63);expect(tall.center).toEqual({xMm:10,yMm:50});
});
it('zoom limitato dal budget dell’intero canvas, anche Retina e grande formato',()=>{
 const target={xMm:950,yMm:350,widthMm:50,heightMm:30},viewport={width:800,height:600};
 for(const retina of[1,2,3]){const limit=canvasZoomLimit({width:1100,height:400},retina),fit=selectionViewFit(target,viewport,limit);expect(fit.zoom).toBe(limit);expect(fit.fits).toBe(true);expect(fit.center).toEqual({xMm:975,yMm:365});}
 expect(selectionViewFit({xMm:0,yMm:0,widthMm:1,heightMm:1},viewport,4).zoom).toBe(4);
});
it('il minimo di vista non finge che una selezione enorme sia completamente visibile',()=>{
 const fit=selectionViewFit({xMm:-5000,yMm:0,widthMm:10000,heightMm:2},{width:390,height:600},4);expect(fit.zoom).toBe(.01);expect(fit.fits).toBe(false);expect(fit.center).toEqual({xMm:0,yMm:1});
});
it('spazio insufficiente e numeri non validi non producono scale o centri non finiti',()=>{
 const bounds={xMm:0,yMm:0,widthMm:5,heightMm:5};for(const viewport of[{width:48,height:600},{width:800,height:NaN}])expect(()=>selectionViewFit(bounds,viewport,4)).toThrow();
 for(const patch of[{widthMm:0},{xMm:Infinity},{heightMm:-1},{xMm:Number.MAX_VALUE,widthMm:Number.MAX_VALUE}])expect(()=>selectionViewFit({...bounds,...patch},{width:800,height:600},4)).toThrow();expect(()=>selectionViewFit(bounds,{width:800,height:600},.001)).toThrow();
});
