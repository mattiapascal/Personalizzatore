import type {Page} from '@playwright/test';
import{randomUUID}from'node:crypto';
import{adminSnapshot}from'../../scripts/editor-admin-store';
import type{AdminState,ArchiveRecord}from'../../src/editor-admin/schema';
export async function navigationArchive(page:Page,seed:AdminState){
 const source=seed.records[0]!,records:ArchiveRecord[]=Array.from({length:55},(_,i)=>({...source,id:randomUUID(),title:`TEST scheda ${String(i+1).padStart(3,'0')}`,tags:['Navigazione'],version:1})),state={...seed,records},writes:string[]=[];
 await page.route('**/__editor-local/admin/**',async route=>{const path=new URL(route.request().url()).pathname.replace('/__editor-local/admin/','');if(path==='font-coverage')return route.fallback();if(route.request().method()!=='GET'){writes.push(path);return route.fulfill({status:422,json:{error:'Archivio TEST in sola lettura'}});}return route.fulfill({json:path.startsWith('record/')?records.find(record=>record.id===path.slice(7)):adminSnapshot(state)});});
 return{records,writes};
}
