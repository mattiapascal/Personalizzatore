import { affineTextSource } from './pitchprint-affine-text';
export function pitchprintMaskCases():Record<string,unknown>[] {
 const shapes:Record<string,unknown>[]=[
  {type:'rect',width:120,height:60,rx:12,ry:8},
  {type:'path',path:[['M',-50,30],['H',50],['V',-30],['H',-50],['Z']]},
  {type:'path',path:[['M',-50,-30],['C',-20,-65,20,-65,50,-30],['S',65,20,50,30],['L',-50,30],['Z'],['M',-10,-10],['L',10,-10],['L',10,10],['L',-10,10],['Z']],fillRule:'evenodd'},
  {type:'path',path:[['m',-60,0],['q',30,-80,60,0],['t',60,0],['l',0,30],['h',-120],['z']]},
  {type:'path',path:[['M',-60,0],['A',60,35,15,0,1,60,0],['L',60,30],['L',-60,30],['Z']]},
  {type:'path',path:[['M',-60,-20],['L',60,-20],['L',60,20],['L',-60,20]]},
 ];
 const rows:Record<string,unknown>[]=[];
 for(const[shapeIndex,shape]of shapes.entries())for(const origin of['left','center','right'])for(const explicit of[false,true])rows.push({name:`shape-${shapeIndex+1}-${origin}-${explicit}`,type:'i-text',clipPath:{...shape,originX:origin,originY:origin==='left'?'top':origin==='right'?'bottom':'center',...(explicit?{left:-35,top:17}:{}),scaleX:1.3,scaleY:.8,angle:17,skewX:12,skewY:-7,flipX:true,flipY:shapeIndex%2===0,stroke:null,strokeWidth:2,strokeUniform:explicit,width:shape.type==='path'?9999:120,height:shape.type==='path'?7777:60,pathOffset:{x:99999,y:-99999},mtx:[0,0,0,0,99999,99999]}});
 rows.push({name:'nested-intersection',type:'i-text',clipPath:{type:'rect',width:140,height:70,left:-50,top:-30,angle:-12,skewY:7,strokeWidth:1,clipPath:{...shapes[2],originX:'center',originY:'center',left:5,top:3,scaleX:.8,scaleY:1.2,angle:23,flipY:true,strokeWidth:2}}});
 return rows;
}

export function maskedPitchprintSource(){
 const source:any=affineTextSource();source.title='Maschere dei testi PitchPrint TEST';const roots=source.pages[0].canvas.objects;
 roots[0].clipPath={type:'rect',originX:'center',originY:'center',left:0,top:0,width:145,height:58,rx:8,ry:8,strokeWidth:1,angle:8};
 roots[1].clipPath={type:'path',originX:'center',originY:'center',left:0,top:5,strokeWidth:2,scaleX:1.1,scaleY:.9,angle:-12,skewX:9,flipY:true,fillRule:'evenodd',path:[['M',-120,-55],['H',120],['V',55],['H',-120],['Z'],['M',-15,-25],['H',15],['V',25],['H',-15],['Z']],clipPath:{type:'rect',originX:'center',originY:'center',left:0,top:0,width:260,height:100,strokeWidth:0,angle:12}};
 roots[2].objects[0].clipPath={type:'path',originX:'center',originY:'center',left:0,top:0,strokeWidth:1,skewY:5,path:[['m',-95,0],['q',20,-45,65,-20],['t',125,20],['l',0,25],['h',-190],['z']]};
 roots[2].objects[1].objects[0].clipPath={type:'rect',originX:'right',originY:'bottom',left:100,top:30,width:160,height:60,strokeWidth:2,scaleX:1.1,scaleY:1.3,angle:-18,flipY:true};
 return source;
}
