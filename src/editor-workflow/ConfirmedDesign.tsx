import {useEffect,useState} from 'react';
import {readArchiveRecord} from '../editor-admin/api';
import type {ArchiveRecord} from '../editor-admin/schema';
import {fixtureCatalog} from '../catalog/adapter';
import {DocumentPreview} from './DocumentPreview';
import '../editor-admin/admin.css';
export default function ConfirmedDesign(){
 const[record,setRecord]=useState<ArchiveRecord|null>(null),[error,setError]=useState('');const id=new URLSearchParams(location.search).get('project');
 useEffect(()=>{if(!id){setError('Nessun design selezionato');return;}void readArchiveRecord(id).then(setRecord).catch(cause=>setError(cause.message));},[id]);
 const product=record?fixtureCatalog.list().find(item=>item.productId===record.document.productId&&item.variantIds.includes(record.document.variantId??'')):null;
 return <main className="editor-admin confirmed-design" data-editor-mode="customer"><h1>{record?'Design confermato':'Riepilogo design'}</h1>{error&&<p role="alert">{error}</p>}{record&&<><h2>{record.title}</h2>{record.document.shopSelection&&<p data-testid="confirmed-shop-product"><strong>{record.document.shopSelection.productTitle}</strong>{!record.document.productionProfile?.kind.startsWith('stamp-')&&` · ${record.document.shopSelection.variantTitle}`}</p>}<DocumentPreview document={record.document} label="Design confermato"/><p>{record.document.areaMm.width} × {record.document.areaMm.height} mm · versione {record.version}</p><p>Il design è salvato nell’ambiente locale. Il collegamento automatico del progetto al negozio sarà attivato nella fase di integrazione online.</p><div className="button-row"><a href={`/editor?workspace=1&mode=customer&archive=${record.id}`}>Torna a modificare il design</a>{product&&<a href={`https://www.incisoriasacchetti.it/products/${encodeURIComponent(product.handle)}`}>Apri la pagina del prodotto ↗</a>}<a href="/editor/templates?mode=customer">Scegli un altro template</a></div></>}</main>;
}
