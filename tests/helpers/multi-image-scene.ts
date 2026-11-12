import{testPng}from'./png';
import{rasterSourceFromBytes}from'../../src/editor/raster-source';
import{DEFAULT_RASTER}from'../../src/editor/raster-processing';
import{createTestDocument}from'./editor-fonts';
import type{GraphicDocument,SceneObject}from'../../src/editor/model';
/** Eight exact bitmap originals, sixteen resource aliases and 32 placements.
 * Original/gray/binary, fractional crops and flips exercise the existing engine. */
export function multiImageScene():GraphicDocument{
 const sources=Array.from({length:8},(_,seed)=>rasterSourceFromBytes(`tile-${seed}`,testPng(6,4,new Uint8Array(Array.from({length:24},(_,p)=>[(p*31+seed*47)%256,(p*17+seed*61)%256,(p*43+seed*23)%256,p%7===0?100:255]).flat()))));
 const doc=createTestDocument();Object.assign(doc,{documentId:'bbbbbbbb-1234-4234-8234-123456789032',colorMode:'color',areaMm:{width:160,height:100},objects:[],fontAssets:[]});
 doc.objects=Array.from({length:32},(_,i):Extract<SceneObject,{type:'image'}>=>{const crop=i%4===0?{leftPx:1,topPx:.5,widthPx:4,heightPx:3}:undefined;return{id:`photo-${i+1}`,type:'image',xMm:5+i%8*19,yMm:5+Math.floor(i/8)*23,widthMm:16,heightMm:16*(crop?crop.heightPx/crop.widthPx:2/3),rotationDeg:i%4*15,source:{...sources[i%8]!,...(i>=16?{id:`alias-${i%8}`}:{})},raster:i%3===0?{...DEFAULT_RASTER,mode:'original'}:i%3===1?{...DEFAULT_RASTER,mode:'grayscale',backgroundRemoval:'luminance',tintColor:i%2?'#0088cc':'#cc2200'}:{...DEFAULT_RASTER,method:'ordered',whiteTransparent:true},...(crop?{crop}:{}),flipX:i%2===0,flipY:i%5===0};});return doc;
}
