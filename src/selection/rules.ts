import type { CatalogAdapter } from '../catalog/adapter';
import { RequirementsSchema, type MissingField, type Recommendation, type Requirements } from './schema';

export function missingInformation(input: Requirements): MissingField[] {
  const r = RequirementsSchema.parse(input);
  if (!r.family) return ['family'];
  if (r.family !== 'stamp') return [];
  if (!r.mechanism) return ['mechanism'];
  if (r.mechanism !== 'automatic' || r.shape === 'round') return [];
  if (!r.minimumAreaMm && !r.sizeUnknown) return ['minimumAreaMm'];
  return [];
}
export const questions: Record<MissingField, string> = {
  family: 'Che prodotto cerchi? In questo laboratorio possiamo cercare timbri.',
  mechanism: 'Preferisci un timbro autoinchiostrante, manuale o tascabile?',
  minimumAreaMm: 'Quale ingombro minimo deve avere l’impronta (larghezza × altezza in mm)? Se non lo sai, scegli «Non so le misure». Il numero di righe da solo non garantisce che il testo entri.',
};

export function recommendProducts(catalog: CatalogAdapter, input: Requirements): Recommendation[] {
  const r = RequirementsSchema.parse(input);
  if (missingInformation(r).length || r.family !== 'stamp') return [];
  return catalog.list().filter(p =>
    p.status === 'ACTIVE' && p.family === r.family && p.mechanism === r.mechanism &&
    (!r.shape || p.shape === r.shape) && (!r.hasLogo || p.supportsLogo) &&
    (!r.minimumAreaMm || (p.nominalAreaMm.width >= r.minimumAreaMm.width && p.nominalAreaMm.height >= r.minimumAreaMm.height))
  ).sort((a, b) => a.nominalAreaMm.width * a.nominalAreaMm.height - b.nominalAreaMm.width * b.nominalAreaMm.height || a.productId.localeCompare(b.productId))
    .map(p => ({
      productId: p.productId, profileVersion: p.profileVersion, catalogVersion: catalog.version,
      reasons: [
        { ruleId: 'R1_CATALOG', explanation: 'Referenza reale presente nello snapshot Shopify, stato ACTIVE alla cattura.' },
        { ruleId: 'R2_MECHANISM', explanation: 'Montatura autoinchiostrante coerente con la scelta.' },
        { ruleId: 'R3_NOMINAL_SIZE', explanation: r.minimumAreaMm
          ? `Dimensioni nominali ${p.nominalAreaMm.width} × ${p.nominalAreaMm.height} mm ≥ ingombro minimo richiesto ${r.minimumAreaMm.width} × ${r.minimumAreaMm.height} mm; orientamento fisso.`
          : `Misure non note: ${p.nominalAreaMm.width} × ${p.nominalAreaMm.height} mm è una possibilità da esplorare.` },
        ...(r.hasLogo ? [{ ruleId: 'R4_LOGO', explanation: 'La descrizione Shopify prevede l’inserimento del logo; il file specifico va verificato.' }] : []),
        { ruleId: 'R5_ORDER', explanation: 'Ordinamento per superficie nominale crescente, senza usare prezzo o disponibilità.' },
      ],
      pending: [
        'Area utile, margini, font minimo e impaginazione da confermare con il laboratorio.',
        ...(r.lines ? [`Compatibilità delle ${r.lines} righe non verificata graficamente.`] : []),
        'Prezzo finale, disponibilità e pubblicazione da verificare sulla pagina attuale.',
        'Tag Shopify No-AI e warning-pitchprint: significato da confermare prima del rilascio.',
      ],
    }));
}
