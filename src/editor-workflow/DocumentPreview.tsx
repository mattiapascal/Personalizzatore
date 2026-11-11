import {plaqueMountingPoints,mountingLabels} from '../editor/plaque';
import { useEffect,useId,useState } from 'react';
import { FabricAdapter } from '../editor/fabric-adapter';
import type { GraphicDocument } from '../editor/model';
import { InkPreviewFilter } from '../editor/InkPreviewFilter';
export function DocumentPreview({document:doc,label}:{document:GraphicDocument;label:string}){
 const[url,setUrl]=useState(''),[error,setError]=useState('');
 const filterId=`preview-ink-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`,color=doc.colorMode==='color'?'black':doc.inkColor??'black';
 useEffect(()=>{let uri='';try{const view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});try{uri=URL.createObjectURL(new Blob([view.exportSvg(doc)],{type:'image/svg+xml'}));setUrl(uri);setError('');}finally{view.dispose();}}catch(cause){setError(cause instanceof Error?cause.message:'Anteprima non disponibile');}return()=>{if(uri)URL.revokeObjectURL(uri);};},[doc]);
 return error?<p role="alert">{error}</p>:url?<><InkPreviewFilter id={filterId} color={color}/>{doc.plaque?<svg className="template-fit-preview" viewBox={`0 0 ${doc.areaMm.width} ${doc.areaMm.height}`} role="img" aria-label={label}><image href={url} width={doc.areaMm.width} height={doc.areaMm.height}/>{plaqueMountingPoints(doc.areaMm,doc.plaque).map((point,index)=><circle data-testid="mounting-point" key={index} cx={point.xMm} cy={point.yMm} r={doc.plaque!.holeDiameterMm?doc.plaque!.holeDiameterMm/2:Math.min(doc.areaMm.width,doc.areaMm.height)/80} fill={doc.plaque!.method==='holes'?'white':'#c4d9e3'} stroke="#006b9d" strokeWidth="1" vectorEffect="non-scaling-stroke"><title>{mountingLabels[doc.plaque!.method]} · X {point.xMm} Y {point.yMm} mm</title></circle>)}</svg>:<img className="template-fit-preview" src={url} alt={label} style={{filter:color==='black'?'none':`url(#${filterId})`}}/>}</>:<p>Preparazione anteprima…</p>;
}
