import {z} from 'zod';
import {ProductProfileSchema,type ProductProfile} from '../catalog/schema';
import {ContentBriefSchema,type ContentBrief} from '../selection/content';
/** In-memory handoff. No inferred dimensions, transcript, price, URL or scene. */
export interface SelectionGraphicHandoff {sessionId:string;productId:string;productTitle:string;variantIds:string[];kind:'stamp-ink'|'stamp-emboss';text?:string;graphicSubject?:string;}
export function selectionGraphicHandoff(profile:ProductProfile,brief:ContentBrief|undefined,sessionId:string):SelectionGraphicHandoff{
 const product=ProductProfileSchema.parse(profile),content=ContentBriefSchema.parse(brief??{});
 if(product.status!=='ACTIVE')throw Error('Il prodotto non è disponibile per una nuova personalizzazione.');
 return{sessionId:z.string().uuid().parse(sessionId),productId:product.productId,productTitle:product.title,variantIds:[...product.variantIds],kind:product.mechanism==='emboss'?'stamp-emboss':'stamp-ink',...(content.text?{text:content.text}:{}),...(content.graphicSubject?{graphicSubject:content.graphicSubject}:{})};
}
