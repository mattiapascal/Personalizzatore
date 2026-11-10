import type { AdminCommand, AdminSnapshot, ArchiveRecord } from './schema';
export async function localAdminRequest(path='', command?:AdminCommand):Promise<unknown>{const response=await fetch(`/__editor-local/admin/${path}`,{method:command?'POST':'GET',headers:{'X-Editor-Local':'1',...(command?{'Content-Type':'application/json'}:{})},...(command?{body:JSON.stringify(command)}:{})});const data=await response.json();if(!response.ok)throw new Error(data.error??'Archivio locale non disponibile');return data;}
export const readAdminSnapshot=()=>localAdminRequest() as Promise<AdminSnapshot>;
export const readArchiveRecord=(id:string)=>localAdminRequest(`record/${id}`) as Promise<ArchiveRecord>;
