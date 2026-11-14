# Cambio prodotto e materiale dall’editor

14 novembre 2026, dopo `ede0380`; [piano](editor-shop-product-change-plan.md). Primo percorso locale di cambio montatura, prodotto/supporto o variante, con confronto prima/dopo e conferma. Usa prodotti reali letti dall’adattatore e profili esplicitamente configurati; nessuna modifica online.

## Uso

Aprire una composizione collegata a un prodotto reale. In **Prodotto e fissaggi** oppure **Compila i dati**, scegliere **Cambia materiale o prodotto**; sui timbri il pulsante è **Cambia montatura**. Scegliere prodotto, profilo, variante e fissaggio, poi **Controlla cambio e mostra anteprima**. Il riepilogo mostra prodotto/variante, formato e fissaggio. La conferma applica il cambio al documento; il pulsante per mantenere il prodotto attuale lascia la composizione intatta.

L’elenco comprende soltanto prodotti con profili attivi della stessa categoria e fonte. Una variante priva di misure configurate non apre un formato di ripiego. Per i timbri il corpo della montatura è deciso dalla variante primaria del laboratorio; il cliente sceglie separatamente il colore dell’impronta. I formati personalizzati conservano le misure scelte dal cliente finché compatibili con la sagoma: diametro per i cerchi, lato per i quadrati, due quote per i rettangoli.

Il materiale è rappresentato dalla scelta reale di prodotto/variante e dalle relative regole, non da texture generate o caratteristiche inferite dal titolo. Prezzi, disponibilità per l’acquisto, BSS e checkout non sono collegati a questa procedura.

## Documento e controlli

Il comando canonico `changeShopProduct` conserva documento, ID, gruppi, font, proprietà protette, origine template e pagine inattive. Opera sulla sola pagina corrente e mantiene Undo/Redo. Comandi manuali e AI simulati usano lo stesso contratto e validatore. Il contesto commerciale aggiornato entra nel DocumentStore insieme al comando soltanto dopo il suo successo, senza azzerare la cronologia né sostituire il catalogo storico.

La grafica mantiene le dimensioni fisiche e la posizione rispetto al centro della pagina; gli sfondi collegati coprono il nuovo formato. Nessun ingrandimento automatico. Se occorre ridurre, l’adattamento proporzionale è proposto soltanto con margini e vincoli noti e rispettati. Incisioni, caratteri sotto minimo, collisioni con zone/fissaggi, esiti al limite o incompleti non sono aggirati con una riduzione. Dati produttivi mancanti possono restare avvisi nel cambio senza riduzione, senza dichiarare il progetto pronto per lavorazione.

I fissaggi compatibili conservano le distanze fisiche e vengono riposizionati sul nuovo supporto. Metodi o schemi incompatibili richiedono una scelta esplicita. Diametro e rispetto tecnico del foro si conservano soltanto a parità di profilo/versione e metodo: negli altri casi tornano da verificare. Fuoriporta con colla/due viti; scatolati con sole staffe. Lo stesso pannello ora gestisce anche sagome quadrate e tonde, verificando che il foro circolare resti realmente interno al supporto.

L’apertura acquisisce gli input validi dell’ispettore e del modulo. Cambi a scelte, documento o pagina invalidano l’anteprima; risposte tardive non la ripristinano. Alla conferma vengono riletti prodotto, varianti e profilo, ricalcolato il risultato e conservata una bozza dell’originale in questo browser prima del comando. Le riletture non scrivono sul negozio. Il record salvato nell’archivio resta invariato finché l’utente non salva/conferma la composizione modificata.

I blocchi dei singoli oggetti restano intatti; soltanto questo comando globale può adattare gli oggetti protetti insieme al foglio. Non abilita spostamenti o modifiche individuali altrimenti vietati. I riferimenti grafici vengono conservati con avviso di verificarne la corrispondenza al nuovo supporto. La procedura non certifica incisione, produzione o compatibilità Illustrator.

## Collaudo

Campione portabile `fixtures/illustrator/shop-product-change.TEST.json/svg`, generato dalla UI con `scripts/capture-editor-shop-product-change.ts`: due oggetti raggruppati, Arimo TEST incorporato, passaggio 200 × 100 → 300 × 150 mm e due viti. Dati, font e identificativi di prova distinti dal catalogo privato. Catture desktop/telefono in `.local/previews/shop-product-change-*`.

Log privati in `.local/shop-product-change/`:

- **1.486 test / 205 file passati** (`units.log`): undici nuovi casi del comando/contesto e due HTTP JSON/SQLite, oltre alla suite precedente. Salvataggio e riapertura esatti, sorgente indipendente, pagine inattive, font e proprietà conservati; scelta incoerente respinta senza cambiare archivio.
- **102 casi browser pertinenti distinti passati**: 69 su prodotti/template/varianti/profili/proposte (`regressions-browser.log`), 21 su fissaggi/acquisizioni (`plaque-browser.log`) e dodici su profili/zone (`legacy-browser.log`). I diciotto nuovi casi sono stati ricontrollati dopo l’ultimo ritocco del riepilogo (`final-browser.log`): desktop/telefono, annullamento/riduzione/Undo, font e gruppi, salvataggio/riapertura, scelte obsolete, campi incompleti, vincoli e chiusura durante letture lente. Le due prime prove avevano un’attesa errata nel test dell’ispettore: il popup si chiudeva al cambio di focus, prima del clic. Sequenza di test corretta e poi verificata. La chiusura con Escape di un dialogo aperto da un popup è stata corretta per lasciare l’evento al dialogo, evitando di nasconderne l’antenato.
- **103 campioni JSON/SVG riaperti/esportati** (`artifacts.log`), zero errori browser, richieste esterne o font privati. Cattura del nuovo campione con zero scritture/errori/richieste esterne (`capture.log`); catture desktop/telefono ispezionate. Il collaudo Illustrator richiede ancora verifica umana.
- Build laboratorio e storefront, TypeScript Worker e schemi passati; JavaScript pubblico ancora `index-BG2r_x-8.js`. **13 test della chat pubblica locale passati** (`public-tests.log`); scansioni segreti passate (`secrets.log`, `public-secrets.log`). Nessuna modifica al suo comportamento.
- Audit completo del principale invariato (`archive-audit.log`), HTTP 200, **R639 / 346 template / due composizioni / 219 font / un profilo** (`http-main.log`). Le prove scrivono soltanto in archivi temporanei. Il PDF già cancellato dall’utente resta escluso dall’incremento.

## Passi successivi

Completare i dati tecnici dei prodotti reali: nell’archivio principale rimane un solo profilo, quindi i 398 legami commerciali non equivalgono a 133 prodotti pronti. Poi assistente grafico locale per bozze semplici mediante gli stessi comandi: testo, font disponibili, corpo, colore, allineamento e immagini caricate. Nessuna nuova funzione avanzata di disegno o generazione immagini. Le misure BSS richiedono un adattatore proprio; i prezzi restano successivi al consolidamento delle associazioni. L’amministrazione può proseguire in locale; un server remoto servirà per accessi condivisi e clienti.
