import { loadEnv } from 'vite';
import { readConfig } from '../server/config.ts';
import { fetchCatalog } from '../server/catalog.ts';
import { writeJson } from '../server/files.ts';

const config = readConfig({ ...loadEnv('development', process.cwd(), ''), ...process.env });
const products = await fetchCatalog(config);
await writeJson('.local/mount-audit.json', { readAt: new Date().toISOString(), products });
const active = products.filter(p => p.status === 'ACTIVE' && p.onlineStoreUrl);
console.log(JSON.stringify({ read: products.length, activePublished: active.length, candidates: active.filter(p => !/creativ|posta|cuscinetto|inchiostro|prestazione|opposizione/i.test(p.title)).map(p => ({ id: p.id, title: p.title, tags: p.tags, variants: p.variants.nodes.map(v => v.title), summary: p.technicalSummary?.jsonValue })) }, null, 2));
