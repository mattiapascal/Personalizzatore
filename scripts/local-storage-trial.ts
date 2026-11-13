import type{Plugin}from'vite';
/** Trial requests cannot change the shared media, chat or configuration archives. */
export function localStorageTrialGuard():Plugin{return{name:'editor-storage-trial-boundary',apply:'serve',configureServer(server){server.middlewares.use((req,res,next)=>{
 const path=new URL(req.url??'/','http://localhost').pathname,method=req.method??'GET';
 if(path==='/'&&method==='GET'){res.statusCode=302;res.setHeader('Location','/editor/admin?section=template');res.end();return;}
 const analysis=['/__editor-local/admin/font-support','/__editor-local/admin/font-coverage','/__editor-local/admin/font-inspect','/__editor-local/admin/font-library/preview','/__editor-local/pitchprint/asset','/__editor-local/stroke-outlines','/__editor-local/svg-outlines','/__editor-local/export-pdf','/__editor-local/check-geometry','/__editor-local/pdf'];
 const adminWrite=path==='/__editor-local/admin/'||path==='/__editor-local/admin'||['/__editor-local/admin/google/import','/__editor-local/admin/font-library/restore'].includes(path);
 const blocked=path.startsWith('/api/')||path.startsWith('/__editor-local/configurations')||!['GET','HEAD'].includes(method)&&!analysis.includes(path)&&!adminWrite;
 if(!blocked){next();return;}res.statusCode=403;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:'Ambiente di prova dell’archivio: questa operazione non è disponibile.'}));
 });}};}
