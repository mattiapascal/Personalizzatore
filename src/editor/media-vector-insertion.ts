import{measureFabric}from'./fabric-adapter';import{svgInsertion,type PreparedSvg}from'./svg-import';import{selectionBounds,transformSelection}from'./selection';import type{GraphicDocument,GraphicCommand}from'./model';import{assertMinimumText}from'./text-production';
export function librarySvgInsertion(prepared:PreparedSvg,doc:GraphicDocument,defaultWidthMm?:number,minimumFontPt:number|null=null){
 if(!defaultWidthMm)return svgInsertion(prepared,doc,measureFabric,minimumFontPt);const bounds=selectionBounds(prepared.objects,measureFabric);if(bounds.widthMm<=0)throw Error('Risorsa priva di larghezza');const target=Math.min(defaultWidthMm,doc.areaMm.width-4,bounds.heightMm?(doc.areaMm.height-4)*bounds.widthMm/bounds.heightMm:defaultWidthMm),scale=target/bounds.widthMm,objects=transformSelection(prepared.objects,{scale,rotationDeg:0,center:{xMm:0,yMm:0}},measureFabric);return svgInsertion({...prepared,objects,widthMm:target,heightMm:prepared.heightMm*scale},doc,measureFabric,minimumFontPt);
}
/** Cover the page with the SVG artboard, preserving its whitespace and aspect.
 * Artwork outside the artboard also stays outside the covered destination. */
export function librarySvgBackground(prepared:PreparedSvg,doc:GraphicDocument,title:string,minimumFontPt:number|null=null):{command:Extract<GraphicCommand,{tool:'setBackgroundObjects'}>;report:string}{
 const bounds=selectionBounds(prepared.objects,measureFabric),frame=prepared.viewportMm??bounds;
 if(frame.widthMm<=0||frame.heightMm<=0)throw Error('Sfondo SVG privo di un formato valido');
 const scale=Math.max(doc.areaMm.width/frame.widthMm,doc.areaMm.height/frame.heightMm),center={xMm:doc.areaMm.width/2+(bounds.xMm+bounds.widthMm/2-frame.xMm-frame.widthMm/2)*scale,yMm:doc.areaMm.height/2+(bounds.yMm+bounds.heightMm/2-frame.yMm-frame.heightMm/2)*scale},objects=transformSelection(prepared.objects,{scale,rotationDeg:0,center},measureFabric),groupId=`background-${crypto.randomUUID()}`;
 if(scale<1)assertMinimumText({...doc,objects},minimumFontPt);
 return{command:{schemaVersion:1,tool:'setBackgroundObjects',objectId:groupId,expectedRevision:doc.revision,arguments:{objects,groups:[{id:groupId,objectIds:objects.map(o=>o.id),editor:{label:`Sfondo · ${title}`.slice(0,120),includeInForm:false}}],backgroundGroupId:groupId,...(prepared.fontAssets?.length?{fontAssets:prepared.fontAssets}:{})}},report:`Sfondo SVG applicato: ${objects.length} elementi vettoriali, proporzioni conservate e ritaglio sul foglio.`};
}
