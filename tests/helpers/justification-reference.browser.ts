import type{FontAsset}from'../../src/editor/font-assets';
import{loadedEditorModule}from'./browser-module';
import{pitchprintPageReferenceSvg}from'./pitchprint-page-reference.browser';
import{compareSupersampledSvg}from'./svg-color-reference.browser';
import{IText,Textbox}from'fabric';
/** Native unmodified Fabric spacing reference; the same equal-space algorithm
 * is independently checked against the cached Fabric 3.4.0 runtime locally. */
export async function inspectImportedJustification(source:any,assets:FontAsset[]){
 const {importPitchPrint}=await import(/* @vite-ignore */ loadedEditorModule('/src/editor/pitchprint-import.ts')),
 {FabricAdapter}=await import(/* @vite-ignore */ loadedEditorModule('/src/editor/fabric-adapter.ts')),
 {renderFontFamily,loadFontAssets}=await import(/* @vite-ignore */ loadedEditorModule('/src/editor/fonts.ts'));
 await loadFontAssets(assets);
 const resolve=(raw:any)=>{const name=String(raw.fontFamily),weight=raw.fontWeight==='bold'?700:Number(raw.fontWeight)||400,italic=raw.fontStyle==='italic',asset=assets.find(f=>(f.familyGroup===name||f.family===name)&&f.weight===weight&&f.italic===italic);if(!asset)throw Error('File TEST esatto mancante: '+name);return asset;};
 const converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async(fontFamily:string,fontWeight:number,fontStyle:boolean)=>resolve({fontFamily,fontWeight,fontStyle:fontStyle?'italic':'normal'}),image:async()=>{throw Error('Nessuna immagine TEST');}}),doc=converted.document;
 const raw=source.pages[0].canvas.objects[0],styles=structuredClone(raw.styles);
 for(const row of Object.values(styles)as any[])for(const style of Object.values(row)as any[])Object.assign(style,{fontFamily:renderFontFamily(resolve({...raw,...style}).id),fontWeight:'normal',fontStyle:'normal'});
 const {type:ignoredType,text:ignoredText,...serialized}=raw;
 const options={...serialized,styles,fontFamily:renderFontFamily(resolve(raw).id),fontWeight:'normal',fontStyle:'normal' as const,minWidth:.001};
 const native=raw.type==='textbox'?new Textbox(raw.text,options):new IText(raw.text,options),view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});
 try{
  view.render(doc);const box=view.canvas.getObjects()[0] as any;
  const lines=box.textLines as string[],nativeLines=native.textLines;
  const points=(o:any,scale:number)=>{const matrix=o.calcOwnMatrix(),points:{x:number;y:number}[]=[];let top=-o.height/2;
   for(let i=0;i<o._textLines.length;i++){const height=o.getHeightOfLine(i),y=top+height/o.lineHeight*(1-o._fontSizeFraction),left=-o.width/2+o._getLineLeftOffset(i);
    for(let j=0;j<=o._textLines[i].length;j++){const x=left+o.__charBounds[i][j].left;points.push({x:(matrix[0]*x+matrix[2]*y+matrix[4])*scale,y:(matrix[1]*x+matrix[3]*y+matrix[5])*scale});}top+=height;
   }return points;};
  const a=points(native,.1),b=points(box,1/8),maxPositionDeltaMm=a.length===b.length?Math.max(...a.map((p,i)=>Math.hypot(p.x-b[i]!.x,p.y-b[i]!.y))):Infinity;
  const svg=view.exportSvg(doc),reference=await pitchprintPageReferenceSvg(source,assets,{},resolve),pixels=await compareSupersampledSvg(reference,svg,1000,625);
  return{document:doc,svg,reference,pixels,lines,nativeLines,maxPositionDeltaMm,positions:a.length,settings:doc.objects[0]!.justification};
 }finally{native.dispose();view.dispose();}
}
