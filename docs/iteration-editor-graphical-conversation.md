# Conversazione grafica accanto allo stesso canvas

14 novembre 2026, dopo `29f2d27`. Incremento esclusivamente locale. Riutilizza proposta, compilatore dei comandi, anteprima, controlli produttivi e transazione atomica dell’assistente grafico esistente.

## Prova manuale

Aprire [la galleria locale](http://127.0.0.1:5173/editor/templates), scegliere un template/prodotto configurato e aprire l’editor. Il nuovo pulsante grafico **Chat grafica** apre il pannello accanto al canvas nella vista espansa; sul telefono rimane sotto al canvas, con scorrimento proprio. Rimane disponibile anche l’accesso **Assistente grafico** in **Compila i dati / Prodotto e fissaggi**. Sono due accessi alla stessa istanza.

Scrivere una richiesta, preparare e controllare l’anteprima, quindi confermare. La chat rimane aperta: si può intervenire manualmente oppure chiedere un’altra modifica. Un solo Annulla annulla ogni proposta confermata; i singoli interventi manuali restano punti distinti nella cronologia. Passare alla vista normale e tornare all’espansa mantiene documento, nodo Canvas, richiesta, immagini e conversazione. Chiudere e riaprire il pannello mantiene la conversazione; cambiare documento/pagina la azzera. **Nuova conversazione** azzera soltanto la memoria e gli allegati, senza cambiare la grafica o azzerare la quota economica di sessione.

La modifica manuale durante richiesta, lettura font o anteprima invalida il risultato catturato. Non si aggiorna implicitamente la revisione della proposta. Prima della conferma restano attive anche le verifiche degli input pendenti di ispettore e modulo. Nessun autosalvataggio nell’archivio principale da parte della chat; l’originale viene conservato nel normale archivio bozze del browser prima del commit.

## Memoria e riservatezza

La memoria è effimera nel componente del browser: massimo venti turni; al modello vanno soltanto gli ultimi tre scambi applicati o di chiarimento. Proposte non confermate, errori e richieste interrotte non entrano nella cronologia inviata. Ogni richiesta protegge di nuovo cronologia, citazioni e testi del documento con la stessa tabella locale di segnaposto. Gli originali rimangono disponibili per ripristinare i testi dopo la validazione; nessun font binario, nome file o pixel immagine viene aggiunto alla richiesta.

L’ultimo insieme di oggetti modificati viene conservato con i suoi ID reali soltanto nel browser. A ogni richiesta viene rimappato sui nuovi riferimenti opachi del documento corrente: riordinamenti non cambiano il bersaglio; elementi eliminati/nascosti scompaiono dal contesto. La selezione corrente ha precedenza. Le istruzioni grafiche distinguono lo stato corrente dalla cronologia; un riferimento ambiguo richiede chiarimento. Il contratto accetta ancora le richieste precedenti prive di memoria, normalizzandole a due elenchi vuoti. Nessuna modifica alla politica commerciale pubblicata.

## Interruzioni

**Interrompi richiesta**, chiusura, cambio documento e modifiche manuali interrompono il trasporto del browser. La disconnessione dell’HTTP grafico viene ora propagata al fetch del provider; il timeout server di 25 secondi rimane attivo. Il blocco concorrente locale viene rilasciato anche in errore. Questo non garantisce che il provider interrompa il calcolo o non addebiti una richiesta già ricevuta: una prenotazione con consumo ignoto rimane conteggiata, senza rimborsi presunti o tentativi automatici aggiuntivi. L’endpoint commerciale non riceve questo nuovo segnale di annullamento.

## Collaudi e campione

Campione [JSON](../fixtures/illustrator/graphical-conversation.TEST.json) e [SVG](../fixtures/illustrator/graphical-conversation.TEST.svg), generati da `scripts/capture-editor-graphical-conversation.ts`: prima proposta AI, modifica manuale, seconda proposta AI sul medesimo documento. Font pubblico TEST incorporato, prodotto e profilo TEST, due oggetti e nessuna scrittura reale. Catture desktop/telefono in `.local/previews/graphical-conversation-*`.

Controlli conclusi:

- **1.520 test / 211 file**: suite completa, inclusi privacy della memoria, rimappatura dei bersagli, compatibilità del contratto e HTTP nativo con annullamento del trasporto simulato.
- **106 casi browser pertinenti distinti**: 105/106 nell’esecuzione estesa iniziale; corretta l’invalidazione durante rilettura font, tutti i 26 casi della chat ricontrollati e passati. Gli altri casi coprono viewport/PAN, acquisizione degli input, cambio prodotto/materiale e galleria reale. Non è una nuova esecuzione dell’intera suite browser del repository.
- **13 browser pubblici** passati; build pubblica ancora `index-BG2r_x-8.js`. Build TypeScript/Worker, schemi, policy generate e scansioni dei segreti passati.
- **106 campioni** riaperti e riesportati dal browser, nessun errore o richiesta esterna/font della libreria reale.
- Audit principale R639 verificato: 348 record (346 template e due composizioni), 219 font; grafica, miniature, profili, font e risorse invariati. Nessuna modifica a Shopify, BSS, prezzi, acquisti o deploy.

Log privati `.local/graphical-chat-*`; il primo controllo fallito è conservato insieme al ricontrollo, senza sostituirlo con un risultato verde presunto. I test del provider usano risposte simulate, senza chiamate AI a pagamento: non certificano la comprensione del modello reale o Illustrator. Il mini-editor incorporato nella chat commerciale, il passaggio dalla conversazione di scelta prodotto e la valutazione semantica reale restano passi separati. Non sono state aggiunte nuove funzioni avanzate di disegno.
