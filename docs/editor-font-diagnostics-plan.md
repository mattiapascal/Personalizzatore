# Stabilità della diagnostica font — 13 novembre 2026

Prova browser prima della modifica: sei aggiornamenti dell’elenco di font estranei al testo rimuovono e ricreano sia la segnalazione rossa nell’ispettore sia l’anteprima del candidato. La revisione grafica non cambia; il risultato del controllo, invece, dipende dalle versioni globali della libreria. Evidenza: `.local/font-diagnostics/before.log`.

Incremento previsto: invalidare la diagnosi soltanto quando cambiano il testo/gli stili pertinenti, i file effettivamente usati o la disponibilità della loro copertura; invalidare il candidato per il file scelto, la revisione sorgente e i medesimi controlli. Gli aggiornamenti generali continuano ad aggiornare il menu, senza azzerare una diagnosi ancora valida.

Non nascondere errori nuovi e non conservare esiti di un altro testo/file. Cancellazione delle risposte obsolete, retry espliciti e ricontrollo sul comando Applica restano necessari. Nessuna modifica al motore delle metriche, ai byte dei font o al documento, nessuna scrittura nell’archivio personale. Manuale e simulazione AI restano sugli stessi comandi.

Verifiche: regressione browser prima/dopo con osservazione degli elementi rimossi, aggiornamenti reali di font e coperture estranee, recupero di una copertura pertinente inizialmente non disponibile, cambi del testo/candidato e risposte tardive. Test delle dipendenze per file/identità e geometria irrilevante; campioni JSON/SVG già esistenti conservati e riaperti. Nessun nuovo strumento avanzato, servizio o deploy.

**Completato:** [risultati e limiti](iteration-editor-font-diagnostics.md). Riproduzione negativa prima della modifica, chiavi limitate ai file pertinenti, 1.198 unitari e 38 browser pertinenti passati; retry e risposte tardive ricontrollati. I campioni esistenti restano identici. Nessuna scrittura nell’archivio R638.
