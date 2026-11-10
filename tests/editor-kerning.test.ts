import { describe, it, expect } from 'vitest';
import { applyTextKerning, textSpacingScope, applyCharacterStyle, type TextObject } from '../src/editor/text-style';
import { createDocument, DocumentStore, parseGraphicDocument, type Measure } from '../src/editor/model';
const source = (): TextObject => ({ id: 'text', type: 'text', text: 'AVATAR\nTEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', xMm: 5, yMm: 5, letterSpacingPt: .2 });
const measure: Measure = () => ({ widthMm: 20, heightMm: 8 });
describe('spaziatura generale e correzione delle coppie', () => {
  it('applica la crenatura alla coppia ai lati del cursore, sommata al valore generale', () => {
    const changed = applyTextKerning(source(), -.1, { start: 1, end: 1 }); expect(changed).toMatchObject({ letterSpacingPt: .2, characterStyles: [{ start: 0, end: 1, style: { kerningPt: -.1 } }] }); expect(textSpacingScope(changed, { start: 1, end: 1 })).toMatchObject({ value: -.1, base: .2, indices: [0], mode: 'pair' }); expect(source()).not.toHaveProperty('characterStyles');
  });
  it('modifica solo gli intervalli interni alla selezione, saltando gli a capo', () => {
    const changed = applyTextKerning(source(), .3, { start: 1, end: 9 }); expect(changed.characterStyles).toEqual([{ start: 1, end: 5, style: { kerningPt: .3 } }, { start: 7, end: 8, style: { kerningPt: .3 } }]); expect(textSpacingScope(changed, { start: 0, end: 5 }).mixed).toBe(true);
  });
  it('rifiuta estremità, a capo e selezioni senza coppie; zero ripristina la correzione', () => {
    for (const start of [0, 6, 7, 11, -1]) expect(() => applyTextKerning(source(), .1, { start, end: start })).toThrow(); expect(() => applyTextKerning(source(), .1, { start: 0, end: 1 })).toThrow(); expect(() => applyTextKerning(source(), 101, { start: 1, end: 1 })).toThrow(); const changed = applyTextKerning(source(), .1, { start: 1, end: 1 }); expect(applyTextKerning(changed, 0, { start: 1, end: 1 })).toEqual(source()); expect(() => applyCharacterStyle(source(), { kerningPt: .2 })).toThrow('richiede');
  });
  it('UI/AI, JSON, undo e scala del gruppo conservano correzioni e spaziatura fisica', () => {
    const doc = createDocument(); doc.objects = [source(), { id: 'box', type: 'rect', xMm: 28, yMm: 6, widthMm: 4, heightMm: 3, stroke: '#000000', strokeMm: .25 }]; const store = new DocumentStore(doc, measure); const changed = applyTextKerning(source(), .2, { start: 0, end: 4 }); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'text', expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation'); expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects[0]).toEqual(changed);
    store.dispatch({ schemaVersion: 1, tool: 'transformObjects', objectId: 'text', expectedRevision: 1, arguments: { objectIds: ['text', 'box'], scale: 2, rotationDeg: 0, center: { xMm: 29, yMm: 11 } } }, 'manual'); expect(store.document.objects[0]).toMatchObject({ letterSpacingPt: .4, characterStyles: [{ style: { kerningPt: .4 } }] }); store.undo(); expect(store.document.objects[0]).toEqual(changed);
  });
});

it('tracking di testi grandi: oltre il vecchio limite, stesso comando, scala e undo senza clamp',()=>{const object={...source(),fontSizePt:200,letterSpacingPt:-5},doc=createDocument();doc.areaMm={width:200,height:100};doc.objects=[object,{id:'box',type:'rect',xMm:30,yMm:5,widthMm:4,heightMm:3,stroke:'#000000',strokeMm:.25}];const store=new DocumentStore(doc,measure),changed=applyTextKerning(object,-6,{start:1,end:1});store.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object:changed}},'manual');expect(store.document.objects[0]).toMatchObject({letterSpacingPt:-5,characterStyles:[{style:{kerningPt:-6}}]});store.dispatch({schemaVersion:1,tool:'transformObjects',objectId:object.id,expectedRevision:1,arguments:{objectIds:[object.id,'box'],scale:2,rotationDeg:0,center:{xMm:100,yMm:50}}},'ai-simulation');expect(store.document.objects[0]).toMatchObject({fontSizePt:400,letterSpacingPt:-10,characterStyles:[{style:{kerningPt:-12}}]});store.undo();expect(store.document.objects[0]).toEqual(changed);});
