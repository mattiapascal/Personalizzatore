import {createRoot} from 'react-dom/client';
import {EditorLab} from '../../src/editor/EditorLab';
import type {GraphicDocument} from '../../src/editor/model';

/** Mount the real component with a supplied document, without a second editor. */
export function mountEditorStartup(document:GraphicDocument){
 const host=globalThis.document.createElement('div');globalThis.document.body.append(host);
 const root=createRoot(host);root.render(<EditorLab initialDocument={document} portable catalogVersion={document.catalogVersion??'TEST-embedded-startup'} onEditingChange={()=>{}} onKeepProduct={()=>{}}/>);
 return()=>{root.unmount();host.remove();};
}
