import {it,expect} from 'vitest';
import {productIntegrationFixture} from './helpers/product-integration';
import {productIntegration} from '../src/editor-admin/product-integration';
import {adminSnapshot} from '../scripts/editor-admin-store';
it('collegamenti prodotto: ID esatti, template attivi e provenienza, nessuna inferenza dal titolo o dalle misure',()=>{
 const f=productIntegrationFixture(),before=structuredClone(f),plan=productIntegration(adminSnapshot(f.state),f.associations,f.detail.id);expect(plan.linked.map(r=>r.title)).toEqual(['Template parziale TEST']);expect(plan.recovered.map(r=>r.record.title)).toEqual(['Template recuperabile TEST','Template parziale TEST']);expect(plan.profiles).toHaveLength(1);expect(plan.profiles[0]!.safeMarginMm).toBeNull();expect(productIntegration(adminSnapshot(f.state),null,f.detail.id).recovered).toEqual([]);expect(productIntegration(adminSnapshot(f.state),f.associations,'gid://shopify/Product/999')).toEqual({linked:[],recovered:[],profiles:[]});expect(f).toEqual(before);
});
it('collegamenti prodotto: profili archiviati e sole associazioni TEST non diventano legami Shopify',()=>{
 const f=productIntegrationFixture();f.state.productionProfiles![0]!.archived=true;delete f.state.records[1]!.shopProducts;f.state.records[1]!.templateProducts={profileKeys:['fixture'],initialMount:'smallest-compatible',adaptation:'confirm-proportional'};const result=productIntegration(adminSnapshot(f.state),f.associations,f.detail.id);expect(result.profiles).toEqual([]);expect(result.linked).toEqual([]);expect(result.recovered).toHaveLength(2);
});
