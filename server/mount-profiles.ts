import { ProductProfileSchema, ProductImageSchema, type ProductProfile } from '../src/catalog/schema.ts';
import type { RawProduct } from './catalog.ts';

type Format = { width: number; height: number; shape: ProductProfile['shape'] };
export const PROFILE_RULES_VERSION = 'mount-rules-v3-advisory';
const number = '(\\d+(?:[.,]\\d+)?)';
const plain = (text: string) => text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
const numeric = (value: string) => Number(value.replace(',', '.'));
function formats(text: string): Format[] {
  const result: Format[] = [];
  for (const match of text.matchAll(new RegExp(number + '\\s*[x×]\\s*' + number + '\\s*(mm|cm)\\b', 'gi'))) {
    const scale = match[3]!.toLowerCase() === 'cm' ? 10 : 1;
    const width = numeric(match[1]!) * scale, height = numeric(match[2]!) * scale;
    result.push({ width, height, shape: width === height ? 'square' : 'rectangle' });
  }
  for (const match of text.matchAll(new RegExp('(?:diametro|diam\\.?|[Øø])\\s*' + number + '\\s*(mm|cm)\\b', 'gi'))) {
    const size = numeric(match[1]!) * (match[2]!.toLowerCase() === 'cm' ? 10 : 1);
    result.push({ width: size, height: size, shape: 'round' });
  }
  return result.filter(f => f.width > 0 && f.height > 0 && f.width <= 1000 && f.height <= 1000);
}
const sameArea = (a: Format, b: Format) => Math.abs(a.width - b.width) < 0.01 && Math.abs(a.height - b.height) < 0.01;
function oneFormat(text: string): Format | null {
  const found = formats(text);
  if (!found.length || found.some(f => !sameArea(f, found[0]!))) return null;
  const f = found[0]!;
  if (/tond|circolar|diam|[Øø]/i.test(text)) {
    if (f.width !== f.height) return null;
    return { ...f, shape: 'round' };
  }
  return f;
}
function dimension(field: RawProduct['variants']['nodes'][number]['imprintWidth']): number | null {
  if (field?.type !== 'number_decimal') return null;
  const raw = field.jsonValue;
  if (typeof raw !== 'number' && (typeof raw !== 'string' || !/^\d+(?:\.\d+)?$/.test(raw))) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value <= 1000 ? value : null;
}

