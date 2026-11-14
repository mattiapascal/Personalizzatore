import {inspectorCommitFixture} from './inspector-commit';
export function clipboardActionsFixture(){const doc=inspectorCommitFixture();doc.documentId='60606060-6060-4060-8060-606060606060';const caption=doc.objects.find(o=>o.id==='caption');if(caption?.type==='text')caption.text='TEST · Appunti e selezioni';return doc;}
