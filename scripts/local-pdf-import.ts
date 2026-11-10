import type { Plugin } from 'vite';
import { pdfEditableText } from './pdf-editable-text';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export const MAX_PDF_BYTES = 2 * 1024 * 1024;
const run = promisify(execFile);
/** Development-only conversion. Original files exist only in a temporary directory. */
export async function convertLocalPdf(bytes: Buffer, textMode: 'outlines'|'editable' = 'outlines'): Promise<{ svg: string; unembeddedFonts: string[]; textCount?: number }> {
  if (bytes.length > MAX_PDF_BYTES || !bytes.subarray(0, 8).toString('ascii').match(/^%PDF-(?:1\.[0-7]|2\.0)/)) throw new Error('PDF non valido o oltre 2 MB');
  const directory = await mkdtemp(join(tmpdir(), 'editor-pdf-'));
  try {
    const input = join(directory, 'input.pdf'); await writeFile(input, bytes);
    let info: string;
    try { info = (await run('pdfinfo', [input], { timeout: 10000, maxBuffer: 256 * 1024, env: { ...process.env, LC_ALL: 'C' } })).stdout; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('Conversione PDF locale non disponibile: installare Poppler (pdfinfo/pdftocairo).'); throw new Error('PDF non leggibile, protetto o oltre il tempo di elaborazione'); }
    if (!/^Pages:\s+1\s*$/m.test(info)) throw new Error('Importare un PDF con una sola pagina');
    if (/^Encrypted:\s+yes/m.test(info)) throw new Error('PDF protetto non supportato');
    let unembeddedFonts: string[];
    try { const fonts = (await run('pdffonts', [input], { timeout: 10000, maxBuffer: 256 * 1024, env: { ...process.env, LC_ALL: 'C' } })).stdout; unembeddedFonts = fonts.split('\n').filter(line => /\sno\s+(?:yes|no)\s+(?:yes|no)\s+\d+\s+\d+\s*$/.test(line)).map(line => line.trim().split(/\s+/)[0]!).slice(0,100); } catch { throw new Error('Analisi dei font PDF non riuscita'); }
    try { const images = (await run('pdfimages', ['-list', input], { timeout: 10000, maxBuffer: 256 * 1024, env: { ...process.env, LC_ALL: 'C' } })).stdout; if (images.split('\n').some(line => /^\s*\d+\s+\d+\s+\S+/.test(line))) throw new Error('PDF con immagini raster: questo import accetta soltanto grafica vettoriale'); } catch (error) { if (error instanceof Error && error.message.includes('immagini raster')) throw error; throw new Error('Analisi delle immagini PDF non riuscita'); }
    let svg: string;
    try { svg = (await run('pdftocairo', ['-svg', '-f', '1', '-l', '1', input, '-'], { timeout: 10000, maxBuffer: 256 * 1024, env: { ...process.env, LC_ALL: 'C', XDG_CACHE_HOME: directory } })).stdout; }
    catch { throw new Error('Conversione PDF oltre i limiti di tempo/256 KB SVG o non riuscita'); }
    if (textMode === 'editable') { const xml=(await run('pdftohtml',['-xml','-stdout','-i','-zoom','1','-noroundcoord','-fontfullname','-nomerge',input],{timeout:10000,maxBuffer:256*1024,env:{...process.env,LC_ALL:'C'}})).stdout; return {...pdfEditableText(svg,xml),unembeddedFonts}; }
    return { svg, unembeddedFonts };
  } finally { await rm(directory, { recursive: true, force: true }); }
}
export function localPdfImportPlugin(): Plugin {
 let busy = false;
 return { name: 'editor-local-pdf-import', apply: 'serve', configureServer(server) {
  server.middlewares.use('/__editor-local/pdf', async (req, res) => {
   const json = (status: number, value: unknown) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(value)); };
   const origin = req.headers.origin, host = req.headers.host, remote = req.socket.remoteAddress;
   if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote ?? '') || origin !== `http://${host}` || req.headers['x-editor-local'] !== '1') { json(403, { error: 'Importazione disponibile soltanto dall’editor locale' }); return; }
   if (req.method !== 'POST' || req.headers['content-type'] !== 'application/pdf') { json(415, { error: 'Inviare un PDF locale' }); return; }
   if (busy) { json(429, { error: 'Un PDF è già in elaborazione' }); return; }
   if (Number(req.headers['content-length']) > MAX_PDF_BYTES) { json(413, { error: 'PDF oltre 2 MB' }); return; }
   busy = true;
   try { const chunks: Buffer[] = []; let total = 0; for await (const chunk of req) { const data = Buffer.from(chunk); total += data.length; if (total > MAX_PDF_BYTES) throw new Error('PDF oltre 2 MB'); chunks.push(data); } const textMode=req.headers['x-editor-text-mode']==='editable'?'editable':'outlines'; const converted = await convertLocalPdf(Buffer.concat(chunks),textMode); json(200, { ...converted, textAsOutlines: textMode==='outlines' }); }
   catch (error) { json(422, { error: error instanceof Error ? error.message : 'PDF non importabile' }); }
   finally { busy = false; }
  });
 }};
}
