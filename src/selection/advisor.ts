import type { CatalogAdapter } from '../catalog/adapter.ts';
import { profileKey } from '../catalog/schema.ts';
import type { ContentBrief } from './content.ts';
import type { Recommendation, Requirements } from './schema.ts';
import { productMatches } from './rules.ts';

// Proposte iniziali: fatti di catalogo e scelte del cliente restano distinti.
export function adviseProducts(catalog: CatalogAdapter, requirements: Requirements, brief?: ContentBrief): Recommendation[] {
  if (requirements.family !== 'stamp' || !brief?.purpose || !['loyalty', 'exlibris'].includes(brief.purpose)) return [];
  const purpose = brief.purpose;
  return catalog.list().filter(p => p.useCases?.some(c => c.purpose === purpose) && productMatches(p, requirements))
    .sort((a, b) => a.nominalAreaMm.width * a.nominalAreaMm.height - b.nominalAreaMm.width * b.nominalAreaMm.height || profileKey(a).localeCompare(profileKey(b))).slice(0, 3)
    .map(p => ({ productId: p.productId, profileId: profileKey(p), profileVersion: p.profileVersion, catalogVersion: catalog.version,
      reasons: [{ ruleId: 'P1_CATALOG_USE', explanation: 'La scheda prodotto indica: ' + p.useCases!.find(c => c.purpose === purpose)!.evidence }],
      pending: [...(p.dataWarnings ?? []), ...(!requirements.maximumAreaMm && purpose === 'loyalty' ? ['Misure delle caselline e ingombro del logo ancora da verificare.'] : []), 'Area utile, impaginazione, prezzo e disponibilità da verificare prima della conferma.'],
    }));
}
export function advisoryFacts(catalog: CatalogAdapter, r: Requirements, brief?: ContentBrief) {
  const preferred = adviseProducts(catalog, { ...r, family: r.family ?? 'stamp' }, brief);
  const examples = preferred.length ? preferred.map(c => catalog.get(c.profileId!)) : catalog.list().filter(p => p.useCases?.length && productMatches(p, r)).sort((a, b) => a.nominalAreaMm.width * a.nominalAreaMm.height - b.nominalAreaMm.width * b.nominalAreaMm.height).slice(0, 6);
  return examples.slice(0, 6).map(p => ({ profileId: profileKey(p), title: p.title, mechanism: p.mechanism, shape: p.shape, nominalAreaMm: p.nominalAreaMm, uses: p.useCases }));
}
