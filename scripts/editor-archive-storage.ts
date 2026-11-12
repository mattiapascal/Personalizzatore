import{prepareArchiveCopy,verifyArchiveFiles,exportArchiveCopy}from'./editor-archive-copy';
const[operation,...args]=process.argv.slice(2),options=new Map<string,string>();
for(let index=0;index<args.length;index+=2){const key=args[index],value=args[index+1];if(!['--source','--output','--copy'].includes(key??'')||!value||options.has(key!))throw Error('Uso: prepare --source JSON --output DB | verify --source JSON --copy DB | export --source DB --output JSON');options.set(key!,value);}
const source=options.get('--source');if(!source)throw Error('Specificare --source; nessun archivio viene scelto automaticamente');
const start=performance.now();let result;
if(operation==='prepare'&&options.size===2&&options.has('--output'))result=await prepareArchiveCopy(source,options.get('--output')!);
else if(operation==='verify'&&options.size===2&&options.has('--copy'))result=await verifyArchiveFiles(source,options.get('--copy')!);
else if(operation==='export'&&options.size===2&&options.has('--output'))result=await exportArchiveCopy(source,options.get('--output')!);
else throw Error('Operazione di prova non valida: nessuna attivazione automatica prevista');
console.log(JSON.stringify({operation,...result,elapsedMs:Math.round(performance.now()-start),maxRssKiB:process.resourceUsage().maxRSS}));
