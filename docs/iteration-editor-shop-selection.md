# Dal prodotto reale al foglio locale

14 novembre 2026, dopo `efc60fd`; [piano](editor-shop-selection-plan.md). Primo percorso locale prodotto → variante ammessa → profilo → documento vuoto → salvataggio/riapertura. Nessun deploy o modifica del negozio.

## Percorso disponibile

In **Prodotti del negozio → Scegli prodotto → Prova il prodotto nell’editor locale** si apre `/editor/product`. Il percorso legge prodotto/varianti e profili locali con gli adattatori esistenti. Senza un profilo utilizzabile non sceglie una montatura di prova o misure ricavate dal titolo.

Le misure fisse provengono dall’area configurata nel profilo. Per i profili «Misure della pagina» si inseriscono esplicitamente larghezza/altezza in mm. Non è ancora la lettura BSS e non è la mappatura delle dimensioni specifiche di ogni variante. Il cliente sceglie soltanto varianti ammesse dal profilo e presenti nella lettura corrente; per i timbri si usa la sola variante primaria decisa in amministrazione, anche se il profilo associa più varianti. Nessuna scelta del colore del corpo. La tinta dell’impronta resta separata; il timbro a secco non propone né accetta tinte diverse dal nero di rappresentazione.

Il profilo e il prodotto vengono riletti prima dell’apertura, dopo aver preparato un solo font della libreria. Cambi di prodotto, varianti, stato, profilo o scelte durante l’attesa impediscono l’apertura e richiedono una nuova scelta. Il parametro locale `refresh=1` usa il controllo `force` già disponibile nell’adattatore; nessuna nuova query Shopify o lettura prezzi.

Il foglio nasce vuoto, con area/sagoma e regole del profilo. I fissaggi già esistenti seguono la famiglia; le misure di una targa con profilo fisso sono disabilitate anche nel pannello, senza impedire la scelta dei fissaggi. Il prodotto compare nel pannello e nel riepilogo locale, e rimane nel JSON quando si salva e riapre la composizione.

## Documento e comandi

`shopSelection` è una proprietà opzionale per pagina con prodotto/variante, provenienza, data della lettura e ID/versione del profilo. Non sovraccarica i campi storici delle montature e non modifica di nascosto il profilo mantenendone la versione. I vecchi documenti restano validi; nessuna migrazione dell’archivio.

`setShopSelection` è condiviso da manuale e simulazione AI e richiede prodotto e profilo esatti nel contesto. Rifiuta revisione superata, metadati non corrispondenti alla lettura, varianti non ammesse e profilo assente/manomesso. La scelta resta coerente con il profilo anche in JSON; import del cliente e comandi già esistenti delle pagine non possono introdurre una scelta diversa senza il comando verificato. Questa è compatibilità del contratto, non una nuova funzione multipagina. La cancellazione della scelta è amministrativa; Undo/Redo conserva le scelte delle rispettive revisioni. Il timbro a secco rifiuta tinte di tampone anche nel JSON importato, non solo dal selettore.

Il percorso legato al prodotto usa importazione nel documento corrente, non apertura arbitraria di un altro progetto come se avesse lo stesso prodotto. La riapertura esplicita di un progetto autonomo conserva invece il suo snapshot. I comandi grafici offline restano utilizzabili; per cambiare la scelta serve il contesto aggiornato. Il vecchio cambio montatura TEST non viene proposto sui progetti con scelta commerciale.

## Problemi trovati durante il collaudo

- Nella copia del catalogo, 15 titoli prodotto superano i 120 caratteri ammessi per il nome del progetto. Il nome iniziale viene ora abbreviato senza spezzare una coppia UTF-16; `shopSelection` conserva il titolo commerciale completo. Salvataggio e riapertura con titolo lungo verificati nel caso cliente desktop.
- Un nuovo documento vuoto con profilo saltava la preparazione del font: «Aggiungi testo» non trovava un file caricato. Il percorso prepara ora un solo font della libreria prima dell’ultimo controllo dei dati. Non carica tutta la libreria e non usa font del computer.
- Le miniature tecniche dei fissaggi rimuovevano il profilo ma lasciavano la scelta commerciale, creando una proiezione incoerente. Le sole proiezioni di riferimento eliminano ora entrambi; sorgente canonico e grafica conservano scelta e profilo. Correzione coperta da prova unitaria, miniature native e PDF tecnico. Nessuna invalidazione globale delle cache dei vecchi template.

