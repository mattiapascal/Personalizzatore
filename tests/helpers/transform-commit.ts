import {inspectorCommitFixture} from './inspector-commit';
export function transformCommitFixture(){const doc=inspectorCommitFixture();doc.documentId='80808080-8080-4080-8080-808080808080';const caption=doc.objects.find(o=>o.id==='caption');if(caption?.type==='text')caption.text='TEST · Trasformazioni e ispettore';return doc;}
