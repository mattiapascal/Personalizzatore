import {z} from 'zod';
const id=z.uuid(),title=z.string().trim().min(1).max(160);
export const MediaKindSchema=z.enum(['picture','background']);
export const MediaOriginSchema=z.strictObject({provider:z.literal('pitchprint'),id:z.string().min(1).max(160),url:z.url().max(2048),categoryId:z.string().max(160).optional()});
export const MediaCategorySchema=z.strictObject({id,kind:MediaKindSchema,title,archived:z.boolean(),originId:z.string().max(160).optional()});
export const MediaAssetSchema=z.strictObject({id,kind:MediaKindSchema,title,categories:z.array(id).max(40),archived:z.boolean(),usage:z.enum(['print','unclassified','material']),defaultWidthMm:z.number().min(.1).max(1000).optional(),mime:z.enum(['image/png','image/jpeg','image/svg+xml','image/webp']),hash:z.string().regex(/^[a-f0-9]{64}$/),thumbnailHash:z.string().regex(/^[a-f0-9]{64}$/),bytes:z.number().int().positive().max(20*1024*1024),width:z.number().positive().max(12000),height:z.number().positive().max(12000),origin:MediaOriginSchema.optional(),createdAt:z.iso.datetime()});
export const MediaStateSchema=z.strictObject({schemaVersion:z.literal(1),revision:z.number().int().nonnegative(),categories:z.array(MediaCategorySchema).max(1000),assets:z.array(MediaAssetSchema).max(10000)});
const metadata={title,defaultWidthMm:z.number().min(.1).max(1000).optional(),categories:z.array(id).max(40),usage:z.enum(['print','unclassified','material'])};
export const MediaCommandSchema=z.discriminatedUnion('tool',[
 z.strictObject({tool:z.literal('category'),expectedRevision:z.number().int().nonnegative(),arguments:z.strictObject({id:id.optional(),kind:MediaKindSchema,title,archived:z.boolean().optional(),originId:z.string().max(160).optional()})}),
 z.strictObject({tool:z.literal('upload'),expectedRevision:z.number().int().nonnegative(),arguments:z.strictObject({kind:MediaKindSchema,...metadata,dataBase64:z.string().max(28*1024*1024),thumbnailBase64:z.string().max(400*1024),width:z.number().positive().max(12000),height:z.number().positive().max(12000),origin:MediaOriginSchema.optional()})}),
 z.strictObject({tool:z.literal('update'),expectedRevision:z.number().int().nonnegative(),arguments:z.strictObject({id,...metadata,archived:z.boolean()})})
]);
export type MediaState=z.infer<typeof MediaStateSchema>;export type MediaAsset=z.infer<typeof MediaAssetSchema>;export type MediaCommand=z.infer<typeof MediaCommandSchema>;export type MediaKind=z.infer<typeof MediaKindSchema>;
export const emptyMediaState=():MediaState=>({schemaVersion:1,revision:0,categories:[],assets:[]});
export function availableMedia(state:MediaState,kind:MediaKind,admin=false):MediaAsset[]{const active=new Set(state.categories.filter(c=>!c.archived).map(c=>c.id));return state.assets.filter(a=>a.kind===kind&&(admin||!a.archived&&(kind!=='background'||a.usage==='print')&&(!a.categories.length||a.categories.some(c=>active.has(c)))));}
