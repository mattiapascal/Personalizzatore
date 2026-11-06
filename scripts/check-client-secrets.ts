import { loadEnv } from 'vite';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const secrets = ['OPENAI_API_KEY', 'SHOPIFY_ADMIN_ACCESS_TOKEN'].map(key => env[key]).filter((value): value is string => !!value && value.length > 10);
let cloudflareSecrets: Record<string, unknown> = {};
try { cloudflareSecrets = JSON.parse(await readFile('.local/cloudflare-secrets.json', 'utf8')); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('Configurazione privata Cloudflare illeggibile: controllo interrotto.'); }
for (const [key, value] of Object.entries(cloudflareSecrets)) {
  if (key !== 'TURNSTILE_SITE_KEY' && typeof value === 'string' && value.length > 10) secrets.push(value);
}
async function check(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await check(path);
    else {
      const text = await readFile(path, 'utf8');
      if (secrets.some(secret => text.includes(secret))) throw new Error('Credenziale rilevata nel bundle client: ' + path);
    }
  }
}
await check(process.argv[2] ?? 'dist');
console.log('PASS bundle client: nessuna delle credenziali locali configurate presente negli asset.');
