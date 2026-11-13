import {assertMinimumText,minimumFontForDocument} from './text-production';
import {cloneGraphicDocument,DocumentSchema,validateLayout,type GraphicDocument,type Measure,TEST_MARGIN_MM} from './model';
import {selectionBounds} from './selection';
import {defaultMountingFor} from './plaque';
import {adaptCompositionObjects,foregroundObjects} from './background';
/** One layout for multiple dimensions. Center without deformation; shrink only after explicit preview. */
export function fitPlaqueTemplate(source:GraphicDocument,area:GraphicDocument['areaMm'],measure:Measure):{document:GraphicDocument;scale:number}{
 if(!source.plaque||!source.objects.length&&!source.paperColor)throw new Error('Scegli un template di targa non vuoto.');DocumentSchema.parse(source);
 const target=cloneGraphicDocument(source);target.productId=null;target.variantId=null;target.catalogVersion=null;target.catalogProductProfileVersion=null;target.areaMm={...area};target.shape='rectangle';target.plaque=defaultMountingFor(source.plaque.family??'flat-plaque');
 const candidate=(scale:number)=>{const doc=cloneGraphicDocument(target);doc.objects=adaptCompositionObjects(source,area,measure,scale);return doc;};
 const original=candidate(1);assertMinimumText(original,minimumFontForDocument(original));try{validateLayout(original,measure);return{document:DocumentSchema.parse(original),scale:1};}catch{/* Preview a proportional reduction; never distort the artwork. */}
 const bounds=selectionBounds(foregroundObjects(source),measure),width=area.width-2*TEST_MARGIN_MM,height=area.height-2*TEST_MARGIN_MM;if(width<=0||height<=0)throw new Error('Dimensioni insufficienti per la grafica.');let upper=Math.min(1,width/bounds.widthMm,height/bounds.heightMm),lower=0;for(let i=0;i<32;i++){const trial=(lower+upper)/2;try{validateLayout(candidate(trial),measure);lower=trial;}catch{upper=trial;}}if(lower<.00001)throw Error('La composizione non può essere adattata a questa misura.');const scale=lower*(1-1e-8),parsed=DocumentSchema.safeParse(candidate(scale));if(!parsed.success)throw new Error('La riduzione violerebbe i limiti grafici del laboratorio. Modifica il template o scegli una misura maggiore.');assertMinimumText(parsed.data,minimumFontForDocument(parsed.data));validateLayout(parsed.data,measure);return{document:parsed.data,scale};
}
