import {NumericStepper} from './NumericStepper';
import { useEffect, useRef, useState } from 'react';

export function NumberField({ label, value, revision, min, max, step, disabled, mixed, className, onChange }: { label: string; value: number; revision: number; min: number; max: number; step?: number; disabled?: boolean; mixed?: boolean; className?: string; onChange: (value: number) => void }) {
  const formatted = (number: number) => String(Math.round(number * (step === undefined ? 1000 : 1e9)) / (step === undefined ? 1000 : 1e9));
  const [raw, setRaw] = useState(mixed ? '' : formatted(value));
  const focused = useRef(false);
  // Ancorare il passo al valore effettivo consente anche misure importate o
  // scalate (es. 0,2875 mm), senza stepMismatch o scatti alla griglia decimale.
  const offset = step === undefined ? 0 : (value - min) / step;
  const fraction = Math.abs(offset - Math.round(offset)) < 1e-7 ? 0 : offset - Math.floor(offset);
  const stepMinimum = step === undefined ? min : Math.round((min + fraction * step) * 1e9) / 1e9;
  useEffect(() => { const precision = step === undefined ? 1000 : 1e9; if (!focused.current) setRaw(mixed ? '' : String(Math.round(value * precision) / precision)); }, [value, revision, mixed, step]);
  return <label className={className}>{label}<NumericStepper label={label} value={mixed?null:value} min={min} max={max} step={step} disabled={disabled} onStep={next=>{setRaw(formatted(next));onChange(next);}}><input aria-label={label} type="number" step={step ?? 'any'} required={!mixed} placeholder={mixed ? 'Misto' : undefined} min={stepMinimum} max={max} disabled={disabled} value={raw} onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; }} onKeyDown={event => { if (event.key === 'Escape') { focused.current = false; setRaw(String(value)); } }} onChange={event => {
    setRaw(event.target.value);
    if (event.target.value !== '' && Number.isFinite(Number(event.target.value))) onChange(Number(event.target.value));
  }}/></NumericStepper></label>;
}
