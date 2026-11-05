import { describe, expect, it } from 'vitest';
import sources from '../fixtures/products/mount-sources.TEST.json';
import { RawProductSchema, normalizeCatalog } from '../server/catalog';
import { deriveMountProfiles } from '../server/mount-profiles';
import { mountFixtureCatalog, productPage } from '../src/catalog/adapter';
import { profileKey } from '../src/catalog/schema';
import { missingInformation, recommendProducts } from '../src/selection/rules';
import { chooseProduct, newSession, restoreSession, updateRequirements } from '../src/selection/session';
import { createDocument, DocumentStore, type Measure } from '../src/editor/model';
import { proposalFromArguments } from '../server/openai';

const source = (id: string) => RawProductSchema.parse(sources.products.find(p => p.id.endsWith('/' + id)));
const measure: Measure = o => o.type === 'circle' ? { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm }
  : o.type === 'rect' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : { widthMm: 6, heightMm: 3 };
const args = (patch: Record<string, unknown>) => ({ family: null, mechanism: null, material: null, diameterMm: null, shape: null, lines: null, hasLogo: null, widthMm: null, heightMm: null, sizeUnknown: null, clearFields: [], clarification: null, ...patch });

describe('Montature reali: fonti, aggiornamenti e varianti', () => {
  it('legno tondo usa i diametri delle varianti e non il numero nel vecchio handle', () => {
    const p = source('15106681799036');
    expect(p.handle).toContain('50');
    const result = deriveMountProfiles(p);
    expect(result.reason).toBeNull();
    expect(result.profiles.map(p => p.nominalAreaMm.width)).toEqual([30, 35, 40]);
    expect(result.profiles.every(p => p.shape === 'round' && p.mechanism === 'manual' && p.materials?.includes('wood'))).toBe(true);
    expect(new Set(result.profiles.map(profileKey)).size).toBe(3);
  });
  it('discordanza plastica 45 mm resta in revisione senza scartare i tre diametri coerenti', () => {
    const result = deriveMountProfiles(source('15999882330492'));
    expect(result.profiles.map(p => p.nominalAreaMm.width)).toEqual([30, 35, 40]);
    expect(result.reason).toContain('45');
    expect(result.reason).toContain('scheda tecnica');
  });
  it('a secco ha due varianti circolari e una rettangolare con ID separati', () => {
    const result = deriveMountProfiles(source('15104977633660'));
    expect(result.reason).toBeNull();
    expect(result.profiles.map(p => [p.shape, p.nominalAreaMm])).toEqual([
      ['round', { width: 41, height: 41 }], ['round', { width: 51, height: 51 }], ['rectangle', { width: 51, height: 25 }],
    ]);
    expect(result.profiles.every(p => p.mechanism === 'emboss' && p.validatedForProduction === false && p.constraints.minFontSizePt === null)).toBe(true);
  });
  it('tascabile è prioritario rispetto ad autoinchiostrante; datari e misure discordanti sono esclusi', () => {
    expect(deriveMountProfiles(source('15104975208828')).profiles[0]?.mechanism).toBe('pocket');
    expect(deriveMountProfiles(source('15106215805308')).profiles[0]).toMatchObject({ mechanism: 'pocket', shape: 'square', nominalAreaMm: { width: 12, height: 12 } });
    for (const id of ['16036621287804', '16036621746556']) expect(deriveMountProfiles(source(id)).profiles).toHaveLength(0);
    expect(deriveMountProfiles(source('15106103345532')).profiles[0]?.nominalAreaMm).toEqual({ width: 26, height: 9 });
    const conflicting = source('16036621287804'); conflicting.descriptionHtml += '<p>Personalizzabile con logo.</p>';
    expect(deriveMountProfiles(conflicting).reason).toContain('misure discordanti');
  });
  it('nuovi ID e misure coerenti diventano utilizzabili senza un registro da aggiornare a mano', () => {
    const p = source('15106681799036');
    const before = normalizeCatalog([p], new Date());
    p.id = 'gid://shopify/Product/999';
    p.variants.nodes = [{ ...p.variants.nodes[0]!, id: 'gid://shopify/ProductVariant/999', title: '50', selectedOptions: [{ name: 'Diametro (mm)', value: '50' }] }];
    p.technicalSummary = { jsonValue: 'Diametri disponibili: 50 mm. Timbro personalizzato.' };
    const after = normalizeCatalog([p], new Date());
    expect(after.version).not.toBe(before.version);
    expect(after.snapshot.products).toHaveLength(1);
    expect(after.snapshot.products[0]).toMatchObject({ productId: p.id, nominalAreaMm: { width: 50, height: 50 } });
    p.descriptionHtml = ''; p.technicalSummary = null;
    expect(normalizeCatalog([p], new Date()).snapshot.products).toHaveLength(0);
    p.status = 'ARCHIVED'; expect(normalizeCatalog([p], new Date()).snapshot.products).toHaveLength(0);
  });
  it('la fonte originale non viene mutata e nessun prezzo o disponibilità è presunto', () => {
    const original = structuredClone(sources.products);
    const result = normalizeCatalog(sources.products.map(p => RawProductSchema.parse(p)), new Date());
    expect(sources.products).toEqual(original);
    expect(result.snapshot.products.every(p => p.price === null && p.availability === null && !p.validatedForProduction)).toBe(true);
  });
});

