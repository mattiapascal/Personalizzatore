import {textPathPropertiesFixture} from './text-path-properties';
import {DocumentSchema} from '../../src/editor/model';
export function textPathCommitFixture(){
 const doc=textPathPropertiesFixture('line');doc.documentId='97979797-9797-4979-8979-979797979797';
 return DocumentSchema.parse(doc);
}
