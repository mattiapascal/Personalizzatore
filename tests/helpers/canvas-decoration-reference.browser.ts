/** Independent test oracle. Ask the native runtime to paint its decorations,
 * retaining each native text run; do not import the editor's SVG adapter.
 * Self-contained so the same function can also run in an isolated Fabric 3 VM. */
export function canvasDecorationReference(object:any,serialize:()=>string):string {
  const types=['underline','overline','linethrough'],paint:Record<string,string>={},original=object.getSvgTextDecoration;
  const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
  for(const kind of types){
    const rectangles:string[]=[],context={fillStyle:'',fillRect(x:number,y:number,w:number,h:number){if(w&&h)rectangles.push(`<rect data-native-decoration="${kind}" x="${w<0?x+w:x}" y="${h<0?y+h:y}" width="${Math.abs(w)}" height="${Math.abs(h)}" fill="${escape(String(this.fillStyle))}" stroke="none"/>`);}};
    object._renderTextDecoration(context,kind);paint[kind]=rectangles.join('');
  }
  if(!types.some(kind=>object[kind]||object.styleHas(kind)))return serialize();
  try{
    object.getSvgTextDecoration=()=>'';
    return serialize().replace(/<text\b/,paint.underline+'<text').replace('</text>','</text>'+paint.overline+paint.linethrough);
  }finally{object.getSvgTextDecoration=original;}
}
