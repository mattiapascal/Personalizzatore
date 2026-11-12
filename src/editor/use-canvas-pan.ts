import { useEffect, useRef, type RefObject } from 'react';
interface PanView { zoom: number; panX: number; panY: number; }
export function useCanvasPan(viewport: RefObject<HTMLDivElement | null>, view: RefObject<PanView>, persistent: boolean, blocked: boolean, onTemporary: (active: boolean) => void) {
  const live = useRef({ persistent, blocked, onTemporary }); live.current = { persistent, blocked, onTemporary };
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const area = viewport.current?.querySelector<HTMLElement>('.canvas-scroll'); if (!area) return;
    let held = false, drag: { id: number; x: number; y: number; panX: number; panY: number } | null = null;
    const active = () => !live.current.blocked && (held || live.current.persistent);
    const stop = () => { if (drag && area.hasPointerCapture(drag.id)) area.releasePointerCapture(drag.id); drag = null; delete area.dataset.panDragging; };
    const update = () => { if (live.current.blocked) stop(); area.dataset.panActive = active() ? 'true' : 'false'; }; refresh.current = update;
    const editable = (target: EventTarget | null) => target instanceof Element && !!target.closest('input, textarea, select, [contenteditable=true], [role=combobox], [role=listbox], [role=tab], .page-manager, dialog[open]');
    const downKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || editable(event.target) || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const root = area.closest('[data-testid="editor-workspace"]'); if (event.target instanceof Node && event.target !== document.body && !root?.contains(event.target)) return;
      event.preventDefault(); event.stopImmediatePropagation(); if (live.current.blocked || held) return; held = true; live.current.onTemporary(true); update();
    };
    const releaseKey = (event: KeyboardEvent) => { if (event.code !== 'Space' || !held) return; event.preventDefault(); event.stopImmediatePropagation(); held = false; stop(); live.current.onTemporary(false); update(); };
    const blur = () => { held = false; stop(); live.current.onTemporary(false); update(); };
    const pointerDown = (event: PointerEvent) => { if (!active() || event.button !== 0) return; event.preventDefault(); event.stopImmediatePropagation(); drag = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: view.current.panX, panY: view.current.panY }; area.setPointerCapture(event.pointerId); area.dataset.panDragging = 'true'; };
    const pointerMove = (event: PointerEvent) => { if (!active()) return; event.preventDefault(); event.stopImmediatePropagation(); if (!drag || event.pointerId !== drag.id) return; const container = area.querySelector<HTMLElement>('.canvas-container'); if (!container) return; view.current.panX = drag.panX + event.clientX - drag.x; view.current.panY = drag.panY + event.clientY - drag.y; container.style.transform = `translate(${view.current.panX}px, ${view.current.panY}px)`; };
    const pointerUp = (event: PointerEvent) => { if (!drag || event.pointerId !== drag.id) return; event.preventDefault(); event.stopImmediatePropagation(); stop(); update(); };
    const mouse = (event: MouseEvent) => { if (active()) { event.preventDefault(); event.stopImmediatePropagation(); } };
    window.addEventListener('keydown', downKey, true); window.addEventListener('keyup', releaseKey, true); window.addEventListener('blur', blur);
    area.addEventListener('pointerdown', pointerDown, true); area.addEventListener('pointermove', pointerMove, true); area.addEventListener('pointerup', pointerUp, true); area.addEventListener('pointercancel', pointerUp, true); area.addEventListener('lostpointercapture', pointerUp, true); area.addEventListener('mousedown', mouse, true); area.addEventListener('mousemove', mouse, true); area.addEventListener('dblclick', mouse, true); update();
    return () => { stop(); window.removeEventListener('keydown', downKey, true); window.removeEventListener('keyup', releaseKey, true); window.removeEventListener('blur', blur); area.removeEventListener('pointerdown', pointerDown, true); area.removeEventListener('pointermove', pointerMove, true); area.removeEventListener('pointerup', pointerUp, true); area.removeEventListener('pointercancel', pointerUp, true); area.removeEventListener('lostpointercapture', pointerUp, true); area.removeEventListener('mousedown', mouse, true); area.removeEventListener('mousemove', mouse, true); area.removeEventListener('dblclick', mouse, true); delete area.dataset.panActive; };
  }, []);
  useEffect(() => refresh.current(), [persistent, blocked]);
}
