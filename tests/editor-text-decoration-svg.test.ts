import { expect,it } from 'vitest';
import { decorationRects,decorationSvg } from '../src/editor/text-decoration-svg';
it('decorazioni vettoriali: coordinate esatte, rettangoli negativi normalizzati e colore/alpha espliciti',()=>{
 const rects=decorationRects(context=>{context.fillStyle='rgba(0,136,204,.4)';context.fillRect(3,4,-2,.3);context.fillRect(0,0,0,5);});
 expect(rects).toEqual([{x:1,y:4,width:2,height:.3,fill:'rgba(0,136,204,.4)'}]);
 expect(decorationSvg(rects,'linethrough')).toContain('data-editor-decoration="line-through"');expect(decorationSvg(rects,'underline')).toContain('fill="#0088cc" fill-opacity="0.4"');
 expect(decorationSvg([{...rects[0]!,fill:'transparent'}],'overline')).toBe('');
});
it('valori non finiti e colori non interpretabili non generano SVG apparentemente valido',()=>{
 expect(()=>decorationRects(context=>context.fillRect(Infinity,0,1,1))).toThrow('non finita');
 expect(()=>decorationSvg([{x:0,y:0,width:1,height:1,fill:'bad-color'}],'underline')).toThrow('Colore');
});
