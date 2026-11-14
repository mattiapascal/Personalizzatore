import {transformCommitFixture} from './transform-commit';
export function gestureCommitFixture(){const doc=transformCommitFixture();doc.documentId='90909090-9090-4090-8090-909090909090';const caption=doc.objects.find(o=>o.id==='caption');if(caption?.type==='text')caption.text='TEST · Gesti e revisioni';return doc;}
