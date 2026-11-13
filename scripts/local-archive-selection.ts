import type{Plugin}from'vite';
import{activeEditorArchive}from'./editor-active-archive';
/** A process started with an old choice must never save to that old backend. */
export function localArchiveSelectionGuard(selection:{root:string;token:string|null}):Plugin{
 return{name:'editor-archive-selection-boundary',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  let path:string;try{path=new URL(req.url??'/','http://localhost').pathname;}catch{res.statusCode=400;res.end('Percorso non valido');return;}if(!path.startsWith('/__editor-local/')&&!path.startsWith('/api/')){next();return;}
  try{const current=await activeEditorArchive(selection.root);if(current.token===selection.token){next();return;}}catch{/* Incomplete control data must not authorize the old runtime. */}
  res.statusCode=409;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({code:'archive_selection_changed',error:'La scelta dell’archivio è cambiata o richiede un controllo. Riavvia il laboratorio prima di salvare.'}));
 });}};
}
