import {profileAreaConfiguration} from './production-profile';
import type {GraphicDocument} from './model';
import {INK_PREVIEWS,type InkColor} from './ink';
export function ShopSelectionPanel({document:doc,disabled,onInk}:{document:GraphicDocument;disabled:boolean;onInk:(color:InkColor)=>boolean}){
 const selection=doc.shopSelection;if(!selection)return null;const stamp=doc.productionProfile?.kind.startsWith('stamp-');
 return <section className="production-subcard" aria-label="Prodotto scelto"><h3>{selection.productTitle}</h3><p>{stamp?'Variante della montatura gestita dal laboratorio.':selection.variantTitle}</p><p>{doc.areaMm.width} × {doc.areaMm.height} mm · {doc.productionProfile&&profileAreaConfiguration(doc.productionProfile,selection.variantId).sizeMode==='document'?'misure personalizzate':'misure del profilo locale'}</p>{doc.productionProfile?.kind==='stamp-ink'&&<label>Colore impronta<select aria-label="Colore impronta del prodotto" disabled={disabled} value={doc.inkColor??'black'} onChange={event=>onInk(event.target.value as InkColor)}>{Object.entries(INK_PREVIEWS).map(([value,ink])=><option key={value} value={value}>{ink.label}</option>)}</select></label>}<p className="caption">{selection.source==='test'?'DATI TEST. ':''}Scelta conservata nel progetto. Anteprima locale: disponibilità, materiali, tamponi e prezzi del negozio non ancora collegati.</p></section>;
}
