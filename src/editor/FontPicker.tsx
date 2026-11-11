import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { fontFamilyChoices, fontFamilyLabel, renderFontFamily, subscribeFonts, fontCatalogVersion, isFontAvailable, type FontFamily } from './fonts';
export function FontPicker({ value, disabled, onChange, onOpen, emptyLabel='Misto', label='Font' }: { label?:string; emptyLabel?:string; onOpen: () => void; value: FontFamily | ''; disabled: boolean; onChange: (font: FontFamily) => void }) {
  useSyncExternalStore(subscribeFonts, fontCatalogVersion); const families = fontFamilyChoices();
  const root = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null), id = useId(), [open, setOpen] = useState(false), [active, setActive] = useState(0), [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 300 });
  const [scrollRequest, requestScroll] = useState(0);
  const available = families.map(isFontAvailable);
  const close = () => setOpen(false);
  const place = () => { const box = button.current?.getBoundingClientRect(); if (!box) return; const height = Math.min(320, innerHeight - 16), below = innerHeight - box.bottom - 8; setPosition({ left: Math.max(8, Math.min(box.left, innerWidth - box.width - 8)), top: below >= height || below >= box.top ? box.bottom + 4 : Math.max(8, box.top - height - 4), width: box.width, maxHeight: Math.min(height, Math.max(below, box.top - 8)) }); };
  const show = () => { if (!families.length || disabled || button.current?.matches(':disabled')) return; place(); onOpen(); setActive(Math.max(0, families.findIndex(id=>fontFamilyLabel(id)===fontFamilyLabel(value as FontFamily)))); setOpen(true); };
  const choose = (index: number) => { if (!available[index] || disabled || button.current?.matches(':disabled')) return; close(); onChange(families[index]!); button.current?.focus({ preventScroll: true }); };
  useEffect(() => { if (disabled) close(); }, [disabled]);
  useEffect(() => {
    if (!open) return;
    const reposition = (event: Event) => { if (!(event.target instanceof Element) || !event.target.closest('.font-picker-list')) place(); };
    const outside = (event: Event) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(); }; place(); window.addEventListener('pointerdown', outside, true); window.addEventListener('focusin', outside, true); window.addEventListener('resize', place); window.addEventListener('scroll', reposition, true);
    return () => { window.removeEventListener('pointerdown', outside, true); window.removeEventListener('focusin', outside, true); window.removeEventListener('resize', place); window.removeEventListener('scroll', reposition, true); };
  }, [open]);
  // Only opening the menu and explicit keyboard navigation may scroll an option
  // into view. Hover and scroll-driven positioning must never fight the wheel.
  useEffect(() => { if (!open) return; const list = document.getElementById(`${id}-list`), option = document.getElementById(`${id}-${active}`); if (!list || !option) return; if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop; else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight; }, [scrollRequest, open]);
  return <div className="font-picker" ref={root}><label id={`${id}-label`}>{label}</label><button ref={button} type="button" role="combobox" aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-${active}` : undefined} disabled={disabled || !families.length} style={{ fontFamily: value && isFontAvailable(value) ? renderFontFamily(value) : undefined }} onClick={() => open ? close() : show()} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (open) choose(active); else show(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); if (!open) { show(); return; } let next = event.key === 'Home' ? 0 : event.key === 'End' ? families.length - 1 : (active + (event.key === 'ArrowDown' ? 1 : -1) + families.length) % families.length; const step = event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1; for (let i = 0; i < families.length && !available[next]; i++) next = (next + step + families.length) % families.length; setActive(next); requestScroll(request => request + 1); }
  }}>{value ? fontFamilyLabel(value) : emptyLabel}<span aria-hidden="true">▾</span></button>
    {open && <div id={`${id}-list`} role="listbox" aria-label="Caratteri disponibili" className="font-picker-list" style={position}>{families.map((family, index) => <button key={family} id={`${id}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={!!value && fontFamilyLabel(value)===fontFamilyLabel(family)} disabled={!available[index]} data-active={index === active} style={{ fontFamily: renderFontFamily(family) }} onMouseDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}>{fontFamilyLabel(family)}{!available[index] && <small>non disponibile</small>}</button>)}</div>}
  </div>;
}
