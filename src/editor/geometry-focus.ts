import type {GraphicDocument} from './model';
import type {ProductionGeometryReport} from './production-geometry';
export interface GeometryFocus {
 documentId:string;contentRevision:number;pageId:string;profileId:string;profileVersion:number;
 xMm:number;yMm:number;label:string;status:'overlap'|'boundary';sequence:number;
}
const scene=(document:GraphicDocument,id:string)=>id===(document.pageId??'page-1')?document:document.otherPages?.find(page=>page.id===id);
/** A report locates paint, never a supposed offending object inferred from its
 * bounding box. Only a current report and the same profile can create a focus. */
export function geometryFocusFromReport(document:GraphicDocument,report:ProductionGeometryReport,pageId:string,ruleId:string,sequence:number):GeometryFocus|null{
 if(document.documentId!==report.documentId||(document.contentRevision??document.revision)!==report.contentRevision||!Number.isSafeInteger(sequence)||sequence<1)return null;
 const page=scene(document,pageId),result=report.pages.find(page=>page.id===pageId),rule=result?.rules.find(rule=>rule.id===ruleId),profile=page?.productionProfile;
 if(!page||!profile||!result?.profile||result.profile.id!==profile.id||result.profile.version!==profile.version||!rule?.witness||rule.status!=='overlap'&&rule.status!=='boundary')return null;
 const {xMm,yMm}=rule.witness,tolerance=Math.min(.05,report.resolutionMm*2);
 if(!Number.isFinite(xMm)||!Number.isFinite(yMm)||!Number.isFinite(tolerance)||tolerance<=0||xMm<-tolerance||yMm<-tolerance||xMm>page.areaMm.width+tolerance||yMm>page.areaMm.height+tolerance)return null;
 let x=Math.max(0,Math.min(page.areaMm.width,xMm)),y=Math.max(0,Math.min(page.areaMm.height,yMm));
 if(page.shape==='round'){const radius=page.areaMm.width/2,dx=x-radius,dy=y-radius,distance=Math.hypot(dx,dy);if(distance>radius+tolerance)return null;if(distance>radius){x=radius+dx*radius/distance;y=radius+dy*radius/distance;}}
 return{documentId:document.documentId,contentRevision:report.contentRevision,pageId,profileId:profile.id,profileVersion:profile.version,xMm:x,yMm:y,label:rule.label,status:rule.status,sequence};
}
export function geometryFocusCurrent(focus:GeometryFocus,document:GraphicDocument,activeOnly=true):boolean{
 const page=scene(document,focus.pageId),profile=page?.productionProfile;
 return focus.documentId===document.documentId&&focus.contentRevision===(document.contentRevision??document.revision)&&!!profile&&profile.id===focus.profileId&&profile.version===focus.profileVersion&&Number.isFinite(focus.xMm)&&Number.isFinite(focus.yMm)&&focus.xMm>=0&&focus.yMm>=0&&focus.xMm<=page!.areaMm.width&&focus.yMm<=page!.areaMm.height&&(!activeOnly||focus.pageId===(document.pageId??'page-1'));
}
/** Viewport translation only, in screen pixels. No scene coordinates, zoom or
 * object transforms are changed. Using actual DOM bounds includes rounding. */
export function geometryFocusTranslation(canvas:{left:number;top:number;width:number;height:number},viewport:{left:number;top:number;width:number;height:number},area:{width:number;height:number},point:{xMm:number;yMm:number}):{x:number;y:number}{
 if(![canvas.left,canvas.top,canvas.width,canvas.height,viewport.left,viewport.top,viewport.width,viewport.height,area.width,area.height,point.xMm,point.yMm].every(Number.isFinite)||canvas.width<=0||canvas.height<=0||viewport.width<=0||viewport.height<=0||area.width<=0||area.height<=0)throw Error('Vista del punto non disponibile');
 return{x:viewport.left+viewport.width/2-canvas.left-point.xMm/area.width*canvas.width,y:viewport.top+viewport.height/2-canvas.top-point.yMm/area.height*canvas.height};
}
