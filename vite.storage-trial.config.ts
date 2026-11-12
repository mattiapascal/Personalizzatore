import{defineConfig}from'vitest/config';import{editorLabConfig}from'./scripts/editor-lab-config';
const file=process.env.EDITOR_STORAGE_TRIAL_SQLITE,write=process.env.EDITOR_STORAGE_TRIAL_WRITABLE??'0';
if(!file)throw Error('Specificare EDITOR_STORAGE_TRIAL_SQLITE con una copia preparata dell’archivio');
if(!['0','1'].includes(write))throw Error('EDITOR_STORAGE_TRIAL_WRITABLE deve essere 0 oppure 1');
export default defineConfig(editorLabConfig({port:5175,trial:true,storage:{kind:'sqlite-copy',file,readOnly:write!=='1'}}));
