import{PaintPicker}from'./PaintPicker';import type{GraphicDocument}from'./model';
export function PaperColorPanel({document,onChange}:{document:GraphicDocument;onChange:(color:string|null)=>void}){
 return <details className="paper-color-panel"><summary>Colore del foglio</summary><PaintPicker label="Colore del foglio" value={document.paperColor??'none'} allowNone allowColor={document.colorMode==='color'} onChange={value=>onChange(value==='none'?null:value)}/><p className="caption">Il colore scelto fa parte della grafica, anche nel PNG trasparente. Nessuno mantiene il foglio bianco di visualizzazione e lascia trasparente il PNG.</p></details>;
}
