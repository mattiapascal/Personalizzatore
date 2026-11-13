/** Synthetic Fabric 3 source. Declared text dimensions intentionally include
 * stale editing-history sizes; groups retain their declared coordinate plane. */
export function affineTextSource() {
  const common={type:'i-text',originX:'left',originY:'top',text:'TEST · Città',fontFamily:'Arimo',fontSize:38,fontWeight:'normal',fontStyle:'normal',width:310,height:55,left:0,top:0,scaleX:1,scaleY:1,angle:0,skewX:0,skewY:0,stroke:null,strokeWidth:1,fill:'#0088cc',textAlign:'center',lineHeight:1,charSpacing:15};
  return {title:'Testi affini importati TEST',unit:'mm',pages:[{pageData:{fWidth:166,fHeight:113},canvas:{clipPath:{left:25,top:-40,width:1600,height:1100},objects:[
    {...common,left:120,top:100,scaleX:1.7,scaleY:2.2,angle:-12,skewX:25,styles:{0:{0:{fill:'#aa3300',fontSize:44},7:{underline:true}}}},
    {...common,type:'textbox',left:1400,top:520,width:230,height:170,text:'ALFA BETA GAMMA\nCittà',originX:'right',originY:'bottom',scaleX:1.7,scaleY:1.5,skewY:12,angle:8,stroke:'#000000',strokeWidth:1.2,strokeLineJoin:'round'},
    {type:'group',left:720,top:720,width:560,height:240,originX:'center',originY:'center',scaleX:1.2,scaleY:.9,angle:18,skewX:-10,skewY:5,strokeWidth:0,title:'Gruppo inclinato TEST',objects:[
      {...common,left:-220,top:-80,originX:'left',originY:'top',scaleX:1.2,scaleY:1.4,skewX:-15,skewY:7,angle:-12,text:'Gruppo TEST'},
      {type:'group',left:240,top:100,width:230,height:100,originX:'right',originY:'bottom',scaleX:.9,scaleY:1.2,angle:-16,skewY:9,flipX:true,flipY:true,strokeWidth:0,objects:[
        {...common,text:'ABC DEF',left:0,top:0,originX:'center',originY:'center',scaleX:1.1,scaleY:1.3,skewX:8,angle:11},
      ]},
      {type:'rect',left:-220,top:60,width:280,height:20,originX:'left',originY:'top',fill:'#0088cc',stroke:null,strokeWidth:0},
    ]},
  ]}}]};
}
