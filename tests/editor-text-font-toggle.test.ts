import{expect,it}from'vitest';
import{createTestDocument,TEST_FONT_ASSETS}from'./helpers/editor-fonts';
import{textFontToggle}from'../src/editor/text-font-toggle';
import{selectionStyle,type TextObject}from'../src/editor/text-style';
const regular='font-aaaaaaaa-0000-4000-8000-000000000001',bold='font-aaaaaaaa-0000-4000-8000-000000000002',italic='font-aaaaaaaa-0000-4000-8000-000000000003',boldItalic='font-aaaaaaaa-0000-4000-8000-000000000004';
function source():TextObject{return{...createTestDocument().objects[1] as TextObject,text:'AB😀D',characterStyles:[{start:0,end:2,style:{fontFamily:bold,underline:true,kerningPt:.2}}]};}
it('corsivo su tutto il box conserva il grassetto parziale e gli altri attributi',()=>{
 const original=source(),before=structuredClone(original),result=textFontToggle(original,'italic',TEST_FONT_ASSETS);expect(result.pressed).toBe(false);expect(original).toEqual(before);expect(result.object).toMatchObject({fontFamily:italic,fontWeight:'normal',fontStyle:'normal',characterStyles:[{start:0,end:2,style:{fontFamily:boldItalic,underline:true,kerningPt:.2}}]});
 const restored=textFontToggle(result.object!,'italic',TEST_FONT_ASSETS);expect(restored.pressed).toBe(true);expect(restored.object).toMatchObject({fontFamily:regular,characterStyles:[{start:0,end:2,style:{fontFamily:bold}}]});
});
it('selezione mista: B attiva tutti i caratteri selezionati, poi li disattiva senza toccare il resto',()=>{
 const original=source(),result=textFontToggle(original,'bold',TEST_FONT_ASSETS,{start:1,end:3});expect(result.pressed).toBe('mixed');expect(result.object?.fontFamily).toBe(regular);expect(selectionStyle(result.object!,1,3).style.fontFamily).toBe(bold);expect(selectionStyle(result.object!,0,1).style).toMatchObject({fontFamily:bold,underline:true});
 const off=textFontToggle(result.object!,'bold',TEST_FONT_ASSETS,{start:1,end:3});expect(off.pressed).toBe(true);expect(selectionStyle(off.object!,1,3).style.fontFamily).toBe(regular);expect(selectionStyle(off.object!,0,1).style.fontFamily).toBe(bold);
});
it('variante assente o ambigua: nessun aggiornamento parziale e nessuna simulazione',()=>{
 const original=source(),before=structuredClone(original);expect(textFontToggle(original,'italic',TEST_FONT_ASSETS.filter(asset=>asset.id!==boldItalic)).object).toBeNull();
 const other={...TEST_FONT_ASSETS.find(asset=>asset.id===italic)!,id:'font-bbbbbbbb-0000-4000-8000-000000000001',dataBase64:TEST_FONT_ASSETS.find(asset=>asset.id===bold)!.dataBase64};expect(textFontToggle(original,'italic',[...TEST_FONT_ASSETS,other]).object).toBeNull();expect(original).toEqual(before);
});
it('cursore senza selezione non applica formattazioni',()=>{expect(textFontToggle(source(),'bold',TEST_FONT_ASSETS,{start:2,end:2}).object).toBeNull();});

it('cambio famiglia: mantiene stili misti con file della nuova famiglia e rifiuta una variante mancante',async()=>{
 const{textFontFamily,commonTextFontFamily}=await import('../src/editor/text-font-toggle'),original=source(),before=structuredClone(original),cousine='font-aaaaaaaa-0000-4000-8000-000000000007',cousineBold='font-aaaaaaaa-0000-4000-8000-000000000010';
 const next=textFontFamily(original,cousine,TEST_FONT_ASSETS)!;expect(original).toEqual(before);expect(next.fontFamily).toBe(cousine);expect(next.characterStyles?.[0]?.style).toMatchObject({fontFamily:cousineBold,underline:true});expect(commonTextFontFamily(original,TEST_FONT_ASSETS)).toBe(bold);expect(commonTextFontFamily({...original,characterStyles:[{start:0,end:1,style:{fontFamily:cousine}}]},TEST_FONT_ASSETS)).toBeUndefined();expect(textFontFamily(original,cousine,TEST_FONT_ASSETS.filter(asset=>asset.id!==cousineBold))).toBeNull();
});

it('scelta esplicita di una famiglia con un solo stile usa proprio quel file, senza simulazioni',async()=>{
 const{textFontFamily}=await import('../src/editor/text-font-toggle'),only={...TEST_FONT_ASSETS.find(asset=>asset.id===bold)!,id:'font-bbbbbbbb-0000-4000-8000-000000000001',familyGroup:'Solo grassetto TEST'},doc=source();delete doc.characterStyles;
 expect(textFontFamily(doc,only.id,[...TEST_FONT_ASSETS,only])).toBeNull();const next=textFontFamily(doc,only.id,[...TEST_FONT_ASSETS,only],undefined,true)!;expect(next).toMatchObject({fontFamily:only.id,fontWeight:'normal',fontStyle:'normal'});expect(next.characterStyles).toBeUndefined();
 const plain={...TEST_FONT_ASSETS.find(asset=>asset.id===regular)!,id:'font-bbbbbbbb-0000-4000-8000-000000000002',familyGroup:'Solo normale TEST'};expect(textFontFamily(next,plain.id,[...TEST_FONT_ASSETS,only,plain],undefined,true)).toMatchObject({fontFamily:plain.id,fontWeight:'normal',fontStyle:'normal'});
});
