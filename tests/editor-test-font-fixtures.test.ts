import{expect,it}from'vitest';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{TEST_FONT_ASSETS,TEST_DEFAULT_FONT,createTestDocument,portableTestFixture}from'./helpers/editor-fonts';
import sources from'../fixtures/fonts/editor-fonts.TEST.sources.json' with{type:'json'};
import{assertExactFontIdentity}from'../scripts/font-identity';
import{parseGraphicDocument}from'../src/editor/model';
import{legacyFontRequests}from'../src/editor/legacy-fonts';
it('font dei collaudi: dodici file originali con hash, nome, peso e corsivo verificati, senza font personali',()=>{
 expect(TEST_FONT_ASSETS).toHaveLength(12);for(const source of sources){const asset=TEST_FONT_ASSETS.find(asset=>asset.id===source.id)!,bytes=readFileSync(`fixtures/fonts/${source.file}`);expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);expect(asset.dataBase64).toBe(bytes.toString('base64'));expect(()=>assertExactFontIdentity(bytes,asset.format,asset.family,source.weight,source.italic)).not.toThrow();expect(asset.licenseText).toContain('SIL OPEN FONT LICENSE');expect(source.sourceUrl).toMatch(/^https:\/\/fonts.gstatic.com\//);}
});
it('la nuova fixture dichiara il file e la migrazione TEST non modifica il campione storico',()=>{
 const doc=createTestDocument();expect(doc.fontAssets).toEqual([TEST_DEFAULT_FONT]);expect(legacyFontRequests(doc)).toEqual([]);
 const legacy=parseGraphicDocument(JSON.parse(readFileSync('fixtures/illustrator/stamp.TEST.json','utf8'))),before=structuredClone(legacy),converted=portableTestFixture(legacy);expect(legacy).toEqual(before);expect(legacyFontRequests(converted)).toEqual([]);expect(converted.areaMm).toEqual(before.areaMm);expect(converted.objects.map(({id,type,xMm,yMm})=>({id,type,xMm,yMm}))).toEqual(before.objects.map(({id,type,xMm,yMm})=>({id,type,xMm,yMm})));expect(parseGraphicDocument(converted)).toEqual(converted);
});
