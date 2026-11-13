# Resolver font dopo un riavvio locale — 13 novembre 2026

Il resolver PitchPrint poteva rispondere «database is not open» dopo un riavvio a caldo di Vite, mentre l’elenco amministrativo continuava a funzionare. Il registro condiviso del runtime era una proprietà simbolica non enumerabile: Vite 8 copia le proprietà del nuovo server nel precedente e vi reindirizza il proxy ricevuto dai plugin. Il resolver ritrovava quindi la vecchia connessione già chiusa.

`registerEditorAdminRuntime` registra ora una proprietà enumerabile e scrivibile, conservando la chiave `Symbol.for` comune ai moduli nativi e SSR. Il nuovo runtime segue il server durante il riavvio; quello precedente viene chiuso normalmente. Il simbolo non entra in `JSON.stringify` o nelle risposte API. Nessuna modifica al formato dell’archivio, migrazione, copia dei dati o ripiego sul vecchio JSON.

Due regressioni riproducono la sostituzione del server su database temporanei: archivio differente e tre riavvii del medesimo file. Un’ulteriore prova usa **Vite reale e due `server.restart()`** con un archivio SQLite in sola lettura: prima e dopo ciascun riavvio, indice e resolver restituiscono la stessa identità e gli stessi byte Arimo TEST; la vecchia connessione è chiusa, le scritture restano vietate e il file rimane identico.

**22 test pertinenti passati** nei due file runtime e audit font; i due nuovi casi puri erano falliti prima della correzione. Log `.local/runtime-restart-before.log` e `.local/runtime-restart-after.log`. Il successivo controllo completo supera **1.158 test in 162 file**, log `.local/geometry-focus-all-units.log`.

Il laboratorio ordinario è stato riavviato brevemente per eliminare il vecchio registro non scrivibile. Verificati in sola lettura HTTP 200 del resolver Allura e indice **SQLite R630: 339 template, due composizioni, 219 font e un profilo**, identità `ace788c5db319d1efe690101caf23f90942bf45a1d9ad6e6e770e0405564ad69`. Nessuna modifica a font/template personali, negozio o chat pubblicata; nessun deploy.
