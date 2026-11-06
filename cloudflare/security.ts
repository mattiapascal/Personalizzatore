export const STORE_ORIGINS = ['https://www.incisoriasacchetti.it', 'https://incisoriasacchetti.it', 'https://zqu2eg-72.myshopify.com'];
export async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export async function sha256(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
export function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function readBody(request: Request, maxBytes = 16_384): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Formato richiesta non valido.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Messaggio mancante.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error('Messaggio troppo lungo.'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(all));
}
export async function verifyTurnstile(token: string, secret: string, hostname: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!token || token.length > 2048 || !secret) return false;
  const result = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST',
    body: new URLSearchParams({ secret, response: token }), signal: AbortSignal.timeout(8000), redirect: 'manual' });
  if (!result.ok) return false;
  const data = await result.json() as { success?: boolean; hostname?: string; action?: string };
  return data.success === true && data.hostname === hostname && data.action === 'assistant-start';
}
