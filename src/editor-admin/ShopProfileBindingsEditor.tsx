import {useState} from 'react';
import {profileShopBindings,type ProductionProfileData} from '../editor/production-profile';
import type {ShopProfileBinding} from './shop-catalog';
import {ShopProfilePicker} from './ShopProfilePicker';

export function ShopProfileBindingsEditor({profile,onChange,disabled}:{profile:ProductionProfileData;onChange:(bindings:ShopProfileBinding[])=>void;disabled:boolean}){
 const [adding,setAdding]=useState(false),[error,setError]=useState(''),bindings=profileShopBindings(profile);
 const change=(index:number,value:ShopProfileBinding|null)=>{
  if(value&&bindings.some((binding,at)=>at!==index&&binding.productId===value.productId)){setError('Questo prodotto è già nel profilo. Modifica la sua associazione per cambiare le varianti.');return;}
  setError('');onChange(value?index===bindings.length?[...bindings,value]:bindings.map((binding,at)=>at===index?value:binding):bindings.filter((_,at)=>at!==index));setAdding(false);
 };
 return <section aria-label="Prodotti del profilo"><h3>Prodotti con regole comuni</h3><p>Associa qui i prodotti che condividono lavorazione, margine e zone riservate. Puoi impostare misure diverse per variante. Le associazioni dei template rimangono separate. Per includere nuove varianti Shopify occorre salvare una nuova versione del profilo.</p>{error&&<p role="alert">{error}</p>}
 {bindings.map((binding,index)=><ShopProfilePicker key={binding.productId} value={binding} onChange={value=>change(index,value)} disabled={disabled}/>)}
 {(!bindings.length||adding)&&<ShopProfilePicker value={null} onChange={value=>change(bindings.length,value)} disabled={disabled}/>}
 {!!bindings.length&&!adding&&<button type="button" disabled={disabled||bindings.length>=200} onClick={()=>{setError('');setAdding(true);}}>Aggiungi prodotto al profilo</button>}
 {adding&&<button type="button" disabled={disabled} onClick={()=>{setAdding(false);setError('');}}>Annulla aggiunta prodotto</button>}
 </section>;
}
