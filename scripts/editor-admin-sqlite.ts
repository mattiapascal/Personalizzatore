import {DatabaseSync} from 'node:sqlite';
import {open,mkdir,unlink} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {AdminStateSchema,ArchiveRecordSchema,AdminFontSchema,type AdminState,type AdminSnapshot,type ArchiveRecord} from '../src/editor-admin/schema';
import {AdminRevisionConflictError} from '../src/editor-admin/errors';
import {adminSnapshot} from './editor-admin-store';
import {MAX_LOCAL_ARCHIVE_BYTES,internArchiveResourceStrings,cloneArchiveValue} from './editor-admin-read-cache';
import {validateDocumentPngCopies} from './png-copy-validation';
import type {EditorAdminPersistence,AdminPersistenceSnapshot} from './editor-admin-persistence';
import {resourceHash,encodeArchiveRecord,decodeArchiveRecord,encodeArchiveFont,decodeArchiveFont} from './editor-admin-resource-codec';
const APPLICATION_ID=0x49534544;
interface Counters {resourcesRead:number;recordsDecoded:number;fontsDecoded:number;resourcesWritten:number;recordsWritten:number;fontsWritten:number;}
const zero=():Counters=>({resourcesRead:0,recordsDecoded:0,fontsDecoded:0,resourcesWritten:0,recordsWritten:0,fontsWritten:0});
const schema=`
 CREATE TABLE archive(singleton INTEGER PRIMARY KEY CHECK(singleton=1),epoch TEXT NOT NULL,revision INTEGER NOT NULL,root TEXT NOT NULL,root_checksum TEXT NOT NULL,records_count INTEGER NOT NULL,fonts_count INTEGER NOT NULL,max_bytes INTEGER NOT NULL);
 CREATE TABLE resources(hash TEXT PRIMARY KEY CHECK(length(hash)=64),data TEXT NOT NULL) STRICT;
 CREATE TABLE records(id TEXT PRIMARY KEY,position INTEGER NOT NULL,payload TEXT NOT NULL,checksum TEXT NOT NULL,summary TEXT NOT NULL,summary_checksum TEXT NOT NULL) STRICT;
 CREATE TABLE fonts(id TEXT PRIMARY KEY,position INTEGER NOT NULL,payload TEXT NOT NULL,checksum TEXT NOT NULL,summary TEXT NOT NULL,summary_checksum TEXT NOT NULL) STRICT;
 CREATE TABLE record_resources(owner TEXT REFERENCES records(id) ON DELETE CASCADE,hash TEXT REFERENCES resources(hash),PRIMARY KEY(owner,hash)) STRICT;
 CREATE TABLE font_resources(owner TEXT REFERENCES fonts(id) ON DELETE CASCADE,hash TEXT REFERENCES resources(hash),PRIMARY KEY(owner,hash)) STRICT;
 CREATE INDEX record_resources_hash ON record_resources(hash);
 CREATE INDEX font_resources_hash ON font_resources(hash);
`;
/** Explicit backend. No discovery or automatic conversion of state.json. */
export class EditorAdminSqlite implements EditorAdminPersistence {
 private entry:AdminPersistenceSnapshot|null=null;
 private counters=zero();
 private constructor(private readonly db:DatabaseSync,readonly path:string,private readonly readOnly:boolean){
  db.exec('PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF;');
  const application=db.prepare('PRAGMA application_id').get(),version=db.prepare('PRAGMA user_version').get();
  if(application?.application_id!==APPLICATION_ID||version?.user_version!==1)throw Error('Formato SQLite del configuratore non supportato');
  const capacity=db.prepare('SELECT max_bytes FROM archive WHERE singleton=1').get()?.max_bytes;if(typeof capacity!=='number'||!Number.isSafeInteger(capacity)||capacity<65536||capacity>MAX_LOCAL_ARCHIVE_BYTES)throw Error('Capacità SQLite non valida');if(!readOnly){const size=Number(db.prepare('PRAGMA page_size').get()!.page_size);db.exec(`PRAGMA max_page_count=${Math.floor(capacity/size)}`);}
 }
 static async create(path:string,state:AdminState,maxBytes=MAX_LOCAL_ARCHIVE_BYTES){
  if(!Number.isSafeInteger(maxBytes)||maxBytes<65536||maxBytes>MAX_LOCAL_ARCHIVE_BYTES)throw Error('Capacità SQLite non valida');
  const parsed=AdminStateSchema.parse(state);internArchiveResourceStrings(parsed);await validateDocumentPngCopies(parsed.records.map(r=>r.document));
  await mkdir(dirname(path),{recursive:true});const file=await open(path,'wx',0o600);await file.close();let db:DatabaseSync|undefined;
  try{
   db=new DatabaseSync(path,{enableForeignKeyConstraints:true,allowExtension:false,timeout:1000});db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=1; PRAGMA synchronous=FULL; PRAGMA journal_mode=DELETE;`);
   const pageSize=Number(db.prepare('PRAGMA page_size').get()!.page_size);db.exec(`PRAGMA max_page_count=${Math.floor(maxBytes/pageSize)}`);
   db.exec('BEGIN IMMEDIATE');db.exec(schema);const{records:_r,fonts:_f,...root}=parsed;const metadata=JSON.stringify(root);db.prepare('INSERT INTO archive VALUES(1,?,?,?,?,?,?,?)').run(randomUUID(),parsed.revision,metadata,resourceHash(metadata),parsed.records.length,parsed.fonts.length,maxBytes);db.exec('COMMIT');
   const store=new EditorAdminSqlite(db,path,false);store.transaction(()=>store.writeRows(undefined,parsed));return store;
  }catch(error){try{db?.close();}catch{}await unlink(path).catch(()=>{});throw error;}
 }
 static open(path:string,readOnly=false){const db=new DatabaseSync(path,{readOnly,enableForeignKeyConstraints:true,allowExtension:false,timeout:1000});try{const store=new EditorAdminSqlite(db,path,readOnly);store.header();return store;}catch(error){db.close();throw error;}}
 close(){this.entry=null;this.db.close();}
 diagnostics(){return{...this.counters};}
 resetDiagnostics(){this.counters=zero();}
 snapshotVersion(){return this.key();}
 private transaction<T>(work:()=>T,write=true):T{
  if(write&&this.readOnly)throw Error('Archivio SQLite aperto in sola lettura');this.db.exec(write?'BEGIN IMMEDIATE':'BEGIN');
  try{const result=work();this.db.exec('COMMIT');return result;}catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 private header(){const row=this.db.prepare('SELECT epoch,revision,root,root_checksum,records_count,fonts_count FROM archive WHERE singleton=1').get();if(!row||typeof row.epoch!=='string'||typeof row.revision!=='number'||typeof row.root!=='string')throw Error('Indice SQLite incompleto');if(resourceHash(row.root)!==row.root_checksum)throw Error('Metadati SQLite non integri');const counts=this.db.prepare('SELECT (SELECT COUNT(*) FROM records) AS records_count,(SELECT COUNT(*) FROM fonts) AS fonts_count').get()!;if(counts.records_count!==row.records_count||counts.fonts_count!==row.fonts_count)throw Error('Archivio SQLite incompleto');const root=AdminStateSchema.parse({...JSON.parse(row.root),records:[],fonts:[]});if(root.revision!==row.revision)throw Error('Revisione SQLite incoerente');const{records:_r,fonts:_f,...metadata}=root;return{root:metadata,epoch:row.epoch,revision:row.revision};}
 private key(){const head=this.header(),version=this.db.prepare('PRAGMA data_version').get()!.data_version;return`${head.epoch}:${head.revision}:${version}`;}
 private resourceReader(){const values=new Map<string,string>();return(hash:string)=>{let value=values.get(hash);if(value!==undefined)return value;const row=this.db.prepare('SELECT data FROM resources WHERE hash=?').get(hash);this.counters.resourcesRead++;if(typeof row?.data!=='string'||resourceHash(row.data)!==hash)throw Error('Risorsa archivio mancante o non integra: nessun fallback');value=row.data;values.set(hash,value);return value;};}
 private checked(row:Record<string,unknown>,field:'payload'|'summary'){
  const value=row[field],hash=row[field==='payload'?'checksum':'summary_checksum'];if(typeof value!=='string'||typeof hash!=='string'||resourceHash(value)!==hash)throw Error('Record SQLite non integro');return value;
 }
 async get():Promise<AdminPersistenceSnapshot>{
  const key=this.key();if(this.entry?.key===key)return this.entry;
  for(let attempt=0;attempt<3;attempt++){
   const snapshot=this.transaction(()=>{const header=this.header(),load=this.resourceReader(),records=this.db.prepare('SELECT * FROM records ORDER BY position').all().map(row=>{this.counters.recordsDecoded++;return ArchiveRecordSchema.parse(decodeArchiveRecord(this.checked(row,'payload'),load));}),fonts=this.db.prepare('SELECT * FROM fonts ORDER BY position').all().map(row=>{this.counters.fontsDecoded++;return AdminFontSchema.parse(decodeArchiveFont(this.checked(row,'payload'),load));}),state=AdminStateSchema.parse({...header.root,records,fonts});internArchiveResourceStrings(state);return{state,key:this.key()};},false);
   await validateDocumentPngCopies(snapshot.state.records.map(r=>r.document));if(this.key()===snapshot.key){this.entry=snapshot;return snapshot;}
  }
  throw new AdminRevisionConflictError();
 }
 async readRecord(id:string):Promise<ArchiveRecord|undefined>{const record=this.transaction(()=>{this.header();const row=this.db.prepare('SELECT * FROM records WHERE id=?').get(id);if(!row)return;this.counters.recordsDecoded++;const record=ArchiveRecordSchema.parse(decodeArchiveRecord(this.checked(row,'payload'),this.resourceReader()));if(record.id!==id)throw Error('Identità record incoerente');return record;},false);if(record)await validateDocumentPngCopies([record.document]);return record;}
 async readFont(id:string){const font=this.transaction(()=>{this.header();const row=this.db.prepare('SELECT * FROM fonts WHERE id=?').get(id);if(!row)return;this.counters.fontsDecoded++;const font=AdminFontSchema.parse(decodeArchiveFont(this.checked(row,'payload'),this.resourceReader()));if(font.id!==id)throw Error('Identità font incoerente');return font;},false);return font?{format:font.format,dataBase64:font.dataBase64}:undefined;}
 async readFonts(){return(await this.readFontLibrary()).fonts;}
 async readFontLibrary(){return this.transaction(()=>{const{revision}=this.header(),load=this.resourceReader(),fonts=this.db.prepare('SELECT * FROM fonts ORDER BY position').all().map(row=>{this.counters.fontsDecoded++;return AdminFontSchema.parse(decodeArchiveFont(this.checked(row,'payload'),load));});return{revision,fonts};},false);}
 async readSnapshot():Promise<AdminSnapshot>{return this.transaction(()=>({...this.header().root,records:this.db.prepare('SELECT summary,summary_checksum FROM records ORDER BY position').all().map(row=>JSON.parse(this.checked(row,'summary'))),fonts:this.db.prepare('SELECT summary,summary_checksum FROM fonts ORDER BY position').all().map(row=>JSON.parse(this.checked(row,'summary')))}),false);}
 async commit(before:AdminPersistenceSnapshot,state:AdminState){
  AdminStateSchema.parse(state);
  this.transaction(()=>{if(this.key()!==before.key||state.revision!==before.state.revision+1)throw new AdminRevisionConflictError();this.writeRows(before.state,state);const{records:_r,fonts:_f,...root}=state;const metadata=JSON.stringify(root);this.db.prepare('UPDATE archive SET revision=?,root=?,root_checksum=?,records_count=?,fonts_count=? WHERE singleton=1').run(state.revision,metadata,resourceHash(metadata),state.records.length,state.fonts.length);});this.entry={state,key:this.key()};
 }
 private writeRows(before:AdminState|undefined,state:AdminState){
  const seen=new Map<string,string>(),save=(value:string)=>{let hash=seen.get(value);if(hash)return hash;hash=resourceHash(value);const existing=this.db.prepare('SELECT data FROM resources WHERE hash=?').get(hash);if(existing){if(existing.data!==value)throw Error('Hash risorsa incoerente');}else{this.db.prepare('INSERT INTO resources VALUES(?,?)').run(hash,value);this.counters.resourcesWritten++;}seen.set(value,hash);return hash;};
  const write=(table:'records'|'fonts',link:'record_resources'|'font_resources',items:AdminState['records']|AdminState['fonts'],previous:typeof items)=>{
   const old=new Map(previous.map(item=>[item.id,item]));
   for(const[position,item]of items.entries()){
    if(old.get(item.id)===item){this.db.prepare(`UPDATE ${table} SET position=? WHERE id=? AND position<>?`).run(position,item.id,position);old.delete(item.id);continue;}
    const hashes=new Set<string>(),remember=(value:string)=>{const hash=save(value);hashes.add(hash);return hash;};
    const payload=table==='records'?encodeArchiveRecord(item as ArchiveRecord,remember):encodeArchiveFont(item as AdminState['fonts'][number],remember),summary=JSON.stringify(table==='records'?adminSnapshot({...state,records:[item as ArchiveRecord],fonts:[]}).records[0]:adminSnapshot({...state,records:[],fonts:[item as AdminState['fonts'][number]]}).fonts[0]);
    this.db.prepare(`INSERT INTO ${table} VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET position=excluded.position,payload=excluded.payload,checksum=excluded.checksum,summary=excluded.summary,summary_checksum=excluded.summary_checksum`).run(item.id,position,payload,resourceHash(payload),summary,resourceHash(summary));
    this.db.prepare(`DELETE FROM ${link} WHERE owner=?`).run(item.id);for(const hash of hashes)this.db.prepare(`INSERT INTO ${link} VALUES(?,?)`).run(item.id,hash);
    this.counters[table==='records'?'recordsWritten':'fontsWritten']++;old.delete(item.id);
   }
   for(const id of old.keys())this.db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
  };
  write('records','record_resources',state.records,before?.records??[]);write('fonts','font_resources',state.fonts,before?.fonts??[]);
  this.db.exec('DELETE FROM resources WHERE NOT EXISTS(SELECT 1 FROM record_resources WHERE hash=resources.hash) AND NOT EXISTS(SELECT 1 FROM font_resources WHERE hash=resources.hash)');
 }
 async exportState():Promise<AdminState>{return cloneArchiveValue((await this.get()).state);}
 resourceCounts(){return this.transaction(()=>({resources:Number(this.db.prepare('SELECT COUNT(*) AS n FROM resources').get()!.n),records:Number(this.db.prepare('SELECT COUNT(*) AS n FROM records').get()!.n),fonts:Number(this.db.prepare('SELECT COUNT(*) AS n FROM fonts').get()!.n),resourceBytes:Number(this.db.prepare('SELECT COALESCE(SUM(length(CAST(data AS BLOB))),0) AS n FROM resources').get()!.n)}),false);}
 verifyDatabase(){
  const result=this.db.prepare('PRAGMA integrity_check').all();if(result.length!==1||result[0]!.integrity_check!=='ok'||this.db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Database SQLite non integro');
  for(const row of this.db.prepare('SELECT hash,data FROM resources').iterate())if(typeof row.data!=='string'||resourceHash(row.data)!==row.hash)throw Error('Risorsa SQLite non integra');
  for(const[table,links]of[['records','record_resources'],['fonts','font_resources']]as const){
   let index=0;for(const row of this.db.prepare(`SELECT id,position,payload,checksum FROM ${table} ORDER BY position`).iterate()){
    if(row.position!==index++)throw Error('Ordine delle righe SQLite non integro');
    const expected=new Set<string>(),collect=(hash:string)=>{expected.add(hash);return '';},payload=this.checked(row,'payload');
    if(table==='records')decodeArchiveRecord(payload,collect);else decodeArchiveFont(payload,collect);
    const actual=this.db.prepare(`SELECT hash FROM ${links} WHERE owner=?`).all(row.id as string).map(link=>link.hash);
    if(actual.length!==expected.size||actual.some(hash=>typeof hash!=='string'||!expected.has(hash)))throw Error('Riferimenti delle risorse SQLite non integri');
   }
  }
  if(this.db.prepare('SELECT hash FROM resources WHERE NOT EXISTS(SELECT 1 FROM record_resources WHERE hash=resources.hash) AND NOT EXISTS(SELECT 1 FROM font_resources WHERE hash=resources.hash) LIMIT 1').get())throw Error('Risorsa SQLite non referenziata');
 }
}
