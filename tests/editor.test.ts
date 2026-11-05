import { describe, expect, it } from 'vitest';
import { createDocument, DocumentSchema, DocumentStore, type Measure } from '../src/editor/model';
import { fixtureCatalog } from '../src/catalog/adapter';

// Geometria deterministica di test. Le metriche browser reali sono verificate negli e2e Fabric.
const measure: Measure = o => o.type === 'circle' ? { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm } : o.type === 'rect' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : { widthMm: Math.max(...o.text.split('\n').map(line => line.length)) * o.fontSizePt * 25.4 / 72 * 0.6, heightMm: o.text.split('\n').length * o.fontSizePt * 25.4 / 72 * 1.2 };
const move = (revision: number, xMm = 10) => ({ schemaVersion: 1, tool: 'moveObject', expectedRevision: revision, objectId: 'text-1', arguments: { xMm, yMm: 8 } });
describe('documento unico e comandi revisionati', () => {
  it('UI e AI modificano lo stesso oggetto senza cambiare ID', () => {
    const s = new DocumentStore(createDocument(), measure);
    s.dispatch({ schemaVersion: 1, expectedRevision: 0, objectId: 'text-1', tool: 'setText', arguments: { text: 'Città' } }, 'manual');
    s.dispatch(move(1), 'ai-simulation');
    expect(s.document.objects.find(o => o.id === 'text-1')).toMatchObject({ text: 'Città', xMm: 10 }); expect(s.document.revision).toBe(2);
    expect(s.events.map(e => e.source)).toEqual(['manual', 'ai-simulation']);
  });
  it('rifiuta stale, ID inesistenti, fuori area, font sotto minimo e colori', () => {
    const s = new DocumentStore(createDocument(), measure); const original = structuredClone(s.document);
    for (const c of [move(1), { ...move(0), objectId: 'unknown' }, move(0, 90), { ...move(0), tool: 'setObjectStyle', arguments: { fontSizePt: 6, fill: '#000000' } }, { ...move(0), tool: 'setObjectStyle', arguments: { fontSizePt: 9, fill: '#888888' } }, { ...move(0), tool: 'eval', arguments: { script: 'fetch()' } }]) expect(() => s.dispatch(c, 'ai-simulation')).toThrow();
    expect(s.document).toEqual(original); expect(s.events).toHaveLength(0);
  });
  it('undo/redo mantengono revisione monotona e invalidano comandi vecchi', () => {
    const s = new DocumentStore(createDocument(), measure); s.dispatch(move(0), 'manual'); s.undo();
    expect(s.document.revision).toBe(2); expect(s.document.objects[1]!.xMm).toBe(5);
    expect(() => s.dispatch(move(0), 'ai-simulation')).toThrow('obsoleta');
    s.redo(); expect(s.document.revision).toBe(3); expect(s.document.objects[1]!.xMm).toBe(10);
  });
  it('JSON round-trip, import invalida revisioni e impedisce ID duplicati', () => {
    const s = new DocumentStore(createDocument(), measure);
    const parsed = DocumentSchema.parse(JSON.parse(JSON.stringify(s.document))); expect(parsed).toEqual(s.document);
    s.import(parsed); expect(s.document.revision).toBe(1);
    expect(() => s.dispatch(move(0), 'ai-simulation')).toThrow('obsoleta');
    expect(() => s.import({ ...parsed, objects: [parsed.objects[0], parsed.objects[0]] })).toThrow();
  });
  it('rifiuta import enorme o metadati produttivi inventati', () => {
    const s = new DocumentStore(createDocument(), measure);
    expect(() => s.import({ ...s.document, validatedForProduction: true })).toThrow();
    expect(() => s.import({ ...s.document, objects: Array(100).fill(s.document.objects[0]) })).toThrow();
  });
  it('associa catalogo e dimensioni reali senza dichiarare vincoli produttivi validati', () => {
    const product = fixtureCatalog.list()[0]!;
    const doc = DocumentSchema.parse(createDocument(product, fixtureCatalog.version));
    expect(doc).toMatchObject({ productId: product.productId, variantId: product.variantIds[0], catalogVersion: fixtureCatalog.version, areaMm: product.nominalAreaMm, validatedForProduction: false, productProfileVersion: 'TEST-stamp-v1' });
    expect(() => DocumentSchema.parse({ ...doc, productId: null })).toThrow();
  });
  it('cambio prodotto mantiene oggetti e ID; rifiuto è atomico e undo non ripristina il vecchio prodotto', () => {
    const small = fixtureCatalog.list().find(p => p.handle === 'trodat-4912')!;
    const large = fixtureCatalog.list().find(p => p.handle === 'trodat-4913')!;
    const s = new DocumentStore(createDocument(small, fixtureCatalog.version), measure);
    s.dispatch({ schemaVersion: 1, expectedRevision: 0, objectId: 'text-1', tool: 'setText', arguments: { text: 'ACME\nRoma' } }, 'manual');
    const objects = structuredClone(s.document.objects), documentId = s.document.documentId;
    s.changeProduct(large, fixtureCatalog.version);
    expect(s.document.objects).toEqual(objects); expect(s.document.documentId).toBe(documentId);
    expect(s.document.productId).toBe(large.productId); expect(s.document.revision).toBe(2);
    s.undo(); expect(s.document.revision).toBe(2);
    s.dispatch(move(2, 40), 'manual');
    const original = structuredClone(s.document), events = structuredClone(s.events);
    expect(() => s.changeProduct(small, fixtureCatalog.version)).toThrow('fuori');
    expect(s.document).toEqual(original); expect(s.events).toEqual(events);
    expect(() => s.dispatch(move(1), 'ai-simulation')).toThrow('obsoleta');
  });
  it('import non può cambiare prodotto/versione/area e adotta fixture storiche compatibili', () => {
    const product = fixtureCatalog.list().find(p => p.handle === 'trodat-4913')!;
    const s = new DocumentStore(createDocument(product, fixtureCatalog.version), measure);
    for (const patch of [{ productId: 'gid://shopify/Product/123' }, { variantId: 'gid://shopify/ProductVariant/123' }, { catalogVersion: 'future' }, { areaMm: { width: 70, height: 25 } }]) expect(() => s.import({ ...s.document, ...patch })).toThrow();
    s.import(createDocument()); expect(s.document.productId).toBe(product.productId); expect(s.document.revision).toBe(1);
    expect(() => s.dispatch({ schemaVersion: 1, expectedRevision: 1, objectId: 'text-1', tool: 'setText', arguments: { text: 'A\n'.repeat(9) } }, 'manual')).toThrow();
  });
});
