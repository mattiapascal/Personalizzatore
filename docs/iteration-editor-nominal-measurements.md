# Misure nominali dal catalogo reale

14 novembre 2026, dopo `520bf87`; [piano](editor-nominal-measurements-plan.md). Nel profilo produttivo, **Misure del profilo → Per variante Shopify → Leggi misure nominali da Shopify** legge e propone le dimensioni delle varianti. Nessun profilo reale compilato automaticamente e nessuna modifica online.

## Uso e controlli

La proposta confronta nominale e area utile, distingue aree nuove/incomplete, già configurate e personalizzate. Selezionare le righe, scegliere esplicitamente la sagoma delle nuove aree (anche in gruppo), verificare che le misure corrispondano all’area utile e premere **Precompila le aree selezionate nel modulo**. Il pulsante non salva: controllare i campi e poi usare **Salva profilo locale**. Le righe già complete o personalizzate non sono sovrascrivibili dalla proposta; nelle incomplete si conservano i numeri e la sagoma già impostati. Il margine e le zone rimangono fisici e devono entrare in tutte le aree. Una sagoma o geometria incompatibile respinge l’intera precompilazione.

Solo letture esplicite, con query separata dall’adattatore commerciale delle varianti e dalla chat pubblica. ID, fonte, prodotto/varianti, data e paginazione verificati; cache separata, richieste concorrenti deduplicate, massimo tre prodotti simultanei nella proposta. Errori di una lettura non mostrano tabelle parziali. Ogni modifica al modulo invalida proposta e conferma; le risposte tardive non sovrascrivono la nuova versione. I timbri propongono solo la variante primaria scelta dal laboratorio per ciascun prodotto.

I metafield devono essere `number_decimal` positivi entro il limite del foglio; stringhe decimali valide e numeri sono letti senza conversioni presunte. Booleani, oggetti, virgole decimali, zero, valori negativi/fuori limite e tipi diversi restano da verificare. Un decimale non contiene un’unità: la definizione deve corrispondere al contratto esplicito osservato sul negozio, con descrizione «Valore espresso in millimetri.». Definizioni mancanti/cambiate non producono dimensioni numeriche. Nomi, titoli e lati uguali non stabiliscono dimensioni o sagoma.

La provenienza opzionale `variantAreas[].nominalSource` conserva prodotto, fonte, dimensioni nominali e data della lettura. Rimane distinta dalle misure utili editabili: ad esempio il campione ha **nominale 300 × 150 mm e area utile 280 × 150 mm**. I vecchi documenti senza questa proprietà restano validi. Stesso profilo versionato nel documento, stessi comandi manuali/AI, Undo e output; nessuna migrazione SQLite. Fonte attribuita al prodotto sbagliato respinta, anche al salvataggio dopo la verifica delle varianti.

La tabella desktop mostra l’esito accanto al nome; su telefono le righe diventano schede leggibili, con dimensioni e sagoma sulla stessa scheda. Nessun caricamento di misure all’apertura ordinaria del pannello.

## Riscontro sui dati reali

Letti tramite plugin Shopify il dominio del negozio, le due definizioni e la variante del Trodat 4913; le definizioni dichiarano millimetri, il valore è 58 × 22 mm. Stesso risultato dall’endpoint locale. La targa fuoriporta DL non ha i due metafield: nessun formato ricavato dal titolo. La query è stata validata contro Admin GraphQL **2026-10**, con solo scope `read_products`. Riferimenti ufficiali: [metafield della variante](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/productVariant), [definizioni](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/metafieldDefinitions).

Censimento in sola lettura dei **133 prodotti / 496 varianti** già associati: **55 coppie complete su 39 prodotti**, **441 varianti senza entrambi i metafield**, nessuna coppia parziale, definizione cambiata o errore di lettura. Per 94 prodotti non è quindi disponibile una coppia di misure da questi campi. Rilevazione del **14 novembre alle 10:57 UTC**. Dati privati in `.local/nominal-measurements/inventory.json`, aggregati in `inventory.log`; nessuna assegnazione di area utile o compatibilità produttiva dedotta dal censimento. Le altre misure richiedono configurazione esplicita o il futuro adattatore BSS.

## Evidenze e limiti

- **1.473 test / 203 file passati** (`units.log`): dodici casi del lettore/cache, dieci su proposta, provenienza, documenti/comandi e JSON/SQLite, due HTTP nuovi (`http.log`), oltre alla suite precedente.
- **63 casi browser pertinenti distinti passati**: 51 su prodotti/template/varianti/profili/proposte (`browser-final.log`) e dodici precedenti su profili/zone (`legacy-browser.log`). I sette nuovi ricontrollati con la versione finale per telefono, inclusa l’assenza di scorrimento orizzontale, passano (`mobile-final-browser.log`, ricontrollo finale `verified-browser.log`). Un’attesa di test preesistente è stata resa specifica alla notifica di salvataggio, distinta dallo stato simultaneo di lettura delle varianti.
- **102 campioni JSON/SVG riaperti/esportati** (`artifacts.log`), zero errori browser, richieste esterne o font privati. Cattura del nuovo campione con zero scritture/errori/richieste esterne (`capture.log`).
- Build laboratorio e storefront, TypeScript Worker e schemi generati passati; JavaScript pubblico ancora `index-BG2r_x-8.js`. **13 test della chat pubblica locale passati** (`public-tests.log`); scansioni segreti passate (`secrets.log`, `public-secrets.log`).
- Audit completo del principale invariato (`archive-audit.log`), HTTP 200, **R639 / 346 template / due composizioni / 219 font / un profilo** (`http-main.log`). PDF cancellato precedentemente dall’utente escluso dall’incremento.

Il campione `fixtures/illustrator/nominal-measurements.TEST.json/svg` è generato dalla UI con `scripts/capture-editor-shop-selection.ts --nominal-measurements`: Arimo TEST incorporato, area utile distinta dal nominale, secondo prodotto e due viti; nessun dato/font privato o salvataggio reale. Catture amministrative desktop/telefono e canvas ispezionate.

Restano da verificare fisicamente aree utili, sagome, margini e lavorazioni. Una conferma del modulo non certifica produzione o Illustrator. Non sono state create nuove funzioni grafiche avanzate, calcoli prezzi o integrazioni online. Prossimo incremento: cambio prodotto/materiale con anteprima e conservazione della grafica/fissaggi; poi assistente grafico locale semplice.
