import type { SelectionStyle } from './model';
import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
export function OpacityControls({ fill, stroke, canFill, canStroke, linked, onLinkedChange, onChange, revision, selection = false, disabled = false }: {
  fill: number | null; stroke: number | null; canFill: boolean; canStroke: boolean;
  linked: boolean; onLinkedChange: (value: boolean) => void; onChange: (style: SelectionStyle) => void;
  revision: number; selection?: boolean; disabled?: boolean;
}) {
  const change = (kind: 'fill' | 'stroke', percent: number) => {
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return;
    const opacity = (100 - percent) / 100;
    onChange({ ...(canFill && (kind === 'fill' || linked) ? { fillOpacity: opacity } : {}), ...(canStroke && (kind === 'stroke' || linked) ? { strokeOpacity: opacity } : {}) });
  };
  return <fieldset className="paint-opacity inspector-arrangement" disabled={disabled}>
    <legend>Trasparenza</legend>
    {canFill && canStroke && <EditorButton icon={linked ? 'link' : 'unlink'} label="Collega trasparenza riempimento e contorno" aria-pressed={linked} onClick={() => onLinkedChange(!linked)}/>}
    {(['fill', 'stroke'] as const).filter(kind => kind === 'fill' ? canFill : canStroke).map(kind => {
      const opacity = kind === 'fill' ? fill : stroke, value = opacity === null ? 0 : Math.round((1 - opacity) * 1000000) / 10000;
      const label = `Trasparenza ${kind === 'fill' ? 'riempimento' : 'contorno'}${selection ? ' selezione' : ''}`;
      return <div key={kind} className="paint-opacity-row">
        <NumberField label={`${label} (%)`} value={value} mixed={opacity === null} revision={revision} min={0} max={100} step={1} onChange={percent => change(kind, percent)}/>
        <input type="range" aria-label={label} aria-valuetext={opacity === null ? 'Mista' : `${value}% trasparente`} min="0" max="100" step="1" value={value} onChange={event => change(kind, Number(event.target.value))}/>
      </div>;
    })}
    <p className="caption">0% opaco · 100% trasparente{canFill && canStroke ? linked ? ' · regolazioni collegate' : ' · regolazioni separate' : ''}.</p>
  </fieldset>;
}
