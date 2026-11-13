import type {GraphicDocument,SceneObject} from './model';
import {frameToWorld} from './object-affine';
import {vectorContours} from './vector-geometry';
import {flattenBezier} from './bezier-geometry';
import {pathIntersectsArea} from './path-intersection';

/** Test the transformed contours, rather than their enclosing rectangle. */
export function affinePathIntersects(doc:Pick<GraphicDocument,'areaMm'|'shape'>,object:SceneObject,center:{xMm:number;yMm:number}):boolean|null{
 if(object.type==='text'||object.type==='rect'||object.type==='image')return null;
 const width=object.type==='circle'?2*object.radiusMm:object.type==='ellipse'?2*object.rxMm:object.type==='line'?object.lengthMm:object.widthMm;
 const height=object.type==='circle'?2*object.radiusMm:object.type==='ellipse'?2*object.ryMm:object.type==='line'?0:object.heightMm;
 const ellipse=()=>Array.from({length:256},(_,i)=>({x:.5+Math.cos(i*Math.PI/128)/2,y:.5+Math.sin(i*Math.PI/128)/2}));
 const filled='fill'in object&&!!object.fill&&object.fill!=='none',closed=object.type==='line'?false:object.type==='path'||object.type==='bezier'?object.closed:true;
 const contours=object.type==='vector'?vectorContours(object.commands):[{points:object.type==='path'?object.points:object.type==='bezier'?flattenBezier(object.nodes,object.closed,width,height):object.type==='line'?[{x:0,y:.5},{x:1,y:.5}]:ellipse(),closed}];
 const world=contours.map(contour=>({...contour,points:contour.points.map(p=>{const q=frameToWorld(object,(p.x-.5)*width,(p.y-.5)*height);return{x:q.x+center.xMm,y:q.y+center.yMm};})}));
 // A shear also stretches the pen. Use its largest singular value so an
 // object is never thrown away while a painted edge still reaches the page.
 const a=frameToWorld(object,1,0),b=frameToWorld(object,0,1),trace=a.x*a.x+a.y*a.y+b.x*b.x+b.y*b.y;
 const stretch=Math.sqrt((trace+Math.sqrt(Math.max(0,trace*trace-4)))/2),stroke=object.stroke==='none'?0:object.strokeMm*stretch;
 for(const contour of world){
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;for(const p of contour.points){left=Math.min(left,p.x);top=Math.min(top,p.y);right=Math.max(right,p.x);bottom=Math.max(bottom,p.y);}const w=Math.max(1e-9,right-left),h=Math.max(1e-9,bottom-top);
  if(pathIntersectsArea(contour.points.map(p=>({x:(p.x-left)/w,y:(p.y-top)/h})),w,h,{x:left+w/2,y:top+h/2},0,stroke,false,contour.closed||filled,doc.areaMm,doc.shape==='round'))return true;
 }
 if(!filled)return false;
 const p={x:doc.areaMm.width/2,y:doc.areaMm.height/2};let winding=0;
 for(const contour of world)for(let i=0;i<contour.points.length;i++){const a=contour.points[i]!,b=contour.points[(i+1)%contour.points.length]!,cross=(b.x-a.x)*(p.y-a.y)-(p.x-a.x)*(b.y-a.y);if(a.y<=p.y&&b.y>p.y&&cross>0)winding++;else if(a.y>p.y&&b.y<=p.y&&cross<0)winding--;}
 return object.type==='vector'&&object.fillRule==='nonzero'?winding!==0:Math.abs(winding)%2===1;
}
