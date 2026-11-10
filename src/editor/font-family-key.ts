/** Match naming differences only; never choose another face, weight or style. */
export const fontFamilyKey=(family:string)=>family.normalize('NFC').trim().toLocaleLowerCase('en').replace(/[\s_-]+/g,'');

/** Internal font names retain Unicode letters and digits; punctuation is ignored. */
export const fontIdentityNameKey=(name:string)=>name.normalize('NFC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]/gu,'');
