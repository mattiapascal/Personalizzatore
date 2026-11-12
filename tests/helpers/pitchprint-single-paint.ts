export function singlePaintPitchprintSource(){
 const base={originX:'left',originY:'top',scaleX:1,scaleY:1,angle:0,stroke:null,strokeWidth:0,opacity:1};
 return{title:'Opacità singolo riempimento TEST',unit:'mm',pages:[{pageData:{fWidth:100,fHeight:60},canvas:{clipPath:{left:0,top:0,width:1000,height:600},objects:[
  {...base,type:'rect',left:0,top:0,width:1000,height:600,fill:'#dbe8ee'},
  {...base,type:'rect',left:120,top:120,width:380,height:260,fill:'#0044cc'},
  {...base,type:'rect',left:220,top:200,width:270,height:160,fill:'rgba(167,169,172,1)',opacity:.9,strokeWidth:2},
  {...base,type:'circle',left:600,top:120,width:140,height:140,radius:70,fill:'#118844',opacity:.35,scaleX:1.3,scaleY:.8,angle:25,flipX:true,startAngle:0,endAngle:2*Math.PI},
  {...base,type:'ellipse',left:180,top:420,width:160,height:70,rx:80,ry:35,fill:'#cc4400',opacity:0},
  {...base,type:'rect',left:400,top:400,width:120,height:60,fill:null,opacity:.3,title:'Segnaposto TEST',includeInForm:true},
  {...base,type:'group',left:600,top:400,width:200,height:100,scaleX:1.1,scaleY:1.1,angle:15,objects:[{...base,type:'rect',left:-100,top:-50,width:200,height:100,fill:'#cc2200',opacity:.4}]}
 ]}}]};
}