export function deriveMountProfiles(p: RawProduct): { profiles: ProductProfile[]; reason: string | null } {
  const body = plain(p.descriptionHtml);
  const summary = typeof p.technicalSummary?.jsonValue === 'string' ? plain(p.technicalSummary.jsonValue) : '';
  const source = body + ' ' + summary;
  const useCases: NonNullable<ProductProfile['useCases']> = [];
  for (const [purpose, pattern] of [['loyalty', /tessere\s+(?:punti|fedeltà)|raccolt[ae]\s+punti|abbonament|drink\s*card/i], ['exlibris', /ex[ -]?libris|propri\s+libri|contrassegnare.{0,60}libri/i]] as const) {
    const match = pattern.exec(source);
    if (match) useCases.push({ purpose, evidence: source.slice(Math.max(0, match.index - 65), match.index + 145).trim() });
  }
  if (!/^timbro\b/i.test(p.title)) return { profiles: [], reason: 'Escluso: accessorio o articolo diverso da una montatura.' };
  if (/creativo|componibile|firma autografa|\bdatari|numerator|\bdata\b.*(?:gestione|altezza)/i.test(p.title) || /testo fisso|gestione della data|timbro datario|numeratore/i.test(source)) return { profiles: [], reason: 'Escluso: dicitura, firma o meccanismo speciale con layout dedicato non definito.' };
  const mechanism: ProductProfile['mechanism'] | null = /a secco/i.test(p.title) ? 'emboss'
    : /tascabil/i.test(p.title) || p.tags.includes('Tascabili') ? 'pocket'
    : p.tags.includes('Timbri manuali') || /timbro (?:manuale|in legno|in plastica)/i.test(p.title) ? 'manual'
    : /autoinchiostrante/i.test(p.title) ? 'automatic' : null;
  if (!mechanism) return { profiles: [], reason: 'Da verificare: tipo di montatura non dichiarato esplicitamente.' };
  if (!/personalizz|compositore|composizion|incisione|clich[ée]|\bloghi\b|\blogo\b/i.test(source)) return { profiles: [], reason: 'Da verificare: personalizzazione libera non documentata.' };
  if (p.variants.pageInfo.hasNextPage) return { profiles: [], reason: 'Da verificare: varianti non lette integralmente.' };
  const profiles: ProductProfile[] = [], failures: string[] = [];
  const titleFormat = oneFormat(p.title);
  const summaryFormats = formats(summary);
  const materials: NonNullable<ProductProfile['materials']> = [];
  if (/legno/i.test(p.title)) materials.push('wood');
  if (/plastica/i.test(p.title)) materials.push('plastic');
  if (/ottone|metallo/i.test(p.title)) materials.push('metal');
  for (const variant of p.variants.nodes) {
    const width = dimension(variant.imprintWidth), height = dimension(variant.imprintHeight);
    if (width === null || height === null) { failures.push(variant.title + ': metafield variante custom.larghezza/custom.altezza mancanti o non validi (number_decimal, mm, > 0 e ≤ 1000)'); continue; }
    const diameterOption = variant.selectedOptions.find(o => /diametro.*mm/i.test(o.name));
    const variantFormat = oneFormat(variant.title);
    const shapeText = variant.title !== 'Default Title' ? variant.title : p.title;
    const round = !!diameterOption || /tond|circolar|diam|[Øø]/i.test(shapeText) || (!variantFormat && /tond|circolar|diam|[Øø]/i.test(p.title));
    if (round && width !== height) { failures.push(variant.title + ': forma circolare incompatibile con larghezza/altezza dei metafield'); continue; }
    const area: Format = { width, height, shape: round ? 'round' : width === height ? 'square' : 'rectangle' };
    const areaSource = `Shopify variante ${variant.id}, custom.larghezza=${width} mm, custom.altezza=${height} mm`;
    if (/quadrat/i.test(shapeText) && area.width !== area.height) { failures.push(variant.title + ': forma quadrata discordante con le misure'); continue; }
    const conflicts: string[] = [];
    if (variantFormat && !sameArea(variantFormat, area)) conflicts.push('titolo variante');
    if (!variantFormat && !diameterOption && titleFormat && !sameArea(titleFormat, area)) conflicts.push('titolo prodotto');
    if (diameterOption && numeric(diameterOption.value) !== width) conflicts.push('opzione diametro');
    if (summaryFormats.length && !summaryFormats.some(f => sameArea(f, area))) conflicts.push('custom.short_description');
    const listedDiameters = summary.match(/diametri disponibili:\s*([\d\s/.,]+)mm/i);
    if (diameterOption && listedDiameters && !listedDiameters[1]!.split('/').map(v => numeric(v.trim())).includes(area.width)) conflicts.push('elenco diametri nella scheda tecnica');
    if (conflicts.length) failures.push(variant.title + ': discordanza descrittiva con ' + conflicts.join(', ') + '; usati i metafield variante');
    const supportsLogo = /logo|grafic|disegn|composizion/i.test(source) ? true : null;
    profiles.push(ProductProfileSchema.parse({
      image: ProductImageSchema.safeParse(p.featuredMedia?.preview?.image).data ?? null,
      useCases,
      profileId: `${p.id}::${variant.id}`, productId: p.id, variantIds: [variant.id], variantLabel: variant.title === 'Default Title' ? '' : variant.title,
      handle: p.handle, title: p.title, status: p.status, url: p.onlineStoreUrl, tags: [...p.tags].sort(), profileVersion: 1,
      family: 'stamp', mechanism, mechanismSource: 'Shopify titolo/tag espliciti: ' + p.title, shape: area.shape, nominalAreaMm: { width: area.width, height: area.height }, materials,
      areaSource: areaSource + '; nominale, area produttiva non validata', supportsLogo, logoSource: supportsLogo ? 'Descrizione Shopify: logo/grafica/composizione dichiarati' : 'Compatibilità logo da confermare',
      dataWarnings: conflicts.length ? ['Dimensioni dai metafield variante; dati descrittivi discordanti: ' + conflicts.join(', ') + '.'] : [],
      constraints: { minFontSizePt: null, safeMarginMm: null, allowedColors: null }, validatedForProduction: false, price: null, availability: null,
    }));
  }
  return { profiles, reason: failures.length ? 'Da verificare: ' + failures.join('; ') : profiles.length ? null : 'Da verificare: nessun formato utilizzabile' };
}
