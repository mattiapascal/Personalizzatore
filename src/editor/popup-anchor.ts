/** Initial popup placement must clear every row of a wrapping toolbar. */
export function popupAnchor(element:HTMLElement|null){
 if(!element)return null;const anchor=element.getBoundingClientRect(),toolbar=element.closest('.workspace-toolbar')?.getBoundingClientRect();
 return {left:anchor.left,top:Math.min(anchor.top,toolbar?.top??anchor.top),bottom:Math.max(anchor.bottom,toolbar?.bottom??anchor.bottom)};
}
export function observePopupToolbar(element:HTMLElement|null,place:()=>void){
 const toolbar=element?.closest('.workspace-toolbar');if(!toolbar)return()=>{};const observer=new ResizeObserver(place);observer.observe(toolbar);return()=>observer.disconnect();
}
