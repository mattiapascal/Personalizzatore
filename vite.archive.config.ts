import{defineConfig}from'vitest/config';
import{editorLabConfig}from'./scripts/editor-lab-config';
import{selectedEditorArchive}from'./scripts/editor-archive-selection';
export default defineConfig(editorLabConfig({port:5177,storage:await selectedEditorArchive(process.env)}));
