import { util,type TComplexPathData } from 'fabric';
import { EDITOR_LIMITS } from './limits';
import { pitchprintNumber as number } from './pitchprint-units';
import { pitchprintLinear } from './pitchprint-affine';
import { pitchprintTransform,pitchprintOrigin,multiplyPitchprintMatrices,pitchprintPoint,PITCHPRINT_IDENTITY,type PitchprintMatrix } from './pitchprint-tree';
import { mapVector,vectorBounds,VectorCommandsSchema,type VectorCommand } from './vector-geometry';
import { TextClipMasksSchema,type TextClipMask } from './text-clip-masks';

type Data=Record<string,unknown>;
export interface PitchprintTextMask { commands:VectorCommand[];fillRule:'nonzero'|'evenodd'; }
const sizes:Record<string,number>={M:3,L:3,H:2,V:2,C:7,S:5,Q:5,T:3,A:8,Z:1};
function scalar(value:unknown,name:string):number{const n=number(value,name);if(Math.abs(n)>1e7)throw Error(`${name}: geometria sorgente oltre il limite locale`);return n;}

/** Geometry, not serialized width/pathOffset caches, defines a Path's plane.
 * Fabric 3 measures a quadratic using a cubic with duplicated control points;
 * retain that legacy origin while painting the actual quadratic exactly. */
function pathGeometry(raw:Data,name:string){
 if(!Array.isArray(raw.path)||!raw.path.length||raw.path.length>EDITOR_LIMITS.vectorCommandsPerObject)throw Error(`${name}: percorso della maschera non valido o eccessivo`);
 const checked=raw.path.map((c,i)=>{
  if(!Array.isArray(c)||typeof c[0]!=='string'||c[0].length!==1||sizes[c[0].toUpperCase()]!==c.length||i===0&&c[0].toUpperCase()!=='M')throw Error(`${name}: comando della maschera non valido`);
  const values=c.slice(1).map(v=>scalar(v,name));if(c[0].toUpperCase()==='A'&&(values[0]!<0||values[1]!<0||![0,1].includes(values[3]!)||![0,1].includes(values[4]!)))throw Error(`${name}: arco della maschera non valido`);
  return[c[0],...values];
 }) as TComplexPathData;
 const simple=util.makePathSimpler(checked),commands:VectorCommand[]=[],dimensions:VectorCommand[]=[];
 let x=0,y=0,startX=0,startY=0,open=false;
 const close=()=>{if(open){commands.push(['Z']);open=false;}};
 for(const c of simple){
  if(c[0]==='M'){close();commands.push([...c]);dimensions.push([...c],['L',c[1],c[2]]);x=startX=c[1];y=startY=c[2];open=true;}
  else if(c[0]==='Z'){close();x=startX;y=startY;}
  else{
   if(!open){commands.push(['M',x,y]);dimensions.push(['M',x,y]);open=true;}
   if(c[0]==='Q'){const[,cx,cy,ex,ey]=c;commands.push(['C',x+2/3*(cx-x),y+2/3*(cy-y),ex+2/3*(cx-ex),ey+2/3*(cy-ey),ex,ey]);dimensions.push(['C',cx,cy,cx,cy,ex,ey]);x=ex;y=ey;}
   else if(c[0]==='C'){commands.push([...c]);dimensions.push([...c]);x=c[5];y=c[6];}
   else if(c[0]==='L'){commands.push([...c]);dimensions.push([...c]);x=c[1];y=c[2];}
   else throw Error(`${name}: curva della maschera non rappresentabile`);
  }
  if(commands.length>EDITOR_LIMITS.vectorCommandsPerObject)throw Error(`${name}: maschera oltre il budget vettoriale`);
 }
 close();const bounds=vectorBounds(dimensions);
 if(!Object.values(bounds).every(Number.isFinite)||!(bounds.width>0&&bounds.height>0))throw Error(`${name}: percorso della maschera degenere`);
 return{commands:mapVector(commands,(x,y)=>({x:x-bounds.x-bounds.width/2,y:y-bounds.y-bounds.height/2})),bounds};
}

function rectangleGeometry(raw:Data,name:string){
 const width=scalar(raw.width,name),height=scalar(raw.height,name);if(!(width>0&&height>0))throw Error(`${name}: rettangolo della maschera degenere`);
 let rx=scalar(raw.rx??0,name),ry=scalar(raw.ry??0,name);if(rx<0||ry<0)throw Error(`${name}: raggio della maschera non valido`);if(rx&&!ry)ry=rx;else if(ry&&!rx)rx=ry;rx=Math.min(rx,width/2);ry=Math.min(ry,height/2);
 const x=-width/2,y=-height/2,w=width,h=height,k=1-.5522847498,commands:VectorCommand[]=[['M',x+rx,y],['L',x+w-rx,y]];
 if(rx||ry)commands.push(['C',x+w-k*rx,y,x+w,y+k*ry,x+w,y+ry]);commands.push(['L',x+w,y+h-ry]);
 if(rx||ry)commands.push(['C',x+w,y+h-k*ry,x+w-k*rx,y+h,x+w-rx,y+h]);commands.push(['L',x+rx,y+h]);
 if(rx||ry)commands.push(['C',x+k*rx,y+h,x,y+h-k*ry,x,y+h-ry]);commands.push(['L',x,y+ry]);
 if(rx||ry)commands.push(['C',x,y+k*ry,x+k*rx,y,x+rx,y]);commands.push(['Z']);
 return{commands,bounds:{x:0,y:0,width,height}};
}

