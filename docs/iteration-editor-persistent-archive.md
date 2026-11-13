# Scelta persistente dell’archivio e proposta pronta — 13 novembre 2026

## Risultato

Il normale `npm run dev` e il censimento font senza opzioni esplicite possono ora condividere un registro privato della scelta dell’archivio. **Il principale è ancora sul JSON R627:** il registro reale non è stato creato e nessuna migrazione è stata attivata.

La copia candidata contiene gli stessi **337 template, due composizioni e 219 font**. Confronto completo dei dati e della revisione riuscito. Il JSON misura **535.456.964 byte (510,7 MiB)**; SQLite **90.738.688 byte (86,5 MiB)**, con 296 risorse uniche. Il passaggio libera il collo di bottiglia della stringa JSON monolitica, senza cambiare documenti, ID, comandi grafici o file produttivi.

## Registro, avvio e censimento

Il registro risiede in `.local/editor-admin/archive-selection/active.json`. Solo l’assenza dell’intera directory mantiene il comportamento storico JSON. Directory incompleta, configurazione corrotta, file mancante, progetto diverso o identità errata bloccano l’avvio: nessun ripiego sul vecchio archivio. I file di controllo sono piccoli e letti con un budget esplicito; non contengono segreti.

Il registro conserva backend, percorso canonico, identità, data e checkpoint della verifica iniziale. La revisione registrata è storica: i normali salvataggi successivi restano validi e non richiedono di riscrivere la selezione. Il censimento predefinito segue lo stesso registro; `--sqlite-file`, `--library-dir` e l’avvio alternativo rimangono scelte esplicite per i collaudi.

La cache del catalogo commerciale del laboratorio completo rimane nel percorso precedente `.local/editor-shop-catalog.json`, anche quando cambia il file grafico. Le copie `storage-trial` conservano la loro cache separata. Configurazioni cliente e librerie media non vengono migrate.

Un controllo locale verifica la scelta prima delle richieste alle API. Se un processo è partito con un registro precedente, le letture e i salvataggi sono rifiutati con **409 `archive_selection_changed`** e richiesta di riavvio. Questo copre anche un vecchio server ancora aperto dopo un cambio; il test prova che non scriva sul JSON precedente. La chat pubblicata usa un’altra configurazione e rimane separata.

## Comandi e garanzie

```sh
npm run editor:selection -- inspect
npm run editor:selection -- prepare --backend sqlite --path .local/copia/archive.sqlite --output .local/proposte/passaggio.json
# Solo dopo autorizzazione e arresto del server che scrive:
npm run editor:selection -- apply --plan .local/proposte/passaggio.json
# Recupero di un’operazione di controllo interrotta, con proprietario non più attivo:
npm run editor:selection -- recover
```

`prepare` non cambia la selezione. Controlla i due archivi, compresi risorse SQLite, indici, progetti, font, metadati, ordine e revisione. La proposta riporta identità, hash dei file/WAL e contenuto semantico; se i dati differiscono viene rifiutata.

`apply` richiede il server sulla porta 5173 fermo; `--port` serve ai collaudi su altre porte. Devono essere conclusi anche gli altri processi che scrivono sugli stessi file. Dopo un blocco esclusivo vengono ripetuti il confronto completo, il controllo dei token e degli hash; la porta viene controllata nuovamente prima della pubblicazione atomica del registro. Un vecchio piano o una modifica concorrente non autorizzano il passaggio. Non vengono copiati, sovrascritti o cancellati archivi e non viene avviato un server automaticamente.

Il recupero riguarda soltanto i file di controllo: verifica che il proprietario del blocco sia terminato e che il registro corrisponda allo stato precedente o a quello già pubblicato. Conserva la scelta corretta e non ripristina dati. Un blocco corrotto o uno stato estraneo richiedono ispezione, senza rimozione automatica. I normali errori della prima applicazione puliscono la directory vuota, lasciando invariato l’avvio storico.

Per tornare a JSON occorre esportare la revisione SQLite corrente in una nuova directory, verificarla e preparare/applicare una nuova proposta JSON. **Non cancellare il registro per riaprire il vecchio file.** Il limite del lettore JSON di 512 MiB resta vincolante; oltre quel volume usare il backup/ripristino SQLite già collaudato.

## Proposta reale pronta, non applicata

File privati:

