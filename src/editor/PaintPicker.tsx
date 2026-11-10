export function PaintPicker({ label, value, allowNone, onChange }: { label: string; value: string; allowNone: boolean; onChange: (value: '#000000' | '#ffffff' | 'none') => void }) {
  const options = [['#000000', 'Nero'], ['#ffffff', 'Bianco'], ...(allowNone ? [['none', 'Nessuno']] : [])] as const;
  return <div role="group" aria-label={label} className="inspector-paints">
    {options.map(([paint, name]) => <button key={paint} type="button" className="editor-icon-button paint-button" title={`${label}: ${name}`} aria-label={`${label}: ${name}`} aria-pressed={value === paint} onClick={() => onChange(paint as '#000000' | '#ffffff' | 'none')}><span aria-hidden="true" className={`paint-swatch${paint === 'none' ? ' paint-none' : ''}`} style={{ backgroundColor: paint === 'none' ? undefined : paint }}/></button>)}
  </div>;
}