describe('Montature: conversazione, selezione e geometrie', () => {
  it('richiede materiale, forma e dimensioni anche per le montature manuali', () => {
    expect(missingInformation({ family: 'stamp', mechanism: 'manual' })).toEqual(['material']);
    expect(missingInformation({ family: 'stamp', mechanism: 'manual', material: 'wood' })).toEqual(['shape']);
    expect(missingInformation({ family: 'stamp', mechanism: 'emboss', shape: 'round' })).toEqual(['minimumAreaMm']);
  });
  it('seleziona e ripristina la variante esatta e costruisce il link Shopify corrispondente', () => {
    let session = updateRequirements(newSession(mountFixtureCatalog), { family: 'stamp', mechanism: 'manual', material: 'wood', shape: 'round', diameterMm: 35 }, mountFixtureCatalog);
    const candidate = session.candidates.find(c => c.productId.endsWith('/15106681799036'))!;
    session = chooseProduct(session, candidate.profileId!, mountFixtureCatalog);
    expect(session.selectedProductId).toBe(candidate.productId);
    expect(session.selectedProfileId).toBe(candidate.profileId);
    expect(productPage(mountFixtureCatalog, session.selectedProfileId!)).toBe('https://www.incisoriasacchetti.it/products/timbro-in-legno-diam-50-mm?variant=55676402958716');
    expect(restoreSession(JSON.stringify(session), mountFixtureCatalog).selectedProfileId).toBe(session.selectedProfileId);
    expect(updateRequirements(session, { diameterMm: 40 }, mountFixtureCatalog).selectedProfileId).toBeNull();
    const rectangular = updateRequirements(session, { shape: 'rectangle' }, mountFixtureCatalog);
    expect(rectangular.requirements.diameterMm).toBeNull();
    expect(missingInformation(rectangular.requirements)).toEqual(['minimumAreaMm']);
  });
  it('ingombro rettangolare deve entrare nel cerchio; il cambio montatura ignora il vecchio materiale manuale', () => {
    const products = recommendProducts(mountFixtureCatalog, { family: 'stamp', mechanism: 'manual', material: 'wood', shape: 'round', minimumAreaMm: { width: 30, height: 30 } });
    expect(products).toHaveLength(0); // Diagonale 42,43 mm > tutti i diametri in legno censiti.
    expect(recommendProducts(mountFixtureCatalog, { family: 'stamp', mechanism: 'pocket', material: 'wood', shape: 'square', sizeUnknown: true }).length).toBeGreaterThan(0);
  });
  it('schema AI separa diametro e ingombro, converte anche le cancellazioni', () => {
    expect(proposalFromArguments(args({ mechanism: 'emboss', diameterMm: 41, sizeUnknown: false }), 2)).toMatchObject({ arguments: { mechanism: 'emboss', diameterMm: 41, shape: 'round', minimumAreaMm: null, sizeUnknown: false } });
    expect(proposalFromArguments(args({ sizeUnknown: true }), 2)).toMatchObject({ arguments: { diameterMm: null, minimumAreaMm: null, sizeUnknown: true } });
    expect(() => proposalFromArguments(args({ diameterMm: 35, widthMm: 20, heightMm: 10 }), 2)).toThrow();
  });
  it('rifiuta un testo nel quadrato circoscritto ma fuori dal cerchio; cambio variante conserva ID e stato', () => {
    const profiles = mountFixtureCatalog.list().filter(p => p.productId.endsWith('/15106681799036'));
    const small = profiles.find(p => p.nominalAreaMm.width === 35)!, large = profiles.find(p => p.nominalAreaMm.width === 40)!;
    const store = new DocumentStore(createDocument(small, mountFixtureCatalog.version), measure);
    const before = structuredClone(store.document);
    expect(() => store.dispatch({ schemaVersion: 1, expectedRevision: 0, objectId: 'text-1', tool: 'moveObject', arguments: { xMm: 1, yMm: 1 } }, 'manual')).toThrow('circolare');
    expect(store.document).toEqual(before);
    store.changeProduct(large, mountFixtureCatalog.version);
    expect(store.document.objects).toEqual(before.objects); expect(store.document.documentId).toBe(before.documentId);
    expect(store.document.variantId).toBe(large.variantIds[0]); expect(store.document.revision).toBe(1);
    expect(() => store.import({ ...store.document, shape: 'rectangle' })).toThrow('Area');
  });
});
