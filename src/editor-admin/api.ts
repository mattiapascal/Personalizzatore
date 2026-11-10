import type { AdminCommand, AdminSnapshot, ArchiveRecord } from './schema';
export class LocalAdminRequestError extends Error{constructor(message:string,readonly code?:string){super(message);this.name='LocalAdminRequestError';}}
export async function localAdminRequest(path='', command?:AdminCommand, signal?:AbortSignal):Promise<unknown>{const response=await fetch(`/__editor-local/admin/${path}`,{method:command?'POST':'GET',headers:{'X-Editor-Local':'1',...(command?{'Content-Type':'application/json'}:{})},...(command?{body:JSON.stringify(command)}:{}),...(signal?{signal}:{})});const data=await response.json();if(!response.ok)throw new LocalAdminRequestError(data.error??'Archivio locale non disponibile',typeof data.code==='string'?data.code:undefined);return data;}
export const readAdminSnapshot=(signal?:AbortSignal)=>localAdminRequest('',undefined,signal) as Promise<AdminSnapshot>;
export const readArchiveRecord=(id:string)=>localAdminRequest(`record/${id}`) as Promise<ArchiveRecord>;
