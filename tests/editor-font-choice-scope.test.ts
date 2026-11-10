import{expect,it}from'vitest';import{FontChoiceScope}from'../src/editor/font-choice-scope';
it('cambio progetto e undo mostrano solo libreria attiva e risorse del documento attuale',()=>{
 let visible:readonly string[]=[];const scope=new FontChoiceScope(ids=>visible=ids);scope.setLibrary(['A']);scope.setDocument(['B']);expect(visible).toEqual(['A','B']);scope.setDocument(['A']);expect(visible).toEqual(['A']);scope.setDocument(['B']);scope.setLibrary([]);expect(visible).toEqual(['B']);scope.setDocument([]);expect(visible).toEqual([]);
});
it('font in preparazione restano disponibili nel dialogo, poi annullamento e preparazioni sovrapposte li rimuovono correttamente',()=>{
 let visible:readonly string[]=[];const scope=new FontChoiceScope(ids=>visible=ids);scope.setLibrary(['A']);const first=scope.includePending(['B']),second=scope.includePending(['B','C']);first();first();expect(visible).toEqual(['A','B','C']);scope.setDocument(['D']);scope.setLibrary(['E']);expect(visible).toEqual(['E','D','B','C']);second();expect(visible).toEqual(['E','D']);
});
