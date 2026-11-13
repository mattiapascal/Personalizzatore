import {it,expect} from 'vitest';
import {documentPaintColors} from '../src/editor/document-paints';
import {DocumentSchema} from '../src/editor/model';
import {documentPaletteFixture} from './helpers/document-palette';
it('colori dichiarati ordinati e deduplicati, senza modificare stato, risorse o geometria',()=>{
 const doc=documentPaletteFixture(),snapshot=structuredClone(doc);expect(documentPaintColors(doc)).toEqual(['#000000','#0088cc','#00aa00','#ff0000']);expect(doc).toEqual(snapshot);doc.objects.reverse();expect(documentPaintColors(doc)).toEqual(['#000000','#0088cc','#00aa00','#ff0000']);
});
it('oggetti nascosti e riferimenti ereditati esclusi senza nascondere gli altri membri del gruppo',()=>{
 const doc=documentPaletteFixture();doc.objects[1]!.visible=false;doc.groups=[{id:'guides',objectIds:['outside'],editor:{reference:true}}];expect(documentPaintColors(doc)).toEqual(['#000000','#0088cc']);doc.groups=[{id:'hidden',objectIds:['outside'],visible:false}];expect(documentPaintColors(doc)).toEqual(['#000000','#0088cc']);
});
it('stili dei caratteri: base interamente sovrascritta esclusa, Unicode e attributi ereditati conservati',()=>{
 const doc=documentPaletteFixture(),text=doc.objects.find(object=>object.type==='text')!;if(text.type!=='text')throw Error('TEST');doc.objects=[text];text.text='AB😀C';text.fill='#ff0000';text.stroke='#654321';text.strokeMm=.25;text.characterStyles=[{start:0,end:4,style:{fill:'#123456',stroke:'none'}}];expect(documentPaintColors(DocumentSchema.parse(doc))).toEqual(['#123456']);text.characterStyles=[{start:1,end:2,style:{fill:'#123456'}}];expect(documentPaintColors(doc)).toEqual(['#123456','#654321','#ff0000']);
});
it('testo vuoto, trasparenze e contorni spenti restano attributi riutilizzabili, non colori produttivi stimati',()=>{
 const doc=documentPaletteFixture(),text=doc.objects.find(object=>object.type==='text')!;if(text.type!=='text')throw Error('TEST');doc.objects=[text];text.text='';text.fill='#112233';text.fillOpacity=0;text.stroke='#445566';text.strokeMm=0;expect(documentPaintColors(doc)).toEqual(['#112233','#445566']);
});
it('solo colore esplicito del foglio e tinta monocolore, nessun colore presunto dai pixel delle foto',()=>{
 const doc=documentPaletteFixture(0,true);doc.objects=doc.objects.filter(object=>object.type==='image');expect(documentPaintColors(doc)).toEqual(['#aa00aa']);doc.paperColor='#ff0000';expect(documentPaintColors(doc)).toEqual(['#aa00aa','#ff0000']);const image=doc.objects[0]!;if(image.type!=='image')throw Error('TEST');image.raster={...image.raster,mode:'original',tintColor:undefined,backgroundRemoval:undefined};expect(documentPaintColors(doc)).toEqual(['#ff0000']);
});
it('guide personali e riferimenti meccanici non creano colori della pagina',()=>{
 const doc=documentPaletteFixture();doc.objects=[];doc.layoutGuides={items:[{id:'guide',axis:'x',positionMm:15}],visible:true,locked:false};expect(documentPaintColors(doc)).toEqual([]);
});
it('collezione ampia entro i limiti del documento, interamente disponibile al filtro UI senza troncamento dei dati',()=>{
 const doc=documentPaletteFixture(800);expect(documentPaintColors(doc)).toHaveLength(804);expect(documentPaintColors(doc)).toContain('#000320');expect(DocumentSchema.safeParse(doc).success).toBe(true);
});
