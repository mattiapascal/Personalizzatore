import {expect,it} from 'vitest';
import {singleFillPitchprintOpacity,rasterPitchprintOpacity} from '../src/editor/pitchprint-opacity';
import {checkedPitchprintEffects} from '../src/editor/pitchprint-tree';

const rect={type:'rect',width:227,height:150,fill:'rgba(167,169,172,1)',stroke:null,strokeWidth:2,opacity:.9};
it('rettangolo senza contorno effettivo: alpha oggetto equivalente all’alpha del solo fill, estremi inclusi',()=>{
 for(const opacity of[0,.1,.9,1]){const item={...rect,opacity};expect(singleFillPitchprintOpacity(item)).toBe(opacity);expect(()=>checkedPitchprintEffects(item,'TEST')).not.toThrow();}
 expect(singleFillPitchprintOpacity({...rect,stroke:'#000000',strokeWidth:0})).toBe(.9);
 expect(singleFillPitchprintOpacity({...rect,type:'ellipse',rx:100,ry:50})).toBe(.9);
});
it('compositing diverso, geometria non trattata e alpha invalido restano bloccanti',()=>{
 for(const change of [{stroke:'#000000'}, {backgroundColor:'#ffffff'}, {rx:1}, {type:'group'}, {type:'i-text'}, {type:'path'}, {opacity:null}, {opacity:'0.9'}, {opacity:NaN}, {opacity:-.1}, {opacity:1.1}]) {
  const item={...rect,...change};expect(singleFillPitchprintOpacity(item)).toBeNull();expect(()=>checkedPitchprintEffects(item,'TEST')).toThrow('opacità');
 }
 for(const change of [{shadow:{color:'#000000'}},{skewX:15},{transformMatrix:[1,0,0,1,0,0]}])expect(()=>checkedPitchprintEffects({...rect,...change},'TEST')).toThrow();
 expect(()=>singleFillPitchprintOpacity({...rect,fill:'rgba(167,169,172,.5)'})).toThrow('Opacità');
});

it('immagine raster: alpha complessivo distinto dal fill, senza appiattire gruppi o pitture aggiuntive',()=>{
 for(const opacity of[0,.25,1]){const image={type:'image',width:40,height:30,opacity};expect(rasterPitchprintOpacity(image)).toBe(opacity);expect(()=>checkedPitchprintEffects(image,'TEST')).not.toThrow();}
 for(const opacity of[null,NaN,Infinity,'0.5',-1,2])expect(rasterPitchprintOpacity({type:'image',opacity})).toBeNull();
 for(const extra of[{backgroundColor:'#ffffff'},{stroke:'#000000',strokeWidth:1}])expect(()=>checkedPitchprintEffects({type:'image',opacity:.5,...extra},'TEST')).toThrow('opacità');
 expect(()=>checkedPitchprintEffects({type:'group',opacity:.5},'TEST')).toThrow('opacità');
});
