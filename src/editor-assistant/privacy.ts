import {PrivacyVault} from '../privacy/redaction';
/** Composition-only restoration through the existing local review interface.
 * No changes to the public chat's contract or 480-character brief are needed. */
export class CompositionPrivacy {
 private readonly vault:PrivacyVault;
 private readonly literals=new Map<string,string>();
 private readonly literalPrefix=crypto.randomUUID();
 private readonly reviewSession=crypto.randomUUID();
 constructor(fontNames:readonly string[]=[]){this.vault=new PrivacyVault(fontNames);}
 protect(text:string,opaque=false):string{if(opaque&&/^\[RISERVATO_\d+\]$/.test(text)){const token=this.vault.protect(`${this.literalPrefix}: ${text}`,true);this.literals.set(token,text);return token;}return this.vault.protect(text,opaque);}
 restoreContent(text:string):string{
  if(/\[RISERVATO_(?!\d+\])/.test(text))throw Error('Segnaposto AI non valido');
  return text.replace(/\[RISERVATO_\d+\]/g,token=>{
   if(this.literals.has(token))return this.literals.get(token)!;
   const prepared=this.vault.prepare({message:token,sessionId:this.reviewSession,revision:0,requirements:{},lastQuestion:null,recentMessages:[],privacyReviewed:false,publicFragments:[]}),part=prepared.parts.find(part=>part.token===token);
   if(!part)throw Error('Segnaposto AI sconosciuto: nessun contenuto privato ripristinato');return part.original;
  });
 }
}
