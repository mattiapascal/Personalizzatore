import { z } from 'zod';
import { DocumentSchema } from '../editor/model';
import { ProductionProfileSchema, ProductionProfileDataSchema } from './production-profile';
import { ShopProfileBindingSchema } from './shop-catalog';
export const MAX_LIBRARY_FONTS=500;
export const MAX_ARCHIVE_RECORDS=2000;
const title = z.string().trim().min(1).max(120), tags = z.array(z.string().trim().min(1).max(40)).max(20), id = z.string().uuid();
export const AdminSettingsSchema = z.strictObject({ editorName: title, gridMm: z.number().finite().min(.1).max(10), gridVisible: z.boolean(), snapEnabled: z.boolean(), customerPdfEnabled:z.boolean().optional() });
export const DEFAULT_ADMIN_SETTINGS = { editorName: 'Configuratore locale', gridMm: 1, gridVisible: false, snapEnabled: false, customerPdfEnabled:false };
const base = { id, title, archived: z.boolean(), createdAt: z.string().datetime(), updatedAt: z.string().datetime() };
export const TemplateProductsSchema = z.strictObject({profileKeys:z.array(z.string().min(1).max(200)).min(1).max(200),initialMount:z.literal('smallest-compatible'),adaptation:z.literal('confirm-proportional')}).refine(value=>new Set(value.profileKeys).size===value.profileKeys.length,'Modelli duplicati');
export const PitchprintProvenanceSchema=z.strictObject({sourceId:z.string().trim().min(1).max(200),sourceHash:z.string().regex(/^[a-f0-9]{64}$/),converterVersion:z.literal(1),warnings:z.array(z.string().max(2000)).max(200)});
export const ShopProductSelectionSchema=z.strictObject({productId:ShopProfileBindingSchema.shape.productId,allVariants:z.boolean(),variantIds:z.array(ShopProfileBindingSchema.shape.variantId).max(2000)}).refine(value=>new Set(value.variantIds).size===value.variantIds.length&&(value.allVariants||value.variantIds.length>0),'Scegli varianti uniche oppure tutte le varianti');
export const ArchiveRecordSchema = z.strictObject({ ...base, kind: z.enum(['template','composition']), tags, clientRef: z.string().trim().max(120), document: DocumentSchema, version: z.number().int().positive(), templateProducts:TemplateProductsSchema.optional(),shopProducts:z.array(ShopProfileBindingSchema).max(2000).optional(),pitchprintSource:PitchprintProvenanceSchema.optional() });
export const AdminFontSchema = z.strictObject({ ...base, family: z.string().trim().min(1).max(80), familyGroup:z.string().trim().min(1).max(120).optional(),styleName:z.string().max(120).optional(),weight:z.number().int().min(1).max(1000).optional(),italic:z.boolean().optional(), format: z.enum(['woff2','woff','ttf','otf']), notes: z.string().max(1000), originalFileName:z.string().min(1).max(255).optional(), categories:tags.optional(), source: z.enum(['manual','google']).optional(), sourceUrl: z.string().max(1000).optional(), licenseText: z.string().max(30000).optional(), dataBase64: z.string().max(1400000) });
// Descriptive information only: a metadata edit cannot replace a font file or its typographic metrics.
export const FontMetadataSchema = AdminFontSchema.pick({family:true,notes:true}).extend({sourceUrl:z.union([z.literal(''),z.url({protocol:/^https?$/})]).pipe(z.string().max(1000)),licenseText:z.string().max(30000)});
export const FontLibraryBackupSchema=z.strictObject({kind:z.literal('incisoria-font-library'),schemaVersion:z.literal(1),exportedAt:z.string().datetime(),fonts:z.array(AdminFontSchema).max(MAX_LIBRARY_FONTS)}).refine(value=>new Set(value.fonts.map(font=>font.id)).size===value.fonts.length,'ID font duplicati nel backup');
export type FontLibraryBackup=z.infer<typeof FontLibraryBackupSchema>;
const TagOrderSchema=z.array(z.string().trim().min(1).max(40)).max(4000);
export const AdminStateSchema = z.strictObject({ schemaVersion: z.literal(1), revision: z.number().int().nonnegative(), settings: AdminSettingsSchema, records: z.array(ArchiveRecordSchema).max(MAX_ARCHIVE_RECORDS), fonts: z.array(AdminFontSchema).max(MAX_LIBRARY_FONTS), productionProfiles:z.array(ProductionProfileSchema).max(200).optional(),productionProfileHistory:z.array(ProductionProfileSchema).max(2000).optional(),tagOrder:TagOrderSchema.optional() });
export type AdminState = z.infer<typeof AdminStateSchema>;
export type ArchiveRecord = z.infer<typeof ArchiveRecordSchema>;
export type AdminSnapshot = Omit<AdminState,'records'|'fonts'> & { records: (Omit<ArchiveRecord,'document'>&{graphicFamily?:'plaque'|'stamp-test'})[]; fonts: (Omit<z.infer<typeof AdminFontSchema>,'dataBase64'> & { fileHash?:string; actualFamily?: string; actualFullName?: string; actualFamilyGroup?:string; detectedFamilyGroup?:string;detectedCategories?:string[]; actualStyleName?:string; actualWeight?:number; actualItalic?:boolean })[] };
const expectedRevision = z.number().int().nonnegative();
export const AdminCommandSchema = z.discriminatedUnion('tool',[
 z.strictObject({tool:z.literal('bulkTemplateAssociationMap'),expectedRevision,arguments:z.strictObject({targets:z.array(z.strictObject({id,version:z.number().int().positive(),products:z.array(ShopProductSelectionSchema).min(1).max(200)})).min(1).max(MAX_ARCHIVE_RECORDS),mode:z.enum(['add','replace'])})}),
 z.strictObject({tool:z.literal('setFontCategories'),expectedRevision,arguments:z.strictObject({ids:z.array(id).min(1).max(MAX_LIBRARY_FONTS),categories:tags.nullable(),mode:z.enum(['add','replace','remove'])})}),
 z.strictObject({tool:z.literal('importPitchprintTemplate'),expectedRevision,arguments:z.strictObject({title,tags,document:DocumentSchema,origin:PitchprintProvenanceSchema})}),
 z.strictObject({tool:z.literal('bulkTemplateAssociations'),expectedRevision,arguments:z.strictObject({targets:z.array(z.strictObject({id,version:z.number().int().positive()})).min(1).max(MAX_ARCHIVE_RECORDS),mode:z.enum(['add','replace','remove']),products:z.array(ShopProductSelectionSchema).max(200)})}),
 z.strictObject({tool:z.literal('uploadFonts'),expectedRevision,arguments:z.strictObject({fonts:z.array(z.strictObject({fileName:z.string().min(1).max(255),format:AdminFontSchema.shape.format,dataBase64:AdminFontSchema.shape.dataBase64,family:AdminFontSchema.shape.family.optional(),notes:z.string().max(1000).optional(),sourceUrl:FontMetadataSchema.shape.sourceUrl.optional(),licenseText:z.string().max(30000).optional(),weight:AdminFontSchema.shape.weight,italic:AdminFontSchema.shape.italic})).min(1).max(50)})}),
 z.strictObject({tool:z.literal('setFontFamilies'),expectedRevision,arguments:z.strictObject({ids:z.array(id).min(1).max(MAX_LIBRARY_FONTS),familyGroup:z.string().trim().min(1).max(120).nullable()})}),
 z.strictObject({tool:z.literal('setTagOrder'),expectedRevision,arguments:z.strictObject({tags:TagOrderSchema})}),
 z.strictObject({tool:z.literal('compositionToTemplate'),expectedRevision,arguments:z.strictObject({id})}),
 z.strictObject({tool:z.literal('restoreFontLibrary'),expectedRevision,arguments:z.strictObject({backup:FontLibraryBackupSchema})}),
 z.strictObject({tool:z.literal('saveProductionProfile'),expectedRevision,arguments:z.strictObject({id:id.optional(),profile:ProductionProfileDataSchema})}),
 z.strictObject({tool:z.literal('archiveProductionProfile'),expectedRevision,arguments:z.strictObject({id,archived:z.boolean()})}),
 z.strictObject({tool:z.literal('settings'),expectedRevision,arguments:AdminSettingsSchema}),
 z.strictObject({tool:z.literal('saveRecord'),expectedRevision,arguments:ArchiveRecordSchema.pick({title:true,kind:true,tags:true,clientRef:true,document:true})}),
 z.strictObject({tool:z.literal('replaceRecord'),expectedRevision,arguments:z.strictObject({id,recordVersion:z.number().int().positive(),title,tags,document:DocumentSchema})}),
 z.strictObject({tool:z.literal('deleteRecord'),expectedRevision,arguments:z.strictObject({id,recordVersion:z.number().int().positive()})}),
 z.strictObject({tool:z.literal('deleteFont'),expectedRevision,arguments:z.strictObject({id})}),
 z.strictObject({tool:z.literal('updateRecord'),expectedRevision,arguments:z.strictObject({id,title,tags,clientRef:z.string().trim().max(120)})}),
 z.strictObject({tool:z.literal('archiveRecord'),expectedRevision,arguments:z.strictObject({id,archived:z.boolean()})}),
 z.strictObject({tool:z.literal('templateProducts'),expectedRevision,arguments:z.strictObject({id,products:TemplateProductsSchema.nullable()})}),
 z.strictObject({tool:z.literal('duplicateRecord'),expectedRevision,arguments:z.strictObject({id})}),
 z.strictObject({tool:z.literal('uploadFont'),expectedRevision,arguments:AdminFontSchema.pick({family:true,format:true,notes:true,originalFileName:true,categories:true,dataBase64:true,source:true,sourceUrl:true,licenseText:true,familyGroup:true,styleName:true,weight:true,italic:true}).extend({sourceUrl:FontMetadataSchema.shape.sourceUrl.optional()})}),
 z.strictObject({tool:z.literal('updateFontMetadata'),expectedRevision,arguments:FontMetadataSchema.extend({id})}),
 z.strictObject({tool:z.literal('archiveFont'),expectedRevision,arguments:z.strictObject({id,archived:z.boolean()})}),
]);
export type AdminCommand = z.infer<typeof AdminCommandSchema>;
