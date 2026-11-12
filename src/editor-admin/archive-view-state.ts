import { z } from 'zod';
export type ArchiveKind = 'template' | 'composition';
export const ArchiveViewSchema = z.strictObject({
 query:z.string().max(500),archived:z.boolean(),tags:z.array(z.string().min(1).max(40)).max(4000),tagQuery:z.string().max(500),mode:z.enum(['all','any']),sort:z.enum(['tags','title','updated']),page:z.number().int().min(0).max(1000),scrollY:z.number().finite().min(0).max(10000000),selectedId:z.string().uuid().optional(),anchorId:z.string().uuid().optional(),anchorOffset:z.number().finite().min(-10000).max(10000).optional(),
});
export type ArchiveView=z.infer<typeof ArchiveViewSchema>;
export const defaultArchiveView=():ArchiveView=>({query:'',archived:false,tags:[],tagQuery:'',mode:'all',sort:'tags',page:0,scrollY:0});
const key=(kind:ArchiveKind)=>`incisoria-admin-archive-view-v1:${kind}`;
/** View state belongs to this tab, never to a saved design or a customer account. */
export function readArchiveView(kind:ArchiveKind):ArchiveView{
 try{const raw=sessionStorage.getItem(key(kind));if(raw&&raw.length<256000){const parsed=ArchiveViewSchema.safeParse(JSON.parse(raw));if(parsed.success)return parsed.data;}}catch{/* Disabled browser storage: browsing remains available. */}
 return defaultArchiveView();
}
export function saveArchiveView(kind:ArchiveKind,view:ArchiveView):void{
 try{const checked=ArchiveViewSchema.safeParse(view);if(checked.success)sessionStorage.setItem(key(kind),JSON.stringify(checked.data));}catch{/* No archive or document writes depend on this convenience. */}
}
