import { expect, it } from 'vitest';
import { DocumentStore, DocumentSchema, type Measure } from '../src/editor/model';
import { textInputProblem, validateObjectInputs } from '../src/editor/object-properties';
import { inspectDocumentFonts, assertOutputFonts } from '../src/editor/font-preflight';
import { createTestDocument, TEST_DEFAULT_FONT } from './helpers/editor-fonts';

const measure: Measure = object => object.type === 'text'
  ? {widthMm: object.textBox?.widthMm ?? 10, heightMm: object.fontSizePt * 25.4 / 72}
  : {widthMm: 10, heightMm: 10};

it('svuotamento manuale/AI e form: oggetto e frame persistono, Undo/Redo e JSON conservano il contenuto esatto', () => {
  for (const source of ['manual', 'ai-simulation'] as const) {
    const doc = createTestDocument();
    doc.objects = [{...doc.objects.find(o => o.type === 'text')!, textBox: {widthMm: 20, heightMm: 5, autoWidth: true, autoHeight: true}, editor: {label: 'Email', includeInForm: true, textInputFormat: 'email'}}];
    const store = new DocumentStore(doc, measure), original = structuredClone(store.document.objects);
    store.dispatch({schemaVersion: 1, tool: 'setText', objectId: 'text-1', expectedRevision: 0, arguments: {text: ''}}, source);
    expect(store.document.objects).toHaveLength(1);
    expect(store.document.objects[0]).toMatchObject({id: 'text-1', text: '', textBox: {widthMm: 20, autoHeight: true}});
    expect(textInputProblem(store.document.objects[0]!)).toBeNull();
    validateObjectInputs(store.document);
    expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toEqual(store.document.objects);
    store.undo(); expect(store.document.objects).toEqual(original);
    store.redo(); expect(store.document.objects[0]).toHaveProperty('text', '');
    const before = structuredClone(store.document);
    for (const text of ['\u0000', '\t', 'A\n'.repeat(100), '😀'.repeat(20001)]) {
      expect(() => store.dispatch({schemaVersion: 1, tool: 'setText', objectId: 'text-1', expectedRevision: before.revision, arguments: {text}}, source)).toThrow();
      expect(store.document).toEqual(before);
    }
    store.dispatch({schemaVersion: 1, tool: 'setText', objectId: 'text-1', expectedRevision: before.revision, arguments: {text: 'test@example.it'}}, source);
    expect(store.document.objects[0]).toHaveProperty('text', 'test@example.it');
  }
});

it('anche un box vuoto richiede il file esatto e la copertura verificabile del font', async () => {
  const doc = createTestDocument(); doc.objects = [{...doc.objects.find(o => o.type === 'text')!, text: ''}];
  expect(await inspectDocumentFonts(doc)).toEqual({checkedFonts: 1, issues: []});
  doc.fontAssets = [];
  await expect(assertOutputFonts(doc)).rejects.toThrow('non verificabile');
  doc.fontAssets = [TEST_DEFAULT_FONT];
  Object.assign(doc.objects[0]!, {fontWeight: 'bold'});
  await expect(assertOutputFonts(doc)).rejects.toThrow('simulato');
  Object.assign(doc.objects[0]!, {fontFamily: 'Arial', fontWeight: 'normal'});
  await expect(assertOutputFonts(doc)).rejects.toThrow('font del computer');
});

it('pulizia solo nella migrazione: spazi e formattazione sono refusi, geometrie parziali o sul bordo restano e i gruppi non hanno riferimenti pendenti', async () => {
  const {pitchprintTextIsBlank, prunePitchprintRefuse} = await import('../src/editor/pitchprint-refuse');
  for(const value of ['', ' \n\u00a0\u200b\u200d\ufeff\ufe0f', '\u{E0100}']) expect(pitchprintTextIsBlank(value)).toBe(true);
  for(const value of ['A', '   A\n', '😀', '\u0301', '.']) expect(pitchprintTextIsBlank(value)).toBe(false);
  const doc = createTestDocument(), text = doc.objects.find(o=>o.type==='text')!;
  doc.areaMm={width:50,height:30};
  doc.objects=[{...text,id:'blank',text:' \n\u200b'},{id:'outside',type:'rect',xMm:51,yMm:10,widthMm:10,heightMm:10,stroke:'none',strokeMm:.25,fill:'#000000'},{id:'partial',type:'rect',xMm:45,yMm:10,widthMm:10,heightMm:10,stroke:'none',strokeMm:.25,fill:'#000000'},{id:'touching',type:'rect',xMm:50,yMm:10,widthMm:10,heightMm:10,stroke:'none',strokeMm:.25,fill:'#000000'}];
  doc.groups=[{id:'empty-group',objectIds:['blank','outside']},{id:'mixed-group',objectIds:['outside','partial']}];
  const original=structuredClone(doc), cleaned=prunePitchprintRefuse(doc,measure);
  expect(cleaned.objects.map(o=>o.id)).toEqual(['partial','touching']);expect(cleaned.groups).toEqual([{id:'mixed-group',objectIds:['partial']}]);expect(cleaned.removed.map(o=>o.id)).toEqual(['blank','outside']);expect(doc).toEqual(original);
});
