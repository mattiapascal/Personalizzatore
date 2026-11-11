import { expect, it } from 'vitest';
import { canonicalPaint } from '../src/editor/paint';
import { DocumentSchema, DocumentStore, createDocument, parseGraphicDocument, type Measure } from '../src/editor/model';
import { rasterPixels, RasterParametersSchema, DEFAULT_RASTER } from '../src/editor/raster-processing';
import { fitTemplate } from '../src/editor/format-adaptation';
import { snapshot } from '../src/catalog/adapter';
import { EditorAdminStore } from '../scripts/editor-admin-store';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const measure: Measure = () => ({ widthMm: 8, heightMm: 4 });
function colored() { return DocumentSchema.parse({ ...createDocument(), colorMode: 'color', areaMm: { width: 100, height: 60 }, objects: [{ id: 'text-1', type: 'text', xMm: 10, yMm: 10, text: 'TEST', fontSizePt: 12, fontFamily: 'Arial', fill: '#d02040', characterStyles: [{ start: 1, end: 3, style: { fill: '#0088cc' } }] }] }); }
it('normalizza colori CSS senza perdere canali; conversione B/N solo esplicita', () => {
 expect(canonicalPaint('rgb(18, 52, 171)')).toBe('#1234ab'); expect(canonicalPaint('#08c')).toBe('#0088cc'); expect(canonicalPaint('white')).toBe('#ffffff'); expect(canonicalPaint('red')).toBe('#ff0000'); expect(canonicalPaint('red', true)).toBe('#000000'); expect(canonicalPaint('white', true)).toBe('#ffffff'); expect(canonicalPaint('rgba(1,2,3,0)')).toBe('none');
 for (const value of ['rgba(1,2,3,.5)', 'url(#gradient)', 'nonsense', { color: 'red' }]) expect(() => canonicalPaint(value)).toThrow();
});
it('colore del box e dei singoli caratteri sopravvive al JSON; documenti esistenti restano monocromatici', () => {
 const doc = colored(); expect(parseGraphicDocument(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
 expect(() => DocumentSchema.parse({ ...doc, colorMode: undefined })).toThrow('monocromatico');
 expect(() => DocumentSchema.parse({ ...doc, objects: [{ ...doc.objects[0], fill: '#000000' }], colorMode: 'monochrome' })).toThrow('monocromatico');
 expect(() => DocumentSchema.parse({ ...doc, objects: [{ ...doc.objects[0], fill: '#08c' }] })).toThrow();
});
it('stessi comandi manuali e AI: colore permesso nelle targhe, rifiuto atomico nei timbri, undo/redo', () => {
 for (const source of ['manual', 'ai-simulation'] as const) {
  const initial = colored(), store = new DocumentStore(initial, measure), command = { schemaVersion: 1, tool: 'setObjectStyle', objectId: 'text-1', expectedRevision: 0, arguments: { fill: '#f08010', fontSizePt: 14 } };
  store.dispatch(command, source); expect(store.document.objects[0]).toMatchObject({ fill: '#f08010' }); store.undo(); expect(store.document).toEqual({ ...initial, revision: 2 }); store.redo(); expect(store.document.objects[0]).toMatchObject({ fill: '#f08010' });
  const mono = createDocument(), black = new DocumentStore(mono, measure); expect(() => black.dispatch({ ...command, objectId: mono.objects.find(object => object.type === 'text')!.id }, source)).toThrow('monocromatico'); expect(black.document).toEqual(mono);
 }
});
it('la compatibilità con una montatura non converte mai un template a colori in nero', () => {
 expect(() => fitTemplate(colored(), snapshot.products[0]!, 'TEST-color', measure, true)).toThrow();
 const doc = colored(); expect(() => DocumentSchema.parse({ ...doc, productId: snapshot.products[0]!.productId, variantId: snapshot.products[0]!.variantIds[0], catalogVersion: 'TEST', catalogProductProfileVersion: 1 })).toThrow('montature timbro');
});
it('pixel originali RGBA conservati e indipendenti dal buffer, modalità B/N ancora disponibile', () => {
 const pixels = new Uint8ClampedArray([255, 10, 20, 255, 12, 130, 220, 70, 0, 0, 0, 0]);
 const result = rasterPixels(pixels, { ...DEFAULT_RASTER, mode: 'original' }, 3); expect(result).toEqual(pixels); expect(result).not.toBe(pixels); result[0] = 0; expect(pixels[0]).toBe(255);
 expect(rasterPixels(pixels, DEFAULT_RASTER, 3)).not.toEqual(pixels);
 expect(() => RasterParametersSchema.parse({ ...DEFAULT_RASTER, mode: 'original', invert: true })).toThrow();
});
it('archivio isolato: bozza RGB idempotente, senza prodotti, tag Da verificare, riapertura invariata', async () => {
 const directory = await mkdtemp(join(tmpdir(), 'editor-color-'));
 try { const store = new EditorAdminStore(directory), document = colored(), command = { tool: 'importPitchprintTemplate', expectedRevision: 0, arguments: { title: 'Colori TEST', tags: ['Targhe stampate'], document, origin: { sourceId: 'pitchprint:color-test', sourceHash: 'c'.repeat(64), converterVersion: 1, warnings: [] } } };
  await store.dispatch(command); const state = await store.read(), record = state.records[0]!; expect(record.document).toEqual(document); expect(record.tags).toContain('Da verificare'); expect(record.templateProducts).toBeUndefined(); expect(record.shopProducts).toBeUndefined(); await store.dispatch({ ...command, expectedRevision: state.revision }); expect(await new EditorAdminStore(directory).read()).toEqual(state);
 } finally { await rm(directory, { recursive: true, force: true }); }
});

it('riaprire un file colorato nel canvas timbro non aggira il validatore', () => {
 const product = snapshot.products[0]!, mono = createDocument(product, 'TEST-color'), store = new DocumentStore(mono, measure), input = {...colored(), areaMm: mono.areaMm, shape: mono.shape};
 expect(() => store.import(input)).toThrow('montature timbro'); expect(store.document).toEqual(mono);
});
