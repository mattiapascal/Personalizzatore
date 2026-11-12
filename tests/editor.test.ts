import { describe, expect, it } from 'vitest';
import { createDocument, DocumentSchema, DocumentStore, validateLayout, type Measure, type SceneObject } from '../src/editor/model';
import { fixtureCatalog } from '../src/catalog/adapter';

// Geometria deterministica di test. Le metriche browser reali sono verificate negli e2e Fabric.
const measure: Measure = o => o.type === 'image' ? { widthMm: o.widthMm, heightMm: o.heightMm } : o.type === 'path' || o.type === 'bezier' || o.type === 'vector' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : o.type === 'ellipse' ? { widthMm: o.rxMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm), heightMm: o.ryMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm) } : o.type === 'line' ? { widthMm: o.lengthMm + o.strokeMm, heightMm: o.strokeMm } : o.type === 'circle' ? { widthMm: o.radiusMm * 2 + o.strokeMm, heightMm: o.radiusMm * 2 + o.strokeMm } : o.type === 'rect' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : { widthMm: Math.max(...o.text.split('\n').map(line => line.length)) * o.fontSizePt * 25.4 / 72 * 0.6, heightMm: o.text.split('\n').length * o.fontSizePt * 25.4 / 72 * 1.2 };
const move = (revision: number, xMm = 10) => ({ schemaVersion: 1, tool: 'moveObject', expectedRevision: revision, objectId: 'text-1', arguments: { xMm, yMm: 8 } });
describe('documento unico e comandi revisionati', () => {
  const newText: SceneObject = { id: 'new-text', type: 'text', xMm: 3, yMm: 3, text: 'TEST', fontFamily: 'Arial', fontSizePt: 7, fill: '#000000' };
  const add = (revision: number, object: SceneObject = newText) => ({ schemaVersion: 1, tool: 'addObject', expectedRevision: revision, objectId: object.id, arguments: { object } });
  const duplicate = (revision: number, objectId = 'new-text', newObjectId = 'copy-text', xMm = 4) => ({ schemaVersion: 1, tool: 'duplicateObject', expectedRevision: revision, objectId, arguments: { newObjectId, xMm, yMm: 4 } });
  const remove = (revision: number, objectId: string) => ({ schemaVersion: 1, tool: 'deleteObject', expectedRevision: revision, objectId, arguments: {} });
  it('aggiunta manuale, modifica AI, copia e cancellazione condividono documento e storico', () => {
    const s = new DocumentStore(createDocument(), measure), original = structuredClone(s.document);
    s.dispatch(add(0), 'manual');
    s.dispatch({ schemaVersion: 1, tool: 'setText', expectedRevision: 1, objectId: 'new-text', arguments: { text: 'Città' } }, 'ai-simulation');
    s.dispatch(duplicate(2), 'manual');
    expect(s.document.objects.at(-1)).toEqual({ ...newText, id: 'copy-text', text: 'Città', xMm: 4, yMm: 4 });
    s.dispatch(remove(3, 'new-text'), 'ai-simulation');
    expect(s.document.objects.map(o => o.id)).toEqual(['frame-1', 'text-1', 'copy-text']);
    expect(s.events.map(e => e.source)).toEqual(['manual', 'ai-simulation', 'manual', 'ai-simulation']);
    for (let i = 0; i < 4; i++) s.undo();
    expect(s.document).toEqual({ ...original, revision: 8 });
    for (let i = 0; i < 4; i++) s.redo();
    expect(s.document.objects.at(-1)).toMatchObject({ id: 'copy-text', text: 'Città' });
    expect(s.document.revision).toBe(12);
    expect(() => s.dispatch(remove(3, 'copy-text'), 'ai-simulation')).toThrow('obsoleta');
  });
  it('aggiunge e duplica ogni tipo senza alterare sorgente, stile o binding commerciale', () => {
    const product = fixtureCatalog.list()[0]!;
    const s = new DocumentStore(createDocument(product, fixtureCatalog.version), measure);
    const objects: SceneObject[] = [newText, { id: 'new-rect', type: 'rect', xMm: 3, yMm: 3, widthMm: 6, heightMm: 4, strokeMm: 0.25, stroke: '#000000' }, { id: 'new-circle', type: 'circle', xMm: 3, yMm: 3, radiusMm: 2, strokeMm: 0.25, stroke: '#ffffff' }];
    const binding = { productId: s.document.productId, variantId: s.document.variantId, catalogVersion: s.document.catalogVersion, productProfileVersion: s.document.productProfileVersion };
    for (const object of objects) {
      s.dispatch(add(s.document.revision, object), 'ai-simulation');
      s.dispatch(duplicate(s.document.revision, object.id, `copy-${object.id}`), 'manual');
      expect(s.document.objects.find(o => o.id === object.id)).toEqual(object);
      expect(s.document.objects.at(-1)).toEqual({ ...object, id: `copy-${object.id}`, xMm: 4, yMm: 4 });
    }
    expect(s.document).toMatchObject({ ...binding, fixture: true, validatedForProduction: false });
  });
  it('rifiuta nuovi comandi invalidi atomicamente conservando anche il redo', () => {
    const s = new DocumentStore(createDocument(), measure);
    s.dispatch(add(0), 'manual'); s.undo();
    const before = structuredClone(s.document), events = structuredClone(s.events);
    const invalid = [add(1), add(2, { ...newText, id: 'text-1' }), { ...add(2), objectId: 'different-id' }, add(2, { ...newText, xMm: 10001 }), { ...add(2), arguments: { object: { ...newText, fill: '#888888' } } }, { ...add(2), arguments: { object: { ...newText, type: 'image', src: 'https://example.test/private' } } }, duplicate(2, 'missing'), duplicate(2, 'text-1', 'frame-1'), duplicate(2, 'text-1', 'copy-text', 10001), remove(2, 'missing'), { ...remove(2, 'text-1'), arguments: { force: true } }];
    for (const command of invalid) {
      expect(() => s.dispatch(command, 'ai-simulation')).toThrow();
      expect(s.document).toEqual(before); expect(s.events).toEqual(events);
    }
    s.redo(); expect(s.document.objects.at(-1)!.id).toBe('new-text');
  });
  it('il limite di 1000 oggetti vale per aggiunta e copia', () => {
    const doc=createDocument();doc.objects.push(...Array.from({length:998},(_,i)=>({...newText,id:`object-${i}`})));
    const s = new DocumentStore(doc, measure),before=structuredClone(s.document);
    expect(() => s.dispatch(add(0), 'manual')).toThrow('1000');
    expect(() => s.dispatch(duplicate(0, 'text-1'), 'ai-simulation')).toThrow('1000');
    expect(s.document).toEqual(before); expect(s.events).toHaveLength(0);
  });
  it('può svuotare, salvare, riaprire e ricominciare; undo ripristina gli ID', () => {
    const s = new DocumentStore(createDocument(), measure);
    s.dispatch(remove(0, 'text-1'), 'manual'); s.dispatch(remove(1, 'frame-1'), 'manual');
    expect(s.document.objects).toEqual([]);
    s.import(JSON.parse(JSON.stringify(s.document))); expect(s.document.objects).toEqual([]);
    s.dispatch(add(3), 'ai-simulation');
    s.undo(); expect(s.document.objects).toEqual([]);
    s.undo(); s.undo(); expect(s.document.objects.map(o => o.id)).toEqual(['frame-1']);
    s.undo(); expect(s.document.objects.map(o => o.id)).toEqual(['frame-1', 'text-1']);
  });
  it('una modifica valida dopo undo apre un nuovo ramo e conserva la proprietà degli oggetti', () => {
    const s = new DocumentStore(createDocument(), measure), payload = structuredClone(newText);
    s.dispatch(add(0, payload), 'manual'); payload.text = 'MUTATO';
    expect(s.document.objects.at(-1)).toEqual(newText);
    s.undo(); s.dispatch(add(2, { ...newText, id: 'new-branch' }), 'manual');
    s.redo(); expect(s.document.revision).toBe(3); expect(s.document.objects.at(-1)!.id).toBe('new-branch');
  });
  it('documento circolare: conserva nuovi oggetti e copie fuori foglio; il controllo produttivo resta distinto',()=>{
    const doc=createDocument();doc.areaMm={width:30,height:30};doc.shape='round';doc.objects=[];const store=new DocumentStore(doc,measure);
    store.dispatch(add(0,{...newText,id:'external-text',xMm:-8,yMm:1}),'manual');store.dispatch(add(1,{...newText,xMm:12,yMm:12}),'manual');store.dispatch({...duplicate(2),arguments:{newObjectId:'copy-text',xMm:-8,yMm:1}},'ai-simulation');expect(store.document.objects).toHaveLength(3);expect(()=>validateLayout(store.document,measure)).toThrow('fuori');const saved=JSON.parse(JSON.stringify(store.document));store.open(saved);expect(store.document.objects).toEqual(saved.objects);
  });
  it('UI e AI modificano lo stesso oggetto senza cambiare ID', () => {
    const s = new DocumentStore(createDocument(), measure);
    s.dispatch({ schemaVersion: 1, expectedRevision: 0, objectId: 'text-1', tool: 'setText', arguments: { text: 'Città' } }, 'manual');
    s.dispatch(move(1), 'ai-simulation');
    expect(s.document.objects.find(o => o.id === 'text-1')).toMatchObject({ text: 'Città', xMm: 10 }); expect(s.document.revision).toBe(2);
    expect(s.events.map(e => e.source)).toEqual(['manual', 'ai-simulation']);
  });
  it('rifiuta stale, ID inesistenti, oltre i limiti di coordinate, font sotto minimo e colori', () => {
    const s = new DocumentStore(createDocument(), measure); const original = structuredClone(s.document);
    for (const c of [move(1), { ...move(0), objectId: 'unknown' }, move(0, 10001), { ...move(0), tool: 'setObjectStyle', arguments: { fontSizePt: 0.09, fill: '#000000' } }, { ...move(0), tool: 'setObjectStyle', arguments: { fontSizePt: 9, fill: '#888888' } }, { ...move(0), tool: 'eval', arguments: { script: 'fetch()' } }]) expect(() => s.dispatch(c, 'ai-simulation')).toThrow();
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
    expect(() => s.dispatch({ schemaVersion: 1, expectedRevision: 1, objectId: 'text-1', tool: 'setText', arguments: { text: 'A\n'.repeat(100) } }, 'manual')).toThrow();
  });
});
