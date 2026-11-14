import type {AdminSnapshot,AdminCommand} from './schema';
import {pitchprintAssociationPlan,type PitchprintAssociations} from './pitchprint-associations';
/** Reconstruct only missing product links. An existing binding is a deliberate
 * local choice, including a restricted variant set, and is never broadened. */
export function pitchprintRecoveryPlan(state:AdminSnapshot,source:PitchprintAssociations){
 const candidates=pitchprintAssociationPlan(source,state.records),preserved:{templateId:string;productId:string}[]=[],targets:Extract<AdminCommand,{tool:'bulkTemplateAssociationMap'}>['arguments']['targets']=[];
 for(const candidate of candidates){const products=candidate.products.filter(product=>{if(candidate.record.shopProducts?.some(binding=>binding.productId===product.productId)){preserved.push({templateId:candidate.record.id,productId:product.productId});return false;}return true;}).map(({productId,allVariants,variantIds})=>({productId,allVariants,variantIds}));if(products.length)targets.push({id:candidate.record.id,version:candidate.record.version,products});}
 const command:Extract<AdminCommand,{tool:'bulkTemplateAssociationMap'}>|null=targets.length?{tool:'bulkTemplateAssociationMap',expectedRevision:state.revision,arguments:{mode:'add',targets}}:null;
 const linked=new Set(candidates.map(item=>item.record.id));
 return{command,preserved,unmatched:state.records.filter(record=>record.kind==='template'&&!record.archived&&!linked.has(record.id)).map(record=>({id:record.id,title:record.title,hasProvenance:!!record.pitchprintSource})),counts:{candidateTemplates:candidates.length,templatesToUpdate:targets.length,linksToAdd:targets.reduce((sum,target)=>sum+target.products.length,0),productsToRead:new Set(targets.flatMap(target=>target.products.map(product=>product.productId))).size,preservedLinks:preserved.length,unresolvedConfigurations:source.issues.length}};
}
