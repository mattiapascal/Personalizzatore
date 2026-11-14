import {inspectorCommitFixture} from './inspector-commit';
import {DEFAULT_PLAQUE_MOUNTING} from '../../src/editor/plaque';
import {DocumentSchema} from '../../src/editor/model';
export function plaqueCommitFixture(){
 const doc=inspectorCommitFixture();doc.documentId='98989898-9898-4898-8989-989898989898';
 doc.plaque={...DEFAULT_PLAQUE_MOUNTING,method:'holes',holeDiameterMm:4,clearanceMm:3};
 return DocumentSchema.parse(doc);
}
