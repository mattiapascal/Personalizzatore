/** Ephemeral browser memory. Unconfirmed proposals never become model history. */
export interface AssistantTurn {id:number;request:string;reply:string;status:'clarification'|'applied';revision:number;}
export interface AssistantMemory {turns:readonly AssistantTurn[];focusIds:readonly string[];}
export function rememberAssistantTurn(turns:readonly AssistantTurn[],turn:AssistantTurn):AssistantTurn[]{return [...turns,turn].slice(-20);}
export function assistantHistory(turns:readonly AssistantTurn[]):{role:'user'|'assistant';text:string}[]{
 return turns.slice(-3).flatMap(turn=>[{role:'user' as const,text:turn.request},{role:'assistant' as const,text:turn.reply}]);
}

/** Model questions cannot reuse tokens from an earlier restoration table. */
export function assistantQuestion(text:string):string{return /\[RISERVATO_/.test(text)?'Scrivi tra virgolette il testo completo e indica l’oggetto da modificare.':text;}
