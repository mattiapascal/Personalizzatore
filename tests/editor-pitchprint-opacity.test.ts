import {expect,it} from 'vitest';
import {singleFillPitchprintOpacity} from '../src/editor/pitchprint-opacity';
import {checkedPitchprintEffects} from '../src/editor/pitchprint-tree';

const rect={type:'rect',width:227,height:150,fill:'rgba(167,169,172,1)',stroke:null,strokeWidth:2,opacity:.9};
it('rettangolo senza contorno effettivo: alpha oggetto equivalente all’alpha del solo fill, estremi inclusi',()=>{
 for(const opacity of[0,.1,.9,1]){const item={...rect,opacity};expect(singleFillPitchprintOpacity(item)).toBe(opacity);expect(()=>checkedPitchprintEffects(item,'TEST')).not.toThrow();}
 expect(singleFillPitchprintOpacity({...rect,stroke:'#000000',strokeWidth:0})).toBe(.9);
 expect(singleFillPitchprintOpacity({...rect,type:'ellipse',rx:100,ry:50})).toBe(.9);
});
it('compositing diverso, geometria non trattata e alpha invalido restano bloccanti',()=>{
 for(const change of [{stroke:'#000000'}, {backgroundColor:'#ffffff'}, {rx:1}, {type:'group'}, {type:'image'}, {type:'i-text'}, {type:'path'}, {opacity:null}, {opacity:'0.9'}, {opacity:NaN}, {opacity:-.1}, {opacity:1.1}]) {
  const item={...rect,...change};expect(singleFillPitchprintOpacity(item)).toBeNull();expect(()=>checkedPitchprintEffects(item,'TEST')).toThrow('opacità');
 }
 for(const change of [{shadow:{color:'#000000'}},{skewX:15},{transformMatrix:[1,0,0,1,0,0]}])expect(()=>checkedPitchprintEffects({...rect,...change},'TEST')).toThrow();
 expect(()=>singleFillPitchprintOpacity({...rect,fill:'rgba(167,169,172,.5)'})).toThrow('Opacità');
});
