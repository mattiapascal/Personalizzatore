/** Exact area average of equal-sized RGBA blocks. Canvas getImageData exposes
 * straight alpha; accumulate premultiplied colours so transparent pixels cannot
 * introduce dark/coloured fringes. No browser-dependent resize kernel. */
export function boxSampleRgba(source:Uint8ClampedArray,width:number,height:number,samples:number):Uint8ClampedArray<ArrayBuffer>{
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0||![1,2,4,8].includes(samples)||width%samples||height%samples||source.length!==width*height*4)throw Error('Dimensioni o campionamento RGBA non validi');
 if(samples===1)return source.slice();
 const outWidth=width/samples,outHeight=height/samples,result=new Uint8ClampedArray(outWidth*outHeight*4),count=samples*samples;
 for(let y=0;y<outHeight;y++)for(let x=0;x<outWidth;x++){
  let red=0,green=0,blue=0,alpha=0;
  for(let dy=0;dy<samples;dy++){let i=((y*samples+dy)*width+x*samples)*4;for(let dx=0;dx<samples;dx++,i+=4){const a=source[i+3]!;alpha+=a;red+=source[i]!*a;green+=source[i+1]!*a;blue+=source[i+2]!*a;}}
  const i=(y*outWidth+x)*4,a=Math.round(alpha/count);result[i+3]=a;
  if(a){result[i]=Math.round(red/alpha);result[i+1]=Math.round(green/alpha);result[i+2]=Math.round(blue/alpha);}
 }
 return result;
}
