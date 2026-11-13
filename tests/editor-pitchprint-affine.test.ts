import { expect, it } from 'vitest';
import { pitchprintLinear, decomposePitchprintText } from '../src/editor/pitchprint-affine';
import { pitchprintTransform, pitchprintTree, checkedPitchprintEffects, type PitchprintMatrix } from '../src/editor/pitchprint-tree';

it('decomposizione fisica R*K*S: corpo dal determinante, dilatazione e inclinazione indipendenti', () => {
  for (const angle of [-170,-23,0,37,179]) for (const shear of [-.6,0,.4]) for (const [sx,sy] of [[.3,.5],[2.7,1.2],[1,1]]) {
    const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
    const matrix:PitchprintMatrix=[c*sx!,s*sx!,(c*shear-s)*sy!,(s*shear+c)*sy!,20,-10];
    const result=decomposePitchprintText(matrix,'TEST');
    expect(result.horizontal).toBeCloseTo(sx!,12);expect(result.vertical).toBeCloseTo(sy!,12);
    expect(result.textScaleX).toBeCloseTo(sx!/sy!,12);expect(result.rotationDeg).toBeCloseTo(angle,12);
    expect(result.textSkewXDeg).toBeCloseTo(Math.atan(shear)*180/Math.PI,12);
    const k=Math.tan(result.textSkewXDeg*Math.PI/180),a=result.rotationDeg*Math.PI/180;
    const rebuilt=[Math.cos(a)*result.horizontal,Math.sin(a)*result.horizontal,(Math.cos(a)*k-Math.sin(a))*result.vertical,(Math.sin(a)*k+Math.cos(a))*result.vertical];
    rebuilt.forEach((value,i)=>expect(value).toBeCloseTo(matrix[i]!,12));
  }
});
it('la matrice dimensionale legacy concatena entrambi gli skew dopo scala/riflessione', () => {
  const result=pitchprintLinear({scaleX:2,scaleY:3,skewX:45,skewY:-45,flipX:true},'TEST');
  result.forEach((value,i)=>expect(value).toBeCloseTo([0,-3,-2,3,0,0][i]!,12));
  expect(pitchprintLinear({},'TEST')).toEqual([1,0,0,1,0,0]);
  for(const fields of [{skewX:90},{skewY:-90},{skewX:Infinity},{skewY:'bad'},{scaleX:0},{scaleY:-2}])expect(()=>pitchprintLinear(fields,'TEST')).toThrow();
});
it('origini e involucro legacy: lo skew modifica l’ingombro prima della rotazione, non moltiplica il vettore origine', () => {
  const shape={left:100,top:200,width:20,height:10,strokeWidth:2,scaleX:2,scaleY:3,skewX:45,originX:'right',originY:'bottom',angle:90};
  const m=pitchprintTransform(shape,'TEST');expect(m[4]).toBeCloseTo(118);expect(m[5]).toBeCloseTo(166);
  const uniform=pitchprintTransform({...shape,strokeUniform:true},'TEST');expect(uniform[4]).toBeCloseTo(116);expect(uniform[5]).toBeCloseTo(169);
  const flipped=pitchprintTransform({...shape,flipX:true},'TEST');expect(flipped.slice(4)).toEqual(m.slice(4));
  expect(()=>pitchprintTransform({...shape,width:1e308,scaleX:1e308},'TEST')).toThrow('finita');
});
it('riflessioni singole, matrici degeneri/non finite e capacità eccessive restano bloccanti', () => {
  for(const matrix of [[-1,0,0,1,0,0],[0,0,0,1,0,0],[1,0,0,0,0,0],[NaN,0,0,1,0,0],[1,0,0,1,Infinity,0],[100,0,0,1,0,0],[1,0,100,1,0,0]])expect(()=>decomposePitchprintText(matrix as PitchprintMatrix,'TEST')).toThrow();
  expect(decomposePitchprintText([-1,0,0,-1,0,0],'TEST')).toMatchObject({horizontal:1,vertical:1,textSkewXDeg:0});
});
it('preflight ammette lo skew soltanto per testi e gruppi; conserva i blocchi su maschere ed effetti', () => {
  const text={type:'i-text',left:0,top:0,width:20,height:10,strokeWidth:0,skewX:20};
  expect(()=>checkedPitchprintEffects(text,'TEST')).not.toThrow();
  for(const extra of [{type:'image'},{type:'rect'},{clipPath:{type:'rect',width:10,height:10}},{shadow:{}},{transformMatrix:[1,0,0,1,0,0]},{opacity:.5}])expect(()=>checkedPitchprintEffects({...text,...extra},'TEST')).toThrow();
  const group={type:'group',left:100,top:100,width:80,height:60,skewY:-12,objects:[text]},before=structuredClone(group);
  const tree=pitchprintTree([group],()=>({label:'TEST'}));expect(tree.leaves).toHaveLength(1);expect(tree.groups[0]!.editor.label).toBe('TEST');expect(group).toEqual(before);
});
it('limiti esatti della dilatazione e inclinazione non vengono superati per il solo arrotondamento delle matrici',()=>{
 for(const stretch of[.1,10])for(const angle of[-135,32,170])for(const skew of[-85,0,85]){
  const a=angle*Math.PI/180,k=Math.tan(skew*Math.PI/180),sx=stretch*1.3,sy=1.3,matrix:PitchprintMatrix=[Math.cos(a)*sx,Math.sin(a)*sx,(Math.cos(a)*k-Math.sin(a))*sy,(Math.sin(a)*k+Math.cos(a))*sy,0,0];
  const result=decomposePitchprintText(matrix,'TEST');expect(result.textScaleX).toBeCloseTo(stretch,10);expect(result.textSkewXDeg).toBeCloseTo(skew,10);
 }
 for(const value of[.1-1e-8,10+1e-8])expect(()=>decomposePitchprintText([value,0,0,1,0,0],'TEST')).toThrow('limiti');
});
