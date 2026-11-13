import {expect,it} from 'vitest';
import {createDocument,DocumentStore,objectGeometry,type Measure,type SceneObject} from '../src/editor/model';
const measure:Measure=o=>({widthMm:o.type==='text'?(o.textBox?.autoWidth===false?o.textBox.widthMm:Array.from(o.text.replace(/\n/g,'')).length*2):10,heightMm:o.type==='text'?o.text.split('\n').length*4:10});
const anchor=(o:SceneObject,factor:number)=>{const c=objectGeometry(o,measure).corners;return{x:c[0]!.x+(c[1]!.x-c[0]!.x)*factor,y:c[0]!.y+(c[1]!.y-c[0]!.y)*factor};};
for(const alignment of ['left','center','right']as const)for(const rotationDeg of[0,45])it(`setText conserva l’ancoraggio ${alignment} con rotazione ${rotationDeg}, manuale/AI e Undo`,()=>{
 const doc=createDocument();doc.objects=[{id:'text',type:'text',text:'ABC',fontFamily:'Arial',fontSizePt:12,fill:'#000000',textAlign:alignment,xMm:20,yMm:10,rotationDeg,skewXDeg:10,mirrorX:true}];
 const s=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure),factor=alignment==='center'?.5:alignment==='right'?1:0,previous=anchor(doc.objects[0]!,factor);
 const command={schemaVersion:1,tool:'setText',objectId:'text',expectedRevision:0,arguments:{text:'ABC molto lungo'}};
 s.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');expect(s.document).toEqual(ai.document);expect(anchor(s.document.objects[0]!,factor).x).toBeCloseTo(previous.x,8);expect(anchor(s.document.objects[0]!,factor).y).toBeCloseTo(previous.y,8);
 s.undo();expect(s.document.objects).toEqual(doc.objects);s.redo();expect(s.document.objects).toEqual(ai.document.objects);
});
it('setText mantiene gli allineamenti per paragrafo e ricostruisce gli offset Unicode',()=>{
 const doc=createDocument();doc.objects=[{id:'text',type:'text',text:'ABC\nDE',fontFamily:'Arial',fontSizePt:12,fill:'#000000',xMm:20,yMm:10,textAlign:'left',lineStyles:[{start:0,end:4,alignment:'center'},{start:4,end:6,alignment:'right'}]}];const s=new DocumentStore(doc,measure),previous=anchor(doc.objects[0]!,.5);
 s.dispatch({schemaVersion:1,tool:'setText',objectId:'text',expectedRevision:0,arguments:{text:'😀 Nuovo\nAltro testo'}},'manual');const text=s.document.objects[0]!;expect(text.type).toBe('text');if(text.type!=='text')return;expect(text.lineStyles).toEqual([{start:0,end:8,alignment:'center'},{start:8,end:19,alignment:'right'}]);expect(anchor(text,.5).x).toBeCloseTo(previous.x,8);
});
it('il box a larghezza fissa conserva posizione e dimensioni quando cambia il contenuto',()=>{
 const doc=createDocument();doc.objects=[{id:'text',type:'text',text:'ABC',fontFamily:'Arial',fontSizePt:12,fill:'#000000',xMm:20,yMm:10,textAlign:'center',textBox:{widthMm:30,heightMm:5,autoWidth:false,autoHeight:true}}];const s=new DocumentStore(doc,measure);s.dispatch({schemaVersion:1,tool:'setText',objectId:'text',expectedRevision:0,arguments:{text:'ABC\nDEF'}},'manual');expect(s.document.objects[0]).toMatchObject({xMm:20,yMm:10,textBox:doc.objects[0]!.type==='text'?doc.objects[0]!.textBox:undefined});
});
