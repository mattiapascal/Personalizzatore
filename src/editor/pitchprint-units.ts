/** Parse numeric values serialized by PitchPrint, without guessing locale separators or units. */
export function pitchprintNumber(value:unknown,label:string):number{
 const parsed=typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())?Number(value):value;
 if(typeof parsed!=='number'||!Number.isFinite(parsed))throw new Error(`${label}: valore numerico non valido.`);return parsed;
}
export function pitchprintUnitMm(unit:string):number{
 const scale:Record<string,number>={mm:1,cm:10,in:25.4,inch:25.4,inches:25.4};const value=scale[unit.trim().toLowerCase()];if(!value)throw new Error(`Unità PitchPrint «${unit}» non convertibile senza una misura fisica certa.`);return value;
}
