import { describe, it, expect } from 'vitest';
import { justifySpacing, DEFAULT_JUSTIFICATION, JustificationSchema } from '../src/editor/justification';
import { createDocument, DocumentStore, type Measure } from '../src/editor/model';
describe('giustificazione additiva di parole e lettere', () => {
  it('la larghezza automatica è valida per spazi uguali; il passaggio tipografico richiede un box fisso',()=>{
    const doc=createDocument(),object=doc.objects.find(o=>o.type==='text')!;Object.assign(object,{textAlign:'justify-left',textBox:{widthMm:20,heightMm:5,autoWidth:true,autoHeight:true},justification:{...DEFAULT_JUSTIFICATION,distribution:'word-space',justifyLastLine:true}});
    const store=new DocumentStore(doc,()=>({widthMm:20,heightMm:5})),before=structuredClone(store.document);
    expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object:{...object,justification:{...object.justification!,distribution:'typographic'}}}},'ai-simulation')).toThrow('larghezza fissa');expect(store.document).toEqual(before);
    store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object:{...object,textBox:{...object.textBox!,autoWidth:false},justification:{...object.justification!,distribution:'typographic'}}}},'manual');expect(store.document.objects.find(o=>o.id===object.id)).toMatchObject({textBox:{autoWidth:false},justification:{distribution:'typographic'}});store.undo();expect(store.document.objects).toEqual(before.objects);
  });
  it('spazi uguali: incrementi assoluti identici con stili diversi e nessun limite percentuale tipografico',()=>{
    const settings={...DEFAULT_JUSTIFICATION,distribution:'word-space' as const,justifyLastLine:true};
    const a=justifySpacing(50,650,30,100,settings,3),b=justifySpacing(50,650,90,40,settings,3);
    expect(a).toMatchObject({spaceDelta:200,width:650,letterPercent:0,wordPercent:2100,underfull:false,overfull:false});expect(b.spaceDelta).toBe(200);expect(b.width).toBe(650);
  });
  it('spazi uguali: nessuna lettera allargata senza spazi, nessuna compressione delle righe troppo lunghe',()=>{
    const settings={...DEFAULT_JUSTIFICATION,distribution:'word-space' as const};
    expect(justifySpacing(50,100,0,100,settings,0)).toMatchObject({width:50,spaceDelta:0,letterPercent:0,underfull:true});
    expect(justifySpacing(150,100,20,100,settings,2)).toMatchObject({width:150,spaceDelta:0,overfull:true});
    expect(justifySpacing(50,100,0,100,settings,2)).toMatchObject({width:100,spaceDelta:25,wordPercent:100});
    for(const count of[undefined,-1,.5,Infinity])expect(()=>justifySpacing(50,100,20,100,settings,count)).toThrow('Numero di spazi');
  });
  it('modo e ultima riga condividono JSON, comandi manuali/AI e Undo; valori estranei non entrano nel documento',()=>{
    const settings={...DEFAULT_JUSTIFICATION,distribution:'word-space' as const,justifyLastLine:true};
    for(const caller of['manual','ai-simulation']as const){const doc=createDocument(),object=doc.objects.find(o=>o.type==='text')!,store=new DocumentStore(doc,()=>({widthMm:20,heightMm:5})),changed={...object,justification:settings,letterSpacingPt:.2,characterStyles:[{start:0,end:1,style:{kerningPt:-.1}}]};
      store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object:changed}},caller);
      expect(JSON.parse(JSON.stringify(store.document)).objects.find((o:any)=>o.id===object.id)).toEqual(changed);const before=structuredClone(store.document);
      expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:1,arguments:{object:{...changed,justification:{...settings,distribution:'unknown'}}}},caller)).toThrow();expect(store.document).toEqual(before);
      store.undo();expect(store.document.objects).toEqual(doc.objects);store.redo();expect(store.document.objects.find(o=>o.id===object.id)).toEqual(changed);
    }
    expect(()=>JustificationSchema.parse({...settings,justifyLastLine:'yes'})).toThrow();
  });
  it('usa i sei valori richiesti, con percentuali riferite allo spazio normale del font', () => {
    expect(DEFAULT_JUSTIFICATION).toEqual({ word: { min: 80, desired: 100, max: 133 }, letter: { min: 0, desired: 15, max: 30 } }); const result = justifySpacing(100, 112, 20, 80); expect(result.wordPercent).toBe(100); expect(result.letterPercent).toBe(15); expect(result.width).toBeCloseTo(112); expect(result.underfull).toBe(false);
  });
  it('interpola tra minimi/desiderati e desiderati/massimi conservando i limiti', () => {
    const low = justifySpacing(100, 104, 20, 80), high = justifySpacing(100, 122, 20, 80); expect(low.width).toBeCloseTo(104); expect(low.wordPercent).toBeGreaterThan(80); expect(low.wordPercent).toBeLessThan(100); expect(low.letterPercent).toBeGreaterThan(0); expect(low.letterPercent).toBeLessThan(15); expect(high.width).toBeCloseTo(122); expect(high.wordPercent).toBeGreaterThan(100); expect(high.letterPercent).toBeGreaterThan(15); expect(high.letterPercent).toBeLessThan(30);
  });
  it('non supera massimi o minimi per riempire una misura impossibile', () => {
    const max = justifySpacing(100, 200, 20, 80), min = justifySpacing(100, 80, 20, 80); expect(max).toMatchObject({ wordPercent: 133, letterPercent: 30, underfull: true }); expect(max.width).toBeCloseTo(130.6); expect(min).toMatchObject({ wordPercent: 80, letterPercent: 0, overfull: true }); expect(min.width).toBeCloseTo(96);
  });
  it('gestisce parola singola, assenza di intervalli e minimi/desiderati/massimi uguali', () => {
    expect(justifySpacing(100, 110, 0, 100)).toMatchObject({ width: 110, underfull: false }); expect(justifySpacing(100, 110, 0, 0)).toMatchObject({ width: 100, underfull: true }); const settings = { word: { min: 100, desired: 100, max: 100 }, letter: { min: 15, desired: 15, max: 15 } }; expect(justifySpacing(100, 999, 20, 80, settings)).toMatchObject({ width: 112, underfull: true });
  });
  it('valida ordinamento, numeri e comandi comuni senza alterare tracking o crenatura', () => {
    expect(() => JustificationSchema.parse({ ...DEFAULT_JUSTIFICATION, word: { min: 120, desired: 100, max: 133 } })).toThrow(); expect(() => justifySpacing(NaN, 100, 20, 80)).toThrow(); const doc = createDocument(); const object = doc.objects.find(o => o.type === 'text')!; const measure: Measure = () => ({ widthMm: 20, heightMm: 4 }), store = new DocumentStore(doc, measure), changed = { ...object, letterSpacingPt: .2, characterStyles: [{ start: 0, end: 1, style: { kerningPt: -.1 } }], justification: DEFAULT_JUSTIFICATION }; store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation'); expect(store.document.objects.find(o => o.id === object.id)).toEqual(changed); store.undo(); expect(store.document.objects).toEqual(doc.objects);
  });
});
