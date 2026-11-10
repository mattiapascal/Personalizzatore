import {PitchprintFontResolutionSchema} from '../src/editor/pitchprint-font-resolution';
import { ZoneCommandSchema } from '../src/editor-admin/zone-model';
import { AcceptanceReportSchema } from '../src/editor-admin/acceptance';
import { ShopProductDetailSchema,ShopBrowserCatalogSchema } from '../src/editor-admin/shop-catalog';
import { ConfigurationCommandSchema, ConfigurationStateSchema } from '../src/editor-workflow/schema';
import { AdminCommandSchema, AdminStateSchema, FontLibraryBackupSchema } from '../src/editor-admin/schema';
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { CatalogSchema, ProductProfileSchema } from '../src/catalog/schema';
import { RequirementsSchema, RecommendationSchema, SelectionSessionSchema } from '../src/selection/schema';
import { AiToolSchema } from '../src/ai/contract';
import { DocumentSchema, GraphicCommandSchema } from '../src/editor/model';
import { RuntimeSchema, CatalogStateSchema } from '../src/runtime/schema';
import { AiRequestSchema, ArgumentsSchema } from '../server/openai';

mkdirSync('docs/schemas', { recursive: true });
for (const [name, schema] of Object.entries({ PitchprintFontResolution:PitchprintFontResolutionSchema,ReservedZoneCommand:ZoneCommandSchema,EditorAcceptanceReport:AcceptanceReportSchema,ShopProductDetail:ShopProductDetailSchema,LocalConfigurationCommand: ConfigurationCommandSchema, LocalConfigurationState: ConfigurationStateSchema, ShopBrowserCatalog: ShopBrowserCatalogSchema, FontLibraryBackup: FontLibraryBackupSchema, EditorAdminCommand: AdminCommandSchema, EditorAdminState: AdminStateSchema, Catalog: CatalogSchema, ProductProfile: ProductProfileSchema, Requirements: RequirementsSchema, Recommendation: RecommendationSchema, SelectionSession: SelectionSessionSchema, AiTool: AiToolSchema, GraphicDocument: DocumentSchema, GraphicCommand: GraphicCommandSchema, Runtime: RuntimeSchema, CatalogState: CatalogStateSchema, AiRequest: AiRequestSchema, AiInterpretationArguments: ArgumentsSchema })) {
  writeFileSync(`docs/schemas/${name}.json`, JSON.stringify(z.toJSONSchema(schema), null, 2) + '\n');
}
