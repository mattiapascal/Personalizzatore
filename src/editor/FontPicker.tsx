import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { fontMenuFamilyChoices, fontMenuLabel, renderFontFamily, subscribeFonts, fontCatalogVersion, isFontAvailable, type FontFamily } from './fonts';
import { fontNameMatches } from './font-name-search';
export function FontPicker({ value, disabled, onChange, onOpen, emptyLabel='Misto', label='Font' }: { label?:string; emptyLabel?:string; onOpen: () => void; value: FontFamily | ''; disabled: boolean; onChange: (font: FontFamily) => void }) {
  useSyncExternalStore(subscribeFonts, fontCatalogVersion);
  const [query, setQuery] = useState(''), allFamilies = fontMenuFamilyChoices(), families = allFamilies.filter(id => fontNameMatches(fontMenuLabel(id), query));
  const root = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null), search = useRef<HTMLInputElement>(null), id = useId();
  const [open, setOpen] = useState(false), [active, setActive] = useState('');
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number }>({ left: 0, top: 0, width: 0, maxHeight: 300 });
  const [scrollRequest, requestScroll] = useState(0);
  const available = families.map(isFontAvailable), activeIndex = Math.max(0, families.indexOf(active)), descendant = open && families.length ? `${id}-${activeIndex}` : undefined;
  const close = () => setOpen(false);
  const place = () => {
    const box = button.current?.getBoundingClientRect(); if (!box) return;
    const height = Math.min(320, innerHeight - 16), below = innerHeight - box.bottom - 8, above = box.top - 8, width = Math.min(box.width, innerWidth - 16), down = below >= height || below >= above;
    // Anchor the actual popup edge. A short filtered list must not retain the
    // empty gap that a full-height popup would have occupied above the button.
    setPosition({ left: Math.max(8, Math.min(box.left, innerWidth - width - 8)), top: down ? box.bottom + 4 : undefined, bottom: down ? undefined : innerHeight - box.top + 4, width, maxHeight: Math.min(height, down ? below : above) });
  };
  const show = () => { if (!allFamilies.length || disabled || button.current?.matches(':disabled')) return; place(); onOpen(); setQuery(''); setActive(allFamilies.find(id => fontMenuLabel(id) === fontMenuLabel(value as FontFamily)) ?? allFamilies[0]!); setOpen(true); };
  const choose = (index: number) => { if (!available[index] || disabled || button.current?.matches(':disabled')) return; close(); onChange(families[index]!); button.current?.focus({ preventScroll: true }); };
  const changeQuery = (next: string) => { setQuery(next); setActive(allFamilies.find(id => fontNameMatches(fontMenuLabel(id), next)) ?? ''); requestScroll(request => request + 1); };
  const navigate = (event: KeyboardEvent, fromSearch = false) => {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); button.current?.focus({ preventScroll: true }); return; }
    if (event.key === 'Tab' && !fromSearch) { close(); return; }
    if (event.key === 'Enter' || !fromSearch && event.key === ' ') { event.preventDefault(); if (open) choose(activeIndex); else show(); return; }
    if (['ArrowDown', 'ArrowUp', ...(!fromSearch ? ['Home', 'End'] : [])].includes(event.key)) {
      event.preventDefault(); if (!open) { show(); return; } if (!families.length) return;
      let next = event.key === 'Home' ? 0 : event.key === 'End' ? families.length - 1 : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + families.length) % families.length;
      const step = event.key === 'ArrowUp' || event.key === 'End' ? -1 : 1;
      for (let i = 0; i < families.length && !available[next]; i++) next = (next + step + families.length) % families.length;
      setActive(families[next]!); requestScroll(request => request + 1);
    }
  };
  useEffect(() => { if (disabled) close(); }, [disabled]);
  useEffect(() => {
    if (!open) return;
    const reposition = (event: Event) => { if (!(event.target instanceof Element) || !event.target.closest('.font-picker-list')) place(); };
    const outside = (event: Event) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(); }; place(); window.addEventListener('pointerdown', outside, true); window.addEventListener('focusin', outside, true); window.addEventListener('resize', place); window.addEventListener('scroll', reposition, true);
    return () => { window.removeEventListener('pointerdown', outside, true); window.removeEventListener('focusin', outside, true); window.removeEventListener('resize', place); window.removeEventListener('scroll', reposition, true); };
  }, [open]);
  useEffect(() => { if (open) search.current?.focus({ preventScroll: true }); }, [open]);
  // Only opening the menu and explicit keyboard navigation may scroll an option
  // into view. Hover and scroll-driven positioning must never fight the wheel.
  useEffect(() => { if (!open) return; const list = document.getElementById(`${id}-list`), option = document.getElementById(descendant ?? ''); if (!list || !option) return; if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop; else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight; }, [scrollRequest, open]);
  return <div className="font-picker" ref={root}><label id={`${id}-label`}>{label}</label><button ref={button} type="button" role="combobox" aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={descendant} disabled={disabled || !allFamilies.length} style={{ fontFamily: value && isFontAvailable(value) ? renderFontFamily(value) : undefined }} onClick={() => open ? close() : show()} onKeyDown={event => navigate(event)}>{value ? fontMenuLabel(value) : emptyLabel}<span aria-hidden="true">▾</span></button>
    {open && <div className="font-picker-popup" style={position}>
      <div className="font-picker-search-row"><input ref={search} type="search" aria-label="Cerca font" placeholder="Cerca font…" maxLength={160} autoComplete="off" spellCheck={false} aria-controls={`${id}-list`} aria-activedescendant={descendant} aria-describedby={`${id}-results`} value={query} onChange={event => changeQuery(event.target.value)} onKeyDown={event => { event.stopPropagation(); navigate(event, true); }}/><button type="button" aria-label="Svuota ricerca font" title="Svuota ricerca" disabled={!query} onClick={() => { changeQuery(''); search.current?.focus({ preventScroll: true }); }}>×</button></div>
      <p id={`${id}-results`} className="font-picker-results" role="status">{families.length ? `${families.length} di ${allFamilies.length} font` : 'Nessun font corrisponde alla ricerca.'}</p>
      <div id={`${id}-list`} role="listbox" aria-label="Caratteri disponibili" className="font-picker-list">{families.map((family, index) => <button key={family} id={`${id}-${index}`} type="button" role="option" title={fontMenuLabel(family)} tabIndex={-1} aria-selected={!!value && fontMenuLabel(value)===fontMenuLabel(family)} disabled={!available[index]} data-active={index === activeIndex} style={{ fontFamily: available[index]?renderFontFamily(family):undefined }} onMouseDown={event => event.preventDefault()} onPointerMove={() => setActive(family)} onClick={() => choose(index)}><span className="font-picker-family-name">{fontMenuLabel(family)}</span>{!available[index] && <small>non caricato</small>}</button>)}</div>
    </div>}
  </div>;
}