## Evidenze

- **1.409 unitari / 194 file passati**, inclusi otto nuovi casi su contesto, ruoli, import, metadati, misure, timbri, proiezioni e compatibilità delle pagine (`.local/shop-selection-verified-units.log`).
- **66 browser pertinenti distinti verificati fra esecuzioni/ricontrolli**: 50 su nuovo percorso, associazioni, fissaggi e acquisizioni (`shop-selection-browser-final.log`), più un nuovo PDF e 15 regressioni di fissaggi/proprietà/riferimenti; i dieci casi del percorso e queste 15 regressioni passano **25/25** in `shop-selection-projections.log`. I dieci casi sono poi ricontrollati con il titolo lungo in `shop-selection-final.log` (**10/10**). Non una nuova suite browser generale. La precedente esecuzione `shop-selection-related.log` era 26/27: ha rilevato il difetto del font iniziale, poi corretto e ricontrollato.
- Fonte reale: profilo **v6** letto da SQLite in sola lettura e una lettura Shopify aggiornata del prodotto tramite l’adattatore locale, poi la stessa risposta fornita alla UI per il controllo visivo. Canvas **400 × 300 mm**, scelta `source: shopify`, zero scritture/errori/richieste esterne dal browser e font privati esclusi. `scripts/capture-editor-shop-selection.ts --real-product`, `shop-selection-real-capture.log/json` e catture in `.local/previews/shop-selection-real-*`. È la verifica dell’unico profilo configurato, non di tutti i prodotti dello shop.
- Campione portatile `fixtures/illustrator/shop-selection.TEST.json/svg`: **100 × 60 mm**, un testo con file Arimo TEST incorporato, scelta prodotto/variante/profilo, due punti a viti e misure tecniche ancora da definire. Generato dalla UI da `scripts/capture-editor-shop-selection.ts`; catture desktop/telefono ispezionate. Sorgenti/licenza Arimo in `fixtures/fonts`.
- **98 campioni JSON/SVG riaperti/esportati**, compresa uguaglianza di `shopSelection`, zero errori browser/richieste esterne/letture dei font privati (`shop-selection-verified-artifacts.log`). Dopo il riavvio del laboratorio anche i dieci casi del nuovo percorso sono passati di nuovo (**10/10**, `shop-selection-restarted.log`).
- **13 test della chat pubblica locale passati**, JavaScript pubblico ancora `index-BG2r_x-8.js`. Build laboratorio/storefront e TypeScript Worker passati; scansioni segreti passate. Sei schemi JSON aggiornati dallo stesso modello, senza cambiare i dati salvati.
- Principale **SQLite R638 invariato**: 346 template, due composizioni, 219 font/218 attivi, un profilo; checksum dei metadati valido e identico al controllo precedente (`shop-selection-archive.json`). Cancellazione PDF preesistente esclusa dal commit. Laboratorio riavviato sulla stessa porta 5173 per caricare anche le validazioni server: lettura HTTP 200, backend SQLite e stessi conteggi R638. Nessuna migrazione.

## Limiti e prossimo lavoro

Il percorso apre ancora un foglio vuoto. Restano da integrare template associati, aree specifiche per variante, cambio materiale/prodotto durante il disegno e misure BSS, preservando le regole condivise. Non è una nuova certificazione delle misure del profilo, della disponibilità, dei kit o della lavorabilità; Illustrator e produzione fisica richiedono ancora collaudo umano.

Seguire con geometrie per variante nello stesso profilo e scelta dei template nel percorso reale, poi materiali/fissaggi e assistente grafico locale per bozze semplici. Prezzi dopo le associazioni, secondo il piano del titolare. Nessuna generazione immagini AI, nuova funzione multipagina, modifica Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout o pubblicazione.
