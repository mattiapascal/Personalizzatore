const ClipperLib = require('clipper-lib');
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
/** Worker-only numeric geometry. Quantization <= flatness/32; extra curve
 * flattening <= flatness/8. NonZero union preserves outer and inner contours. */
module.exports=function unionStrokeOutline(commands,flatnessMm){
 const quantum=flatnessMm/32,tolerance=flatnessMm/8,paths=[];let points=[],current={x:0,y:0},first=current,total=0;
 const push=p=>{if(++total>131072)throw Error('Unione del contorno oltre la capacità locale');points.push(p);};const flush=()=>{if(points.length>=3)paths.push(points.map(p=>({X:Math.round(p.x/quantum),Y:Math.round(p.y/quantum)})));points=[];};
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,squared=dx*dx+dy*dy,t=squared?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/squared)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
 for(const c of commands){if(c[0]==='M'){flush();current=first={x:c[1],y:c[2]};push(current);}else if(c[0]==='L'){current={x:c[1],y:c[2]};push(current);}else if(c[0]==='Z'){current=first;flush();}else{const end={x:c[5],y:c[6]},stack=[{a:current,b:{x:c[1],y:c[2]},c:{x:c[3],y:c[4]},d:end,depth:0}];while(stack.length){const{a,b,c,d,depth}=stack.pop();if(Math.max(distance(b,a,d),distance(c,a,d))<=tolerance)push(d);else{if(depth>=20)throw Error('Curva del contorno oltre la precisione locale');const ab=midpoint(a,b),bc=midpoint(b,c),cd=midpoint(c,d),abc=midpoint(ab,bc),bcd=midpoint(bc,cd),m=midpoint(abc,bcd);stack.push({a:m,b:bcd,c:cd,d,depth:depth+1},{a,b:ab,c:abc,d:m,depth:depth+1});}}current=end;}}flush();
 const cleaned=ClipperLib.Clipper.CleanPolygons(paths,1.1),clipper=new ClipperLib.Clipper();clipper.StrictlySimple=false;clipper.AddPaths(cleaned,ClipperLib.PolyType.ptSubject,true);const solution=[];if(!clipper.Execute(ClipperLib.ClipType.ctUnion,solution,ClipperLib.PolyFillType.pftNonZero,ClipperLib.PolyFillType.pftNonZero))throw Error('Unione del contorno non riuscita');
 // GS polygons can have sub-grid cracks at segment joins. Close only gaps
 // narrower than a tiny, declared fraction of the approximation budget. This
 // removes rasterizer seams while preserving all resolvable holes and details.
 const closeDistance=flatnessMm/16/quantum,offset=(paths,delta)=>{const engine=new ClipperLib.ClipperOffset(2,.25),out=[];engine.AddPaths(paths,ClipperLib.JoinType.jtRound,ClipperLib.EndType.etClosedPolygon);engine.Execute(out,delta);return out;},closed=offset(offset(solution,closeDistance),-closeDistance);
 const output=[];for(const path of closed){if(path.length<3)continue;for(const[i,p]of path.entries())output.push([i?'L':'M',p.X*quantum||0,p.Y*quantum||0]);output.push(['Z']);if(output.length>32768)throw Error('Contorno unito oltre il limite dei segmenti');}if(!output.length)throw Error('Contorno espanso privo di area');return output;
};
