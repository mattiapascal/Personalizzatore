/** Synthetic native source, with differently sized/typed spaces on one line. */
export function justifiedTextTestSource(type:'i-text'|'textbox'='i-text',angle=0,mixed=true,tracking=0){
 const text='ALFA BETA GAMMA\nA  B C\nSOLO\nC D';
 return{title:'Giustificazione TEST',unit:'mm',pages:[{pageData:{fWidth:160,fHeight:100},canvas:{clipPath:{left:0,top:0,width:1600,height:1000},objects:[{type,text,fontFamily:'Arimo',fontSize:40,fontWeight:'normal',fontStyle:'normal',textAlign:'justify',lineHeight:1,charSpacing:tracking,width:260,height:180,left:500,top:100,originX:'center',originY:'top',scaleX:1.7,scaleY:1.5,angle,fill:'#000000',stroke:null,strokeWidth:1,styles:mixed?{1:{1:{fontFamily:'Tinos',fontSize:24},2:{fontFamily:'Arimo',fontSize:56},3:{fill:'#0088cc'}}}:{} }]}}]};
}
