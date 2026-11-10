import { describe, expect, it } from 'vitest';
import { FONT_FAMILIES, fontHasOwnMetrics } from '../src/editor/fonts';
import { applyCharacterStyle, selectionStyle } from '../src/editor/text-style';
import { createDocument, DocumentStore, parseGraphicDocument, type SceneObject } from '../src/editor/model';
describe('catalogo e disponibilità dei font locali', () => {
  it('non confonde la semplice esistenza dei fallback con il font richiesto', () => {
    const fallbackWidth = (font: string) => font.endsWith('monospace') ? 100 : font.endsWith('sans-serif') ? 110 : 120;
    expect(fontHasOwnMetrics('Assente', font => fallbackWidth(font))).toBe(false);
    expect(fontHasOwnMetrics('Presente', font => font.includes('"Presente"') ? 110 : fallbackWidth(font))).toBe(true);
  });
  it('riconosce una differenza anche su un solo campione e conserva una lista finita', () => {
    expect(fontHasOwnMetrics('Accenti', (font, text) => font.includes('"Accenti"') && text.startsWith('Città') ? 121 : 120)).toBe(true);
    expect(FONT_FAMILIES).toContain('Arial'); expect(new Set(FONT_FAMILIES).size).toBe(FONT_FAMILIES.length);
  });
  it('il font cambia soltanto sui caratteri selezionati o su tutto il box', () => {
    const original = createDocument().objects[1] as Extract<SceneObject, { type: 'text' }>;
    const partial = applyCharacterStyle(original, { fontFamily: 'Georgia', fontWeight: 'bold' }, { start: 0, end: 4 });
    expect(partial.fontFamily).toBe('Arial'); expect(selectionStyle(partial, 0, 4).style.fontFamily).toBe('Georgia'); expect(selectionStyle(partial, 0, 6).mixed).toContain('fontFamily');
    const whole = applyCharacterStyle(partial, { fontFamily: 'Courier New' }); expect(whole.fontFamily).toBe('Courier New'); expect(whole.characterStyles).toEqual([{ start: 0, end: 4, style: { fontWeight: 'bold' } }]);
  });
  it('comandi manuali/AI, JSON e undo conservano le famiglie e rifiutano nomi non censiti', () => {
    const doc = createDocument(), store = new DocumentStore(doc, () => ({ widthMm: 15, heightMm: 4 }));
    const object = { ...doc.objects[1]!, fontFamily: 'Times New Roman' }, command = { schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: 0, arguments: { object } };
    store.dispatch(command, 'manual'); const saved = structuredClone(store.document); store.import(JSON.parse(JSON.stringify(saved))); store.undo(); store.undo(); expect(store.document.objects).toEqual(doc.objects); store.redo();
    const before = structuredClone(store.document); expect(() => store.dispatch({ ...command, expectedRevision: before.revision, arguments: { object: { ...object, fontFamily: 'Unknown' } } }, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before);
    expect(() => parseGraphicDocument({ ...saved, schemaVersion: 1 })).toThrow();
  });
  it('font non disponibile: il motore conserva scena e redo se la misurazione lo rifiuta', () => {
    const doc = createDocument(), store = new DocumentStore(doc, object => { if (object.type === 'text' && object.fontFamily === 'Georgia') throw new Error('Font non disponibile TEST'); return { widthMm: 15, heightMm: 4 }; });
    const text = doc.objects[1]!, command = { schemaVersion: 1, tool: 'moveObject', objectId: text.id, expectedRevision: 0, arguments: { xMm: 10, yMm: 5 } };
    store.dispatch(command, 'manual'); store.undo(); const before = structuredClone(store.document);
    expect(() => store.dispatch({ ...command, tool: 'updateObject', expectedRevision: before.revision, arguments: { object: { ...text, fontFamily: 'Georgia' } } }, 'ai-simulation')).toThrow('Font non disponibile TEST'); expect(store.document).toEqual(before); store.redo(); expect(store.document.objects[1]).toMatchObject({ xMm: 10, yMm: 5 });
  });
});

it('risorse font portabili: registro e testo nello stesso comando, identità immutabile e undo atomico',async()=>{
 const {readFile}=await import('node:fs/promises'),{FontAssetSchema}=await import('../src/editor/font-assets');
 const bytes=await readFile('node_modules/playwright-core/lib/vite/recorder/assets/codicon-DCmgc-ay.ttf'),asset=FontAssetSchema.parse({id:'font-11111111-1111-4111-8111-111111111111',family:'codicon',label:'Font TEST',format:'ttf',dataBase64:bytes.toString('base64')});
 const doc=createDocument(),store=new DocumentStore(doc,()=>({widthMm:15,heightMm:4})),object={...doc.objects[1]!,fontFamily:asset.id};
 expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object}},'manual')).toThrow();expect(store.document).toEqual(doc);
 store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object,fontAssets:[asset]}},'manual');expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).fontAssets).toEqual([asset]);store.undo();expect(store.document.fontAssets).toBeUndefined();store.redo();const before=structuredClone(store.document);
 expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:before.revision,arguments:{object,fontAssets:[{...asset,family:'Different'}]}},'ai-simulation')).toThrow('immutabile');expect(store.document).toEqual(before);
 expect(()=>FontAssetSchema.parse({...asset,dataBase64:'invalid'})).toThrow();
});
