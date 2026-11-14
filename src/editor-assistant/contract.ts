import {z} from 'zod';
import {EDITOR_LIMITS} from '../editor/limits';
import {SessionUsageSchema} from '../ai/usage';
const handle=z.string().regex(/^[ofi][1-9]\d{0,3}$/),coordinate=z.number().finite().min(-10000).max(10000),size=z.number().positive().max(10000),color=z.string().regex(/^#[0-9a-f]{6}$/),alignment=z.enum(['left','center','right']);
const fontSize=z.number().min(EDITOR_LIMITS.minFontSizePt).max(EDITOR_LIMITS.maxFontSizePt),text=z.string().max(4000);
export const GraphicalActionSchema=z.union([
 z.strictObject({type:z.enum(['addText']),text,fontId:handle,fontSizePt:fontSize,fill:color,alignment,xMm:coordinate,yMm:coordinate,widthMm:size}),
 z.strictObject({type:z.enum(['editText']),objectId:handle,text:text.nullable(),fontId:handle.nullable(),fontSizePt:fontSize.nullable(),fill:color.nullable(),alignment:alignment.nullable()}),
 z.strictObject({type:z.enum(['moveObject']),objectId:handle,xMm:coordinate,yMm:coordinate}),
 z.strictObject({type:z.enum(['addImage']),imageId:handle,xMm:coordinate,yMm:coordinate,widthMm:size}),
]);
export const GraphicalArgumentsSchema=z.strictObject({clarification:z.string().min(1).max(400).nullable(),actions:z.array(GraphicalActionSchema).max(16)});
export const GraphicalRequestSchema=z.strictObject({
 schemaVersion:z.literal(1),sessionId:z.string().uuid(),requestId:z.string().uuid(),revision:z.number().int().nonnegative(),message:z.string().trim().min(1).max(6000),
 canvas:z.strictObject({widthMm:size,heightMm:size,shape:z.enum(['rectangle','square','round']),monochrome:z.boolean(),minFontSizePt:fontSize,safeMarginMm:z.number().nonnegative().nullable()}),
 exclusions:z.array(z.strictObject({shape:z.enum(['rect','ellipse']),xMm:coordinate,yMm:coordinate,widthMm:size,heightMm:size})).max(29),
 objects:z.array(z.strictObject({id:handle,type:z.enum(['text','image','other']),label:z.string().max(160),selected:z.boolean(),protected:z.boolean(),textEditable:z.boolean(),movable:z.boolean(),xMm:coordinate,yMm:coordinate,widthMm:z.number().nonnegative().max(20000),heightMm:z.number().nonnegative().max(20000),textToken:z.string().regex(/^\[RISERVATO_\d+\]$/).nullable(),characters:z.number().int().nonnegative(),lines:z.number().int().nonnegative(),fontId:handle.nullable(),fontSizePt:fontSize.nullable(),fill:color.nullable(),alignment:alignment.nullable()})).max(200),
 fonts:z.array(z.strictObject({id:handle,name:z.string().min(1).max(160),weight:z.number().int().min(1).max(1000),italic:z.boolean()})).max(500),
 images:z.array(z.strictObject({id:handle,pixelWidth:z.number().int().positive(),pixelHeight:z.number().int().positive()})).max(4),
});
export type GraphicalRequest=z.infer<typeof GraphicalRequestSchema>;
export type GraphicalArguments=z.infer<typeof GraphicalArgumentsSchema>;
export const GraphicalResponseSchema=z.strictObject({schemaVersion:z.literal(1),requestId:z.string().uuid(),expectedRevision:z.number().int().nonnegative(),proposal:GraphicalArgumentsSchema,sessionUsage:SessionUsageSchema.optional()});
