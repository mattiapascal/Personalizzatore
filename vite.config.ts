import {defineConfig}from'vitest/config';
import{editorLabConfig}from'./scripts/editor-lab-config';
import{activeEditorArchive}from'./scripts/editor-active-archive';
const archive=await activeEditorArchive();
export default defineConfig(editorLabConfig({...(archive.origin==='configured'?{storage:archive.storage}:{}),selection:{root:archive.workspace,token:archive.token}}));
