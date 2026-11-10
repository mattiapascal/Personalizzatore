import { regionFitsArea } from '../editor/regions';
import { useId, useState } from 'react';
import { fixingPositions, type ProductionProfileData } from './production-profile';

const positive=(value:number|null|undefined):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1000;
export function ProductionProfilePreview({profile}:{profile:ProductionProfileData}){
 const [fixingId,setFixingId]=useState(''),clip=useId().replaceAll(':',''),area=profile.usableArea,width=area?.widthMm,height=area?.heightMm;
 if(!positive(width)||!positive(height))return <section className="production-preview" aria-label="Anteprima tecnica del profilo"><h3>Schema del profilo</h3><p>Inserisci larghezza e altezza dell’area utile per visualizzare lo schema. Le misure mancanti restano da definire.</p></section>;
 if(area?.shape!=='rectangle'&&width!==height)return <section className="production-preview" aria-label="Anteprima tecnica del profilo"><h3>Schema del profilo</h3><p>Per un’area tonda o quadrata larghezza e altezza devono coincidere.</p></section>;
 const selected=profile.fixings.find(item=>item.id===fixingId)??profile.fixings[0],margin=profile.safeMarginMm,padding=Math.max(width,height)*.025;
 const warnings:string[]=[];let holes:ReturnType<typeof fixingPositions>=[];
 if(selected){try{holes=fixingPositions(profile,selected.id);}catch(error){warnings.push(error instanceof Error?error.message:'Fori non rappresentabili.');}}
 const validMargin=margin!==null&&Number.isFinite(margin)&&margin>=0&&margin*2<Math.min(width,height);
 if(margin===null)warnings.push('Margine di sicurezza da definire.');else if(!validMargin)warnings.push('Il margine non lascia un’area interna utilizzabile.');
 const regions=profile.reservedAreas.filter(region=>{const valid=Number.isFinite(region.xMm)&&Number.isFinite(region.yMm)&&region.xMm>=0&&region.yMm>=0&&positive(region.widthMm)&&positive(region.heightMm);if(!valid)warnings.push(`Completa le misure di «${region.label}».`);else if(!regionFitsArea(region,{width,height,shape:area?.shape??'rectangle'}))warnings.push(`La zona «${region.label}» esce dall’area utile.`);return valid;});
 const clearance=selected?.drilling?.clearanceMm;
 if(holes.length&&clearance===null)warnings.push('Zona di rispetto dei fori da definire.');
 const boundary=(inset=0)=>area?.shape==='round'?<circle cx={width/2} cy={height/2} r={width/2-inset}/>:<rect x={inset} y={inset} width={width-2*inset} height={height-2*inset}/>;
 return <section className="production-preview" aria-label="Anteprima tecnica del profilo"><h3>Schema del profilo</h3>
  {!!profile.fixings.length&&<label>Fissaggio da visualizzare<select aria-label="Fissaggio da visualizzare" value={selected?.id??''} onChange={event=>setFixingId(event.target.value)}>{profile.fixings.map(item=><option value={item.id} key={item.id}>{item.label}{item.kind==='holes-only'?' · solo fori':' · kit'}</option>)}</select></label>}
  <svg role="img" aria-label={`Schema area utile ${width} × ${height} mm`} viewBox={`${-padding} ${-padding} ${width+padding*2} ${height+padding*2}`} className="production-preview-drawing">
   <desc>Coordinate in millimetri, con origine nell’angolo superiore sinistro. {regions.length} zone riservate; {holes.length} fori nello schema scelto. Anteprima tecnica, non file di produzione.</desc>
   <defs><clipPath id={clip}>{boundary()}</clipPath></defs>
   <g fill="white" stroke="#33556b" strokeWidth="1" className="production-area-outline">{boundary()}</g>
   <g clipPath={`url(#${clip})`}>
    {validMargin&&margin>0&&<g fill="none" stroke="#0088cc" strokeDasharray="4 3" strokeWidth="1" className="production-margin">{boundary(margin)}</g>}
    <g fill="#ffd7af" fillOpacity=".75" stroke="#b26925" strokeWidth="1">{regions.map(region=>region.shape==='ellipse'?<ellipse key={region.id} cx={region.xMm+region.widthMm/2} cy={region.yMm+region.heightMm/2} rx={region.widthMm/2} ry={region.heightMm/2}><title>{region.label}</title></ellipse>:<rect key={region.id} x={region.xMm} y={region.yMm} width={region.widthMm} height={region.heightMm}><title>{region.label}</title></rect>)}</g>
    {holes.map((hole,index)=><g key={index}>{clearance!==null&&clearance!==undefined&&Number.isFinite(clearance)&&clearance>0&&<circle data-testid="profile-hole-clearance" cx={hole.xMm} cy={hole.yMm} r={hole.diameterMm/2+clearance} fill="#dff3ff" fillOpacity=".65" stroke="#0088cc" strokeDasharray="3 3" strokeWidth="1"/>}<circle data-testid="profile-hole" cx={hole.xMm} cy={hole.yMm} r={hole.diameterMm/2} fill="white" stroke="#163b52" strokeWidth="1"><title>Foro {index+1}: X {hole.xMm} mm, Y {hole.yMm} mm, diametro {hole.diameterMm} mm</title></circle></g>)}
   </g>
  </svg>
  <p className="production-preview-size">{width} × {height} mm · {area?.shape==='round'?'area tonda':area?.shape==='square'?'area quadrata':'area rettangolare'}{selected?` · ${holes.length} fori`:''}</p>
  <p className="caption">Bordo scuro: area utile. Azzurro tratteggiato: margine e rispetto dei fori. Arancione: zone riservate. Origine X/Y nell’angolo superiore sinistro.</p>
  {selected&&!selected.drilling&&<p>Questo kit non richiede foratura.</p>}
  {!!warnings.length&&<ul className="production-preview-warnings" aria-label="Dati dello schema da completare">{warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>}
  <p className="caption">Anteprima dei dati inseriti; proporzioni conservate, dimensione a schermo variabile. Il profilo non governa ancora il canvas e non è certificato per produzione.</p>
 </section>;
}
