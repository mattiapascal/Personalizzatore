import { z } from 'zod';
import { EDITOR_LIMITS } from './limits';
import { mapVector, vectorBounds, type VectorCommand } from './vector-geometry';
/** Local geometry service contract: no SVG, PostScript, filenames or executable source. */
const coordinate=z.number().finite().min(-1e6).max(1e6);
const command=z.union([z.tuple([z.literal('M'),coordinate,coordinate]),z.tuple([z.literal('L'),coordinate,coordinate]),z.tuple([z.literal('C'),coordinate,coordinate,coordinate,coordinate,coordinate,coordinate]),z.tuple([z.literal('Z')])]);
function path(max:number){return z.array(command).min(2).max(max).superRefine((commands,ctx)=>{let open=false,segments=0;for(const c of commands){if(c[0]==='M')open=true;else if(!open)ctx.addIssue({code:'custom',message:'Ogni contorno deve iniziare con M'});else if(c[0]==='Z'){open=false;segments++;}else segments++;}if(!segments)ctx.addIssue({code:'custom',message:'Tracciato senza segmenti'});});}
export const STROKE_OUTLINE_FLATNESS_MM=.005;
export const MAX_OUTLINE_COMMANDS=EDITOR_LIMITS.vectorCommandsPerObject;
/** Ghostscript emits overlapping segment polygons before their bounded union.
 * The canonical result retains the stricter per-object command ceiling. */
export const MAX_OUTLINE_INTERMEDIATE_COMMANDS=131072;
export const StrokeOutlineRequestSchema=z.strictObject({schemaVersion:z.literal(1),commands:path(4096),matrix:z.tuple([coordinate,coordinate,coordinate,coordinate,coordinate,coordinate]),strokeWidth:z.number().finite().positive().max(1e6),lineCap:z.enum(['butt','round','square']),lineJoin:z.enum(['miter','round','bevel']),miterLimit:z.number().finite().min(1).max(100)});
export type StrokeOutlineRequest=z.infer<typeof StrokeOutlineRequestSchema>;
export const StrokeOutlineResponseSchema=z.strictObject({schemaVersion:z.literal(1),commands:path(MAX_OUTLINE_COMMANDS),engine:z.literal('ghostscript-strokepath'),flatnessMm:z.number().positive().max(STROKE_OUTLINE_FLATNESS_MM)});
/** Normalize to an isotropic physical plane before stroking. The remaining
 * matrix, applied afterwards, has singular values <=1, including reflections. */
export function strokeOutlinePlane(raw:unknown){
 const request=StrokeOutlineRequestSchema.parse(raw),[a,b,c,d,e,f]=request.matrix,trace=a*a+b*b+c*c+d*d,det=a*d-b*c,scale=Math.sqrt((trace+Math.sqrt(Math.max(0,trace*trace-4*det*det)))/2);
 if(!scale||Math.abs(det)<=1e-12*scale*scale)throw Error('Trasformazione del contorno degenere o troppo sbilanciata');
 const bounds=vectorBounds(request.commands),center={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2},commands=mapVector(request.commands,(x,y)=>({x:(x-center.x)*scale,y:(y-center.y)*scale})),strokeWidth=request.strokeWidth*scale;
 if(strokeWidth>100+1e-7)throw Error('Contorno fuori dal limite di capacità del laboratorio: non può superare 100 mm');
 const flatnessMm=Math.min(STROKE_OUTLINE_FLATNESS_MM,strokeWidth/64),deviceScale=Math.max(256,.25/flatnessMm);let extent=0;
 for(const command of commands)for(const v of command.slice(1))extent=Math.max(extent,Math.abs(v as number));
 if(!Number.isFinite(extent)||extent>10000||(extent+strokeWidth*request.miterLimit/2)*deviceScale>4_000_000||extent*2**-23>flatnessMm)throw Error('Geometria del contorno oltre i limiti locali di precisione');
 const offset={x:a*center.x+c*center.y+e,y:b*center.x+d*center.y+f};if(Math.max(Math.abs(offset.x),Math.abs(offset.y))>10000)throw Error('Posizione del contorno oltre i limiti locali');
 return{request,commands,strokeWidth,flatnessMm,deviceScale,toPhysical:(commands:VectorCommand[])=>mapVector(commands,(x,y)=>({x:(a*x+c*y)/scale+offset.x,y:(b*x+d*y)/scale+offset.y}))};
}
export async function requestStrokeOutline(request:StrokeOutlineRequest){
 const checked=StrokeOutlineRequestSchema.parse(request),response=await fetch('/__editor-local/stroke-outlines',{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Local':'1'},body:JSON.stringify(checked)}),result=await response.json();if(!response.ok)throw Error(result.error??'Espansione locale del contorno non riuscita');return StrokeOutlineResponseSchema.parse(result);
}
