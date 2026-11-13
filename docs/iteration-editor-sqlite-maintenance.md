# Backup e ripristino della copia locale — 13 novembre 2026

## Risultato

L’archivio principale rimane il JSON sulla porta 5173: **revisione 627, 337 template, due composizioni e 219 font**. La copia SQLite in sola lettura sulla porta 5175 è stata aggiornata alla stessa revisione. Non è stata attivata una migrazione; i progetti, gli ID, il documento grafico e i comandi non cambiano.

Il JSON misura **535.456.964 byte, circa 510,7 MiB**. La copia con le risorse condivise misura **90.738.688 byte, circa 86,5 MiB**, con 296 risorse uniche. Confrontati tutti i 339 record, i 219 font, le impostazioni, i profili, i metadati e le chiavi delle miniature. Esportato il JSON di ripristino e riletto con il vecchio `EditorAdminStore`: stessi contenuti e chiavi, stessa revisione. Questa prova riguarda il volume attuale, ancora entro la capacità del vecchio lettore.

SHA del JSON principale, invariato: `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb`. Copia di riferimento invariata: `e1eef5be1584441990b929df6d07dce950d2cdb21ff5f7a54dcb67635abfb4cf`.

## Manutenzione senza attivazione

`npm run editor:storage --` accetta ora anche:

```sh
# Percorsi di esempio: scegliere destinazioni nuove, in cartelle separate.
npm run editor:storage -- inspect --source .local/copia/archive.sqlite
npm run editor:storage -- backup --source .local/copia/archive.sqlite --output .local/backup-nuovo/archive.sqlite
npm run editor:storage -- restore --source .local/backup-nuovo/archive.sqlite --output .local/ripristino-nuovo/archive.sqlite
npm run editor:storage -- export --source .local/backup-nuovo/archive.sqlite --output .local/ritorno-json/state.json
```

`restore` produce un nuovo file indipendente. Non sostituisce un archivio in uso e non cambia la configurazione del server. Restano disponibili `prepare` e `verify` del precedente incremento. Il sorgente deve essere esplicito; destinazioni esistenti, journal preesistenti, percorsi nell’archivio attivo e alias delle cartelle protette sono rifiutati. Anche preparazione ed esportazione usano ora la verifica dei percorsi reali.

