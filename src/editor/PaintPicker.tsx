import {DocumentPaintPalette} from './DocumentPaintPalette';
export function PaintPicker({ label, value, allowNone, allowColor = false, colors = [], preserveFocus=false,onChange }: { label: string; value: string; allowNone: boolean; allowColor?: boolean; colors?:readonly string[];preserveFocus?:boolean; onChange: (value: string) => void }) {
  const options = [['#000000', 'Nero'], ['#ffffff', 'Bianco'], ...(allowNone ? [['none', 'Nessuno']] : [])] as const;
  return <div role="group" aria-label={label} className="inspector-paints">
    {allowColor && <label className="paint-custom" title={`${label}: colore personalizzato`}><span className="sr-only">{label}: colore personalizzato</span><input type="color" aria-label={`${label}: colore personalizzato`} value={/^#[0-9a-f]{6}$/.test(value) ? value : '#000000'} onChange={event => onChange(event.target.value)}/></label>}
    {options.map(([paint, name]) => <button key={paint} type="button" onPointerDown={event=>{if(preserveFocus&&event.isPrimary&&event.button===0)event.preventDefault();}} className="editor-icon-button paint-button" title={`${label}: ${name}`} aria-label={`${label}: ${name}`} aria-pressed={value === paint} onClick={() => onChange(paint)}><span aria-hidden="true" className={`paint-swatch${paint === 'none' ? ' paint-none' : ''}`} style={{ backgroundColor: paint === 'none' ? undefined : paint }}/></button>)}
    {allowColor&&<DocumentPaintPalette {...{label,value,colors,onChange}}/>}
  </div>;
}
