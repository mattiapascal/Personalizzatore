import{GRAPHIC_GEOMETRY_LIMITS}from'./limits';
import {z} from 'zod';
export const PlaqueFamilySchema=z.enum(['flat-plaque','doorplate','boxed-sign']);
export type PlaqueFamily=z.infer<typeof PlaqueFamilySchema>;
export const PlaqueMountingSchema=z.strictObject({policyVersion:z.literal('local-mounting-v1').optional(),family:PlaqueFamilySchema.optional(),method:z.enum(['glue','holes','screws','spacer-midi','spacer-maxi','brackets']),pattern:z.enum(['horizontal-pair','vertical-pair','four-corners']),offsetXMm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.pageSideMm),offsetYMm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.pageSideMm),clearanceMm:z.number().finite().min(0).max(100).nullable().optional(),holeDiameterMm:z.number().finite().positive().max(100).nullable()});
export type PlaqueMounting=z.infer<typeof PlaqueMountingSchema>;
export const DEFAULT_PLAQUE_MOUNTING:PlaqueMounting={policyVersion:'local-mounting-v1',method:'glue',pattern:'four-corners',offsetXMm:15,offsetYMm:15,holeDiameterMm:null};
export const mountingLabels={glue:'Incollaggio, senza fori',holes:'Solo fori, senza accessori',screws:'Viti','spacer-midi':'Distanziatori Midi','spacer-maxi':'Distanziatori Maxi',brackets:'Staffe'}as const;
export function plaqueMountingPoints(area:{width:number;height:number},raw:PlaqueMounting):{xMm:number;yMm:number}[]{
 const mounting=PlaqueMountingSchema.parse(raw),family=mounting.family??'flat-plaque';if(!allowedMountingMethods(family).includes(mounting.method))throw new Error('Fissaggio non consentito per questa famiglia di prodotto.');if(mounting.method!=='glue'&&mounting.method!=='brackets'&&!allowedMountingPatterns(family).includes(mounting.pattern))throw new Error('Per i fuoriporta sono ammessi soltanto due punti di fissaggio.');if(mounting.method==='glue'||mounting.method==='brackets')return[];const{offsetXMm:x,offsetYMm:y}=mounting,w=area.width,h=area.height,r=(mounting.holeDiameterMm??0)/2;
 const points=mounting.pattern==='horizontal-pair'?[[x,h/2],[w-x,h/2]]:mounting.pattern==='vertical-pair'?[[w/2,y],[w/2,h-y]]:[[x,y],[w-x,y],[x,h-y],[w-x,h-y]];
 if(mounting.pattern!=='vertical-pair'&&2*x>=w||mounting.pattern!=='horizontal-pair'&&2*y>=h||points.some(([xx,yy])=>xx!-r<=0||yy!-r<=0||xx!+r>=w||yy!+r>=h))throw new Error('Le distanze scelte non lasciano spazio ai punti di fissaggio. Aumenta la targa oppure riduci la distanza dal bordo.');
 if(points.some(([xx,yy],i)=>points.slice(i+1).some(([xxx,yyy])=>Math.hypot(xx!-xxx!,yy!-yyy!)<2*r)))throw new Error('I fori si sovrappongono.');
 return points.map(([xMm,yMm])=>({xMm:xMm!,yMm:yMm!}));
}

export function allowedMountingMethods(family:PlaqueFamily):PlaqueMounting['method'][]{return family==='doorplate'?['glue','screws']:family==='boxed-sign'?['brackets']:['glue','holes','screws','spacer-midi','spacer-maxi'];}
export function allowedMountingPatterns(family:PlaqueFamily):PlaqueMounting['pattern'][]{return family==='doorplate'?['horizontal-pair','vertical-pair']:['horizontal-pair','vertical-pair','four-corners'];}
export function defaultMountingFor(family:PlaqueFamily):PlaqueMounting{return{...DEFAULT_PLAQUE_MOUNTING,family,method:family==='boxed-sign'?'brackets':'glue',pattern:family==='doorplate'?'horizontal-pair':'four-corners'};}
