import {cloneGraphicDocument,DocumentSchema,validateLayout,type GraphicDocument,type Measure,TEST_MARGIN_MM} from './model';
import {selectionBounds,transformSelection} from './selection';
import {defaultMountingFor} from './plaque';
/** One layout for multiple dimensions. Center without deformation; shrink only after explicit preview. */
export function fitPlaqueTemplate(source:GraphicDocument,area:GraphicDocument['areaMm'],measure:Measure):{document:GraphicDocument;scale:number}{
 if(!source.plaque||!source.objects.length&&!source.paperColor)throw new Error('Scegli un template di targa non vuoto.');DocumentSchema.parse(source);
 const target=cloneGraphicDocument(source);target.productId=null;target.variantId=null;target.catalogVersion=null;target.catalogProductProfileVersion=null;target.areaMm={...area};target.shape='rectangle';target.plaque=defaultMountingFor(source.plaque.family??'flat-plaque');
 const candidate=(scale:number)=>{const doc=cloneGraphicDocument(target);doc.objects=source.objects.length?transformSelection(source.objects,{scale,rotationDeg:0,center:{xMm:area.width/2,yMm:area.height/2}},measure):[];return doc;};
 const original=candidate(1);try{validateLayout(original,measure);return{document:DocumentSchema.parse(original),scale:1};}catch{/* Preview a proportional reduction; never distort the artwork. */}
 const bounds=selectionBounds(source.objects,measure),width=area.width-2*TEST_MARGIN_MM,height=area.height-2*TEST_MARGIN_MM;if(width<=0||height<=0)throw new Error('Dimensioni insufficienti per la grafica.');const scale=Math.min(1,width/bounds.widthMm,height/bounds.heightMm)*(1-1e-8),parsed=DocumentSchema.safeParse(candidate(scale));if(!parsed.success)throw new Error('La riduzione violerebbe i limiti grafici del laboratorio. Modifica il template o scegli una misura maggiore.');validateLayout(parsed.data,measure);return{document:parsed.data,scale};
}
