import {z} from 'zod';
export function pitchprintImportError(cause:unknown):string{
 if(cause instanceof z.ZodError){const labels:Record<string,string>={fontSizePt:'corpo del testo',textScaleX:'dilatazione orizzontale',textScaleY:'dilatazione verticale',letterSpacingPt:'spaziatura',lineHeight:'interlinea',text:'contenuto testo',widthMm:'larghezza',heightMm:'altezza'};return cause.issues.slice(0,3).map(issue=>{if(issue.path.includes('canvas'))return'Il sorgente non contiene un canvas a oggetti riconoscibile.';const index=issue.path.indexOf('objects'),element=index>=0&&typeof issue.path[index+1]==='number'?`Elemento ${Number(issue.path[index+1])+1}: `:'',field=String(issue.path.at(-1)??'formato');return `${element}${labels[field]??field} non compatibile con i limiti attuali del laboratorio.`;}).join(' ');}
 return cause instanceof Error?cause.message:'Conversione non riuscita';
}
