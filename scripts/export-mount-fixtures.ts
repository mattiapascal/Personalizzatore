import { readJson, writeJson } from '../server/files.ts';
import { RawProductSchema, normalizeCatalog } from '../server/catalog.ts';
import { z } from 'zod';

const audit = z.object({ readAt: z.iso.datetime(), products: z.array(RawProductSchema) }).parse(await readJson('.local/mount-audit.json'));
const catalog = normalizeCatalog(audit.products, new Date(audit.readAt));
await writeJson('fixtures/products/shopify-mounts.TEST.json', { ...catalog.snapshot, fixture: true, source: 'TEST: fonti Shopify lette in sola lettura; dimensioni esclusivamente da custom.larghezza/custom.altezza della variante in mm; non validati per produzione' });
const samples = ['15104975208828', '15104977633660', '15105044447612', '15106681799036', '15999882330492', '15106215805308', '15106103345532', '16036621287804', '16036621746556'];
await writeJson('fixtures/products/mount-sources.TEST.json', { fixture: true, readAt: audit.readAt, products: audit.products.filter(p => samples.includes(p.id.split('/').at(-1)!)) });
await writeJson('.local/mount-profile-report.json', catalog);
console.log(JSON.stringify({ profiles: catalog.snapshot.products.length, products: new Set(catalog.snapshot.products.map(p => p.productId)).size, mechanisms: Object.fromEntries(['automatic', 'manual', 'pocket', 'emboss'].map(kind => [kind, catalog.snapshot.products.filter(p => p.mechanism === kind).length])), pending: catalog.pending.length, report: '.local/mount-profile-report.json' }, null, 2));
