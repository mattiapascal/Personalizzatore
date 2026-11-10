import {localAdminRequest,LocalAdminRequestError,readAdminSnapshot} from './api';
import {ADMIN_REVISION_CONFLICT} from './errors';
import type {AdminCommand,AdminSnapshot} from './schema';
export type FontActionCommand=Extract<AdminCommand,{tool:'deleteFont'|'archiveFont'}>;
type Access={read:()=>Promise<AdminSnapshot>;dispatch:(command:FontActionCommand)=>Promise<AdminSnapshot>};
const local:Access={read:readAdminSnapshot,dispatch:command=>localAdminRequest('',command) as Promise<AdminSnapshot>};
/** Rebase only a confirmed action on one immutable font, never a general edit. */
export async function executeFontAction(baseline:AdminSnapshot,command:FontActionCommand,access:Access=local):Promise<AdminSnapshot>{
 const original=baseline.fonts.find(font=>font.id===command.arguments.id);
 if(!original)throw new Error('Il font non è più nella lista: aggiorna la libreria.');
 for(let attempt=0;attempt<2;attempt++){
  const fresh=await access.read(),font=fresh.fonts.find(font=>font.id===original.id);
  if(!font){if(command.tool==='deleteFont')return fresh;throw new Error('Il font è già stato eliminato dalla libreria.');}
  if(font.format!==original.format||font.createdAt!==original.createdAt||(original.fileHash&&font.fileHash&&original.fileHash!==font.fileHash))throw new Error('Il file del font è cambiato: controlla la voce aggiornata e ripeti la scelta. Nessun file modificato.');
  if(command.tool==='archiveFont'&&font.archived===command.arguments.archived)return fresh;
  try{return await access.dispatch({...command,expectedRevision:fresh.revision});}
  catch(error){if(attempt===0&&error instanceof LocalAdminRequestError&&error.code===ADMIN_REVISION_CONFLICT)continue;throw error;}
 }
 throw new Error('L’archivio continua a cambiare: riprova tra un momento.');
}
