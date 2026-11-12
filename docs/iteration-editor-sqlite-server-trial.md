# Server locale su copia SQLite — 12 novembre 2026

## Risultato e confini

Il prototipo SQLite è ora collegato alle vere API del laboratorio in una configurazione separata. **Il server principale sulla porta 5173 continua a usare il JSON esistente. Nessuna migrazione o attivazione dell’archivio corrente.**

La copia in sola lettura è consultabile su `http://127.0.0.1:5175/editor/admin?section=template`. Mostra un avviso esplicito nell’amministrazione e nell’area di disegno; si possono aprire, modificare temporaneamente ed esportare i documenti, mentre conferma e salvataggio nell’archivio sono bloccati anche lato server. La copia non riceve automaticamente modifiche successive dell’archivio principale.

## Implementazione

- `editor-admin-runtime.ts` seleziona esclusivamente il backend richiesto: JSON predefinito o file SQLite di copia esplicito. Rifiuta file mancanti, percorsi nella cartella attiva e collegamenti fisici; non crea o scopre silenziosamente un database. Le API amministrative e il resolver dei font PitchPrint condividono la stessa istanza configurata.
- Indice, singolo progetto, singolo font, backup font e anteprima del ripristino usano letture specifiche. L’anteprima del ripristino legge insieme revisione e libreria, senza ricostruire i progetti. Import Google e risoluzione dei font rispettano la libreria selezionata; identità/hash e politica senza fallback conservati.
- Chiusura del runtime dopo la coda dei comandi, rilascio delle cache e chiusura SQLite. Un test controlla che la vecchia cache JSON venga liberata senza alterare il file. Una precedente istanza del server principale è terminata per heap esaurito dopo vari riavvii; è stata riavviata con il normale limite. Non è dimostrata la risoluzione di ogni possibile causa di crescita della memoria.
- Configurazione Vite condivisa, con backend e confini della prova espliciti. Cache delle dipendenze distinte per copia e modalità: il primo avvio simultaneo aveva prodotto risposte 504 «Outdated Optimize Dep» perché i server condividevano la cache. Il problema è stato riprodotto e la separazione verificata.
- La prova esclude API della chat e flussi di configurazione/carrello, modifiche alle librerie media e aggiornamenti delle associazioni PitchPrint. Restano consultabili le risorse e disponibili analisi font e conversioni grafiche locali. La configurazione della prova non è una configurazione di attivazione del sistema completo.
- Nessuna modifica al documento grafico canonico o al suo schema persistente. L’indicazione dell’ambiente è solo metadato della risposta HTTP. Stessi comandi manuali/AI, validatori, ID, revisioni e Undo/Redo.

## Avvio esplicito

Con Node della `.nvmrc`, dopo aver preparato una copia tramite gli strumenti dell’incremento precedente:

```sh
EDITOR_STORAGE_TRIAL_SQLITE=.local/editor-storage-trial/20261112/archive.sqlite npm run editor:storage-trial
```

La modalità predefinita è sola lettura. `EDITOR_STORAGE_TRIAL_WRITABLE=1` abilita scritture soltanto nel file di copia indicato; per i collaudi è stata usata un’ulteriore copia indipendente, poi il relativo server è stato fermato. Non usare il file della prova in sola lettura come destinazione di test di scrittura.

## Dati reali verificati

