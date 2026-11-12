import {unionStrokeOutline} from './stroke-outline-union';
import type { Plugin } from 'vite';
import { execFile } from 'node:child_process';
import { StrokeOutlineResponseSchema,strokeOutlinePlane,MAX_OUTLINE_INTERMEDIATE_COMMANDS } from '../src/editor/stroke-outline';
import type { VectorCommand } from '../src/editor/vector-geometry';
export const MAX_STROKE_REQUEST_BYTES=1024*1024;
type Runner=(program:string)=>Promise<string>;
function ghostscript(program:string):Promise<string>{return new Promise((resolve,reject)=>{const env:NodeJS.ProcessEnv={...process.env,LC_ALL:'C'};delete env.GS_OPTIONS;delete env.GS_LIB;delete env.GS_FONTPATH;const child=execFile('gs',['-q','-dNODISPLAY','-dSAFER','-dBATCH','-dNOPAUSE','-'],{timeout:10000,maxBuffer:8*1024*1024,env},(error,stdout)=>{if(error){reject((error as NodeJS.ErrnoException).code==='ENOENT'?Error('Espansione contorni locale non disponibile: installare Ghostscript (gs)'):Error('Espansione contorni non riuscita o oltre i limiti locali di tempo/risorse'));}else resolve(stdout);});child.stdin?.on('error',()=>{});child.stdin?.end(program);});}
/** Assemble an internal fixed recipe from already checked numeric tuples only. */
export function strokeOutlineProgram(plane:ReturnType<typeof strokeOutlinePlane>){
 const{request,commands,strokeWidth,deviceScale,flatnessMm}=plane,ops={M:'moveto',L:'lineto',C:'curveto',Z:'closepath'};
 // Print integer and fractional parts separately: PostScript cvs rounds large
 // real numbers to six significant digits, losing thin physical details.
 return`${deviceScale} ${deviceScale} scale false setstrokeadjust ${flatnessMm*deviceScale/2} setflat ${strokeWidth} setlinewidth ${['butt','round','square'].indexOf(request.lineCap)} setlinecap ${['miter','round','bevel'].indexOf(request.lineJoin)} setlinejoin ${request.miterLimit} setmiterlimit\n/n { dup truncate dup 32 string cvs print (:) print sub 1000000 mul round cvi 32 string cvs print ( ) print } bind def\nnewpath\n${commands.map(c=>[...c.slice(1),ops[c[0]]].join(' ')).join('\n')}\nstrokepath { (M ) print 2 array astore { n } forall (\\n) print } { (L ) print 2 array astore { n } forall (\\n) print } { (C ) print 6 array astore { n } forall (\\n) print } { (Z\\n) print } pathforall quit\n`;
}
export function parseStrokeOutlineOutput(stdout:string):VectorCommand[]{
 const output:VectorCommand[]=[],arity={M:2,L:2,C:6,Z:0};for(const line of stdout.trim().split(/\r?\n/)){const[op,...values]=line.trim().split(/\s+/);if(!op||!(op in arity)||values.length!==arity[op as keyof typeof arity]||values.some(v=>!/^[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?:[-+]?\d+$/i.test(v)))throw Error('Risposta del motore dei contorni non valida');const numbers=values.map(v=>{const [whole,fraction]=v.split(':').map(Number);return whole!+fraction!/1e6;});if(numbers.some(n=>!Number.isFinite(n)||Math.abs(n)>20000)||output.length>=MAX_OUTLINE_INTERMEDIATE_COMMANDS)throw Error('Espansione del contorno oltre i limiti locali');output.push([op,...numbers]as VectorCommand);}return output;
}
export async function outlineLocalStroke(raw:unknown,runner:Runner=ghostscript){const plane=strokeOutlinePlane(raw),local=parseStrokeOutlineOutput(await runner(strokeOutlineProgram(plane)));return StrokeOutlineResponseSchema.parse({schemaVersion:1,commands:await unionStrokeOutline(plane.toPhysical(local),plane.flatnessMm),engine:'ghostscript-strokepath',flatnessMm:plane.flatnessMm});}
export function localStrokeOutlinesPlugin():Plugin{let busy=false;return{name:'editor-local-stroke-outlines',apply:'serve',configureServer(server){server.middlewares.use('/__editor-local/stroke-outlines',async(req,res)=>{
 const json=(status:number,value:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')||req.headers.origin!==`http://${req.headers.host}`||req.headers['x-editor-local']!=='1'){json(403,{error:'Espansione disponibile soltanto dall’editor locale'});return;}
 if(req.method!=='POST'||req.headers['content-type']!=='application/json'){json(415,{error:'Inviare coordinate numeriche JSON'});return;}if(busy){json(429,{error:'Un contorno è già in elaborazione'});return;}busy=true;
 try{const chunks:Buffer[]=[];let length=0;for await(const part of req){const bytes=Buffer.from(part);length+=bytes.length;if(length>MAX_STROKE_REQUEST_BYTES)throw Error('Richiesta contorno oltre 1 MB');chunks.push(bytes);}json(200,await outlineLocalStroke(JSON.parse(Buffer.concat(chunks).toString('utf8'))));}catch(error){json(422,{error:error instanceof Error?error.message:'Espansione del contorno non riuscita'});}finally{busy=false;}
 });}};}
