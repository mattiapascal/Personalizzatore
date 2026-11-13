import {it,expect} from 'vitest';
import {geometryFocusFromReport,geometryFocusCurrent,geometryFocusTranslation} from '../src/editor/geometry-focus';
import type {ProductionGeometryReport} from '../src/editor/production-geometry';
import {productionGeometryFixture,geometryZoneId} from './helpers/production-geometry';
import {joinGraphicPages,selectGraphicPage} from '../src/editor/pages';
function sample(){
 const document=productionGeometryFixture(),profile=document.productionProfile!,report:ProductionGeometryReport={schemaVersion:1,documentId:document.documentId,revision:0,contentRevision:0,resolutionMm:.025,status:'overlap',pixels:100,pages:[{id:'page-1',name:'Pagina 1',profile:{id:profile.id,version:profile.version,label:profile.label},status:'overlap',rules:[{id:geometryZoneId,label:'Area data TEST',kind:'reserved',status:'overlap',pixels:100,witness:{xMm:45.0125,yMm:24.0125},candidateObjectIds:['clear-frame']}]}]};return{document,report};
}
it('localizza il punto della pittura, senza scegliere un oggetto dal bbox o cambiare il documento/report',()=>{
 const {document,report}=sample(),before=structuredClone({document,report}),focus=geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)!;
 expect(focus).toMatchObject({xMm:45.0125,yMm:24.0125,label:'Area data TEST',pageId:'page-1',sequence:1,status:'overlap'});expect(focus).not.toHaveProperty('objectId');expect({document,report}).toEqual(before);expect(geometryFocusCurrent(focus,document)).toBe(true);
});
it('revisione del contenuto, identità del documento e versione del profilo devono corrispondere',()=>{
 const {document,report}=sample();expect(geometryFocusFromReport({...document,revision:1},report,'page-1',geometryZoneId,1)).toBeNull();expect(geometryFocusFromReport({...document,documentId:'altro'},report,'page-1',geometryZoneId,1)).toBeNull();document.productionProfile!.version++;expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)).toBeNull();
});
it('nessun punto per regole senza rilievo, pagina mancante o sequenza non valida',()=>{
 const {document,report}=sample();expect(geometryFocusFromReport(document,report,'missing',geometryZoneId,1)).toBeNull();expect(geometryFocusFromReport(document,report,'page-1','missing',1)).toBeNull();expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,0)).toBeNull();
 for(const status of ['clear','incomplete','unconfigured']as const){report.pages[0]!.rules[0]!.status=status;expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)).toBeNull();}
});
it('il contatto incerto mantiene la sua classificazione, non diventa una violazione certa',()=>{
 const {document,report}=sample();report.pages[0]!.rules[0]!.status='boundary';expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,2)?.status).toBe('boundary');
});
it('approssimazioni sul bordo vengono limitate al foglio, coordinate impossibili respinte',()=>{
 const {document,report}=sample(),witness=report.pages[0]!.rules[0]!.witness!;witness.xMm=100.0125;expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)?.xMm).toBe(100);witness.xMm=-.01;expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)?.xMm).toBe(0);for(const x of [NaN,Infinity,-2,200]){witness.xMm=x;expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)).toBeNull();}
});
it('bordo circolare: nessun punto inventato negli angoli esterni alla sagoma',()=>{
 const {document,report}=sample();document.shape='round';document.areaMm={width:100,height:100};const witness=report.pages[0]!.rules[0]!.witness!;witness.xMm=99.99;witness.yMm=51.1;const focus=geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)!;expect(Math.hypot(focus.xMm-50,focus.yMm-50)).toBeCloseTo(50,8);witness.xMm=1;witness.yMm=1;expect(geometryFocusFromReport(document,report,'page-1',geometryZoneId,1)).toBeNull();
});
it('pagine già esistenti: localizzazione sulla pagina corretta con contenuto identico, senza ridimensionare',()=>{
 const {document:first,report}=sample(),second=structuredClone(first);second.areaMm={width:120,height:80};const document=joinGraphicPages([first,second]);report.pages.push({...structuredClone(report.pages[0]!),id:'page-2',name:'Pagina 2'});const focus=geometryFocusFromReport(document,report,'page-2',geometryZoneId,1)!;
 expect(focus).not.toBeNull();expect(geometryFocusCurrent(focus,document)).toBe(false);expect(geometryFocusCurrent(focus,document,false)).toBe(true);const selected=selectGraphicPage(document,'page-2');expect(geometryFocusCurrent(focus,selected)).toBe(true);expect(geometryFocusCurrent(focus,{...selected,revision:5,contentRevision:0})).toBe(true);expect(geometryFocusCurrent(focus,{...selected,revision:5,contentRevision:1})).toBe(false);
});
for(const zoom of [.25,1,4])it(`traslazione della sola vista a zoom ${zoom}, coordinate e dimensioni fisiche conservate`,()=>{
 const canvas={left:-700,top:200,width:800*zoom,height:480*zoom},viewport={left:240,top:60,width:900,height:620},area={width:100,height:60},point={xMm:45,yMm:24},before=structuredClone({canvas,viewport,area,point}),delta=geometryFocusTranslation(canvas,viewport,area,point);
 expect(canvas.left+delta.x+point.xMm/area.width*canvas.width).toBeCloseTo(viewport.left+viewport.width/2,9);expect(canvas.top+delta.y+point.yMm/area.height*canvas.height).toBeCloseTo(viewport.top+viewport.height/2,9);expect({canvas,viewport,area,point}).toEqual(before);
});
it('vista non misurabile: nessuna traslazione NaN o infinita',()=>{
 expect(()=>geometryFocusTranslation({left:0,top:0,width:0,height:10},{left:0,top:0,width:10,height:10},{width:100,height:60},{xMm:45,yMm:24})).toThrow('non disponibile');
});
