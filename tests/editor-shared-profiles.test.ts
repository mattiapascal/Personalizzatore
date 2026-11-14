import {it,expect,vi} from 'vitest';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {sharedProfilesFixture} from './helpers/shared-profiles';import {variantAreasFixture} from './helpers/variant-areas';
import {ProductionProfileSchema,profileShopBindings,validateProductionProfile,missingProductionData} from '../src/editor/production-profile';
import {shopSelectionFor,profileShopVariants} from '../src/editor/shop-selection';
import {shopProductDocument} from '../src/editor/shop-product-document';
import {DocumentSchema,DocumentStore,cloneGraphicDocument} from '../src/editor/model';
import {profileForPage} from '../src/editor/production-profile-link';
import {productIntegration} from '../src/editor-admin/product-integration';
import {EditorAdminStore,adminSnapshot} from '../scripts/editor-admin-store';import {EditorAdminSqlite} from '../scripts/editor-admin-sqlite';
import {verifyProfileShopBindings} from '../scripts/editor-profile-bindings';
const measure=()=>({widthMm:5,heightMm:5});
it('un solo profilo su due prodotti: aree per ID globale, scelta e versione portabili, snapshot e cloni indipendenti',()=>{
 const f=sharedProfilesFixture(),before=structuredClone(f.profile);expect(()=>validateProductionProfile(f.profile)).not.toThrow();expect(missingProductionData(f.profile)).toEqual([]);
 for(const [detail,width,height]of[[f.detail,200,100],[f.second,300,150]]as const){const doc=shopProductDocument(detail,f.profile,detail.variants[0]!.id,{width,height},measure).document;expect(doc.areaMm).toEqual({width,height});expect(doc.shopSelection!.productId).toBe(detail.id);expect(doc.productionProfile).toEqual(before);expect(profileForPage(doc.productionProfile!,doc).usableArea!.widthMm).toBe(width);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(doc)))).toEqual(doc);const copy=cloneGraphicDocument(doc);copy.productionProfile!.shopBindings![1]!.variantIds!.pop();expect(doc.productionProfile).toEqual(before);expect(productIntegration(adminSnapshot(f.state),null,detail.id).profiles.map(item=>item.id)).toEqual([f.profile.id]);}
 expect(f.profile).toEqual(before);
});
it('stesso comando manuale/AI per il secondo prodotto, Undo e revisioni; scelta incrociata di una variante respinta',()=>{
 const f=sharedProfilesFixture();f.profile.sizeMode='document';const result=shopProductDocument(f.second,f.profile,f.second.variants[0]!.id,{width:300,height:150},measure),source=cloneGraphicDocument(result.document);delete source.shopSelection;source.revision=0;
 const manual=new DocumentStore(source,measure,result.context),ai=new DocumentStore(source,measure,result.context),command={schemaVersion:1,tool:'setShopSelection',objectId:'project',expectedRevision:0,arguments:{selection:result.document.shopSelection}};manual.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');expect(manual.document).toEqual(ai.document);manual.undo();expect(manual.document.shopSelection).toBeUndefined();manual.redo();expect(manual.document.shopSelection!.productId).toBe(f.second.id);const before=structuredClone(manual.document);expect(()=>manual.dispatch(command,'ai-simulation')).toThrow('obsoleta');expect(manual.document).toEqual(before);expect(DocumentSchema.safeParse({...before,shopSelection:{...before.shopSelection!,variantId:f.detail.variants[0]!.id}}).success).toBe(false);
});
it('contratti storici invariati; associazioni ambigue, duplicate e aree senza legami non sono ammesse',()=>{
 const old=variantAreasFixture().profile;expect(ProductionProfileSchema.parse(JSON.parse(JSON.stringify(old)))).toEqual(old);expect(profileShopBindings(old)).toEqual([old.shopBinding]);
 const f=sharedProfilesFixture();for(const profile of[{...f.profile,shopBinding:old.shopBinding},{...f.profile,shopBindings:[f.profile.shopBindings![0]!,f.profile.shopBindings![0]!]},{...f.profile,binding:{profileKey:'TEST',catalogVersion:'TEST'}},{...f.profile,shopBindings:[{...f.profile.shopBindings![0]!,allVariants:false}],variantAreas:f.profile.variantAreas}])expect(()=>validateProductionProfile(profile)).toThrow();
 const bad={...f.profile,shopBindings:[{...f.profile.shopBindings![0]!,variantIds:[f.detail.variants[1]!.id]}]};expect(()=>validateProductionProfile(bad)).toThrow('primaria');
 expect(ProductionProfileSchema.safeParse({...f.profile,shopBindings:[]}).success).toBe(false);const incomplete=structuredClone(f.profile);incomplete.variantAreas!.pop();expect(missingProductionData(incomplete)).toContain('misure delle varianti associate');
});
it('nuove varianti Shopify richiedono una nuova versione tecnica, anche con tutte le varianti selezionate',async()=>{
 const f=sharedProfilesFixture(),extra={...f.second.variants[0]!,id:'gid://shopify/ProductVariant/23'},latest={...f.second,variants:[...f.second.variants,extra]};
 expect(profileShopVariants(f.profile,latest).map(item=>item.id)).not.toContain(extra.id);expect(()=>shopSelectionFor(f.profile,latest,extra.id)).toThrow('Variante');
 const refreshed=await verifyProfileShopBindings(f.profile,async id=>id===f.detail.id?f.detail:latest);expect(refreshed.shopBindings![1]!.variantIds).toContain(extra.id);expect(f.profile.shopBindings![1]!.variantIds).not.toContain(extra.id);
});
it('timbri: una variante primaria distinta per prodotto, il riordino Shopify non cambia il colore del corpo',async()=>{
 const f=sharedProfilesFixture();f.profile.kind='stamp-ink';f.profile.rasterMode='binary';f.profile.minFontSizePt=7;
 for(const detail of[f.detail,f.second]){const binding=f.profile.shopBindings!.find(item=>item.productId===detail.id)!;binding.variantId=detail.variants[1]!.id;expect(profileShopVariants(f.profile,detail).map(item=>item.id)).toEqual([binding.variantId]);expect(()=>shopSelectionFor(f.profile,detail,detail.variants[0]!.id)).toThrow('Variante');}
 const verified=await verifyProfileShopBindings(f.profile,async id=>id===f.detail.id?f.detail:f.second);expect(verified.shopBindings!.map(item=>item.variantId)).toEqual([f.detail.variants[1]!.id,f.second.variants[1]!.id]);expect(verified.shopBindings![1]!.variantTitle).toBe(f.second.variants[1]!.title);
});
for(const backend of['json','sqlite']as const)it(`backend ${backend}: verifica tutti i prodotti, salvataggio atomico, storico e rimozione dell'elenco senza residui`,async()=>{
 const f=sharedProfilesFixture(),directory=await mkdtemp(join(tmpdir(),'shared-profiles-'));let db:EditorAdminSqlite|undefined;
 try{const initial=variantAreasFixture().state;if(backend==='sqlite')db=await EditorAdminSqlite.create(join(directory,'archive.sqlite'),initial);else await writeFile(join(directory,'state.json'),JSON.stringify(initial));const resolve=vi.fn(async(id:string)=>{if(id===f.detail.id)return f.detail;if(id===f.second.id)return f.second;throw Error('Prodotto TEST non presente');}),store=new EditorAdminStore(directory,resolve,undefined,db);
 const saved=await store.dispatch({tool:'saveProductionProfile',expectedRevision:4,arguments:{id:f.profile.id,profile:f.profile}}).catch(()=>undefined);
 // Full profile metadata cannot enter a data command.
 expect(saved).toBeUndefined();expect((await store.read()).revision).toBe(4);
 const {id,version:_v,archived:_a,createdAt:_c,updatedAt:_u,validatedForProduction:_p,...data}=f.profile;
 const next=await store.dispatch({tool:'saveProductionProfile',expectedRevision:4,arguments:{id,profile:data}});expect(resolve.mock.calls.map(args=>args[0]).sort()).toEqual([f.detail.id,f.second.id]);expect(next.productionProfiles![0]!.version).toBe(2);expect(next.productionProfiles![0]!.shopBindings).toHaveLength(2);expect(next.productionProfiles![0]!.shopBinding).toBeNull();expect(next.productionProfileHistory![0]).toEqual(initial.productionProfiles![0]);
 const doc=shopProductDocument(f.second,next.productionProfiles![0]!,f.second.variants[0]!.id,{width:300,height:150},measure).document;await store.dispatch({tool:'saveRecord',expectedRevision:5,arguments:{title:'Supporto TEST',kind:'composition',tags:[],clientRef:'',document:doc}});const before=await store.read();f.second.variants.pop();await expect(store.dispatch({tool:'saveProductionProfile',expectedRevision:6,arguments:{id,profile:data}})).rejects.toThrow('rimossa');expect(await store.read()).toEqual(before);
 resolve.mockRejectedValueOnce(Error('TEST rete assente'));await expect(store.dispatch({tool:'saveProductionProfile',expectedRevision:6,arguments:{id,profile:data}})).rejects.toThrow('rete assente');expect(await store.read()).toEqual(before);
 const {shopBindings:_bindings,variantAreas:_areas,...clear}=data;await store.dispatch({tool:'saveProductionProfile',expectedRevision:6,arguments:{id,profile:{...clear,shopBinding:initial.productionProfiles![0]!.shopBinding,sizeMode:'fixed'}}});const final=await store.read();expect(final.productionProfiles![0]!.shopBindings).toBeUndefined();expect(final.productionProfileHistory![1]!.shopBindings).toHaveLength(2);expect(final.records[0]!.document).toEqual(doc);expect(final.revision).toBe(7);
 }finally{db?.close();await rm(directory,{recursive:true,force:true});}
});
it('risposte di un prodotto/fonte differente, primaria rimossa o variante ripetuta fra prodotti non diventano associazioni',async()=>{
 const f=sharedProfilesFixture();await expect(verifyProfileShopBindings(f.profile,async()=>f.detail)).rejects.toThrow('non appartiene');await expect(verifyProfileShopBindings(f.profile,async id=>({...((id===f.detail.id)?f.detail:f.second),source:'shopify'}))).rejects.toThrow('non appartiene');
 const removed=structuredClone(f.second);removed.variants.shift();await expect(verifyProfileShopBindings(f.profile,async id=>id===f.detail.id?f.detail:removed)).rejects.toThrow('non appartiene');await expect(verifyProfileShopBindings(f.profile)).rejects.toThrow('non disponibile');
 const repeated={...f.second,variants:f.detail.variants},profile={...f.profile,shopBindings:[f.profile.shopBindings![0]!,{...f.profile.shopBindings![1]!,variantId:f.detail.variants[0]!.id,variantIds:f.detail.variants.map(item=>item.id)}]};await expect(verifyProfileShopBindings(profile,async id=>id===f.detail.id?f.detail:repeated)).rejects.toThrow('più prodotti');
});
