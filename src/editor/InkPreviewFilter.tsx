import { inkChannels,type InkColor } from './ink';
export function InkPreviewFilter({id,color}:{id:string;color:InkColor}){
 const[r,g,b]=inkChannels(color).map(value=>value/255);
 return <svg width="0" height="0" aria-hidden="true" focusable="false" style={{position:'absolute',pointerEvents:'none'}}><defs><filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%"><feComponentTransfer><feFuncR type="linear" slope={1-r!} intercept={r}/><feFuncG type="linear" slope={1-g!} intercept={g}/><feFuncB type="linear" slope={1-b!} intercept={b}/><feFuncA type="identity"/></feComponentTransfer></filter></defs></svg>;
}
