import {z} from 'zod';
import {GRAPHIC_GEOMETRY_LIMITS} from '../editor/limits';
import {ShopProductDetailSchema} from './shop-catalog';
export const MeasurementIssueSchema=z.enum(['missing','unsupported-type','invalid-value','unverified-unit']);
const reading=z.strictObject({mm:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.pageSideMm).nullable(),issue:MeasurementIssueSchema.nullable()}).refine(value=>(value.mm===null)!==(value.issue===null),'Misura e stato non coerenti');
export const ShopMeasurementsSchema=z.strictObject({
 schemaVersion:z.literal(1),source:ShopProductDetailSchema.shape.source,checkedAt:z.string().datetime(),id:ShopProductDetailSchema.shape.id,title:z.string().max(1000),status:ShopProductDetailSchema.shape.status,
 definitions:z.strictObject({width:z.enum(['verified-mm','missing','changed']),height:z.enum(['verified-mm','missing','changed'])}),
 variants:z.array(z.strictObject({id:ShopProductDetailSchema.shape.variants.element.shape.id,title:z.string().max(1000),width:reading,height:reading})).max(2000),
}).refine(value=>new Set(value.variants.map(item=>item.id)).size===value.variants.length,'Varianti duplicate nelle misure').refine(value=>value.variants.every(item=>(value.definitions.width==='verified-mm'||item.width.mm===null)&&(value.definitions.height==='verified-mm'||item.height.mm===null)),'Misura numerica senza unità verificata');
export type ShopMeasurements=z.infer<typeof ShopMeasurementsSchema>;
export const measurementIssueLabel=(issue:z.infer<typeof MeasurementIssueSchema>|null)=>issue===null?'':({'missing':'Metafield mancante','unsupported-type':'Tipo diverso da number_decimal','invalid-value':'Valore non valido o oltre il limite del foglio','unverified-unit':'Unità della definizione da verificare'})[issue];
