import { profileKey, type ProductProfile } from '../catalog/schema';
import { cloneGraphicDocument, DocumentSchema, validateLayout, TEST_MARGIN_MM, type GraphicCommand, type GraphicDocument, type Measure } from './model';
import { selectionBounds, transformSelection } from './selection';
import { assertMinimumText, minimumFontForProduct } from './text-production';

export interface TemplateFit {document:GraphicDocument;scale:number;}
function candidate(source:GraphicDocument,product:ProductProfile,catalogVersion:string,measure:Measure,scale:number):GraphicDocument {
  const document=cloneGraphicDocument(source);
  document.colorMode='monochrome';
  document.productId=product.productId;document.variantId=product.variantIds[0]!;document.catalogVersion=catalogVersion;document.catalogProductProfileVersion=product.profileVersion;document.areaMm={...product.nominalAreaMm};document.shape=product.shape;
  document.objects=source.objects.length?transformSelection(source.objects,{scale,rotationDeg:0,center:{xMm:document.areaMm.width/2,yMm:document.areaMm.height/2}},measure):[];
  return document;
}
/** Local TEST compatibility: real nominal dimensions, conservative existing margin/geometry rules. */
export function fitComposition(source:GraphicDocument,product:ProductProfile,catalogVersion:string,measure:Measure,allowShrink=false):TemplateFit {
  DocumentSchema.parse(source);
  const original=candidate(source,product,catalogVersion,measure,1);
  assertMinimumText(original,minimumFontForProduct(product));
  try{validateLayout(original,measure);return{document:DocumentSchema.parse(original),scale:1};}catch(cause){if(!allowShrink)throw cause;}
  const box=selectionBounds(source.objects,measure),width=product.nominalAreaMm.width-2*TEST_MARGIN_MM,height=product.nominalAreaMm.height-2*TEST_MARGIN_MM;
  if(width<=0||height<=0)throw new Error('Area del modello insufficiente nel profilo TEST');
  let upper=Math.min(1,width/box.widthMm,height/box.heightMm),lower=0;
  // Circular containment and rotated/text geometry use the same validator as the editor.
  for(let step=0;step<32;step++){
    const scale=(lower+upper)/2;
    try{validateLayout(candidate(source,product,catalogVersion,measure,scale),measure);lower=scale;}catch{upper=scale;}
  }
  if(lower<.00001)throw new Error('La composizione non può essere adattata a questo modello');
  const scale=lower*(1-1e-8),document=candidate(source,product,catalogVersion,measure,scale),parsed=DocumentSchema.safeParse(document);
  if(!parsed.success)throw new Error('La riduzione richiederebbe valori fuori dai limiti grafici del laboratorio. Modifica la grafica o scegli un modello più grande.');
  assertMinimumText(parsed.data,minimumFontForProduct(product));
  validateLayout(parsed.data,measure);return{document:parsed.data,scale};
}
export function fitTemplate(source:GraphicDocument,product:ProductProfile,catalogVersion:string,measure:Measure,allowShrink=false):TemplateFit {
  if(!source.objects.length)throw new Error('Il template è vuoto');
  return fitComposition(source,product,catalogVersion,measure,allowShrink);
}
export function smallestTemplateMount(source:GraphicDocument,products:readonly ProductProfile[],allowedKeys:readonly string[],catalogVersion:string,measure:Measure):{product:ProductProfile;fit:TemplateFit} {
  const allowed=new Set(allowedKeys),area=(product:ProductProfile)=>product.nominalAreaMm.width*product.nominalAreaMm.height*(product.shape==='round'?Math.PI/4:1);
  const candidates=products.filter(product=>allowed.has(profileKey(product))).sort((a,b)=>area(a)-area(b)||Math.max(a.nominalAreaMm.width,a.nominalAreaMm.height)-Math.max(b.nominalAreaMm.width,b.nominalAreaMm.height)||profileKey(a).localeCompare(profileKey(b)));
  for(const product of candidates){try{return{product,fit:fitTemplate(source,product,catalogVersion,measure)}}catch{/* Try the next allowed model, without shrinking or deforming. */}}
  throw new Error('Nessun modello associato contiene questa composizione con i vincoli TEST. Modifica il template o le sue associazioni.');
}
export function templateCommand(fit:TemplateFit,templateId:string,templateVersion:number,expectedRevision:number):GraphicCommand {
  return{schemaVersion:1,tool:'applyTemplate',expectedRevision,objectId:fit.document.objects[0]!.id,arguments:{templateId,templateVersion,objects:fit.document.objects,groups:fit.document.groups??[],...(fit.document.inkColor?{inkColor:fit.document.inkColor}:{}),...(fit.document.fontAssets?{fontAssets:fit.document.fontAssets}:{})}};
}
