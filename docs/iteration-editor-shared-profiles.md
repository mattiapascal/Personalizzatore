# Profili condivisi fra più prodotti

14 novembre 2026, dopo `54f78d5`; [piano](editor-shared-profiles-plan.md). L’amministrazione locale può associare esplicitamente più prodotti Shopify allo stesso profilo produttivo. Regole comuni senza duplicare un profilo per ogni supporto/formato; nessun dato tecnico reale inventato o salvato automaticamente.

In **Profili produttivi**, aprire un profilo e usare **Aggiungi prodotto al profilo**, poi scegliere prodotto e varianti dal catalogo. Il salvataggio è esplicito. In **Misure del profilo → Per variante Shopify** la tabella distingue prodotto e variante e permette aree fisse/personalizzate e sagome diverse. Si può cercare anche per prodotto; margine e zone restano comuni, fisici e validati in tutte le aree. Profili con zone produttive differenti richiedono ancora configurazioni separate.

Il frontend riconosce lo stesso profilo dal percorso di ciascun prodotto, conservando nel documento prodotto/variante e versione. Font, testo, geometria e fissaggi passano ancora dai comandi canonici; nessun nuovo strumento grafico. Nei timbri ogni prodotto usa la variante primaria del laboratorio: nessuna scelta del colore del corpo. Il server la mantiene anche se Shopify riordina le varianti.

Il campo opzionale `shopBindings` è alternativo al singolo `shopBinding` storico. Nessuna migrazione SQLite e nessuna riscrittura dei documenti esistenti; snapshot, storico e font rimangono portabili. Rimuovere un prodotto conserva le aree obsolete finché l’amministratore non le elimina esplicitamente; un salvataggio incoerente viene respinto. Rimuovere tutte le associazioni disattiva invece la modalità per variante. Tornare al formato singolo elimina realmente l’elenco opzionale, conservandolo nello storico.

Il server rilegge tutti i prodotti, con al massimo tre letture simultanee, prima di scrivere. Appartenenza delle varianti, fonte, primaria, duplicati e aree sono controllati; errori di rete/dati o revisione obsoleta non provocano salvataggi parziali. Nomi e data provengono dal catalogo. Le nuove varianti richiedono un nuovo salvataggio della configurazione «Tutte le varianti», creando una versione esplicita: una variante estranea non passa attraverso quel flag nei nuovi documenti. Conservata la compatibilità del vecchio collegamento al catalogo storico privo di elenco verificato.

I selettori chiusi non montano più il catalogo: nessuna lettura o lista invisibile per ogni prodotto del profilo. Cambiare associazioni invalida la tabella precedente prima della lettura; nessuna tabella parziale se un prodotto non risponde. Durante il collaudo questo ha corretto un errore reale alla rimozione di un prodotto: le sue varianti precedenti venivano ancora lette nel render successivo.

## Collaudo

- **1.449 test / 200 file passati**, inclusi otto nuovi casi e quattro HTTP (due nuovi) su JSON/SQLite: appartenenza, fonte, nuove varianti, primaria, errori atomici, storico, snapshot e comandi manuali/AI. Log `.local/shared-profiles/units.log`; prova HTTP separata in `http.log`.
- **56 casi browser pertinenti distinti passati** fra le esecuzioni: 43 percorsi prodotto/template/aree/profili condivisi (`browser-verified.log`), dodici regressioni precedenti su profili/zone (`legacy-browser.log`) e un ulteriore caso sull’ordine di selezione delle varianti. Gli otto casi condivisi ricontrollati dopo l’ultima correzione passano (`order-browser.log`). Non una nuova suite browser generale.
- Corretto anche l’abbinamento provvisorio nome/ID delle varianti quando selezionate in un ordine diverso da quello del catalogo; primaria conservata e liste canoniche al salvataggio, verificati nella UI.
- **101 campioni JSON/SVG riaperti/esportati** (`artifacts.log`), zero errori browser, richieste esterne o font privati. Cattura del campione nuovo senza scritture/errori/richieste esterne (`capture.log`).
- Build laboratorio, storefront e TypeScript Worker passati; scansioni segreti passate, JavaScript pubblico sempre `index-BG2r_x-8.js`. Sei schemi JSON rigenerati. **13 test della chat pubblica locale passati** (`public-tests.log`).
- Audit completo del principale ripetuto in sola lettura (`archive-audit.log`), HTTP 200 con R639 e gli stessi conteggi dopo il riavvio del laboratorio (`http-main.log`). Cancellazione PDF preesistente esclusa dall’incremento.

Le prove browser usano archivi temporanei e catalogo/font TEST, con richieste esterne bloccate. Il campione portabile è `fixtures/illustrator/shared-profiles.TEST.json/svg`, generato dalla UI con `scripts/capture-editor-shop-selection.ts --shared-profile`: secondo prodotto, foglio 300 × 150 mm, testo Arimo TEST incorporato e due viti. Catture desktop/telefono ispezionate; dati privati e archivio principale non usati per generare il campione.

## Stato e prossimo incremento

L’archivio principale resta **R639**, con 346 template, due composizioni, 219 font e un solo profilo reale. Il nuovo contratto non compila le misure mancanti e non rende automaticamente pronti i 133 prodotti associati. Audit ripetuto contro il backup verificato: grafica, miniature, profili, font, risorse e composizioni invariati; restano i 290 template/398 legami già recuperati.

Proseguire con acquisizione assistita e verifica delle misure nominali dai metafield, senza confonderle con l’area produttiva verificata; poi cambio prodotto/materiale con anteprima e regole dei fissaggi. Assistente grafico locale per bozze semplici sullo stesso documento dopo questi collegamenti. Prezzi nella fase successiva concordata, con recupero del Preventivometro dove applicabile. Nessun deploy, cambio al negozio/chat pubblicati, nuova funzione grafica avanzata o certificazione Illustrator/produzione.
