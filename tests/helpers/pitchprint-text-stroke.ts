/** Synthetic, portable native source; no commercial artwork or fonts embedded. */
export function outlinedTextTestSource(){
 const base={type:'i-text',originX:'center',originY:'top',fontFamily:'Arimo',fontWeight:'normal',fontStyle:'normal',fontSize:40,textAlign:'center',lineHeight:1,charSpacing:25,angle:0,fill:'#000000',stroke:'#0088cc',strokeWidth:1.2,strokeLineJoin:'miter',strokeMiterLimit:4,paintFirst:'fill'};
 return{title:'Contorno testi TEST',unit:'mm',pages:[{pageData:{fWidth:160,fHeight:100},canvas:{clipPath:{left:0,top:0,width:1600,height:1000},objects:[{...base,text:'TEST ABC\nDEF',width:260,height:90.4,left:800,top:150,scaleX:1.7,scaleY:2.2,styles:{0:{0:{stroke:'#cc2200',strokeWidth:3},1:{strokeWidth:0}},1:{1:{stroke:'rgba(0,0,0,.4)',strokeWidth:2}}}},{...base,type:'textbox',text:'ALFA BETA GAMMA\nDELTA',fontSize:32,width:220,height:110,left:500,top:500,scaleX:2,scaleY:2,stroke:'#000000',strokeWidth:2}]}}]};
}
