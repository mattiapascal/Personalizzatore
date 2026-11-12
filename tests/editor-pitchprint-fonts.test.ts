import {expect,it} from 'vitest';import {pitchprintFontRequest,requiredPitchprintFonts} from '../src/editor/pitchprint-fonts';
it('il censimento font distingue righe residue della versione verificata da font di caratteri esistenti',()=>{
 const item={type:'textbox',version:'3.4.0',text:'ABC',fontFamily:'Arimo',styles:{0:{0:{fontWeight:'bold'},3:{fontFamily:'Inserimento non dipinto'}},1:{0:{fontFamily:'Riga assente non dipinta'}}}},source=(node:unknown)=>[{id:'TEST',source:{pages:[{canvas:{objects:[node]}}]}}];
 const current=requiredPitchprintFonts(source(item));expect(current.fonts.map(f=>[f.family,f.weight])).toEqual([['Arimo',400],['Arimo',700]]);expect(current.issues).toEqual([]);
 expect(requiredPitchprintFonts(source({...item,version:'7.4.0'})).fonts.map(f=>f.family)).toEqual(['Arimo','Arimo','Riga assente non dipinta']);
});
it('usa il primo font dichiarato, conserva pesi e corsivi e non sceglie una famiglia di fallback',()=>{expect(pitchprintFontRequest({fontFamily:"'Arial-BoldItalicMT', 'Arial', sans-serif",fontWeight:700,fontStyle:'italic'})).toEqual({family:'Arial-BoldItalicMT',weight:700,italic:true});expect(()=>pitchprintFontRequest({fontFamily:'Test',fontWeight:'medium'})).toThrow('Peso');expect(()=>pitchprintFontRequest({fontFamily:'Test',fontStyle:'oblique'})).toThrow('esplicitamente');});
it('censisce testi nei gruppi e nei singoli caratteri, deduplica dichiarazioni equivalenti e segnala quelle incomplete',()=>{const source={pages:[{canvas:{objects:[{type:'group',objects:[{type:'i-text',fontFamily:'Open Sans',fontWeight:'normal',text:'TEST',styles:{0:{1:{fontWeight:'bold'},2:{fontStyle:'italic'}}}},{type:'textbox',fontFamily:'open_sans',fontWeight:400,fontStyle:''},{type:'text',text:'senza font'}]}]}}]},result=requiredPitchprintFonts([{id:'source-test',source}]);expect(result.fonts.map(font=>[font.weight,font.italic])).toEqual([[400,false],[400,true],[700,false]]);expect(result.fonts[0]!.sourceNames).toEqual(['Open Sans','open_sans']);expect(result.issues).toEqual([{templateId:'source-test',reason:'Famiglia font non dichiarata nel sorgente.'}]);});

it('censisce anche il testo curvo legacy senza dichiararne supportato il disegno; gli stili di inserimento non richiedono file inutilizzati',()=>{const source={pages:[{canvas:{objects:[{type:'curvedText',fontFamily:'Font curvo TEST',text:'ABC',styles:{0:{3:{fontFamily:'Non usato TEST'}}}}]}}]};const report=requiredPitchprintFonts([{id:'curved-source',source}]);expect(report.fonts.map(font=>font.family)).toEqual(['Font curvo TEST']);expect(report.issues).toEqual([]);});

it('i font delle colonne oltre fine riga non appartengono al testo visibile nelle versioni verificate',()=>{
 for(const type of ['i-text','textbox']){
  const item={type,version:'3.4.0',text:'ÈA\nBCD',fontFamily:'Arimo',styles:{0:{3:{fontFamily:'Residuo TEST'}},1:{0:{fontFamily:'Tinos'}}}},source=(node:unknown)=>[{id:'TEST',source:{pages:[{canvas:{objects:[node]}}]}}];
  expect(requiredPitchprintFonts(source(item)).fonts.map(f=>f.family)).toEqual(['Arimo','Tinos']);
  expect(requiredPitchprintFonts(source({...item,version:'7.4.0'})).fonts.map(f=>f.family)).toContain('Residuo TEST');
  expect(requiredPitchprintFonts(source({...item,text:'\nBCD'})).fonts.map(f=>f.family)).toContain('Residuo TEST');
 }
});
