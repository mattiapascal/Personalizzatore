import{parseArgs}from'node:util';
import{activeEditorArchive,prepareArchiveSelection,writeArchiveSelectionProposal,readArchiveSelectionProposal,applyArchiveSelection,recoverArchiveSelection}from'./editor-active-archive';
import{selectedEditorArchive}from'./editor-archive-selection';
const{values,positionals}=parseArgs({allowPositionals:true,options:{backend:{type:'string'},path:{type:'string'},output:{type:'string'},plan:{type:'string'},port:{type:'string'}}}),[operation]=positionals;
if(positionals.length!==1)throw Error('Specificare inspect, prepare, apply oppure recover');
const keys=Object.keys(values),only=(allowed:string[])=>keys.every(key=>allowed.includes(key));
if(operation==='inspect'&&only([])){const choice=await activeEditorArchive();console.log(JSON.stringify({origin:choice.origin,storage:choice.storage,selectionToken:choice.token}));}
else if(operation==='prepare'&&only(['backend','path','output'])&&values.backend&&values.path&&values.output){const target=await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:values.backend,EDITOR_ARCHIVE_PATH:values.path}),proposal=await prepareArchiveSelection(target),output=await writeArchiveSelectionProposal(proposal,values.output);console.log(JSON.stringify({operation,output,backend:proposal.target.backend,revision:proposal.target.revision,records:proposal.target.records,fonts:proposal.target.fonts,selectionChanged:false}));}
else if(operation==='apply'&&only(['plan','port'])&&values.plan){console.log(JSON.stringify(await applyArchiveSelection(await readArchiveSelectionProposal(values.plan),{port:values.port===undefined?5173:Number(values.port)})));}
else if(operation==='recover'&&only(['port']))console.log(JSON.stringify(await recoverArchiveSelection({port:values.port===undefined?5173:Number(values.port)})));
else throw Error('Argomenti non validi: prepare --backend json|sqlite --path ARCHIVIO --output PROPOSTA; apply --plan PROPOSTA; inspect; recover. Apply/recover richiedono il server fermo.');
