import{boxSampleRgba}from'../../src/editor/pixel-sampling';
/** Render both independent SVGs at the same higher sampling rate before
 * comparing the small result. This separates geometry errors from Skia's
 * different edge coverage for native strokes and filled stroke outlines. */
export async function compareSupersampledSvg(referenceSvg:string,actualSvg:string,width:number,height:number,samples=4,actualSamples=samples){
 const render=async(svg:string,samples:number)=>{const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();const high=document.createElement('canvas');high.width=width*samples;high.height=height*samples;const h=high.getContext('2d')!;h.fillStyle='white';h.fillRect(0,0,high.width,high.height);h.drawImage(image,0,0,high.width,high.height);const data=boxSampleRgba(h.getImageData(0,0,high.width,high.height).data,high.width,high.height,samples);high.width=high.height=1;return data;};
 const a=await render(referenceSvg,samples),b=await render(actualSvg,actualSamples);let different=0,ink=0,error=0;for(let i=0;i<a.length;i+=4){const delta=Math.max(Math.abs(a[i]!-b[i]!),Math.abs(a[i+1]!-b[i+1]!),Math.abs(a[i+2]!-b[i+2]!));if(Math.min(a[i]!,a[i+1]!,a[i+2]!,b[i]!,b[i+1]!,b[i+2]!)<245)ink++;if(delta>24)different++;error+=delta;}return{different,ink,ratio:different/Math.max(ink,1),meanChannelError:error/(width*height)};
}
