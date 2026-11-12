import { Color } from 'fabric';
import { canonicalPaint } from './paint';
import { paintWithOpacity } from './paint-opacity';
import { pitchprintNumber as number } from './pitchprint-units';
import type { SceneObject } from './model';
type Text = Extract<SceneObject,{type:'text'}>;
/** Physical stroke in the same pre-stretch plane as the canonical font. */
export function pitchprintTextStroke(item: Record<string,unknown>, axisY: number, monochrome: boolean) {
 const raw=item.stroke,width=number(item.strokeWidth??(raw?1:0),'Contorno testo');
 if(width<0)throw Error('Spessore del contorno testo non valido.');
 let stroke='none',opacity=1;
 if(raw!=null&&raw!==''&&raw!=='none'&&raw!=='transparent'){
  if(typeof raw!=='string')throw Error('Contorno testo non riconosciuto.');
  const color=new Color(raw);if(color.isUnrecognised)throw Error('Contorno testo non riconosciuto.');
  stroke=canonicalPaint('#'+color.toHex().toLowerCase(),monochrome);opacity=color.getAlpha();
 }
 if(item.strokeUniform===true&&stroke!=='none'&&width>0)throw Error('Contorno uniforme del testo indipendente dalla dilatazione da convertire.');
 const cap=item.strokeLineCap??'butt',join=item.strokeLineJoin??'miter',limit=number(item.strokeMiterLimit??4,'Limite angoli del testo'),order=item.paintFirst??'fill';
 if(!['butt','round','square'].includes(String(cap))||!['miter','round','bevel'].includes(String(join))||!['fill','stroke'].includes(String(order))||limit<1||limit>100)throw Error('Aspetto del contorno testo non riconosciuto.');
 const canonical:Partial<Text>={...(stroke!=='none'?{stroke,strokeMm:width*axisY,...(opacity===1?{}:{strokeOpacity:opacity})}:item.strokeWidth!==undefined&&width>0?{stroke:'none',strokeMm:width*axisY}:{}),...(cap==='butt'?{}:{strokeLineCap:cap as Text['strokeLineCap']}),...(join==='miter'?{}:{strokeLineJoin:join as Text['strokeLineJoin']}),...(limit===4?{}:{strokeMiterLimit:limit}),...(order==='fill'?{}:{paintFirst:'stroke' as const})};
 return{canonical,stroke,width,opacity,native:{stroke:stroke==='none'?null:paintWithOpacity(stroke,opacity),strokeWidth:width,strokeLineCap:cap as NonNullable<Text['strokeLineCap']>,strokeLineJoin:join as NonNullable<Text['strokeLineJoin']>,strokeMiterLimit:limit,paintFirst:order as NonNullable<Text['paintFirst']>}};
}
