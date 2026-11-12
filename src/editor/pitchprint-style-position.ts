import { EDITOR_LIMITS } from './limits';

/** Fabric 3 Textbox styles address hard lines, including during wrapping.
 * Detached rows are retained editing history, not glyphs in the current text.
 * Only the observed legacy version is accepted; malformed positions remain errors. */
export function inactivePitchprintStylePosition(item:{type?:unknown;version?:unknown},lines:readonly (readonly string[])[],row:string,column:string):'insertion'|'detached'|undefined {
 if(!/^(0|[1-9]\d*)$/.test(row)||!/^(0|[1-9]\d*)$/.test(column))return;
 const line=Number(row),index=Number(column);
 if(!Number.isSafeInteger(line)||!Number.isSafeInteger(index)||line>=EDITOR_LIMITS.textLines||index>EDITOR_LIMITS.textCharacters)return;
 if(lines[line]?.length&&index===lines[line]!.length)return'insertion';
 if(lines[line]===undefined&&item.type==='textbox'&&item.version==='3.4.0')return'detached';
}
