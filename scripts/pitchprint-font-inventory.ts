import{readFile,readdir,writeFile,mkdir}from'node:fs/promises';
import{resolve,join,relative,dirname}from'node:path';import{parseArgs}from'node:util';import{randomUUID}from'node:crypto';import{pathToFileURL}from'node:url';
import{requiredPitchprintFonts,fontNameKey}from'../src/editor/pitchprint-fonts';import{GoogleFontLibrary}from'./google-fonts';import{assertExactFontIdentity}from'./font-identity';import{pitchprintLabDirectory}from'./local-pitchprint-import';
import{openFontAuditLibrary,readFontAuditState,assertFontAuditPreserved,checkedFontAuditServer,postFontAuditCommand,localFontAuditOrigin,FontAuditConflictError}from'./editor-font-audit-library';
import{resolvePitchprintFont}from'./pitchprint-font-resolver';
import{backupSqliteArchive}from'./editor-archive-sqlite-maintenance';import{backupJsonArchive}from'./editor-json-backup';
export interface FontAuditOptions{sourceDirectory:string;outputDirectory:string;libraryDirectory?:string;sqliteFile?:string;installGoogle:boolean;origin?:string;offline?:boolean;}
export async function auditPitchprintFonts(options:FontAuditOptions){
 if(options.offline&&options.installGoogle)throw Error('La modalità offline non installa font da Google');
 const origin=options.installGoogle?localFontAuditOrigin(options.origin??'http://127.0.0.1:5173'):undefined;
 const library=await openFontAuditLibrary(options),store=library.store,rows:any[]=[],runId=randomUUID();let backup:unknown,expectedRevision:number|undefined;
 const runStatus=async(status:'running'|'complete'|'failed',error?:unknown)=>writeFile(join(options.outputDirectory,'font-audit-run.json'),JSON.stringify({runId,status,backend:library.backend,archiveIdentity:library.identity,expectedRevision,backup,checkedAt:new Date().toISOString(),processed:rows.length,...(error?{error:error instanceof Error?error.message:String(error)}:{})},null,2),{mode:0o600});
 try{
  await mkdir(options.outputDirectory,{recursive:true,mode:0o700});await runStatus('running');
  const before=await readFontAuditState(library);expectedRevision=before.snapshot.revision;
  if(origin)await checkedFontAuditServer(library,origin,before.snapshot);
  const names=(await readdir(options.sourceDirectory)).filter(name=>/\.source\.json$/.test(name)).sort(),sources=await Promise.all(names.map(async name=>({id:name.replace(/\.source\.json$/,''),source:JSON.parse(await readFile(join(options.sourceDirectory,name),'utf8'))}))),requirements=requiredPitchprintFonts(sources),google=new GoogleFontLibrary(),catalog=options.offline?[]:await google.catalog();
  let pitchCatalog:any;try{pitchCatalog=JSON.parse(await readFile(join(pitchprintLabDirectory(),'font-catalog/catalog.json'),'utf8'));}catch{}
  for(const requirement of requirements.fonts){
   const state=await store.readFontLibrary();if(state.revision!==expectedRevision)throw new FontAuditConflictError('Archivio modificato da un’altra operazione: interrompo senza ripristino automatico');
   const matches=catalog.filter(font=>fontNameKey(font.family)===fontNameKey(requirement.family)),item=matches.length===1?matches[0]:null,variant=`${requirement.weight}${requirement.italic?'i':''}`,row:any={...requirement,googleFamily:item?.family??null,variant,status:'manual',reason:'Non presente nel catalogo Google Fonts con questo nome esatto.'};
   try{const resolution=await resolvePitchprintFont(dirname(library.file),pitchprintLabDirectory(),requirement.family,requirement.weight,requirement.italic,{readFonts:async()=>state.fonts}),existing=state.fonts.find(font=>!font.archived&&font.format===resolution.asset.format&&font.dataBase64===resolution.asset.dataBase64);if(existing){row.status='available';row.reason='Variante originale già installata, verificata con lo stesso resolver dell’editor.';row.fontId=existing.id;row.resolutionEvidence=resolution.evidence.kind;row.actualWeight=resolution.asset.weight;}else row.reason='Originale individuato nel vecchio catalogo, ma non installato nella libreria selezionata.';}catch(cause){row.reason=cause instanceof Error?cause.message:'File esistente non verificabile';}
   if(row.status!=='available'&&item){
    if(!(item.variants??['400']).includes(variant))row.reason='Famiglia Google presente, ma questa variante esatta non è disponibile. Nessun peso alternativo.';
    else if(!origin){row.status='google-to-install';row.reason='Variante esatta disponibile su Google Fonts.';}
    else{
     let coordinated=false;
     try{
      const prepared=await google.prepare(item.family,variant);assertExactFontIdentity(Buffer.from(prepared.dataBase64,'base64'),prepared.format,item.family,requirement.weight,requirement.italic);coordinated=true;
      const snapshot=await store.readSnapshot();if(snapshot.revision!==expectedRevision)throw new FontAuditConflictError('Archivio modificato prima dell’installazione: nessuna richiesta inviata');
      await checkedFontAuditServer(library,origin,snapshot);
      if(!backup){
       const directory=join(options.outputDirectory,`before-font-install-r${expectedRevision}-${runId}`);
       if(library.backend==='sqlite'){const saved=await backupSqliteArchive(library.file,join(directory,'archive.sqlite'));if(saved.revision!==expectedRevision)throw new FontAuditConflictError('Revisione cambiata durante il backup: nessuna installazione avviata');backup=saved;}
       else backup=await backupJsonArchive(library.file,join(directory,'state.json'));
       await runStatus('running');
      }
      if((await store.readFontLibrary()).revision!==expectedRevision)throw new FontAuditConflictError('Archivio modificato durante la preparazione: nessuna richiesta inviata');
      const result=await postFontAuditCommand(library,origin,{tool:'uploadFont',expectedRevision,arguments:prepared});
      if(result.revision!==expectedRevision+1)throw new FontAuditConflictError('Esito della revisione non confermato: verificare il server, nessun retry automatico');
      expectedRevision=result.revision;const saved=await store.readFontLibrary();
      const added=saved.fonts.find(font=>!state.fonts.some(old=>old.id===font.id)&&!font.archived&&font.format===prepared.format&&font.dataBase64===prepared.dataBase64);
      if(saved.revision!==expectedRevision||!added||!result.fonts.some(font=>font.id===added.id))throw new FontAuditConflictError('Font salvato non confermato nell’archivio selezionato: nessun retry automatico');
      row.status='installed';row.reason='Installata da Google con famiglia/peso/stile verificati nel file e licenza conservata.';row.fontId=added.id;
     }catch(cause){if(cause instanceof FontAuditConflictError)throw cause;if(coordinated)throw new FontAuditConflictError((cause instanceof Error?cause.message:'Operazione non verificabile')+'; censimento interrotto senza retry automatico');row.reason=cause instanceof Error?cause.message:'Download/installazione non riusciti';}
    }
   }
   if(row.status==='manual'){if(options.offline)row.reason+=' Analisi offline: disponibilità su Google Fonts non verificata.';const local=pitchCatalog?.items?.find((font:any)=>fontNameKey(font.fontFamily)===fontNameKey(requirement.family)),files=(local?.files??[]).filter((file:any)=>Number(file.weight)===requirement.weight&&(file.style==='italic')===requirement.italic);row.localFiles=files.map((file:any)=>relative(pitchprintLabDirectory(),file.path));}
   rows.push(row);if(row.status==='installed')await runStatus('running');console.log(JSON.stringify({font:requirement.family,variant,status:row.status}));
  }
  const after=await readFontAuditState(library);if(after.snapshot.revision!==expectedRevision)throw new FontAuditConflictError('Archivio modificato al termine del censimento');assertFontAuditPreserved(before,after);
  const manual=rows.filter(row=>row.status==='manual'),report={checkedAt:new Date().toISOString(),backend:library.backend,googleCatalog:options.offline?'not-requested':'live',archiveIdentity:library.identity,initialRevision:before.snapshot.revision,finalRevision:after.snapshot.revision,templates:sources.length,requirements:rows.length,installed:rows.filter(row=>row.status==='installed').length,available:rows.filter(row=>row.status==='available').length,manual:manual.length,googleToInstall:rows.filter(row=>row.status==='google-to-install').length,issues:requirements.issues,rows};
  await writeFile(join(options.outputDirectory,'font-report.json'),JSON.stringify(report,null,2),{mode:0o600});
  const escape=(value:unknown)=>String(value).replaceAll('|','\\|').replaceAll('\n',' '),table=(values:any[])=>['| Font | Peso | Stile | Template | Dettagli |','|---|---:|---|---:|---|',...values.map(row=>`| ${escape(row.family)} | ${row.weight} | ${row.italic?'Corsivo':'Normale'} | ${row.templateIds.length} | ${escape(row.reason)}${row.localFiles?.length?` File presenti nel vecchio laboratorio: ${row.localFiles.map(escape).join(', ')}`:''} |`)].join('\n');
  const markdown=`# Font richiesti dai template PitchPrint\n\nCensimento del ${report.checkedAt}, archivio ${library.backend}, revisione ${report.finalRevision}. ${report.templates} sorgenti esaminati, ${report.requirements} combinazioni famiglia/peso/stile. ${report.installed} installate ora da Google Fonts, ${report.available} già disponibili, ${report.manual} da fornire o verificare manualmente. Nessun fallback o peso/corsivo sintetico autorizzato. I file originali e i template non sono stati modificati. Il censimento include tutte le pagine dei design multipagina.${options.offline?' Analisi offline: disponibilità su Google Fonts non verificata.':''}\n\n## File da installare o verificare manualmente\n\n${manual.length?table(manual):'Nessun file manuale necessario per i sorgenti esaminati.'}\n\nQuando un file esatto è già presente nel vecchio laboratorio, il percorso indicato è relativo a PitchPrint Template Lab. Installarlo dal pannello Font del nuovo editor. Non scegliere una famiglia simile; per varianti mancanti serve il file del peso/stile richiesto o una correzione esplicita del template.\n\n## Google Fonts e varianti disponibili\n\n${table(rows.filter(row=>row.status!=='manual'))}\n\n## Casi da verificare nel sorgente\n\n${requirements.issues.length?requirements.issues.map(issue=>`- ${issue.templateId}: ${issue.reason}`).join('\n'):'Nessuna dichiarazione font incompleta.'}\n`;
  await writeFile(join(options.outputDirectory,'font-da-installare.md'),markdown,{mode:0o600});await runStatus('complete');
  console.log(JSON.stringify({templates:report.templates,requirements:report.requirements,installed:report.installed,manual:report.manual,recordsUnchanged:true,existingFontsUnchanged:true}));return report;
 }catch(error){try{await runStatus('failed',error);}catch{}throw error;}finally{await library.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const{values}=parseArgs({options:{'source-dir':{type:'string',default:'.local/pitchprint-migration/online-sources'},'output-dir':{type:'string',default:'.local/pitchprint-migration/font-audit'},'library-dir':{type:'string'},'sqlite-file':{type:'string'},'install-google':{type:'boolean',default:false},offline:{type:'boolean',default:false},origin:{type:'string',default:'http://127.0.0.1:5173'}}});
 void auditPitchprintFonts({sourceDirectory:resolve(values['source-dir']!),outputDirectory:resolve(values['output-dir']!),...(values['library-dir']!==undefined?{libraryDirectory:values['library-dir']}:{ }),...(values['sqlite-file']!==undefined?{sqliteFile:values['sqlite-file']}:{ }),installGoogle:values['install-google']!,offline:values.offline!,origin:values.origin}).catch(error=>{console.error(error instanceof Error?error.message:'Censimento non riuscito');process.exitCode=1;});
}
