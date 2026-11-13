# Selezione interna e ordine dei gruppi — 13 novembre 2026

Incremento locale sul documento canonico. Nessuna modifica ai template reali per attivare la funzione.

- **Option/Alt + clic** seleziona un solo elemento dentro un gruppo, rispettando contorni trasparenti e blocchi ereditati. Su Mac Ctrl+clic conserva il normale menu contestuale.
- Il pannello Livelli mostra gruppi/sottogruppi e un pulsante **Seleziona solo** per ogni membro. L’ispettore dichiara l’ambito e permette di tornare all’intero gruppo. Clic normale su un altro oggetto ripristina la selezione del gruppo.
- Spostamento, maniglie, testo, colore, duplicazione, eliminazione e appunti possono agire sul solo membro senza separare il gruppo. I fratelli e le proprietà dei contenitori sono preservati; Undo/Redo e riapertura JSON conservano la gerarchia.
- Pulsanti d’ordine limitati al contenitore più interno; i sottogruppi sono unità. La presa della riga muove il membro anche quando non era selezionato. La presa dell’intestazione muove l’intero gruppo radice.
- Trascinamento nel pannello per trasferire un membro tra contenitori o portarlo fuori dal gruppo, nei punti di primo piano/fondo. Posizioni e geometrie sul canvas non cambiano. Contiguità e gerarchia sono validate atomicamente; si rimuovono soltanto i contenitori diventati vuoti.
- Un cliente non può aggirare blocchi o trasformare un riferimento in grafica produttiva cambiandone il contenitore. Un’estrazione amministrativa conserva sul membro gli eventuali blocchi/riferimenti che perderebbe uscendo dal gruppo.

`targetScope: object` è esplicito nei comandi, non una proprietà nascosta del documento. I comandi precedenti continuano a richiedere gruppi completi. `placeGroupMember` è un comando tipizzato con revisione e destinazione; nessuna mutazione esclusivamente Fabric. Corretta anche l’equivalenza tra rotazione assente e zero nel controllo delle geometrie bloccate: il cambio di colore non viene più rifiutato per la normalizzazione a zero eseguita dall’ispettore.

## Vettore del template 80x25

Verifica in sola lettura e prova su copia browser: `pp-1-1-1` è il bordo sottile di un vettore con foro, non un rettangolo pieno. Il riempimento colora l’anello lasciando vuoto l’interno. Con la selezione diretta il colore cambia; il gruppo originale contiene anche blocchi ereditati della selezione cliente. Non sono stati rimossi blocchi né modificati il record o il colore nel database reale.

## Verifiche

Campione portatile `group-member.TEST.json/svg`, generatore `scripts/capture-editor-group-member.ts`; test unitari del comando e otto gesti browser comprendono selezione, testo, maniglie, appunti, ordine, estrazione/reinserimento, trasparenze, blocchi e Ctrl/menu destro. Risultati finali nel resoconto [Trasforma e pannelli](iteration-editor-transform-panels.md). Il riordino successivo dell’interfaccia ha spostato gli appunti da Livelli a Modifica; le istruzioni storiche che li collocavano in Livelli sono superate. Illustrator resta da collaudare.
