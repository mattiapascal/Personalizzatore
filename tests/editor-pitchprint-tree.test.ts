import {expect,it} from 'vitest';
import {pitchprintTree,pitchprintPoint,pitchprintTransform,multiplyPitchprintMatrices} from '../src/editor/pitchprint-tree';
const shape={type:'rect',left:0,top:0,width:20,height:10,strokeWidth:0};
const properties=(raw:Record<string,unknown>)=>({label:String(raw.title??''),order:Number(raw.idx??0),transformLocked:raw.tLocked===true,reference:raw.isReference===true});
it('gruppi nativi: centro dichiarato, origine opposta, scala/rotazione e mtx obsoleta',()=>{
 const group={type:'group',left:100,top:200,width:80,height:40,originX:'right',originY:'bottom',scaleX:2,scaleY:2,angle:90,mtx:[1,0,0,1,999,999]};
 const center=pitchprintPoint(pitchprintTransform(group,'TEST'),0,0);expect(center.x).toBeCloseTo(140);expect(center.y).toBeCloseTo(120);
 const child=pitchprintPoint(pitchprintTransform(group,'TEST'),10,-5);expect(child.x).toBeCloseTo(150);expect(child.y).toBeCloseTo(140);
});
it('gruppi annidati: ordine stabile e coordinate concatenate senza ricentrare i figli',()=>{
 const roots=[{type:'group',left:100,top:80,width:100,height:100,originX:'center',originY:'center',scaleX:2,scaleY:1,objects:[shape,{type:'group',left:10,top:20,width:20,height:20,originX:'center',originY:'center',angle:90,objects:[shape]}]}],before=structuredClone(roots),tree=pitchprintTree(roots,properties);
 expect(tree.leaves.map(leaf=>leaf.id)).toEqual(['pp-1-1','pp-1-2-1']);expect(tree.leaves.every(leaf=>leaf.rootGroup==='pp-1-group')).toBe(true);
 const p=pitchprintPoint(tree.leaves[1]!.parent,5,0);expect(p.x).toBeCloseTo(120);expect(p.y).toBeCloseTo(105);expect(tree.warnings.join()).toContain('gruppo esterno');expect(tree.groups[1]!.parentId).toBe(tree.groups[0]!.id);expect(roots).toEqual(before);
 const reflected=multiplyPitchprintMatrices(tree.leaves[0]!.parent,pitchprintTransform({...shape,originX:'center',originY:'center',flipX:true},'TEST'));expect(reflected[0]).toBe(-2);
});
it('regole del gruppo trasferite conservativamente ai figli; etichette e priorità non vengono perse',()=>{
 const raw={type:'group',left:0,top:0,width:20,height:20,tLocked:true,isReference:true,objects:[shape]},tree=pitchprintTree([raw],properties);expect(tree.leaves[0]!.inherited).toMatchObject({transformLocked:true,reference:true});expect(tree.warnings.join()).toContain('Blocchi');
 expect(pitchprintTree([{...raw,title:'Logo cliente',idx:2}],properties).groups[0]!.editor).toMatchObject({label:'Logo cliente',order:2});
});
it('preflight non scarta gruppi vuoti, effetti, discendenti invalidi, profondità o quantità eccessive',()=>{
 const group={type:'group',left:0,top:0,width:20,height:20,objects:[shape]};for(const extra of [{objects:[]},{objects:[null]},{opacity:.5},{clipPath:{}},{shadow:{}},{skewX:2},{visible:false}])expect(()=>pitchprintTree([{...group,...extra}],properties)).toThrow();
 let nested:Record<string,unknown>=shape;for(let i=0;i<14;i++)nested={...group,objects:[nested]};expect(()=>pitchprintTree([nested],properties)).toThrow('12 livelli');expect(()=>pitchprintTree([{...group,objects:Array.from({length:201},()=>shape)}],properties)).toThrow('200 elementi');
 expect(()=>pitchprintTransform({...group,scaleX:0},'TEST')).toThrow('scala');expect(()=>pitchprintTransform({...group,originX:'invalid'},'TEST')).toThrow('Origine');
});
