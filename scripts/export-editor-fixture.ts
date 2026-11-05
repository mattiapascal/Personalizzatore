import { writeFileSync } from 'node:fs';
import { createDocument } from '../src/editor/model';
const doc = createDocument(); doc.documentId = '00000000-0000-4000-8000-000000000001';
writeFileSync('fixtures/illustrator/stamp.TEST.json', JSON.stringify(doc, null, 2) + '\n');
