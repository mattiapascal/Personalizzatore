import type { CatalogAdapter } from '../catalog/adapter.ts';
import { RequirementsSchema, type MissingField, type Recommendation, type Requirements } from './schema.ts';
import { profileKey } from '../catalog/schema.ts';
import type { ProductProfile } from '../catalog/schema.ts';

export function missingInformation(input: Requirements): MissingField[] {
  const r = RequirementsSchema.parse(input);
  if (!r.family) return ['family'];
  if (r.family !== 'stamp') return [];
  if (!r.mechanism) return ['mechanism'];
  if (r.mechanism === 'manual' && !r.material) return ['material'];
  if (!r.shape) return ['shape'];
  if (!r.minimumAreaMm && !r.maximumAreaMm && !(r.shape === 'round' && r.diameterMm) && !r.sizeUnknown) return ['minimumAreaMm'];
  return [];
}
export const questions: Record<MissingField, string> = {
  family: 'Che prodotto cerchi? In questo laboratorio possiamo cercare timbri.',
  mechanism: 'Preferisci un timbro autoinchiostrante, manuale, tascabile oppure a secco (in rilievo)?',
  material: 'Per la montatura manuale preferisci legno, plastica, metallo oppure non hai preferenze?',
  shape: 'Vuoi un’impronta rettangolare, quadrata o rotonda?',
  minimumAreaMm: 'Quali misure minime deve avere l’impronta in mm (larghezza × altezza, lato per il quadrato o diametro per il tondo)? Puoi rispondere «Non so le misure». Il numero di righe da solo non garantisce che il testo entri.',
};

export function productMatches(p: ProductProfile, r: Requirements): boolean {
  const mechanismMatches = !r.mechanism || p.mechanism === r.mechanism || (r.mechanism === 'automatic' && p.mechanism === 'pocket' && /autoinchiostrante/i.test(p.title));
  return p.status === 'ACTIVE' && (!r.family || p.family === r.family) && mechanismMatches &&
    (!r.shape || p.shape === r.shape) && (!r.hasLogo || p.supportsLogo === true) &&
    (r.mechanism !== 'manual' || !r.material || r.material === 'any' || p.materials?.includes(r.material) === true) &&
    (!r.diameterMm || (p.shape === 'round' && p.nominalAreaMm.width >= r.diameterMm)) &&
    (!r.maximumAreaMm || p.nominalAreaMm.width <= r.maximumAreaMm.width && p.nominalAreaMm.height <= r.maximumAreaMm.height) &&
    (!r.minimumAreaMm || (p.shape === 'round' ? p.nominalAreaMm.width >= Math.hypot(r.minimumAreaMm.width, r.minimumAreaMm.height) : p.nominalAreaMm.width >= r.minimumAreaMm.width && p.nominalAreaMm.height >= r.minimumAreaMm.height));
}
export function recommendProducts(catalog: CatalogAdapter, input: Requirements): Recommendation[] {
  const r = RequirementsSchema.parse(input);
  if (missingInformation(r).length || r.family !== 'stamp') return [];
  return catalog.list().filter(p => productMatches(p, r)).sort((a, b) => a.nominalAreaMm.width * a.nominalAreaMm.height - b.nominalAreaMm.width * b.nominalAreaMm.height || profileKey(a).localeCompare(profileKey(b)))
    .map(p => ({
      productId: p.productId, ...(p.profileId ? { profileId: profileKey(p) } : {}), profileVersion: p.profileVersion, catalogVersion: catalog.version,
      reasons: [
        { ruleId: 'R1_CATALOG', explanation: 'Referenza reale presente nello snapshot Shopify, stato ACTIVE alla cattura.' },
        { ruleId: 'R2_MECHANISM', explanation: `Montatura ${p.mechanism === 'emboss' ? 'a secco' : p.mechanism === 'pocket' ? 'tascabile' : p.mechanism === 'manual' ? 'manuale' : 'autoinchiostrante'} coerente con la scelta.` },
        ...(r.mechanism === 'manual' && r.material && r.material !== 'any' ? [{ ruleId: 'R6_MATERIAL', explanation: `Materiale ${r.material === 'wood' ? 'legno' : r.material === 'plastic' ? 'plastica' : 'metallo'} dichiarato nella montatura Shopify.` }] : []),
        { ruleId: 'R3_NOMINAL_SIZE', explanation: r.diameterMm ? `Diametro nominale ${p.nominalAreaMm.width} mm ≥ diametro minimo richiesto ${r.diameterMm} mm.` : r.minimumAreaMm
          ? p.shape === 'round' ? `Diametro ${p.nominalAreaMm.width} mm ≥ diagonale dell’ingombro rettangolare ${r.minimumAreaMm.width} × ${r.minimumAreaMm.height} mm.` : `Dimensioni nominali ${p.nominalAreaMm.width} × ${p.nominalAreaMm.height} mm ≥ ingombro minimo richiesto ${r.minimumAreaMm.width} × ${r.minimumAreaMm.height} mm; orientamento fisso.`
          : r.maximumAreaMm ? `Dimensioni nominali ${p.nominalAreaMm.width} × ${p.nominalAreaMm.height} mm; confronto con lo spazio massimo nella regola R7.` : `Misure non note: ${p.nominalAreaMm.width} × ${p.nominalAreaMm.height} mm è una possibilità da esplorare.` },
        ...(r.hasLogo ? [{ ruleId: 'R4_LOGO', explanation: 'La descrizione Shopify prevede logo/grafica personalizzata; il file specifico va verificato.' }] : []),
        ...(r.maximumAreaMm ? [{ ruleId: 'R7_TARGET_AREA', explanation: `Impronta nominale ${p.nominalAreaMm.width} × ${p.nominalAreaMm.height} mm entro lo spazio disponibile ${r.maximumAreaMm.width} × ${r.maximumAreaMm.height} mm; margini e grafica da verificare.` }] : []),
        { ruleId: 'R5_ORDER', explanation: 'Ordinamento per superficie nominale crescente, senza usare prezzo o disponibilità.' },
      ],
      pending: [
        ...(r.sizeIsEstimate ? ['Ingombro stimato dal testo con font e margini di prova: verificare la composizione effettiva nel canvas.'] : []),
        ...(p.dataWarnings ?? []),
        'Area utile, margini, font minimo e impaginazione da confermare con il laboratorio.',
        ...(r.lines ? [`Compatibilità delle ${r.lines} righe non verificata graficamente.`] : []),
        'Prezzo finale, disponibilità e pubblicazione da verificare sulla pagina attuale.',
        'Percorso grafico in negozio e avvisi PitchPrint da verificare prima del rilascio.',
      ],
    }));
}
