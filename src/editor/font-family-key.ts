/** Match naming differences only; never choose another face, weight or style. */
export const fontFamilyKey=(family:string)=>family.normalize('NFC').trim().toLocaleLowerCase('en').replace(/[\s_-]+/g,'');
