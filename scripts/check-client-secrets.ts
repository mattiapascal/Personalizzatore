import { loadEnv } from 'vite';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const secrets = ['OPENAI_API_KEY', 'SHOPIFY_ADMIN_ACCESS_TOKEN'].map(key => env[key]).filter((value): value is string => !!value && value.length > 10);
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
await check('dist');
console.log('PASS bundle client: nessuna delle credenziali locali configurate presente negli asset.');
