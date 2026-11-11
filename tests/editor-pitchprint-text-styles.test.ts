import { expect, it } from 'vitest';
import { pitchprintTextStyles } from '../src/editor/pitchprint-text-styles';
import { TEST_FONT_ASSETS } from './helpers/editor-fonts';
import { createDocument, DocumentSchema, DocumentStore } from '../src/editor/model';
const base={text:'È😀A\nBC',fontFamily:'Arimo',fontWeight:'normal',fontStyle:'normal',fontSize:40,fill:'#000000',textAlign:'center'};
const resolve=async(request:{family:string;weight:number;italic:boolean})=>{const font=TEST_FONT_ASSETS.find(font=>font.familyGroup===request.family&&font.weight===request.weight&&font.italic===request.italic);if(!font)throw Error('File esatto mancante');return font;};
it('segnala gli stili di inserimento esattamente a fine riga senza richiedere font non usati; indici vuoti o fuori riga restano bloccanti',async()=>{
 let requests=0;const result=await pitchprintTextStyles({...base,styles:{0:{3:{fontFamily:'Font mai dipinto',fontSize:9999}},1:{2:{fill:'red'}}}},.2,false,async()=>{requests++;throw Error('Non deve risolvere font senza caratteri');});
 expect(result.ignoredInsertionStyles).toBe(2);expect(result.characterStyles).toEqual([]);expect(result.nativeStyles).toEqual({});expect(requests).toBe(0);
 for(const styles of [{0:{4:{fill:'red'}}},{2:{0:{fill:'red'}}},{0:{3:{unknown:true}}}])await expect(pitchprintTextStyles({...base,styles},.2,false,resolve)).rejects.toThrow();
 await expect(pitchprintTextStyles({...base,text:'A\n\nB',styles:{1:{0:{fontSize:70}}}},.2,false,resolve)).rejects.toThrow('Indice');
});
it('stili Unicode per righe: eredita font, risolve varianti esatte, converte mm/pt e conserva false',async()=>{
 const requests:any[]=[];const result=await pitchprintTextStyles({...base,underline:true,styles:{0:{1:{fontWeight:'bold',fontStyle:'italic',fontSize:50,fill:'#08c',underline:false,stroke:null,strokeWidth:1,deltaY:0,textBackgroundColor:'',textAlign:'center'}},1:{0:{fontFamily:'Cousine',fontStyle:'italic',overline:true},1:{underline:'underline'}}}},.2,false,async request=>{requests.push(request);return resolve(request);});
 expect(requests).toEqual([{family:'Arimo',weight:700,italic:true},{family:'Cousine',weight:400,italic:true}]);
 expect(result.characterStyles).toMatchObject([{start:1,end:2,style:{fontWeight:'normal',fontStyle:'normal',fontFamily:'font-aaaaaaaa-0000-4000-8000-000000000004',fill:'#0088cc',underline:false}},{start:4,end:5,style:{overline:true}},{start:5,end:6,style:{underline:true}}]);expect(result.characterStyles[0]!.style.fontSizePt).toBeCloseTo(50*.2*72/25.4,9);expect(result.nativeStyles[0]![1]).toMatchObject({fontWeight:'normal',fontStyle:'normal',fontSize:50,underline:false});
 const mono=await pitchprintTextStyles({...base,styles:{0:{0:{fill:'#f00'}}}},.2,true,resolve);expect(mono.characterStyles[0]!.style.fill).toBe('#000000');
});
it('indici, effetti sconosciuti e sequenze ambigue bloccano prima dei font degli stili; variante mancante non sostituita',async()=>{
 for(const styles of [{1:{9:{fill:'black'}}},{0:{0:{opacity:.5}}},{0:{0:{deltaY:1}}},{0:{0:{stroke:'black',strokeWidth:1}}},{0:{0:{textBackgroundColor:'red'}}},{0:{0:{textAlign:'left'}}},{0:{0:{underline:'yes'}}},{0:{0:{fontSize:.01}}},[]]){
  await expect(pitchprintTextStyles({...base,styles},.2,false,resolve)).rejects.toThrow();
 }
 await expect(pitchprintTextStyles({...base,text:'e\u0301',styles:{0:{0:{fill:'black'}}}},.2,false,resolve)).rejects.toThrow('Unicode');
 await expect(pitchprintTextStyles({...base,styles:{0:{0:{fontFamily:'Missing TEST'}}}},.2,false,resolve)).rejects.toThrow('File esatto mancante');
});
it('interlinea compatta con gli stessi comandi e storico, default invariato e rifiuti atomici',()=>{
 const doc=createDocument();doc.objects=doc.objects.filter(object=>object.type==='text').map(object=>({...object,lineHeight:.8}));const store=new DocumentStore(doc,()=>({widthMm:20,heightMm:8}));
 for(const [index,source] of ['manual','ai-simulation'].entries())store.dispatch({schemaVersion:1,tool:'updateObject',objectId:doc.objects[0]!.id,expectedRevision:index,arguments:{object:{...doc.objects[0],lineHeight:index===0?.9:.1}}},source as 'manual'|'ai-simulation');
 expect(store.document.objects[0]).toMatchObject({lineHeight:.1});store.undo();expect(store.document.objects[0]).toMatchObject({lineHeight:.9});const before=structuredClone(store.document);
 for(const lineHeight of [0,NaN,Infinity,3.01])expect(()=>DocumentSchema.parse({...before,objects:[{...before.objects[0],lineHeight}]})).toThrow();expect(store.document).toEqual(before);store.redo();expect(store.document.objects[0]).toMatchObject({lineHeight:.1});
});
