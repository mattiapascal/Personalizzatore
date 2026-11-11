import type {GraphicDocument,SceneGroup} from './model';
import type {GroupProperties} from './object-properties';
import {groupAncestors} from './scene-groups';
import {ObjectPropertiesPanel} from './ObjectPropertiesPanel';
export function GroupPropertiesPanel({document,group,onChange}:{document:GraphicDocument;group:SceneGroup;onChange:(id:string,properties:GroupProperties)=>void}){
 const children=document.groups?.filter(candidate=>groupAncestors(document,candidate).some(parent=>parent.id===group.id))??[];
 const properties=(item:SceneGroup)=><ObjectPropertiesPanel object={{type:'group',editor:item.editor}} revision={document.revision} onChange={value=>onChange(item.id,value)}/>;
 return <section aria-label={`Proprietà gruppo ${group.id}`}><h3>Proprietà del gruppo</h3>{properties(group)}{children.length>0&&<details><summary>Proprietà dei sottogruppi ({children.length})</summary><p className="caption">I blocchi e i riferimenti dei contenitori superiori restano validi anche nei sottogruppi.</p>{children.map(child=><details key={child.id} aria-label={`Proprietà sottogruppo ${child.id}`}><summary>{child.editor?.label||child.id}</summary>{properties(child)}</details>)}</details>}</section>;
}
