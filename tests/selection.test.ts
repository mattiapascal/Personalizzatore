import { describe, expect, it } from 'vitest';
import { fixtureCatalog, productPage, snapshot } from '../src/catalog/adapter';
import { CatalogSchema } from '../src/catalog/schema';
import { missingInformation, recommendProducts } from '../src/selection/rules';
import { chooseProduct, newSession, restoreSession, SESSION_TTL_MS, updateRequirements } from '../src/selection/session';
import type { Requirements } from '../src/selection/schema';

describe('selezione deterministica — scenari del campione reale', () => {
  const cases: { name: string; req: Requirements; missing: string[]; handles: string[] }[] = [
    { name: 'richiesta vuota', req: {}, missing: ['family'], handles: [] },
    { name: 'azienda con logo e sei righe: manca montatura', req: { family: 'stamp', lines: 6, hasLogo: true }, missing: ['mechanism'], handles: [] },
    { name: 'automatico: manca ingombro', req: { family: 'stamp', mechanism: 'automatic' }, missing: ['minimumAreaMm'], handles: [] },
    { name: '50×20: 4913 prima di 4915', req: { family: 'stamp', mechanism: 'automatic', minimumAreaMm: { width: 50, height: 20 } }, missing: [], handles: ['trodat-4913', 'trodat-4915'] },
    { name: '47×18 esatti', req: { family: 'stamp', mechanism: 'automatic', minimumAreaMm: { width: 47, height: 18 } }, missing: [], handles: ['trodat-4912', 'trodat-4913', 'trodat-4915'] },
    { name: '60×23: solo 4915', req: { family: 'stamp', mechanism: 'automatic', minimumAreaMm: { width: 60, height: 23 } }, missing: [], handles: ['trodat-4915'] },
    { name: '80×30: nessuno nel campione', req: { family: 'stamp', mechanism: 'automatic', minimumAreaMm: { width: 80, height: 30 } }, missing: [], handles: [] },
    { name: 'manuale fuori dal campione', req: { family: 'stamp', mechanism: 'manual' }, missing: [], handles: [] },
    { name: 'tascabile fuori dal campione', req: { family: 'stamp', mechanism: 'pocket' }, missing: [], handles: [] },
    { name: 'rotondo fuori dal campione', req: { family: 'stamp', mechanism: 'automatic', shape: 'round' }, missing: [], handles: [] },
    { name: 'targa fuori dal campione', req: { family: 'other' }, missing: [], handles: [] },
    { name: 'non so: esplorazione di tutti, senza garanzia layout', req: { family: 'stamp', mechanism: 'automatic', sizeUnknown: true }, missing: [], handles: ['trodat-4912', 'trodat-4913', 'trodat-4915'] },
    { name: 'logo supportato dichiarativamente', req: { family: 'stamp', mechanism: 'automatic', hasLogo: true, sizeUnknown: true }, missing: [], handles: ['trodat-4912', 'trodat-4913', 'trodat-4915'] },
    { name: 'non ruota le misure implicitamente', req: { family: 'stamp', mechanism: 'automatic', minimumAreaMm: { width: 20, height: 50 } }, missing: [], handles: [] },
  ];
  it.each(cases)('$name', ({ req, missing, handles }) => {
    expect(missingInformation(req)).toEqual(missing);
    expect(recommendProducts(fixtureCatalog, req).map(c => fixtureCatalog.get(c.productId).handle)).toEqual(handles);
  });
  it('mantiene verifiche residue per sei righe, nessuna falsa capacità', () => {
    const results = recommendProducts(fixtureCatalog, { family: 'stamp', mechanism: 'automatic', sizeUnknown: true, lines: 6 });
    expect(results.every(r => r.pending.some(p => p.includes('6 righe non verificata')))).toBe(true);
    expect(results.every(r => r.reasons.length >= 3)).toBe(true);
  });
});
describe('sessione, provenienza e confini', () => {
  it('cambia candidato conservando sessione e logo, invalida selezione precedente', () => {
    let s = newSession(fixtureCatalog);
    s = updateRequirements(s, { family: 'stamp', mechanism: 'automatic', hasLogo: true, minimumAreaMm: { width: 50, height: 20 } }, fixtureCatalog);
    s = chooseProduct(s, s.candidates[0]!.productId, fixtureCatalog);
    const next = updateRequirements(s, { minimumAreaMm: { width: 60, height: 23 } }, fixtureCatalog);
    expect(next.sessionId).toBe(s.sessionId); expect(next.requirements.hasLogo).toBe(true);
    expect(fixtureCatalog.get(next.candidates[0]!.productId).handle).toBe('trodat-4915'); expect(next.selectedProductId).toBeNull();
  });
  it('rifiuta ID inventati e scelte estranee ai risultati correnti', () => {
    expect(() => fixtureCatalog.get('inventato')).toThrow();
    expect(() => productPage(fixtureCatalog, 'inventato')).toThrow();
    expect(() => chooseProduct(newSession(fixtureCatalog), fixtureCatalog.list()[0]!.productId, fixtureCatalog)).toThrow();
  });
  it('ricostruisce candidati, non si fida dello storage', () => {
    const s = updateRequirements(newSession(fixtureCatalog), { family: 'stamp', mechanism: 'automatic', sizeUnknown: true }, fixtureCatalog);
    const restored = restoreSession(JSON.stringify({ ...s, candidates: [], selectedProductId: 'inventato' }), fixtureCatalog);
    expect(restored.candidates).toHaveLength(3); expect(restored.selectedProductId).toBeNull();
  });
  it('scade dati e scarta corruzione o vecchio catalogo', () => {
    const s = newSession(fixtureCatalog);
    expect(restoreSession(JSON.stringify(s), fixtureCatalog, s.updatedAt + SESSION_TTL_MS + 1).sessionId).not.toBe(s.sessionId);
    expect(restoreSession('invalid', fixtureCatalog).revision).toBe(0);
    expect(restoreSession(JSON.stringify({ ...s, catalogVersion: 'old' }), fixtureCatalog).sessionId).not.toBe(s.sessionId);
  });
  it('fixture vere ma non certificate, nessun prezzo/disponibilità', () => {
    for (const p of fixtureCatalog.list()) {
      expect(p.price).toBeNull(); expect(p.availability).toBeNull(); expect(p.validatedForProduction).toBe(false);
      expect(p.variantIds[0]).toMatch(/^gid:\/\/shopify\/ProductVariant\/\d+$/);
    }
  });
  it('blocca link iniettati nel catalogo', () => {
    const injected = structuredClone(snapshot); injected.products[0]!.url = 'javascript:alert(1)';
    expect(() => CatalogSchema.parse(injected)).toThrow();
  });
});
