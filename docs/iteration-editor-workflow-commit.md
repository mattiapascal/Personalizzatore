# Acquisizione di progetti e profili — 14 novembre 2026

Cambio modello locale, anteprime e profili tecnici acquisiscono ora la composizione dopo il controllo degli input dell’ispettore. Una proposta già acquisita conserva documento, pagina e revisione: nuove modifiche non vengono incorporate implicitamente nella sua conferma.

## Difetti e contratto

Sul commit `0a6b076`, il dialogo del cambio modello si apriva con la larghezza del gruppo vuota; il collegamento del profilo avviava comunque il ricontrollo della libreria. Entrambe le riproduzioni sono fallite sul campione valido (`.local/workflow-commit-before.log`) e passano dopo la correzione.

`WorkflowEditorApi` distingue tre operazioni: `peek` legge senza applicare input (rimane usato dalle bozze); `prepare` applica gli input validi e restituisce una copia della scena; `validate` ricontrolla una proposta già acquisita. Quest’ultimo può conservare una nuova modifica manuale valida, ma in quel caso rifiuta la vecchia proposta, senza riaggiornarne la revisione. Controlla anche il contesto documento/pagina prima di applicare l’ispettore. Il controllo della proposta non duplica inutilmente tutti i dati binari del documento.

I campi non applicati del modulo impediscono nuove acquisizioni e conferme delle proposte. La loro validità corrente è letta anche dai callback iniziati prima di un aggiornamento React. Il documento canonico continua a essere modificato soltanto dai comandi validati, con Undo e gli stessi schemi della simulazione AI; nessuna guardia ricorsiva dentro `act`.

## Modello, anteprima e profilo

Il dialogo modello usa la preparazione prima di acquisire la composizione; mantiene la diagnostica dei font già disponibile nel dialogo, senza introdurre un’esportazione anticipata come requisito per aprirlo. La conferma controlla la scena prima della conservazione della bozza e di nuovo al comando finale, dopo l’attesa. Una modifica sopraggiunta resta nel documento ma annulla il cambio. I salvataggi deduplicati continuano a non riscrivere una bozza già conservata.

L’acquisizione SVG ricontrolla la proposta dopo la preparazione delle risorse. Anche il pannello locale delle configurazioni verifica la scena prima di mostrare il riepilogo e prima di proporre la scrittura di prova; il controllo del corpo minimo usa il documento acquisito dopo l’applicazione dell’ispettore. Una correzione del testo può quindi essere considerata anche quando il pulsante viene attivato senza un cambio di fuoco. Nessuna modifica al contratto delle configurazioni o al carrello reale.

Il profilo tecnico acquisisce la scena **prima** del GET che ne ricontrolla la versione. Al ritorno verifica identità e revisione, oltre a versione/archiviazione del profilo. Una nuova pagina/documento o un input sopraggiunto impediscono il collegamento; una modifica valida rimane applicata come comando separato. Scollegare il profilo e cambiare la tinta dimostrativa usano a loro volta il controllo dell’ispettore. Tinte, montature e prezzi rimangono quelli del prototipo locale: nessun collegamento commerciale nuovo.

## Campione

[JSON](../fixtures/illustrator/workflow-commit.TEST.json) e [SVG](../fixtures/illustrator/workflow-commit.TEST.svg): tre oggetti con gruppo e testo Arimo OFL incorporato, montatura fixture 4912, 47×18 mm, profilo «Profilo timbro TEST» conservato e tinta di prova blu nel progetto. Il generatore `node --import tsx scripts/capture-editor-workflow-commit.ts` parte da 70×25 mm, rifiuta il campo incompleto, applica le misure prima di collegare il profilo e aprire la proposta, conferma il formato e controlla Undo/Redo.

Screenshot di errore, proposta, desktop e telefono in `.local/previews/editor-workflow-commit-*.png`, ispezionati. La vista mobile attende il ridimensionamento e la pittura effettiva. Rapporto privato `workflow-commit-capture.json`: nessun errore browser, richiesta esterna o scrittura amministrativa.

## Verifiche

- **1.399 unitari in 192 file passati** (`.local/workflow-commit-units.log`). Build laboratorio/storefront, TypeScript Worker e controllo TypeScript finale passati (`workflow-commit-build.log`, `workflow-commit-public-build.log`, `workflow-commit-types-final.log`). Schemi persistenti invariati; scansioni segreti passate.
- **143 casi browser pertinenti distinti verificati fra esecuzioni e ricontrolli**: 93 su acquisizioni/ispettori/scena, 47 regressioni locali e tre casi ulteriori su concorrenza/minimo tipografico. La prima esecuzione da 93 termina **92/93**, con un’attesa di collaudo della bozza da correggere; il gruppo finale passa **23/23 nuovi casi** (`workflow-commit-native-final.log`). Il caso del corpo minimo è ripetuto anche senza cambio di fuoco (`workflow-commit-minimum.log`). Non una nuova suite browser generale.
- I due scenari iniziali sono stati riprodotti sul commit precedente. Le prime attese estese usavano un centro numerico fisso senza considerare il contorno; ora leggono il valore effettivo. L’anteprima locale rimuove intenzionalmente il DOCTYPE: il confronto normalizza soltanto questa dichiarazione, conservando il resto dello SVG. Le attese sul testo del modulo acquisiscono la revisione dopo l’effettiva modifica geometrica.
- L’attesa IndexedDB iniziale intercettava soltanto scritture, ma la conservazione può risolversi leggendo una copia già presente. Il collaudo finale ritarda le conferme delle vere transazioni di lettura/scrittura, verifica che la proposta sia ancora aperta e invariata prima dell’input, poi rilascia l’attesa. Deduplicazione e dati dell’app non sono stati modificati per adattarli al test.
- Coperti desktop/telefono, input prima del timer, profilo cambiato/documento successivo, misure sopraggiunte, conservazione della bozza e confronti manuale/AI con Undo separati. Una risposta profilo iniziata prima del dialogo rende obsolete sia la proposta modello sia quella del riepilogo; nessuna POST di configurazione in quei casi. Le regressioni comprendono anche conflitti, retry e il caso 13/15 soltanto in archivi di prova.
- **95 campioni JSON/SVG riaperti/esportati**, senza errori browser, richieste esterne o font personali (`workflow-commit-artifacts.log`). **13 test della chat pubblica locale passati** (`workflow-commit-public-tests.log`), JavaScript pubblico ancora `index-BG2r_x-8.js`.
- Archivio principale controllato in sola lettura prima e dopo: **SQLite R638, 346 template attivi, due composizioni, 219 font (218 attivi), un profilo**. Checksum dei metadati verificato e invariato (`workflow-commit-archive.json`). Cancellazione PDF preesistente esclusa dal commit.

Il lavoro protegge questi percorsi esistenti; non certifica tutti gli input temporanei dell’interfaccia o l’idoneità produttiva. Nessun nuovo sviluppo multipagina, migrazione, generazione immagini AI, deploy o modifica a Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata. I test delle configurazioni sono locali e isolati. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: misure e fissaggi delle targhe nell’editor, con gli stessi criteri di conferma degli input e conservazione delle revisioni. Apertura o scarto intenzionale di un altro documento restano azioni distinte.