- Candidato: `.local/editor-storage-ready/20261113-r627/archive.sqlite`.
- Proposta: `.local/editor-storage-ready/20261113-r627/selection-plan.json`.
- Sorgente conservato: `.local/editor-admin/state.json`.
- Backup SQLite verificato: `.local/editor-storage-trial/20261113-r627/backup/archive.sqlite`; anche il ritorno JSON della stessa revisione è già stato riletto nel precedente incremento.

Sorgente SHA `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb`; candidato SHA `67c7c0dc87feb47796c791955f2fd67b189f2e2bf77f88674d4f9bfc25b0dbde`. Contenuto semantico comune `cd120bff52978c4e7a5dcf30c82ec154bd09d8a3538ae3e5e5c318859758c75c`, revisione 627. Il candidato è distinto dal file della prova in sola lettura sulla porta 5175 e dalla copia usata per scrivere nei test.

L’autorizzazione è necessaria per applicare la proposta al laboratorio principale: [AGENTS.md](../AGENTS.md), workflow 6, «Chiedi approvazione prima di azioni esterne, spese, migrazioni o deploy». Dopo l’eventuale consenso occorre fermare il solo server principale, ricontrollare il piano, applicarlo e riavviare normalmente. Se i dati sono cambiati nel frattempo, il piano viene rifiutato; nessuna sostituzione con una copia vecchia.

## Prove effettive

Dodici nuovi casi verificano proposta senza scritture, registro condiviso con il censimento, cambi concorrenti sui dati, configurazione mancante/corrotta, target assente, sorgente contraffatto, applicazioni concorrenti, server attivo, recupero prima/dopo pubblicazione, proprietario vivo, rifiuto dei salvataggi del vecchio processo, cache catalogo e CLI effettivo. Provato anche SQLite → modifica → esportazione → nuovo JSON → scelta persistente, mantenendo la revisione aggiornata.

Un’ulteriore copia R627 completa è stata collegata **alla vera `vite.config.ts` ordinaria**, eseguita con un registro TEST separato. «Consulente del lavoro»: modifica della X, Undo/Redo, conferma e riapertura, **627 → 628**, versione **1 → 2**. Gli altri **338 record, tutti i 219 font e i metadati invariati**. Arrestato e riavviato il server della prova senza riscegliere il backend: snapshot R628 identico, modifica conservata e vecchio JSON esca ignorato. Zero errori/avvisi font e nessuna scrittura durante la verifica finale; schermata ispezionata. Entrambi i server temporanei sono stati fermati. Il principale e la copia candidata non sono stati modificati.

Rapporti privati in `.local/editor-storage-ready/20261113-r627/ui-test/`, registro TEST sotto `ui-root/`, log `.local/persistent-archive-*`. Queste prove isolate non costituiscono un’attivazione sul principale.

## Verifiche e limite osservato

**1.000 unitari in 148 file**, **13 browser pertinenti e 13 pubblici** passati. Build locale/pubblica, pacchetto Worker dry-run e scansioni segreti passati; bundle pubblico invariato `index-BG2r_x-8.js`. Il runtime Worker e i 59 campioni grafici erano già stati verificati nei precedenti incrementi, non rieseguiti qui. Nessuna certificazione Illustrator.

La prima suite completa aveva **999/1.000** per il timeout nel test pesante dell’unione dei contorni. Isolato: **11/11** in 2,9 secondi. Suite con quattro worker: **1.000/1.000**; ora il runner limita la concorrenza a metà delle CPU disponibili, massimo quattro. Ripetuta la suite con la configurazione ordinaria: **1.000/1.000**. Il limite del prodotto di dieci secondi e i casi non sono stati allentati. La contesa è il contesto osservato, non una diagnosi quantitativa di ogni possibile timeout. Log iniziale fallito conservato in `persistent-archive-unit.log`; ricontrolli in `persistent-archive-contour-recheck.log`, `persistent-archive-unit-four-workers.log` e `persistent-archive-unit-final.log`.

## Stato e prosecuzione

Restano **16 template prioritari**; nessuno importato in questo incremento. La proposta permette di chiedere ora l’autorizzazione al passaggio del solo archivio locale. I sette primi piani richiedono ancora la scelta del ruolo; i casi grafici/font rimangono distinti dalla persistenza. Nell’attesa si possono proseguire le funzioni grafiche e le conversioni diagnostiche senza salvare altri lotti nel JSON quasi pieno.

Nessun deploy, costo AI o modifica al negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout. Multipagina già autorizzato preservato, nessuna generazione immagini AI.
