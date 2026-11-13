# Selezione e ritorno espliciti dell’archivio locale — 13 novembre 2026

## Risultato e ambito

Il laboratorio completo può essere avviato con un archivio JSON o SQLite dichiarato esplicitamente. **`npm run dev` continua a usare il JSON principale**; nessuna variabile privata, configurazione del servizio in uso o archivio reale è stata sostituita. La configurazione della copia in sola lettura sulla porta 5175 resta disponibile.

Il nuovo comando usa una configurazione alternativa sulla porta **5177**, con backend e percorso obbligatori. Un errore non crea un archivio vuoto e non provoca un fallback all’altro backend. SQLite deve essere già preparato; per JSON serve una directory esistente con `state.json` indipendente, entro la capacità del vecchio lettore. Le cache Vite sono distinte per configurazione e modalità.

```sh
# Esempi su copie preparate; non sono un comando di migrazione del principale.
EDITOR_ARCHIVE_BACKEND=sqlite EDITOR_ARCHIVE_PATH=.local/copia/archive.sqlite npm run editor:archive
EDITOR_ARCHIVE_BACKEND=json EDITOR_ARCHIVE_PATH=.local/ritorno-json npm run editor:archive
```

Il runtime distingue ora l’archivio SQLite scelto per il laboratorio completo dalla modalità `sqlite-copy`. In questa seconda modalità rimangono i vincoli della prova e l’avviso di copia. Il laboratorio completo conserva i plugin precedenti: gli altri archivi locali di configurazioni e media non vengono convertiti. I test controllano la presenza dei plugin; non sono un collaudo commerciale delle integrazioni Shopify/BSS.

L’amministrazione indica «archivio JSON» oppure «archivio SQLite» nel riepilogo. La risposta HTTP dello snapshot SQLite completo aggiunge `backend: 'sqlite'` e l’intestazione `X-Editor-Archive-Mode: sqlite`; il normale JSON mantiene il precedente contratto HTTP. Questo è metadato di runtime: percorsi e scelta del backend non entrano nel JSON persistente, nei documenti grafici o nei file produttivi. Nell’editor del cliente non compare una nuova informazione tecnica sul backend.

## Ritorno senza perdere le modifiche

Non basta riavviare il vecchio JSON: dopo nuovi salvataggi SQLite sarebbe una revisione precedente. Il percorso collaudato è:

1. Concludere i salvataggi e fermare il server che usa la copia SQLite.
2. Esportare quella revisione tramite `editor:storage export` in una nuova directory, senza sovrascrivere il vecchio archivio.
3. Verificare il JSON esportato contro SQLite tramite `editor:storage verify`.
4. Avviare il laboratorio completo con backend JSON e quella directory esplicita.
5. Verificare revisione, contenuti e riapertura prima di considerare concluso il ritorno.

Le destinazioni nuove e i backup seguono le [regole di manutenzione](iteration-editor-sqlite-maintenance.md). Il lettore JSON conserva il limite di 512 MiB; il selettore lo controlla prima del caricamento, con una prova su file sintetico sparso. Oltre quel volume il ripristino rimane SQLite: non viene promesso un ritorno JSON illeggibile.

## Prova effettiva sulla copia corrente

Preparata un’ulteriore copia R627 dei 339 progetti e 219 font. Sul laboratorio completo con backend SQLite: modifica della X di un testo di «Consulente del lavoro», Undo/Redo, conferma e riapertura. Revisione **627 → 628**, versione **1 → 2**; gli altri **338 record, tutti i font e i metadati invariati**. Nessuna seconda fonte dello stato grafico.

Fermato quel server ed esportata R628: **535.456.964 byte**, SHA `46fa722b54cac1a78d28538da5ddec39d52f85293b69ae7286d12a96c45421cb`. Confrontati di nuovo tutti i 339 record, i 219 font, metadati e chiavi miniature contro la copia SQLite aggiornata. Poi riavviato sulla porta 5177 con il JSON esportato: snapshot identico, stessa revisione 628, modifica salvata e font conservati nell’editor, nessun errore o scrittura durante la verifica. Schermata ispezionata. Anche il server JSON temporaneo è stato fermato.

L’archivio principale resta **R627, 337 template e due composizioni**, SHA `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb`; copia di riferimento R627 SHA `e1eef5be1584441990b929df6d07dce950d2cdb21ff5f7a54dcb67635abfb4cf`, entrambi invariati. Dati e rapporti privati in `.local/editor-storage-selection/20261113/`, log con prefisso `.local/archive-selection-`.

## Test e limiti

Sei nuovi unitari verificano selezione obbligatoria, file assenti/corrotti, assenza di fallback al JSON esca, uso esplicito anche della cartella attiva in ambiente TEST, collegamenti fisici, volume JSON, ritorno aggiornato e plugin/cache. Il test HTTP completo ripete le operazioni del test della copia: upload multiplo font, download, backup/ripristino, resolver dalla stessa libreria, record, archiviazione/eliminazione e conflitti. Un JSON esca con ID font differenti resta invariato.

**974 unitari in 146 file**, **13 browser pertinenti e 13 pubblici** passati, build locale/pubblica, pacchetto Worker dry-run e scansioni segreti. Bundle pubblico invariato `index-BG2r_x-8.js`. I 59 campioni JSON/SVG e il runtime Worker erano già stati verificati nel precedente incremento di manutenzione; non sono stati rieseguiti dopo questa selezione. Nessuna nuova suite generale browser o certificazione Illustrator. Un controllo TypeScript intermedio ha evidenziato che `react()` può restituire un array di plugin: il test ora confronta i nomi dopo `flat()`, senza modificare i plugin del prodotto.

La suite con 974 casi ha avuto un timeout nell’unione dei contorni mentre erano in corso altri controlli; il limite di dieci secondi non è stato aumentato. Il log iniziale fallito è conservato in `.local/archive-selection-unit-final.log`; il ricontrollo completo separato è in `archive-selection-unit-recheck.log`. La concorrenza è un contesto osservato, non una causa certificata.

## Prossimo passo prima dell’attivazione

Il comando storico `pitchprint:fonts` legge ancora esplicitamente il JSON e deve essere coordinato con la selezione del backend prima di proporre una migrazione. Anche gli script privati dei precedenti lotti non vanno riutilizzati presumendo che abbiano cambiato archivio. Preparare le operazioni di importazione successive sul runtime scelto, con backup nativo e controlli delle revisioni; poi presentare il passaggio concreto per l’autorizzazione prevista da AGENTS.md. Non attivare implicitamente il backend SQLite sul principale.

Restano 16 template prioritari; nessuno aggiunto in questo incremento. Gli ostacoli grafici/font e la scelta del ruolo dei sette primi piani restano distinti dalla persistenza. Nessun deploy o modifica Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout; nessun costo AI.
