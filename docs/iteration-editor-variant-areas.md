# Un profilo, più formati reali

14 novembre 2026, dopo `19734d9`; [piano](editor-variant-areas-plan.md). Il percorso locale prodotto → variante ora risolve misure e sagoma specifiche della variante nello stesso profilo. Nessun profilo o template dell’archivio personale convertito automaticamente.

## Configurazione e comportamento

In **Profili produttivi → Misure del profilo → Per variante Shopify** compare la tabella delle varianti ammesse dal prodotto associato. La lettura aggiornata passa dall’adattatore esistente; ricerca per nome/SKU, numeri direttamente editabili in mm, modo fisso/personalizzato, sagoma e scelta dello schema visuale. La colonna del nome e le intestazioni restano visibili nello scorrimento; i pulsanti non si spezzano. Le prime 100 righe sono navigabili tramite ricerca, senza limitare a 100 le varianti configurabili. Nessuna misura viene estratta dai titoli.

Ogni variante può avere un’area fissa oppure misure personalizzate inserite esplicitamente dal cliente. In quest’ultimo caso i valori amministrativi sono solo il punto di partenza; non è ancora la lettura BSS. I timbri continuano a usare soltanto la variante primaria scelta in amministrazione: nessun selettore del colore del corpo. Le altre regole restano comuni: margine, zone riservate e quote dei fissaggi mantengono i valori fisici in mm. Le zone si disegnano sullo schema della variante scelta e devono entrare in tutte le aree configurate, senza scalature implicite.

Una variante senza configurazione non usa l’area generica e non apre l’editor. Un’area fissa non è modificabile dal pannello targa; quella personalizzata lo è attraverso `configurePlaque`, con gli stessi controlli e Undo. La scelta commerciale usa ancora `setShopSelection`: un cambio incompatibile con la pagina corrente viene respinto senza ridimensionare o cambiare gli oggetti. Il futuro cambio materiale/prodotto con adattamento richiederà un’anteprima esplicita.

`sizeMode: variant` e `variantAreas` sono estensioni opzionali del contratto. I vecchi profili restano validi; risolvere l’area non riscrive lo snapshot, la versione o le altre varianti. I progetti salvati conservano le regole della versione con cui sono nati, anche quando l’amministrazione salva nuove misure. Nessuna migrazione SQLite. Il salvataggio ricontrolla le varianti tramite l’adattatore; configurazioni relative a varianti rimosse/estranee sono respinte. La tabella consente la rimozione esplicita delle configurazioni escluse. Togliendo la tabella, il salvataggio elimina effettivamente il vecchio campo opzionale e ne conserva la copia nello storico.

## Correzioni emerse nel collaudo

La prima integrazione azzerava le misure personalizzate dei profili precedenti quando veniva selezionata la variante. Corretto: nei profili con misure comuni le misure inserite restano; in quelli per variante cambiare variante carica la sua configurazione. Riselezionare la stessa variante non azzera i valori. Le due regressioni desktop/telefono precedenti passano nuovamente. I due nuovi casi cliente sono stati inoltre corretti per aprire effettivamente la modalità cliente e il suo pannello prodotto.

La prima cattura mostrava pulsanti spezzati e nomi che sparivano nello scorrimento orizzontale. Colonna dei nomi bloccata, larghezze minime e pulsanti non spezzabili, poi ricontrollati nella UI. Non è stato modificato l’archivio reale per ottenere le catture.

## Evidenze

- Suite completa **1.418 unitari / 195 file passati** (`.local/variant-areas-verified-units.log`), inclusi nove nuovi casi su geometrie, snapshot, vincoli, JSON/SQLite e storico. La prima esecuzione nel sandbox aveva prove HTTP non completate ed è stata interrotta; riesecuzione con i permessi per le porte locali passata.
- Ulteriori **due nuovi test HTTP reali**, JSON e SQLite, passati (`variant-areas-http.log`): catalogo TEST sostituito nell’adattatore SSR, lettura `refresh=1`, profilo versionato, documento riaperto identico; variante estranea, area incoerente e revisione obsoleta respinte senza cambiamenti. Nessuna chiamata Shopify di questi test. Totale distinto: **1.420 unitari/HTTP**.
- **30 casi browser passati** sul nuovo percorso, prodotti, associazioni e fissaggi (`variant-areas-regressions.log`), di cui sette nuovi. La precedente esecuzione era 13/17 e ha rilevato la regressione delle misure personalizzate e i due casi test impostati nella modalità errata; corretti e ricontrollati.
- Altri **12 casi browser passati** sui profili esistenti, collegamento, zone visuali, sagome e grande formato (`variant-areas-profile-browser.log`): totale **42 browser pertinenti distinti**, non una nuova suite browser generale.
- **99 campioni JSON/SVG riaperti/esportati**, inclusa uguaglianza di profilo e scelta commerciale, zero errori browser, richieste esterne o font privati (`variant-areas-artifacts.log`). **13 test della chat pubblica locale passati** (`variant-areas-public-tests.log`).
- Campione `fixtures/illustrator/variant-areas.TEST.json/svg` generato dalla UI con `scripts/capture-editor-shop-selection.ts --variant-areas`: **200 × 100 mm**, testo Arimo TEST incorporato e due viti, profilo con secondo formato personalizzato. Zero scritture/errori/richieste esterne. Font TEST e licenza in `fixtures/fonts`. Catture amministrative e cliente desktop/telefono in `.local/previews/variant-areas-*`; ispezione visiva eseguita.
- Build laboratorio, storefront e TypeScript Worker passati; JavaScript pubblico ancora `index-BG2r_x-8.js`, scansioni segreti passate. Sei schemi JSON rigenerati dal modello condiviso.
- Principale SQLite **R638** invariato: **346 template, due composizioni, 219 font/218 attivi, un profilo**, checksum dei metadati identico a prima (`variant-areas-archive.json`). Laboratorio riavviato sulla porta 5173 per caricare anche i contratti server; lettura HTTP 200, stessi conteggi/backend. Cancellazione PDF preesistente esclusa dall’incremento.

## Limiti e prossimi passi

Le misure reali richiedono ancora configurazione/verifica amministrativa: nessuna compilazione automatica dai titoli. Le zone sono comuni in coordinate fisiche; uno schema riservato differente per ogni variante richiederà una discussione dedicata se necessario. I test non certificano Illustrator, disponibilità commerciale, accessori o lavorabilità fisica.

Seguire con template associati nel percorso reale e adattamento esplicito, poi cambio materiale/prodotto e fissaggi. Assistente grafico locale per bozze semplici dopo questi collegamenti; prezzi dopo le associazioni come concordato. Nessuna nuova funzione avanzata, generazione immagini AI, funzione multipagina, scrittura al negozio o pubblicazione.
