import type {AdminSnapshot} from './schema';
import type {PitchprintAssociations} from './pitchprint-associations';
import {pitchprintAssociationPlan} from './pitchprint-associations';
/** Exact IDs and source provenance only: names and canvas sizes are not bindings. */
export function productIntegration(state:AdminSnapshot,snapshot:PitchprintAssociations|null,productId:string){
 const templates=state.records.filter(record=>record.kind==='template'&&!record.archived),linked=templates.filter(record=>record.shopProducts?.some(binding=>binding.productId===productId)),recovered=snapshot?pitchprintAssociationPlan(snapshot,state.records).filter(item=>item.products.some(product=>product.productId===productId)):[];
 const profiles=(state.productionProfiles??[]).filter(profile=>!profile.archived&&profile.shopBinding?.productId===productId);
 return{linked,recovered,profiles};
}
