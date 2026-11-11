import {validateObjectInputs} from '../src/editor/object-properties';
import {assertDocumentTextProduction} from '../src/editor/text-production';
import {fixtureCatalog} from '../src/catalog/adapter';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { Parser } from 'htmlparser2';
import { assertOutputFonts } from '../src/editor/font-preflight';
import { fontCoverage } from './font-coverage';
import { ConfigurationStateSchema, ConfigurationCommandSchema, cartSummary, type ConfigurationState, type CartSummary } from '../src/editor-workflow/schema';
/** Passive SVG only. Stored as data and displayed as an image, never injected into HTML. */
export function checkConfigurationSvg(source: string): string {
  if (/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(source)) throw new Error('Anteprima SVG con dichiarazioni non consentite');
  source = source.replace(/<!DOCTYPE svg PUBLIC "-\/\/W3C\/\/DTD SVG 1\.1\/\/EN" "http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd"\s*>/g, '');
  if (/<!DOCTYPE/i.test(source)) throw new Error('Anteprima SVG con dichiarazioni non consentite');
  let root = false; const stack: string[] = [];
  const checkValue = (value: string) => {
    if (/javascript:|https?:|@import|expression\s*\(/i.test(value)) throw new Error('Anteprima con risorse esterne o attive');
    for (const match of value.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) if (!match[1]!.startsWith('#') && !/^data:(?:font\/(?:ttf|otf|woff2?)|image\/(?:png|jpeg));base64,[\w+/=]+$/i.test(match[1]!)) throw new Error('Risorsa SVG non ammessa');
  };
  const tags = new Set(['svg','defs','g','path','rect','circle','ellipse','line','polyline','polygon','text','tspan','clipPath','mask','pattern','image','style','metadata','desc','title']);
  const parser = new Parser({ onopentag(name, attrs) {
    stack.push(name);
    if (!tags.has(name)) throw new Error('Elemento attivo o sconosciuto nell’anteprima');
    if (name === 'svg') root = true;
    for (const [key, value] of Object.entries(attrs)) {
      if (/^on/i.test(key)) throw new Error('Evento non ammesso nell’anteprima');
      if (key.startsWith('xmlns')) continue;
      if (/href/i.test(key)) { if (!/^#[\w-]+$/.test(value) && !/^data:image\/(?:png|jpeg);base64,[\w+/=]+$/.test(value)) throw new Error('Riferimento SVG non ammesso'); }
      else checkValue(value);
    }
  }, onclosetag() { stack.pop(); }, ontext(value) { if (stack.at(-1) === 'style') { if (/\\|@(?!font-face\s*\{)/i.test(value)) throw new Error('CSS non ammesso nell’anteprima'); checkValue(value); } } }, { xmlMode: true });
  parser.end(source); if (!root) throw new Error('Anteprima SVG mancante'); return source;
}
export class ConfigurationStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private directory: string) {}
  async read(): Promise<ConfigurationState> {
    try { return ConfigurationStateSchema.parse(JSON.parse(await readFile(join(this.directory, 'state.json'), 'utf8'))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { schemaVersion: 1, revision: 0, configurations: [], lines: [], receipts: [] }; throw error; }
  }
  async dispatch(raw: unknown): Promise<CartSummary> {
    const work = async () => {
      const command = ConfigurationCommandSchema.parse(raw), state = await this.read();
      const fingerprint = createHash('sha256').update(JSON.stringify({ tool: command.tool, arguments: command.arguments })).digest('hex');
      const previous = state.receipts.find(r => r.id === command.requestId);
      if (previous) { if (previous.fingerprint !== fingerprint) throw new Error('Richiesta già usata con contenuti differenti'); return cartSummary(state); }
      const args = command.arguments;
      let line: ConfigurationState['lines'][number] | undefined;
      if ('lineId' in args) {
        line = state.lines.find(l => l.id === args.lineId);
        if (!line || line.configurationId !== args.expectedConfigurationId || line.version !== args.expectedVersion) throw new Error('Articolo modificato o rimosso in un’altra finestra: aggiorna il carrello locale');
      }
      if (command.tool === 'add' || command.tool === 'replace') {
        const { title, document, options, svg } = command.arguments; const preview = checkConfigurationSvg(svg);
        validateObjectInputs(document);
        assertDocumentTextProduction(document,{version:fixtureCatalog.version,products:fixtureCatalog.list()},true);
        await assertOutputFonts(document,{resolveWoff2:async asset=>fontCoverage(Buffer.from(asset.dataBase64,'base64'),'woff2')});
        const configurationId = randomUUID();
        // Zod parses/clones every nested object; no reference to the mutable editor survives.
        state.configurations.push({ id: configurationId, createdAt: new Date().toISOString(), title, document, options, svg: preview });
        if (command.tool === 'add') state.lines.push({ id: randomUUID(), configurationId, version: 1, quantity: command.arguments.quantity });
        else { line!.configurationId = configurationId; line!.version++; }
      } else if (command.tool === 'quantity') { line!.quantity = command.arguments.quantity; line!.version++; }
      else state.lines = state.lines.filter(l => l.id !== command.arguments.lineId);
      state.revision++; state.receipts.push({ id: command.requestId, fingerprint });
      ConfigurationStateSchema.parse(state);
      const content = JSON.stringify(state); if (Buffer.byteLength(content) > 512 * 1024 * 1024) throw new Error('Archivio delle prove oltre 512 MB');
      await mkdir(this.directory, { recursive: true }); const temp = join(this.directory, `state-${randomUUID()}.tmp`);
      await writeFile(temp, content, { mode: 0o600 }); await rename(temp, join(this.directory, 'state.json'));
      return cartSummary(state);
    };
    const result = this.queue.then(work); this.queue = result.catch(() => {}); return result;
  }
}
