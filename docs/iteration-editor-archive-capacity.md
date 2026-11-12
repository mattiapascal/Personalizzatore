# Capacità dell’archivio locale — 12 novembre 2026

Il lotto dei template ha superato il precedente tetto di 256 MiB. Il controllo ha fermato il salvataggio senza alterare l’archivio; archiviare un record non libera i byte incorporati e quindi il messaggio precedente era fuorviante. Il prototipo ora accetta un archivio fino a **512 MiB** e dichiara esplicitamente quando non può salvarlo. Il limite della sola libreria font rimane 64 MiB. Nessuna migrazione del formato, modifica a file online o aumento dell’heap di Node.

## Letture e scritture

`EditorAdminReadCache` conserva uno snapshot validato per identità del file: dispositivo, inode, byte, mtime e ctime a nanosecondi. Richieste concorrenti condividono la stessa lettura/validazione. Il limite viene verificato prima di leggere il file. Cambiamenti durante il caricamento causano una nuova lettura; JSON corrotto produce un errore, senza restituire silenziosamente i dati precedenti.

Le risposte `read()` copiano i contenitori JSON mutabili; stringhe identiche dei font e delle immagini sono condivise soltanto in RAM. File, ID, digest e contenuto serializzato rimangono invariati. Nessun chiamante riceve i contenitori della cache interna.

Le scritture restano in coda nell’istanza del backend. Prima della rinomina atomica viene ricontrollata l’identità del file di partenza; se è cambiata durante una verifica asincrona, il temporaneo viene eliminato e viene richiesto di rileggere. La cache viene invalidata dopo il salvataggio. Questo controllo non equivale a un database con transazioni distribuite o a un blocco esclusivo fra processi indipendenti: la destinazione resta il server di sviluppo locale.

## Prove eseguite

Otto nuove regressioni coprono letture concorrenti, corruzione e recupero, modifica durante il caricamento, file oltre capacità rifiutato prima della lettura, copie indipendenti, scrittura da altra istanza durante una verifica asincrona, condivisione senza variazione del JSON e superamento atomico del budget con successivo comando ancora funzionante. Suite unitari completa: **783 test / 119 file passati**; build locale e pubblica passate.

Benchmark su copia isolata di **384 MiB**, 244 template e due composizioni, senza modificare l’archivio personale e senza opzioni speciali dell’heap:

| Operazione | Tempo misurato |
|---|---:|
| Prima lettura e snapshot | 3.156 ms |
| Tre snapshot concorrenti a cache calda | 781 ms totali |
| Rifiuto atomico con vecchio tetto 256 MiB | 6.692 ms |
| Salvataggio con nuovo tetto | 4.479 ms |
| Riapertura e invarianti | 3.699 ms |

Dopo la prima lettura l’heap misurato era circa 110 MiB, contro circa 437 MiB nella prova precedente senza condivisione delle stringhe. Non è un miglioramento dimostrato del picco complessivo: l’intero processo del benchmark, inclusi preparazione della copia, più istanze e serializzazione, ha raggiunto circa **3,3 GiB di RSS**. La capacità massima di 512 MiB non è stata collaudata su ogni macchina o con tutte le possibili risorse.

## Limiti e prossimo passo

L’archivio reale dopo il lotto misura circa 384 MiB. La cache evita riletture inutili ma ogni salvataggio riscrive ancora il JSON completo, che ripete risorse fra progetti. Prima dell’uso online o di migliaia di progetti serviranno risorse deduplicate su disco, record separati, backup/ripristino e transazioni, con migrazione esplicita e verificata. Il nuovo tetto sostiene il collaudo locale; non certifica l’architettura produttiva.

Rapporto del benchmark e log privati in `.local/editor-admin-capacity-benchmark/`. Dati personali, template e font esclusi da Git. Nessun deploy o intervento su Shopify, PitchPrint, BSS, prezzi, acquisti o chat pubblicata.
