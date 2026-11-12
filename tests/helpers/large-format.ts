import{createTestDocument,TEST_DEFAULT_FONT}from'./editor-fonts';import type{GraphicDocument}from'../../src/editor/model';
/** Portable synthetic sign, deliberately wider than the old one-metre ceiling. */
export function largeFormatDocument():GraphicDocument{
 return{...createTestDocument(),areaMm:{width:1100,height:400},colorMode:'color',objects:[
  {id:'frame',type:'rect',xMm:25,yMm:25,widthMm:1050,heightMm:350,stroke:'#000000',strokeMm:2,fill:'none'},
  {id:'headline',type:'text',xMm:110,yMm:140,text:'UFFICI',fontFamily:TEST_DEFAULT_FONT.id,fontSizePt:300,fill:'#000000',textAlign:'center',lineHeight:1,textBox:{widthMm:570,heightMm:140,autoWidth:true,autoHeight:true}},
  {id:'arrow',type:'path',xMm:800,yMm:130,widthMm:250,heightMm:140,points:[{x:0,y:0},{x:1,y:.5},{x:0,y:1},{x:.2,y:.5}],closed:true,stroke:'#000000',strokeMm:.1,fill:'#0088cc'},
  {id:'marker',type:'rect',xMm:1040,yMm:45,widthMm:25,heightMm:25,stroke:'none',strokeMm:.1,fill:'#0088cc'},
 ]};
}
