import { fixtureCatalog } from '../catalog/adapter';
import { profileKey } from '../catalog/schema';
import type { ArchiveRecord } from './schema';
export function TemplateProductsEditor({record,disabled,onSave}:{record:ArchiveRecord;disabled:boolean;onSave:(products:NonNullable<ArchiveRecord['templateProducts']>|null)=>Promise<void>}){
 if(record.kind!=='template')return null;
 const real=<section className="production-subcard"><h3>Prodotti del negozio associati</h3><p>{record.shopProducts?.length??0} prodotti collegati. La galleria confronta soltanto formati e varianti con profilo configurato, senza modificare l’originale.</p><a href={`/editor/templates?mode=customer&template=${record.id}`}>Scegli un prodotto reale da questo template</a></section>;
 if(record.document.plaque)return <>{real}<section><h3>Prova targa senza prodotto</h3><p>Questo layout si riutilizza scegliendo misure diverse. Questa prova geometrica rimane distinta dai prodotti e dai profili del negozio.</p><a href={`/editor/plaque?workspace=1&mode=customer&template=${record.id}&templateVersion=${record.version}`}>Prova questo template con altre misure</a></section></>;
 return <>{real}<form key={`${record.id}-${record.version}`} className="admin-template-products" onSubmit={event=>{event.preventDefault();const keys=new FormData(event.currentTarget).getAll('model').map(String);void onSave(keys.length?{profileKeys:keys,initialMount:'smallest-compatible',adaptation:'confirm-proportional'}:null);}}>
  <h3>Modelli TEST associati al template</h3><p>Seleziona i modelli ammessi nella prova. La galleria TEST proporrà il più piccolo che contiene la grafica, senza ridurla automaticamente all’ingresso.</p>
  <fieldset disabled={disabled}><legend>Catalogo di prova · compatibilità geometrica TEST</legend>{fixtureCatalog.list().map(product=><label className="admin-check" key={profileKey(product)}><input type="checkbox" name="model" value={profileKey(product)} defaultChecked={record.templateProducts?.profileKeys.includes(profileKey(product))??false}/>{product.title}</label>)}</fieldset>
  <p>La riduzione, quando il cliente sceglie un altro modello, richiederà anteprima e conferma e dovrà rispettare i vincoli. Nessun prezzo configurato disponibile in questa prova.</p>
  <button disabled={disabled}>Salva associazioni ai modelli</button> <a href="/editor/templates?catalog=test">Apri galleria di prova</a>
 </form></>;
}
