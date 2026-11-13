# Selezione persistente dell’archivio — 13 novembre 2026

Il normale avvio e il CLI font devono condividere una scelta esplicita persistente. Il principale è ancora sul JSON R627; non esiste alcun registro di selezione nella cartella attiva. L’attivazione reale resta soggetta all’autorizzazione di AGENTS.md.

1. Registro privato sotto `.local/editor-admin/archive-selection/`, assente nel comportamento storico. Solo l’assenza dell’intera directory mantiene il JSON predefinito. Registro incompleto/corrotto, target mancante o identità errata devono bloccare l’avvio, senza ripiego sul vecchio JSON.
2. Lettore condiviso da `npm run dev` e dal censimento senza opzioni esplicite. L’avvio alternativo e le opzioni esplicite restano disponibili per copie e ripristini. Nessun dato di controllo nel documento grafico.
3. Preparazione di una proposta separata: backend/percorso, identità e hash dei due archivi, contenuto e revisione identici, token del registro corrente. Solo letture; nessun cambio sul principale.
4. Applicazione esplicita della proposta con server principale fermo, controllo delle revisioni/hash ancora correnti, esclusione concorrente e pubblicazione atomica del solo registro. Non copiare o cancellare dati e non sovrascrivere archivi. Una configurazione scrivibile usata su una copia non costituisce autorizzazione a migrare il principale.
5. Ritorno mediante nuovo JSON esportato dalla revisione corrente, verificato e selezionato esplicitamente. Non cancellare il registro per tornare al vecchio file. Collaudare anche registri incompleti, concorrenza e recupero di un’interruzione senza cancellare dati.
6. Catalogo commerciale locale mantenuto nel percorso precedente per il laboratorio completo; le copie `storage-trial` conservano la propria cache separata. Configurazioni cliente e media rimangono nei loro archivi.

Prove solo in directory TEST o copie private separate. Preparare una proposta concreta sul volume corrente se utile, ma non applicarla né cambiare l’avvio reale senza l’autorizzazione richiesta.

Implementazione e risultati in [iteration-editor-persistent-archive.md](iteration-editor-persistent-archive.md). Proposta reale preparata e non applicata; test e server temporanei usano registri separati.
