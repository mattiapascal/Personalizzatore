import { it, expect, vi } from 'vitest';
import { TextRenderGuard } from '../src/editor/text-render-guard';
import { TEST_DEFAULT_FONT } from './helpers/editor-fonts';
import type { TextObject } from '../src/editor/text-style';
import type { FontReport } from '../src/editor/font-preflight';
import type { GraphicDocument } from '../src/editor/model';
const object:TextObject={id:'text',type:'text',text:'ABC',fontFamily:TEST_DEFAULT_FONT.id,fontSizePt:12,fill:'#000000',xMm:5,yMm:5};
const ready:FontReport={issues:[],checkedFonts:1};
const blocked:FontReport={issues:[{objectId:'text',fontId:object.fontFamily,fontLabel:'TEST',kind:'missing-characters',characters:['Ω']}],checkedFonts:1};
const tick=()=>new Promise<void>(resolve=>queueMicrotask(resolve));
it('nessun permesso prima del preflight; geometria e selezione non invalidano la verifica',async()=>{
 const inspect=vi.fn(async()=>ready),changed=vi.fn(),guard=new TextRenderGuard(changed,inspect),original=structuredClone(object);
 expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('pending');await tick();expect(guard.status({...object,xMm:20,fontSizePt:24},[structuredClone(TEST_DEFAULT_FONT)])).toBe('ready');expect(inspect).toHaveBeenCalledTimes(1);expect(changed).toHaveBeenCalledTimes(1);expect(object).toEqual(original);
 expect(guard.status({...object,characterStyles:[{start:0,end:1,style:{fontWeight:'bold'}}]},[TEST_DEFAULT_FONT])).toBe('pending');await tick();expect(inspect).toHaveBeenCalledTimes(2);
});
it('una risposta vecchia non autorizza nuovi caratteri o una nuova risorsa con lo stesso ID',async()=>{
 const resolve:((report:FontReport)=>void)[]=[],inspect=vi.fn(()=>new Promise<FontReport>(done=>resolve.push(done))),changed=vi.fn(),guard=new TextRenderGuard(changed,inspect);
 guard.status(object,[TEST_DEFAULT_FONT]);const next={...object,text:'Ω'};expect(guard.status(next,[TEST_DEFAULT_FONT])).toBe('pending');resolve[0]!(ready);await tick();expect(guard.status(next,[TEST_DEFAULT_FONT])).toBe('pending');expect(changed).not.toHaveBeenCalled();resolve[1]!(blocked);await tick();expect(guard.status(next,[TEST_DEFAULT_FONT])).toBe('blocked');
 expect(guard.status(next,[{...TEST_DEFAULT_FONT,dataBase64:'changed'}])).toBe('pending');
});
it('errori, retry, rimozione e chiusura non lasciano autorizzazioni o callback obsolete',async()=>{
 const inspect=vi.fn().mockRejectedValueOnce(Error('TEST offline')).mockResolvedValue(ready),changed=vi.fn(),guard=new TextRenderGuard(changed,inspect);
 guard.status(object,[TEST_DEFAULT_FONT]);await tick();await tick();expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('blocked');guard.retry();expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('pending');await tick();expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('ready');guard.retain(new Set());expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('pending');guard.dispose();const before=changed.mock.calls.length;await tick();expect(changed).toHaveBeenCalledTimes(before);expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('blocked');
});
it('il controllo reale dei byte distingue caratteri supportati e stili simulati',async()=>{
 const guard=new TextRenderGuard(()=>{});expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('pending');await tick();await tick();expect(guard.status(object,[TEST_DEFAULT_FONT])).toBe('ready');const synthetic={...object,fontWeight:'bold' as const};expect(guard.status(synthetic,[TEST_DEFAULT_FONT])).toBe('pending');await tick();await tick();expect(guard.status(synthetic,[TEST_DEFAULT_FONT])).toBe('blocked');
});
it('una mutazione della risorsa ricevuta non modifica la prova già avviata o il suo permesso',async()=>{
 const font={...TEST_DEFAULT_FONT},seen:string[]=[],inspect=vi.fn(async(doc:Pick<GraphicDocument,'objects'|'fontAssets'>)=>{seen.push(doc.fontAssets![0]!.dataBase64);return ready;}),guard=new TextRenderGuard(()=>{},inspect);
 guard.status(object,[font]);await tick();expect(guard.status(object,[font])).toBe('ready');font.dataBase64='changed-in-place';expect(guard.status(object,[font])).toBe('pending');await tick();expect(seen).toEqual([TEST_DEFAULT_FONT.dataBase64,'changed-in-place']);expect(inspect).toHaveBeenCalledTimes(2);
});
