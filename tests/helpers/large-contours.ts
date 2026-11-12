import type{VectorCommand}from'../../src/editor/vector-geometry';
/** Independently authored empty rounded frames in legacy pixel planes. The
 * physical axes intentionally differ slightly because the old page was rounded. */
export function largeContoursSource(){
 const width=510.2362,height=793.7008,strokeWidth=9.8978,x=strokeWidth/2,y=x,rx=39.1783,ry=40.002,k=.5522847498307936,right=x+width,bottom=y+height;
 const path:VectorCommand[]=[['M',x,y+ry],['C',x,y+ry*(1-k),x+rx*(1-k),y,x+rx,y],['L',right-rx,y],['C',right-rx*(1-k),y,right,y+ry*(1-k),right,y+ry],['L',right,bottom-ry],['C',right,bottom-ry*(1-k),right-rx*(1-k),bottom,right-rx,bottom],['L',x+rx,bottom],['C',x+rx*(1-k),bottom,x,bottom-ry*(1-k),x,bottom-ry],['L',x,y+ry],['Z']];
 return{title:'Cornici grandi TEST',unit:'mm',pages:[false,true].map(rotated=>({pageData:{fWidth:rotated?300:200,fHeight:rotated?200:300},canvas:{clipPath:{type:'rect',left:0,top:0,width:rotated?850:567,height:rotated?567:850},objects:[{type:'path',version:'3.4.0',originX:'left',originY:'top',left:rotated?23+height+strokeWidth:23,top:23,width,height,scaleX:1,scaleY:1,angle:rotated?90:0,strokeWidth,stroke:'#0088cc',fill:null,strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:3.8637,fillRule:'evenodd',path,includeInForm:false}]}}))};
}
