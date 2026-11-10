import type {GraphicDocument} from './model';
import {editorMode} from './design-session';
import { useMemo,useState } from 'react';
import { fixtureCatalog } from '../catalog/adapter';
import { profileKey } from '../catalog/schema';
import { EditorLab } from './EditorLab';
import { EditorIcon } from './EditorButton';

// Ingresso del solo laboratorio: fixture già censite, nessuna API commerciale o AI.
export default function EditorStandalone() {
  const products = useMemo(()=>fixtureCatalog.list(),[]);
  const [productKey, setProductKey] = useState(() => { const requested = new URLSearchParams(window.location.search).get('format'); return products.some(p => profileKey(p) === requested) ? requested! : profileKey(products.find(p => p.handle === 'trodat-4913')!); });
  const [unlisted,setUnlisted]=useState<GraphicDocument|null>(null);
  const [editing, setEditing] = useState(false);
  const product = useMemo(()=>fixtureCatalog.get(productKey),[productKey]);
  return <div className="editor-standalone" data-editor-mode={editorMode()}>
    <header><div className="brand">IS<span> / laboratorio digitale</span></div>{import.meta.env.DEV && <><a href={`/editor/templates?mode=${editorMode()}`}>Template</a>{editorMode()!=='customer'&&<a href="/editor/admin">Gestione configuratore</a>}</>}<a href="/" className="editor-icon-button" aria-label="Selettore prodotti" title="Selettore prodotti"><EditorIcon name="return"/></a></header>
    <main>
      <div className="intro"><span className="eyebrow">Configuratore grafico / Solo locale</span><h1>Editor <em>grafico.</em></h1><p>Prova gli strumenti manuali con i modelli del catalogo TEST.</p></div>
      <label className="standalone-product" hidden={!!unlisted}>Formato di prova<select disabled={editing} value={productKey} onChange={event => setProductKey(event.target.value)}>
        {products.map(p => <option key={profileKey(p)} value={profileKey(p)}>{p.title} · {p.nominalAreaMm.width} × {p.nominalAreaMm.height} mm</option>)}
      </select></label>
      {unlisted&&<p className="standalone-product">Formato dal file: {unlisted.areaMm.width} × {unlisted.areaMm.height} mm. Associazione originale conservata, anche se il prodotto non è nel catalogo corrente.</p>}
      <EditorLab portable onDocumentState={doc=>setUnlisted(products.some(item=>item.productId===doc.productId&&item.variantIds.includes(doc.variantId??''))?null:doc)} product={product} catalogVersion={fixtureCatalog.version} availableProducts={products} autosave onEditingChange={setEditing} onKeepProduct={(id, variantId) => {
        const target = products.find(p => p.productId === id && p.variantIds.includes(variantId)); if (target) setProductKey(profileKey(target));
      }}/>
    </main>
  </div>;
}
