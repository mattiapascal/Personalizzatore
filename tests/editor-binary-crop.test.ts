import {expect,it,vi} from 'vitest';
import {binaryCropFixture,binaryCropOrientationCases,logicalPoint} from './helpers/binary-crop';
import {pngChunk,testPng} from './helpers/png';
import {rasterSampleWindow,rawRasterSampleWindow} from '../src/editor/raster-sample-window';
import {binaryInkWindow,assertDocumentProduction,type RasterObject} from '../src/editor/production-check';
import {serverBinaryRasterCheck} from '../scripts/editor-production-raster';
import {rasterSourceFromBytes} from '../src/editor/raster-source';
import {DEFAULT_RASTER} from '../src/editor/raster-processing';
import {fixtureCatalog} from '../src/catalog/adapter';
import {DocumentSchema,DocumentStore} from '../src/editor/model';
const catalog={version:fixtureCatalog.version,products:fixtureCatalog.list()};
const object=()=>binaryCropFixture().objects[0] as RasterObject;
it('finestra sorgente: bordi interi/frazionari, minimo un pixel e limiti originali validati',()=>{
 const {source}=object();expect(rasterSampleWindow(source)).toEqual({left:0,top:0,width:3,height:2});
 expect(rasterSampleWindow(source,{leftPx:0,topPx:0,widthPx:2,heightPx:2})).toEqual({left:0,top:0,width:2,height:2});
 expect(rasterSampleWindow(source,{leftPx:.1,topPx:.1,widthPx:1,heightPx:1})).toEqual({left:0,top:0,width:2,height:2});
 expect(rasterSampleWindow(source,{leftPx:0,topPx:0,widthPx:2.000001,heightPx:1})).toEqual({left:0,top:0,width:3,height:1});
 for(const crop of[{leftPx:0,topPx:0,widthPx:.5,heightPx:1},{leftPx:2.1,topPx:0,widthPx:1,heightPx:1},{leftPx:0,topPx:0,widthPx:NaN,heightPx:1}])expect(()=>rasterSampleWindow(source,crop)).toThrow();
});
it('EXIF 1–8: ogni finestra logica rettangolare copre esattamente i campioni raw del riferimento indipendente',()=>{
 const w=5,h=3;
 for(const orientation of[1,2,3,4,5,6,7,8]as const){const lw=orientation>=5?h:w,lh=orientation>=5?w:h;for(let left=0;left<lw;left++)for(let top=0;top<lh;top++)for(let width=1;width<=lw-left;width++)for(let height=1;height<=lh-top;height++){
  const expected:number[]=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const [lx,ly]=logicalPoint(orientation,w,h,x,y);if(lx>=left&&lx<left+width&&ly>=top&&ly<top+height)expected.push(y*w+x);}
  const raw=rawRasterSampleWindow({left,top,width,height},orientation,w,h),actual:number[]=[];for(let y=raw.top;y<raw.top+raw.height;y++)for(let x=raw.left;x<raw.left+raw.width;x++)actual.push(y*w+x);expect(actual).toEqual(expected);
 }}
 expect(()=>rawRasterSampleWindow({left:0,top:0,width:1,height:1},9 as 1,5,3)).toThrow();
});
it('buffer/finestra: controlla ogni campione visibile, ignora RGB trasparente e non attraversa righe',()=>{
 const pixels=new Uint8Array([0,0,0,255,255,255,255,255,127,127,127,255,0,0,0,255,55,88,99,0,0,0,0,128]);
 expect(binaryInkWindow(pixels,3,{left:0,top:0,width:2,height:2})).toBe(true);expect(binaryInkWindow(pixels,3,{left:2,top:0,width:1,height:1})).toBe(false);expect(binaryInkWindow(pixels,3,{left:2,top:1,width:1,height:1})).toBe(false);
 expect(()=>binaryInkWindow(pixels,4,{left:0,top:0,width:1,height:1})).toThrow('RGBA');expect(()=>binaryInkWindow(pixels,3,{left:3,top:0,width:1,height:1})).toThrow('Finestra');
});
it('campioni toccati dal bordo frazionario e da maschere: mai una falsa esclusione del grigio',async()=>{
 const image=object();await expect(serverBinaryRasterCheck(image)).resolves.toBe(true);
 image.crop!.widthPx=2.000001;await expect(serverBinaryRasterCheck(image)).resolves.toBe(false);
 image.crop={leftPx:0,topPx:0,widthPx:3,heightPx:2};image.clipMasks=[{commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']],frame:{left:0,top:0,width:.5,height:1},fillRule:'nonzero'}];await expect(serverBinaryRasterCheck(image)).resolves.toBe(false);
});
it('PNG e JPEG orientati: il crop del nero passa e quello del grigio fallisce, con parametri originali invariati',async()=>{
 for(const row of await binaryCropOrientationCases()){const image={...object(),source:row.source,crop:row.good},before=structuredClone(image);await expect(serverBinaryRasterCheck(image),`${row.mime} EXIF ${row.orientation}`).resolves.toBe(true);expect(image).toEqual(before);await expect(serverBinaryRasterCheck({...image,crop:row.bad}),`${row.mime} EXIF ${row.orientation}`).resolves.toBe(false);}
});
it('cache: stesso contenuto/finestre equivalenti condivise; grigio in un altro crop e metadati diversi ricontrollati',async()=>{
 const base=object(),doc=binaryCropFixture(),equivalent={...base,id:'equivalent',source:{...base.source,id:'new-alias'},crop:{leftPx:.1,topPx:.1,widthPx:1.8,heightPx:1.8}},decode=vi.fn(serverBinaryRasterCheck);doc.objects=[base,equivalent,doc.objects[1]!];
 await expect(assertDocumentProduction(DocumentSchema.parse(doc),catalog,decode,true)).rejects.toThrow('gray-crop');expect(decode).toHaveBeenCalledTimes(2);
 const binary={...base,raster:{...DEFAULT_RASTER}},other={...binary,id:'bad-metadata',source:{...binary.source,id:'alias',pixelWidth:4}},invalid={...doc,objects:[binary,other]},guard=vi.fn(serverBinaryRasterCheck);
 await expect(assertDocumentProduction(invalid,catalog,guard,true)).rejects.toThrow();expect(guard).toHaveBeenCalledTimes(2);
});
it('filtri: rimozione bianco valida la sorgente intera; monocolore esplicito e immagine vuota seguono il motore pixel',async()=>{
 const pixels=new Uint8Array([0,0,0,255,255,0,0,255]),image={...object(),source:rasterSourceFromBytes('color-outside',testPng(2,1,pixels)),crop:{leftPx:0,topPx:0,widthPx:1,heightPx:1}};
 await expect(serverBinaryRasterCheck(image)).rejects.toThrow('scala di grigi');await expect(serverBinaryRasterCheck({...image,raster:{...image.raster,mode:'grayscale'}})).resolves.toBe(true);
 const empty={...image,source:rasterSourceFromBytes('empty',testPng(2,1,new Uint8Array([99,3,200,0,55,88,99,0])))};await expect(serverBinaryRasterCheck(empty)).resolves.toBe(true);
});
it('file intero verificato anche con crop minimo e filtro binario: compressione troncata e copie PNG discordanti respinte',async()=>{
 const pixels=new Uint8Array(4*2*4);for(let i=3;i<pixels.length;i+=4)pixels[i]=255;const first=testPng(4,2,pixels);let at=8;const chunks:Buffer[]=[first.subarray(0,8)];while(at<first.length){const n=first.readUInt32BE(at),kind=first.toString('ascii',at+4,at+8);chunks.push(kind==='IDAT'?pngChunk(kind,first.subarray(at+8,at+8+Math.max(1,Math.floor(n/2)))):first.subarray(at,at+n+12));at+=n+12;}
 const image={...object(),source:{...rasterSourceFromBytes('valid',first),dataUrl:'data:image/png;base64,'+Buffer.concat(chunks).toString('base64')},crop:{leftPx:0,topPx:0,widthPx:1,heightPx:1},raster:{...DEFAULT_RASTER}};
 await expect(serverBinaryRasterCheck(image)).rejects.toThrow();pixels.set([127,127,127,255],pixels.length-4);const different=Buffer.concat([first,testPng(4,2,pixels)]);await expect(serverBinaryRasterCheck({...image,source:rasterSourceFromBytes('copies',different)})).rejects.toThrow('differenti');
});
it('il ritaglio manuale e AI usa lo stesso documento; Undo/Redo cambia il controllo senza perdere gli originali',async()=>{
 const doc=binaryCropFixture();doc.objects=[doc.objects[0]!];const store=new DocumentStore(doc,o=>o.type==='image'?{widthMm:o.widthMm,heightMm:o.heightMm}:{widthMm:1,heightMm:1});const before=structuredClone(doc.objects[0]);
 await expect(assertDocumentProduction(store.document,catalog,serverBinaryRasterCheck,true)).resolves.toBeUndefined();const expanded={...object(),crop:{leftPx:0,topPx:0,widthPx:3,heightPx:2},widthMm:12};store.dispatch({schemaVersion:1,tool:'updateObject',objectId:expanded.id,expectedRevision:0,arguments:{object:expanded}},'manual');await expect(assertDocumentProduction(store.document,catalog,serverBinaryRasterCheck,true)).rejects.toThrow('pixel del ritaglio');
 store.undo();expect(store.document.objects[0]).toEqual(before);await expect(assertDocumentProduction(store.document,catalog,serverBinaryRasterCheck,true)).resolves.toBeUndefined();store.redo();const current=store.document.objects[0] as RasterObject;store.dispatch({schemaVersion:1,tool:'updateObject',objectId:current.id,expectedRevision:store.document.revision,arguments:{object:{...current,raster:{...DEFAULT_RASTER}}}},'ai-simulation');await expect(assertDocumentProduction(store.document,catalog,serverBinaryRasterCheck,true)).resolves.toBeUndefined();expect((store.document.objects[0] as RasterObject).source).toEqual(object().source);
});
it('consumatore locale: crop valido salvato, add/replace non validi senza ricevute o modifiche, retry corretto',async()=>{
 const{mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{randomUUID}=await import('node:crypto'),{ConfigurationStore}=await import('../scripts/configuration-store');const dir=await mkdtemp(join(tmpdir(),'binary-crop-store-'));
 try{const store=new ConfigurationStore(dir),good=binaryCropFixture();good.objects=[good.objects[0]!];const args={title:'Crop TEST',document:good,options:{inkColor:'black'},svg:'<svg xmlns="http://www.w3.org/2000/svg"/>',quantity:1},saved=await store.dispatch({tool:'add',requestId:randomUUID(),arguments:args}),before=await store.read(),bad=binaryCropFixture();const requestId=randomUUID();
  await expect(store.dispatch({tool:'add',requestId,arguments:{...args,document:bad}})).rejects.toThrow('gray-crop');expect(await store.read()).toEqual(before);
  const{quantity:_,...replacement}=args,line=saved.lines[0]!;await expect(store.dispatch({tool:'replace',requestId:randomUUID(),arguments:{...replacement,document:bad,lineId:line.id,expectedConfigurationId:line.configurationId,expectedVersion:line.version}})).rejects.toThrow('gray-crop');expect(await store.read()).toEqual(before);
  await store.dispatch({tool:'add',requestId,arguments:args});expect((await store.read()).lines).toHaveLength(2);expect((await store.read()).configurations[0]!.document.objects).toEqual(good.objects);
 }finally{await rm(dir,{recursive:true,force:true});}
});