Il backup usa l’[API nativa Node SQLite](https://nodejs.org/download/release/v24.9.0/docs/api/sqlite.html#sqlitebackupsourceDBpathoptions), basata sul [backup online SQLite](https://www.sqlite.org/backup.html). Include i commit nel WAL ed esclude le transazioni incomplete. La copia viene chiusa, verificata, sincronizzata e pubblicata senza sovrascritture; permessi 0600. L’originale è aperto in sola lettura; questo non impedisce a un altro processo autorizzato di aggiornarlo durante il backup.

La verifica completa controlla checksum, risorse, collegamenti tra risorse e progetti/font, ordinamento, assenza di risorse orfane, schema, corrispondenza degli indici e chiavi miniature. Rimane un’operazione di manutenzione esplicita: non viene ripetuta integralmente a ogni lettura del frontend.

La nuova prova sul WAL ha evidenziato un limite del precedente controllo dell’esportazione JSON: il solo hash del file principale non rileva tutti i commit nel journal. Esportazione e confronto verificano ora anche la generazione della connessione/revisione. Se cambia durante la lettura, il risultato viene rifiutato. I test riproducono un commit concorrente lasciando identico il file principale. Il backup nativo offre invece uno snapshot coerente e collaudato anche in presenza di commit concorrenti.

Errori ordinari non pubblicano il file finale e rimuovono il temporaneo. Un arresto forzato del processo può lasciare un file con suffisso `.backing-up-…`, che non è un backup pronto: il test interrompe realmente un processo figlio al primo avanzamento e controlla l’assenza della destinazione finale.

## Prove sui dati e sul volume

Il backup reale R627 e il suo ripristino indipendente hanno entrambi 339 record, 219 font, 296 risorse e contenuto semantico `cd120bff52978c4e7a5dcf30c82ec154bd09d8a3538ae3e5e5c318859758c75c`. File verificati da connessioni nuove; manifest e JSON di ritorno in `.local/editor-storage-trial/20261113-r627/`.

`npm run editor:storage:volume` crea esclusivamente dati sintetici in una directory temporanea propria: **809 progetti, 545.344.657 byte logici**, una risorsa immagine condivisa. Database circa 2,6 MiB; backup, ripristino e JSON esportato completi e confrontati. Il vecchio lettore rifiuta esplicitamente il JSON oltre 512 MiB; i singoli progetti restano portabili. Una modifica delle impostazioni non riscrive progetti o risorse. Il test non accede all’archivio personale e pulisce i propri file. Rapporto `.local/editor-storage-volume-report.json`.

Questa prova supera il precedente limite della stringa JSON monolitica quando le risorse sono condivise. **Il limite fisico SQLite locale rimane 512 MiB**: non è una promessa di capacità illimitata né un collaudo di altrettante risorse tutte differenti. Oltre la capacità del vecchio lettore, il ritorno va pianificato tramite backup/ripristino SQLite, non promettendo un ripristino JSON che il vecchio sistema non può leggere.

## Editor e API reali sulla copia

- **40 template:** miniature tecniche visibili; secondo passaggio con zero riletture dei record e zero rasterizzazioni. Dettagli con supporti/fissaggi ispezionati.
- **Otto documenti, 44 pagine:** navigazione, misure per pagina, font, miniature e contenuti conservati, senza scritture.
- **Sei importazioni recenti:** riaperti i quattro Passo Carrabile e le due etichette, oggetti e file font identici; conferma disabilitata nella copia in sola lettura, nessun avviso font o errore.
- Su un’ulteriore copia scrivibile, **Consulente del lavoro**: X modificata dall’ispettore, Undo/Redo, conferma e riapertura. Revisione 627 → 628 e versione 1 → 2; gli altri 338 record, i 219 font e i metadati invariati.

- Sulla stessa copia, font archiviato e ripristinato via API: revisione 628 → 630, richiesta obsoleta rifiutata con 409. File del font, tutti i 339 record, le risorse e le altre 218 righe font invariati.

Il server di prova scrivibile è stato arrestato dopo il collaudo. La copia in sola lettura resta separata su `http://127.0.0.1:5175/editor/admin?section=template`; il normale lavoro continua su `http://127.0.0.1:5173/editor/admin?section=template`.

## Verifiche automatiche

**967 unitari in 145 file**, inclusi dieci nuovi casi di manutenzione; **23 browser pertinenti**, **13 browser pubblici** e **59 campioni JSON/SVG** passati. Build locale e pubblica, pacchetto Worker dry-run, runtime Worker locale e scansioni segreti passati; bundle pubblico invariato `index-BG2r_x-8.js`. Nessuna nuova suite generale browser o prova Illustrator.

Un controllo intermedio della build si era fermato sull’annotazione `this` mancante in un nuovo mock del test WAL; corretta nel test e ripetuti i controlli. Il primo script privato delle operazioni font aveva una parentesi mancante ed è terminato prima dell’esecuzione; corretto senza modificare il prodotto.

Log privati con prefisso `.local/sqlite-maintenance-` e `.local/sqlite-r627-`. Nessun deploy, costo AI o scrittura sul negozio, tema, BSS, PitchPrint, prezzi, carrello o checkout.

## Passo successivo

Prima di proporre l’attivazione servono ancora selezione e ritorno del backend del laboratorio completo, gestione esplicita degli strumenti di manutenzione e prova su un’ulteriore copia. La configurazione `storage-trial` esclude alcune API e non va spacciata per quella di attivazione. L’archivio principale resta sul JSON; ulteriori importazioni consistenti aspettano la procedura verificata e l’autorizzazione prevista da AGENTS.md. Restano 16 sorgenti prioritari: i sette primi piani aspettano la scelta del ruolo produttivo; gli altri richiedono font/simboli esatti o supporto grafico ancora da completare.
