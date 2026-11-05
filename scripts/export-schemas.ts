import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { CatalogSchema, ProductProfileSchema } from '../src/catalog/schema';
import { RequirementsSchema, RecommendationSchema, SelectionSessionSchema } from '../src/selection/schema';
import { AiToolSchema } from '../src/ai/contract';
import { DocumentSchema, GraphicCommandSchema } from '../src/editor/model';

mkdirSync('docs/schemas', { recursive: true });
for (const [name, schema] of Object.entries({ Catalog: CatalogSchema, ProductProfile: ProductProfileSchema, Requirements: RequirementsSchema, Recommendation: RecommendationSchema, SelectionSession: SelectionSessionSchema, AiTool: AiToolSchema, GraphicDocument: DocumentSchema, GraphicCommand: GraphicCommandSchema })) {
  writeFileSync(`docs/schemas/${name}.json`, JSON.stringify(z.toJSONSchema(schema), null, 2) + '\n');
}
