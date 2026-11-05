import type { CatalogAdapter } from '../catalog/adapter.ts';
import { recommendProducts } from './rules.ts';
import { RequirementsSchema, SelectionSessionSchema, type Requirements, type SelectionSession } from './schema.ts';

export const SESSION_KEY = 'customizer.selection.v1';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export function newSession(catalog: CatalogAdapter): SelectionSession {
  return { schemaVersion: 1, sessionId: crypto.randomUUID(), revision: 0, requirements: {}, candidates: [], selectedProductId: null, catalogVersion: catalog.version, updatedAt: Date.now() };
}
export function updateRequirements(session: SelectionSession, patch: Requirements, catalog: CatalogAdapter, clearFields: readonly (keyof Requirements)[] = []): SelectionSession {
  const parsed = RequirementsSchema.parse(patch);
  const previous = { ...session.requirements };
  for (const field of clearFields) delete previous[field];
  const requirements = RequirementsSchema.parse({ ...previous, ...parsed });
  return { ...session, revision: session.revision + 1, requirements, candidates: recommendProducts(catalog, requirements), selectedProductId: null, catalogVersion: catalog.version, updatedAt: Date.now() };
}
export function chooseProduct(session: SelectionSession, id: string, catalog: CatalogAdapter): SelectionSession {
  const candidates = recommendProducts(catalog, session.requirements);
  if (!candidates.some(p => p.productId === id)) throw new Error('Scelta non presente nei candidati correnti');
  return { ...session, revision: session.revision + 1, candidates, selectedProductId: id, updatedAt: Date.now() };
}
export function restoreSession(raw: string | null, catalog: CatalogAdapter, now = Date.now()): SelectionSession {
  try {
    const s = SelectionSessionSchema.parse(JSON.parse(raw ?? 'null'));
    if (now - s.updatedAt > SESSION_TTL_MS || s.updatedAt > now) return newSession(catalog);
    if (s.catalogVersion !== catalog.version) return updateRequirements(s, {}, catalog);
    const candidates = recommendProducts(catalog, s.requirements);
    return { ...s, candidates, selectedProductId: candidates.some(p => p.productId === s.selectedProductId) ? s.selectedProductId : null };
  } catch { return newSession(catalog); }
}