- **34 template** con materiali, cornici, viti, datari, targhe e numeri civici: immagini visibili; secondo passaggio con **zero riletture dei record e zero rasterizzazioni**. Le ricerche con titoli parzialmente uguali riscaldano prima tutte le righe corrispondenti, per distinguere l’effettivo riuso dalla generazione iniziale di altre miniature.
- **Otto documenti multipagina, 44 pagine**: ogni miniatura seleziona la pagina corretta e conserva formato, oggetti, gruppi, font e stato del progetto; conferma disabilitata nella copia in sola lettura. Zero errori browser e scritture.
- Sull’ulteriore copia scrivibile, «Consulente del lavoro»: modifica manuale della X, Undo/Redo, conferma, ritorno in amministrazione e riapertura con la modifica salvata. Verificate versione del record e revisione dell’archivio, **327 altri record, 219 font e metadati invariati**. Un primo controllo attendeva cinque secondi e ha interrotto il browser dopo una scrittura riuscita; il ricontrollo con attesa di completamento è passato dalla revisione 617 alla 618 e dalla versione 2 alla 3. Non è una misura di latenza o una prova di salvataggi sempre sotto cinque secondi.
- Archivio principale ancora **326 template, due composizioni, 219 font, revisione 616**. SHA-256 JSON `ef57cdb7a67345286810521fc3a6c949e32111cabf8fc4380d1f2e32d1945c56`; copia di base `afb4d15927880fb2900476af9b77bfac48a5da41151ec1df1788bcde7060446e`. Entrambi identici prima/dopo.

Rapporti privati in `.local/editor-storage-trial/20261112/server-previews/report.json`, `server-books/report.json` e `server-writable/report.json`; schermate dell’amministrazione e dell’editor ispezionate. File di progetto e font privati esclusi da Git.

## Verifiche automatiche

**929 unitari / 139 file** passati nell’esecuzione finale. Otto nuovi casi verificano runtime, selezione esplicita, collegamenti/percorso, rilascio cache, separazione cache Vite e vere API HTTP JSON/SQLite. Il test del resolver usa un JSON esca con font omonimo e ID differente: legge la libreria selezionata, non quella esca. Provati upload, archiviazione, eliminazione/ripristino font, conflitto 409 e analisi consentite in sola lettura.

Build locale/pubblica, runtime Worker e scansioni segreti passati. Bundle pubblico invariato `index-BG2r_x-8.js`; **13 browser pubblici** passati. **62 browser pertinenti completi** passati, inclusi archivio JSON, backup font, multipagina, anteprime e i tre casi SQLite manuale/AI/cache. **54 campioni JSON/SVG** riaperti ed esportati, zero errori o richieste esterne. Nessun nuovo collaudo Illustrator o suite browser generale.

Log: `.local/sqlite-server-unit-final.log`, `sqlite-server-build-final.log`, `sqlite-server-pertinent-browser.log`, `sqlite-server-public-browser.log`, `sqlite-server-release-checks.log`, `sqlite-server-artifacts-final.log`.

Il primo controllo dei campioni era terminato per timeout di avvio. Il ricontrollo caldo è passato, poi l’ispezione del verificatore ha individuato una sovrapposizione di route Playwright: il filtro generale usava `continue` e saltava la fixture amministrativa registrata prima, caricando la libreria reale. Corretto in `fallback` e ripetuti tutti i 54 campioni: tre letture della fixture, **zero richieste ai file font dell’archivio personale**, zero errori. Il controllo ora impone questi invarianti.

La porta predefinita della copia è 5175, distinta dalla 5174 dei test della chat pubblica; la separazione evita di riutilizzare per errore il server della prova durante le regressioni pubbliche.

## Prossime attività

Restano **27 sorgenti prioritari** da recuperare con fedeltà grafica, distinti dai problemi di persistenza. Nessun template nuovo importato in questo incremento. Tornare ai blocchi grafici della coda, mantenendo la copia disponibile per prove.

Prima di proporre una migrazione reale occorrono una procedura rivedibile di selezione/ritorno, gestione coerente degli strumenti CLI di manutenzione ancora esplicitamente JSON, backup/ripristino SQLite e gestione del volume logico futuro oltre il tetto del vecchio lettore. La prima mutazione su un server appena aperto può ancora richiedere il caricamento dello stato amministrativo: le letture selettive non equivalgono a un reducer completamente incrementale. Attivazione distinta, soggetta all’autorizzazione richiesta da AGENTS.md.

Nessun deploy, generazione immagini AI o modifica Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout. Chat pubblicata preservata.
