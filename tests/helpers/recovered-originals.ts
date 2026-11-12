import{testPng}from'./png';
export const recoveredPreviewUrl='https://pitchprint.io/lowres/0123456789abcdef0123456789abcdef.png';
export const recoveredOriginalUrl=recoveredPreviewUrl.replace('/lowres/','/assets/');
export function recoveredOriginalsFixture(){
 const original=testPng(64,48,new Uint8Array(Array.from({length:64*48},(_,i)=>{const x=i%64,y=Math.floor(i/64);return x<4||x>=60||y<4||y>=44?[10,30,50,255]:(Math.floor(x/8)+Math.floor(y/8))%2?[0,136,204,255]:[230,90,20,180];}).flat())),preview=testPng(16,12,new Uint8Array(Array.from({length:16*12},()=>[255,0,255,255]).flat()));
 const common={type:'image',originX:'left',originY:'top',width:64,height:48,scaleX:3,scaleY:3,angle:0,strokeWidth:0,src:recoveredPreviewUrl,includeInForm:false};
 return{original:original.toString('base64'),preview:preview.toString('base64'),source:{title:'Originali recuperati TEST',unit:'mm',pages:[{pageData:{fWidth:100,fHeight:70},canvas:{clipPath:{type:'rect',left:0,top:0,width:1000,height:700},objects:[
  {...common,left:100,top:120},
  {...common,left:460,top:100,width:42.5,height:31.25,cropX:5.25,cropY:3.75,scaleX:4,scaleY:4,angle:25,flipX:true},
  {type:'group',originX:'center',originY:'center',left:750,top:450,width:250,height:200,scaleX:1.1,scaleY:.8,angle:-20,strokeWidth:0,objects:[{...common,originX:'center',originY:'center',left:0,top:0,scaleX:2.5,scaleY:2.5,flipX:true,flipY:true}]}
 ]}}]}};
}
