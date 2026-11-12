import type{FontAsset}from'../../src/editor/font-assets';
import{pitchprintPageReferenceSvg}from'./pitchprint-page-reference.browser';
import{compareSupersampledSvg}from'./svg-color-reference.browser';
/** Native source retains stale metadata and missing font names without cleanup. */
export async function inspectTrailingTextStyles(source:any,assets:FontAsset[]){
 const h='/tests/helpers/browser-module.ts',{loadedEditorModule}=await import(h),{importPitchPrint}=await import(loadedEditorModule('/src/editor/pitchprint-import.ts')),{FabricAdapter}=await import(loadedEditorModule('/src/editor/fabric-adapter.ts')),{loadFontAssets}=await import(loadedEditorModule('/src/editor/fonts.ts'));await loadFontAssets(assets);
 const before=JSON.stringify(source),requests:string[]=[],resolve=(raw:any)=>{const font=assets.find((a:any)=>a.familyGroup===raw.fontFamily&&a.weight===(raw.fontWeight==='bold'?700:400)&&a.italic===(raw.fontStyle==='italic'));if(!font)throw Error('File TEST esatto mancante: '+raw.fontFamily);return font;},converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async(family:string,weight:number,italic:boolean)=>{requests.push(family);return resolve({fontFamily:family,fontWeight:weight===700?'bold':'normal',fontStyle:italic?'italic':'normal'});},image:async()=>{throw Error('Nessuna immagine TEST');}}),view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});
 try{view.render(converted.document);const svg=view.exportSvg(converted.document),reference=await pitchprintPageReferenceSvg(source,converted.document.fontAssets??[],{},resolve),pixels=await compareSupersampledSvg(reference,svg,1000,625),clean=structuredClone(source);
  for(const item of clean.pages[0].canvas.objects){const lines=item.text.split('\n').map((line:string)=>Array.from(line));for(const [line,styles]of Object.entries(item.styles)as any[])for(const column of Object.keys(styles))if(Number(column)>lines[Number(line)].length)delete styles[column];}
  const cleanReference=await pitchprintPageReferenceSvg(clean,converted.document.fontAssets??[],{},resolve);
  return{document:converted.document,warnings:converted.warnings,svg,reference,pixels,requests,historyInert:reference===cleanReference,sourceUnchanged:before===JSON.stringify(source),lines:view.canvas.getObjects().map((o:any)=>o.textLines.length)};
 }finally{view.dispose();}
}
