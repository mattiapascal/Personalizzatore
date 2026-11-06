import { loadEnv } from 'vite';
import { readConfig } from '../server/config.ts';
import { fetchCatalog } from '../server/catalog.ts';
import { writeJson } from '../server/files.ts';

const config = readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env });
const products = await fetchCatalog(config);
await writeJson('.local/mount-audit.json', { readAt: new Date().toISOString(), products });
const active = products.filter(p => p.status === 'ACTIVE' && p.onlineStoreUrl);
console.log(JSON.stringify({ read: products.length, activePublished: active.length, variants: active.flatMap(p => p.variants.nodes).length, report: '.local/mount-audit.json' }));
