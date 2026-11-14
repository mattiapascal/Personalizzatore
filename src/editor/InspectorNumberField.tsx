import {NumericStepper, steppedNumber} from './NumericStepper';
import { useEffect, useRef, useState } from 'react';

export function NumberField({ label, value, revision, min, max, step, disabled, mixed, className, onChange }: { label: string; value: number; revision: number; min: number; max: number; step?: number; disabled?: boolean; mixed?: boolean; className?: string; onChange: (value: number) => void | boolean }) {
  const formatted = (number: number) => {
    const precision = step === undefined ? 1000 : 1e9, rounded = Math.round(number * precision) / precision;
    return String(rounded < min || rounded > max ? number : rounded);
  };
  const [raw, setRaw] = useState(mixed ? '' : formatted(value));
  const focused = useRef(false);
  // Immediate commands may explicitly reject a change. Show the actual value
  // again without remounting the field or disturbing successful text entry.
  const commit = (next:number,display=formatted(next)) => {setRaw(display);if(onChange(next)===false)setRaw(mixed?'':formatted(value));};
  // Ancorare il passo al valore effettivo consente anche misure importate o
  // scalate (es. 0,2875 mm), senza stepMismatch o scatti alla griglia decimale.
  const offset = step === undefined ? 0 : (value - min) / step;
  const fraction = Math.abs(offset - Math.round(offset)) < 1e-7 ? 0 : offset - Math.floor(offset);
  const stepMinimum = step === undefined ? min : Math.round((min + fraction * step) * 1e9) / 1e9;
  useEffect(() => { if (!focused.current) setRaw(mixed ? '' : formatted(value)); }, [value, revision, mixed, step, min, max]);
  return <label className={className}>{label}<NumericStepper label={label} value={mixed?null:value} min={min} max={max} step={step} disabled={disabled} onStep={next=>commit(next)}><input aria-label={label} type="number" step={step ?? 'any'} required={!mixed} placeholder={mixed ? 'Misto' : undefined} min={stepMinimum} max={max} disabled={disabled} value={raw} onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; }} onKeyDown={event => { if (step!==undefined && ['ArrowUp','ArrowDown'].includes(event.key)) {event.preventDefault();const next=steppedNumber(mixed?null:value,min,max,step,event.key==='ArrowUp'?1:-1);setRaw(formatted(next));if(next!==value)commit(next);} if (event.key === 'Escape') { focused.current = false; setRaw(String(value)); } }} onChange={event => {
    const display=event.target.value;setRaw(display);
    if (display !== '' && Number.isFinite(Number(display))) commit(Number(display),display);
  }}/></NumericStepper></label>;
}
