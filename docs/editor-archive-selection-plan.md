# Selezione esplicita dell’archivio del laboratorio — 13 novembre 2026

Prerequisito verificato: [backup e ripristino](iteration-editor-sqlite-maintenance.md), copia R627 e ritorno JSON attuale. Questo incremento prepara il laboratorio completo, senza attivarlo sul principale.

1. Aggiungere un backend SQLite esplicito al runtime, distinto dalla modalità `sqlite-copy`: file già esistente e indipendente, nessuna scoperta o conversione automatica e nessun fallback al JSON se non leggibile.
2. Configurazione di avvio alternativa con backend e percorso obbligatori, cache Vite distinta e porta 5177. Non modificare `vite.config.ts`, `.env.local`, il server principale o i dati personali. Il laboratorio completo conserva i plugin esistenti: chat, configurazioni e media restano nei propri archivi, senza migrazioni implicite.
3. Per il ritorno JSON richiedere una directory esistente con `state.json`, esportata dalla revisione SQLite corrente. Non riaprire silenziosamente il vecchio JSON come se contenesse le modifiche successive. La capacità del vecchio lettore resta vincolante.
4. Rendere riconoscibile il backend nell’amministrazione e nelle risposte HTTP senza salvare percorsi o metadati di runtime nel documento grafico o nell’archivio.
5. Testare configurazioni errate, file mancanti, assenza di fallback, stessi resolver font/API/comandi e percorso SQLite → modifica → backup/esportazione → JSON → riapertura. Prove soltanto su dati TEST o ulteriori copie.

Rischi e limiti: il comando di avvio non sincronizza i due archivi; gli strumenti CLI storici ancora esplicitamente JSON vanno selezionati/coordinati prima di proporre l’attivazione. Non è prevista una sostituzione del file in uso da un server residente. L’attivazione dell’archivio principale richiederà l’autorizzazione di AGENTS.md, dopo il completamento del collaudo e della procedura di ritorno.

Implementazione e risultati in [iteration-editor-archive-selection.md](iteration-editor-archive-selection.md); il coordinamento del CLI font rimane da completare prima di proporre l’attivazione.
