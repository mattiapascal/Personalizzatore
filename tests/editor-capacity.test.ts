import { expect,it } from 'vitest';
import { createDocument,DocumentSchema,DocumentStore,objectGeometry,type SceneObject } from '../src/editor/model';
const text=(id:string,value:string):Extract<SceneObject,{type:'text'}>=>({id,type:'text',text:value,xMm:5,yMm:5,fontFamily:'Arial',fontSizePt:12,fill:'#000000'});
it('fino a 4000 caratteri Unicode e 100 righe per box, conteggio corretto dei caratteri oltre BMP',()=>{
 const doc=createDocument();doc.objects=[text('text','😀'.repeat(4000))];expect(()=>DocumentSchema.parse(doc)).not.toThrow();doc.objects=[text('text','😀'.repeat(4001))];expect(()=>DocumentSchema.parse(doc)).toThrow('4000');doc.objects=[text('text',Array.from({length:100},()=> 'Riga').join('\n'))];expect(()=>DocumentSchema.parse(doc)).not.toThrow();doc.objects=[text('text',Array.from({length:101},()=> 'Riga').join('\n'))];expect(()=>DocumentSchema.parse(doc)).toThrow('100 righe');
});
it('limite totale di 20000 caratteri e 200 oggetti, rifiuto atomico quando superati',()=>{
 const doc=createDocument();doc.objects=Array.from({length:5},(_,i)=>text(`text-${i}`,'A'.repeat(4000)));expect(()=>DocumentSchema.parse(doc)).not.toThrow();const store=new DocumentStore(doc,()=>({widthMm:20,heightMm:4})),before=structuredClone(store.document);expect(()=>store.dispatch({schemaVersion:1,tool:'addObject',objectId:'extra',expectedRevision:0,arguments:{object:text('extra','A')}},'manual')).toThrow('20000');expect(store.document).toEqual(before);
 doc.objects=Array.from({length:200},(_,i)=>({id:`rect-${i}`,type:'rect',xMm:5,yMm:5,widthMm:2,heightMm:2,strokeMm:.1,stroke:'#000000'}));expect(()=>DocumentSchema.parse(doc)).not.toThrow();doc.objects.push({...doc.objects[0]!,id:'extra'});expect(()=>DocumentSchema.parse(doc)).toThrow();
});
it('corpi oltre 48 pt senza ridurre il minimo produttivo TEST; protezione degli ingombri estremi',()=>{
 const doc=createDocument();doc.objects=[{...text('text','A'),fontSizePt:500,characterStyles:[{start:0,end:1,style:{fontSizePt:300}}]}];expect(()=>DocumentSchema.parse(doc)).not.toThrow();expect(()=>DocumentSchema.parse({...doc,objects:[{...doc.objects[0],fontSizePt:501}]})).toThrow();expect(()=>DocumentSchema.parse({...doc,objects:[{...doc.objects[0],fontSizePt:6}]})).toThrow();expect(()=>objectGeometry(doc.objects[0]!,()=>({widthMm:10001,heightMm:10}))).toThrow('limite di sicurezza');
});
