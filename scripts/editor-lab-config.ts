import{createHash}from'node:crypto';
import {localStrokeOutlinesPlugin} from './local-stroke-outlines';
import {localEditorMediaPlugin} from './local-editor-media';
import {localPitchprintImportPlugin} from './local-pitchprint-import';
import {localPdfExportPlugin} from './local-pdf-export';
import {localConfigurationsPlugin} from './local-configurations';
import {localSvgOutlinesPlugin} from './local-svg-outlines';
import {localEditorAdminPlugin} from './local-editor-admin';
import {localPdfImportPlugin} from './local-pdf-import';
import {localApiPlugin} from '../server/api';
import {localStorageTrialGuard}from'./local-storage-trial';
import type{EditorAdminStorage}from'./editor-admin-runtime';
import react from '@vitejs/plugin-react';
export function editorLabConfig(options:{port?:number;storage?:EditorAdminStorage;trial?:boolean}={}){
 const cacheDir=options.trial||options.storage?'node_modules/.vite-editor-storage-'+createHash('sha256').update(JSON.stringify({storage:options.storage??null,trial:!!options.trial})).digest('hex').slice(0,12):undefined;
 return{...(cacheDir?{cacheDir}:{}),plugins:[...(options.trial?[localStorageTrialGuard()]:[]),localStrokeOutlinesPlugin(),localEditorMediaPlugin(),localPitchprintImportPlugin(),react(),localPdfExportPlugin(),...(options.trial?[]:[localConfigurationsPlugin()]),localEditorAdminPlugin('.local/editor-admin',options.storage),localPdfImportPlugin(),localSvgOutlinesPlugin(),...(options.trial?[]:[localApiPlugin()])],
 server:{watch:{ignored:['**/.local/**']},host:'127.0.0.1',port:options.port??5173,strictPort:true,fs:{deny:['.env','.env.*','*.{crt,pem,key,p12,pfx,cer,der}','.npmrc','.yarnrc.yml','**/.git/**','**/.local/**']}},preview:{host:'127.0.0.1',port:4173,strictPort:true},test:{include:['tests/**/*.test.ts'],environment:'node' as const}};
}
