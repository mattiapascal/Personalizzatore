import {readFileSync} from 'node:fs';
import type {Plugin} from 'vite';
/** Vendored source is outside node_modules, so dependency license collectors
 * cannot discover it. Ship its complete notice whenever its code is bundled. */
export function vendorLicenses():Plugin{return{name:'editor-vendor-licenses',apply:'build',generateBundle(_options,bundle){
 if(!Object.values(bundle).some(item=>item.type==='chunk'&&Object.keys(item.modules).some(id=>id.replaceAll('\\','/').endsWith('/src/vendor/qrcodegen.ts'))))return;
 const source=readFileSync(new URL('../src/vendor/qrcodegen.ts',import.meta.url),'utf8'),notice=source.match(/\/\*![\s\S]*?\*\//)?.[0];if(!notice?.includes('Copyright (c) Project Nayuki. (MIT License)'))throw Error('Missing QR encoder license');
 this.emitFile({type:'asset',fileName:'third-party/qrcodegen.LICENSE.txt',source:notice+'\n'});
}};}