/** Preflight every mask before font/asset callbacks. Nested relative clips
 * intersect; group unions, absolute/inverted masks and effects stay explicit
 * errors. Never execute d/clipTo/mtx or trust cached pathOffset/clipBounds. */
export function readPitchprintTextMasks(item:Data,name:string):PitchprintTextMask[]|undefined{
 if(item.clipPath==null)return;
 const masks:PitchprintTextMask[]=[];let total=0;
 const visit=(value:unknown,parent:PitchprintMatrix)=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${name}: maschera del testo non valida`);const raw=value as Data;
  if(masks.length>=8)throw Error(`${name}: massimo otto maschere del testo`);
  if(raw.absolutePositioned||raw.inverted||raw.clipTo||raw.transformMatrix||raw.shadow||raw.visible===false||raw.globalCompositeOperation&&raw.globalCompositeOperation!=='source-over'||number(raw.opacity??1,name)!==1)throw Error(`${name}: maschera del testo assoluta, invertita o con effetti non supportati`);
  if(raw.fillRule!==undefined&&raw.fillRule!=='nonzero'&&raw.fillRule!=='evenodd')throw Error(`${name}: regola di riempimento della maschera non valida`);
  const geometry=raw.type==='path'?pathGeometry(raw,name):raw.type==='rect'?rectangleGeometry(raw,name):undefined;if(!geometry)throw Error(`${name}: tipo di maschera del testo non supportato`);
  const stroke=scalar(raw.strokeWidth??1,name);if(stroke<0)throw Error(`${name}: contorno della maschera non valido`);
  const linear=pitchprintLinear(raw,name),uniform=raw.strokeUniform===true,w=geometry.bounds.width+(uniform?0:stroke),h=geometry.bounds.height+(uniform?0:stroke),boxWidth=Math.abs(linear[0])*w+Math.abs(linear[2])*h+(uniform?stroke:0),boxHeight=Math.abs(linear[1])*w+Math.abs(linear[3])*h+(uniform?stroke:0);
  const implicitLeft=raw.type==='path'?geometry.bounds.x-stroke/2+pitchprintOrigin(raw.originX,'x')*boxWidth:0,implicitTop=raw.type==='path'?geometry.bounds.y-stroke/2+pitchprintOrigin(raw.originY,'y')*boxHeight:0;
  const matrix=multiplyPitchprintMatrices(parent,pitchprintTransform({...raw,width:geometry.bounds.width,height:geometry.bounds.height,strokeWidth:stroke,left:scalar(raw.left??implicitLeft,name),top:scalar(raw.top??implicitTop,name)},name));
  const commands=mapVector(geometry.commands,(x,y)=>pitchprintPoint(matrix,x,y)),bounds=vectorBounds(commands);if(!Object.values(bounds).every(Number.isFinite)||!(bounds.width>0&&bounds.height>0))throw Error(`${name}: trasformazione della maschera non valida`);
  try{VectorCommandsSchema.parse(mapVector(commands,(x,y)=>({x:(x-bounds.x)/bounds.width,y:(y-bounds.y)/bounds.height})));}catch{throw Error(`${name}: maschera non normalizzabile entro i limiti del documento`);}
  total+=commands.length;if(total>EDITOR_LIMITS.vectorCommandsPerObject)throw Error(`${name}: maschere oltre il budget vettoriale per oggetto`);
  masks.push({commands,fillRule:raw.fillRule==='evenodd'?'evenodd':'nonzero'});if(raw.clipPath!=null)visit(raw.clipPath,matrix);
 };
 visit(item.clipPath,PITCHPRINT_IDENTITY);return masks;
}

/** The affine text matrix equals the canonical glyph matrix times fontScale.
 * A layout-centre correction must also move the mask in that glyph plane. */
export function canonicalPitchprintTextMasks(masks:readonly PitchprintTextMask[]|undefined,fontScale:number,shift={x:0,y:0}):TextClipMask[]|undefined{
 if(!masks)return;
 return TextClipMasksSchema.parse(masks.map(mask=>{const physical=mapVector(mask.commands,(x,y)=>({x:x*fontScale-shift.x,y:y*fontScale-shift.y})),b=vectorBounds(physical);return{fillRule:mask.fillRule,frameMm:{x:b.x,y:b.y,width:b.width,height:b.height},commands:mapVector(physical,(x,y)=>({x:(x-b.x)/b.width,y:(y-b.y)/b.height}))};}));
}
