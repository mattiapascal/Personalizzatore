/** Library files plus the current document, never every font previously loaded in this tab. */
export class FontChoiceScope{
 private library:string[]=[];private document:string[]=[];private pending=new Map<symbol,readonly string[]>();
 constructor(private publish:(ids:readonly string[])=>void){}
 private refresh(){this.publish([...new Set([...this.library,...this.document,...[...this.pending.values()].flat()])]);}
 setLibrary(ids:readonly string[]){this.library=[...ids];this.refresh();}
 setDocument(ids:readonly string[]){this.document=[...ids];this.refresh();}
 includePending(ids:readonly string[]):()=>void{const token=Symbol('incoming-fonts');this.pending.set(token,[...ids]);this.refresh();return()=>{if(this.pending.delete(token))this.refresh();};}
}
