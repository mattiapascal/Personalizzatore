import {expect,it} from 'vitest';
import jsQR from 'jsqr';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {qrSymbol,QrParametersSchema,QR_QUIET_MODULES,type QrParameters} from '../src/editor/qr-code';
import {DocumentSchema,DocumentStore,type SceneObject,type Measure} from '../src/editor/model';
import {createTestDocument} from './helpers/editor-fonts';
import {resizeObjectDimension} from '../src/editor/resize-object';
import {transformSelection} from '../src/editor/selection';
import {EDITOR_LIMITS} from '../src/editor/limits';
const spec=(content='https://example.com/TEST?x=13',ecc:QrParameters['ecc']='M'):QrParameters=>({encoding:'qr-v1',kind:'text',content,ecc});
const object=():Extract<SceneObject,{type:'qr'}>=>({id:'qr-test',type:'qr',qr:spec(),xMm:4,yMm:1,widthMm:20,heightMm:20,fill:'#000000',stroke:'none',strokeMm:0});
const measure:Measure=o=>'widthMm'in o?{widthMm:o.widthMm,heightMm:o.heightMm}:{widthMm:10,heightMm:10};
function document(){const d=createTestDocument();d.objects=[object()];return DocumentSchema.parse(d);}
function read(spec:QrParameters){const q=qrSymbol(spec),n=q.modules+2*QR_QUIET_MODULES,side=n*5,pixels=new Uint8ClampedArray(side*side*4);pixels.fill(255);q.matrix.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)for(let yy=0;yy<5;yy++)for(let xx=0;xx<5;xx++){const i=(((y+4)*5+yy)*side+(x+4)*5+xx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}}));return jsQR(pixels,side,side);}
for(const ecc of['L','M','Q','H']as const)for(const payload of['01234567890123','https://example.com/a?b=13&c=15','TEST · Città Ω 🚀','Nome\nCognome\r\nVia Roma\t13'])it(`lettore indipendente UTF-8/ECI, livello ${ecc}, ${payload.slice(0,14)}`,()=>{
 const parsed=QrParametersSchema.parse(spec(payload,ecc)),decoded=read(parsed);expect(decoded?.data).toBe(payload);expect(decoded?.binaryData).toEqual([...new TextEncoder().encode(payload)]);expect(qrSymbol(parsed).commands.length).toBeLessThanOrEqual(EDITOR_LIMITS.vectorCommandsPerObject);
});
it('parametri e URL: niente controlli nascosti, Unicode malformato, dati troppo lunghi o tipi/versioni presunti',()=>{
 for(const content of['',' ','\u0000','\ud800','🚀'.repeat(257)])expect(QrParametersSchema.safeParse(spec(content)).success).toBe(false);
 for(const content of['example.com','javascript:alert(1)','file:///x','https://a b.test','https://u:p@example.com'])expect(QrParametersSchema.safeParse({...spec(content),kind:'url'}).success).toBe(false);
 expect(QrParametersSchema.safeParse({...spec('https://example.com/a?b=1&c=2'),kind:'url'}).success).toBe(true);expect(QrParametersSchema.safeParse({...spec(),encoding:'future'}).success).toBe(false);
});
it('vendor fissato: algoritmo originale e avviso MIT conservati, adattamenti limitati dichiarati',()=>{
 const metadata=JSON.parse(readFileSync('src/vendor/qrcodegen.source.json','utf8')),adapted=readFileSync('src/vendor/qrcodegen.ts','utf8'),original=adapted.slice(adapted.indexOf('\n')+1).replace('/*!','/*').replaceAll('export namespace qrcodegen','namespace qrcodegen');expect(createHash('sha256').update(original).digest('hex')).toBe(metadata.sha256);expect(adapted).toContain('Copyright (c) Project Nayuki. (MIT License)');
});
it('cache immutabile e budget derivati: un contenuto ripetuto non può aggirare il limite totale dei vettori',()=>{
 const qr=object(),code=qrSymbol(qr.qr);expect(qrSymbol(qr.qr)).toBe(code);expect(Object.isFrozen(code.commands)).toBe(true);expect(Object.isFrozen(code.matrix[0])).toBe(true);const doc=document(),count=Math.floor(EDITOR_LIMITS.vectorCommands/code.commands.length)+1;doc.objects=Array.from({length:count},(_,i)=>({...qr,id:`qr-${i}`}));expect(()=>DocumentSchema.parse(doc)).toThrow('segmenti');
});
it('manuale/AI, modifica del contenuto e Undo/Redo sul medesimo documento',()=>{
 const doc=document(),manual=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure),changed={...object(),qr:spec('TEST · Città 15')},command={schemaVersion:1,tool:'updateObject',objectId:'qr-test',expectedRevision:doc.revision,arguments:{object:changed}};manual.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');expect(manual.document).toEqual(ai.document);expect(manual.document.objects[0]).toEqual(changed);manual.undo();expect(manual.document.objects).toEqual(doc.objects);manual.redo();expect(manual.document.objects[0]).toEqual(changed);expect(read(changed.qr)?.data).toBe(changed.qr.content);
});
it('rifiuti atomici di deformazioni, tinte, alpha, riflessioni e contenuti errati',()=>{
 const doc=document(),s=new DocumentStore(doc,measure);for(const patch of[{widthMm:21},{skewXDeg:10},{mirrorX:true},{fill:'#0088cc'},{fillOpacity:.5},{stroke:'#000000',strokeMm:.1},{qr:{...spec(),content:'\udc00'}}]){expect(()=>s.dispatch({schemaVersion:1,tool:'updateObject',objectId:'qr-test',expectedRevision:doc.revision,arguments:{object:{...object(),...patch}}},'ai-simulation')).toThrow();expect(s.document).toEqual(doc);expect(s.events).toHaveLength(0);}
});
it('dimensioni numeriche dal centro e scala di gruppo: quadrato e contenuto conservati',()=>{
 const qr=object(),resized=resizeObjectDimension(qr,'width',30,false,measure);expect(resized).toMatchObject({xMm:-1,yMm:-4,widthMm:30,heightMm:30,qr:qr.qr});const group=transformSelection([qr],{center:{xMm:14,yMm:11},scale:2,rotationDeg:90},measure)[0]!;expect(group).toMatchObject({type:'qr',widthMm:40,heightMm:40,rotationDeg:90,qr:qr.qr});expect(()=>DocumentSchema.parse({...document(),objects:[group]})).not.toThrow();
});
it('stili e trasformazioni incompatibili della selezione sono atomici, senza saltare il QR',()=>{
 const doc=document();doc.objects.push({id:'rect-test',type:'rect',xMm:25,yMm:1,widthMm:10,heightMm:10,fill:'#000000',stroke:'none',strokeMm:.1});const store=new DocumentStore(doc,measure);
 for(const [tool,args]of[['styleObjects',{style:{fill:'#ffffff'}}],['inclineObjects',{angleDeg:10}],['reflectObjects',{axis:'horizontal'}]]as const){expect(()=>store.dispatch({schemaVersion:1,tool,objectId:'qr-test',expectedRevision:doc.revision,arguments:{objectIds:['qr-test','rect-test'],...args}},'ai-simulation')).toThrow();expect(store.document).toEqual(doc);expect(store.events).toHaveLength(0);}
});
it('blocchi cliente, riferimenti e visibilità restano proprietà del medesimo oggetto tecnico',()=>{
 const doc=document();doc.objects[0]!.editor={selectionLocked:true};const locked=new DocumentStore(doc,measure,undefined,'customer');expect(()=>locked.dispatch({schemaVersion:1,tool:'updateObject',objectId:'qr-test',expectedRevision:doc.revision,arguments:{object:{...object(),qr:spec('CAMBIATO')}}},'manual')).toThrow();expect(locked.document).toEqual(doc);
 const reference=DocumentSchema.parse({...doc,objects:[{...object(),visible:false,editor:{reference:true}}]});expect(reference.objects[0]).toMatchObject({type:'qr',visible:false,editor:{reference:true},qr:object().qr});expect(DocumentSchema.parse(JSON.parse(JSON.stringify(reference)))).toEqual(reference);
});
