# Collegamenti del catalogo reale dal pannello prodotti

14 novembre 2026. Primo incremento dopo le [nuove priorità del titolare](editor-integrazione-prodotti-chat-plan.md). Backend e archivio restano locali; nessun deploy.

## Funzionamento

In **Gestione configuratore → Prodotti del negozio**, i filtri esistenti per collezioni e tag restano disponibili. «Scegli prodotto» apre ora il dettaglio dei suoi collegamenti:

- Template attivi già associati, con varianti censite e collegamento all’editor amministrativo.
- Template recuperabili dalla copia delle associazioni originali PitchPrint, usando ID e provenienza verificabili. Esclusi composizioni cliente, template archiviati e design non importati; nessuna associazione dedotta dal nome o dalle dimensioni del canvas.
- Profili locali associati al prodotto e dati ancora mancanti. Un profilo compilato non è dichiarato produttivamente certificato.

Si possono selezionare uno o più template, controllare il riepilogo e salvare i collegamenti nel solo archivio locale. La modalità è sempre **aggiunta**: conserva gli altri prodotti e le varianti già associate. L’ampliamento da varianti specifiche a tutte le varianti è indicato nella scelta. Il comando `bulkTemplateAssociationMap` e il controllo server delle varianti sono quelli già esistenti; nessuna nuova API Shopify, query, migrazione o regola prezzi.

La proposta si invalida cambiando prodotto, scelte, sorgente o revisione dell’archivio. Il motore rifiuta inoltre un conflitto intervenuto prima del salvataggio, senza scritture parziali. Le copie in sola lettura sono consultabili ma non modificabili. La copia delle associazioni può essere indisponibile senza nascondere i collegamenti già salvati.

## Evidenze iniziali

- Cinque casi browser passati, con veri comandi `EditorAdminStore` su directory temporanee: consultazione senza effetti, recupero selettivo e controllo varianti, conservazione degli altri legami/grafica/profili, cambio prodotto e conflitto, sorgente assente e telefono in sola lettura. `.local/product-integration-native.log`, ricontrollati in `product-integration-related.log`.
- Due unitari per ID/provenienza, esclusioni, mancata inferenza da nomi/misure e conservazione dell’input. `tests/editor-product-integration.test.ts`.
- Verifica visiva sulla copia reale corrente aperta con `EditorAdminSqlite.open(path,true)`, catalogo e associazioni già salvati; scritture e rete esterna bloccate. `scripts/capture-editor-product-integration.ts --real-copy`, `.local/product-integration-real-capture.json` e catture desktop/telefono ispezionate. R638, tre template recuperabili per il prodotto scelto, zero scritture ed errori browser. Immagini CDN bloccate intenzionalmente.

Analisi delle copie datate: 1.597 prodotti/73 collezioni (11 novembre) e associazioni PitchPrint del 10 novembre. **290 dei 346 template attivi recuperabili, 398 legami verso 133 prodotti; 56 template senza legame recuperabile da questa copia.** Nei legami figurano anche prodotti in bozza e non elencati; nessuna attivazione commerciale automatica. Non è una nuova lettura live del catalogo. I dettagli privati restano in `.local`.

Il principale non ha ricevuto associazioni durante il collaudo. Il recupero reale è ora revisionabile dal pannello; la scrittura parte soltanto con «Salva collegamenti locali». Il passaggio successivo è collegare varianti, aree utili verificate e scelte materiale/fissaggi al percorso cliente, poi l’assistente grafico locale. Calcolo dei prezzi dopo le associazioni, secondo il piano concordato e senza modificare BSS.

## Verifiche finali condivise con la correzione testo/tracciato

- **1.401 unitari / 193 file** passati (`product-integration-units.log`).
- **42 browser pertinenti** passati in due esecuzioni finali: 19 nuovi/proprietà e 23 regressioni locali (`product-integration-related.log`, `product-integration-regressions.log`). Non una nuova suite browser generale.
- **13 test della chat pubblica locale** passati; JavaScript pubblico ancora `index-BG2r_x-8.js`. Build laboratorio/storefront e TypeScript Worker passati, schemi persistenti invariati, scansioni segreti passate.
- **97 campioni JSON/SVG** riaperti/esportati senza errori browser, richieste esterne o letture dei font privati (`product-integration-artifacts.log`). Nessun nuovo collaudo umano Illustrator dichiarato.
- Principale **SQLite R638 invariato** rispetto al controllo dell’incremento precedente: 346 template, due composizioni, 219 font/218 attivi, un profilo; checksum dei metadati valido e identico (`product-integration-archive.json`). La cancellazione PDF preesistente resta esclusa dal commit.

Per provare: aprire `/editor/admin?section=products`, filtrare per prodotto/collezione/tag, premere «Scegli prodotto» e selezionare i collegamenti originali desiderati. «Controlla collegamenti selezionati» prepara soltanto il riepilogo; «Salva collegamenti locali» effettua il salvataggio locale dopo il controllo delle varianti.
