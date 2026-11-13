# Censimento font sul backend selezionato — 13 novembre 2026

Il comando storico legge sempre il JSON, serializza tutto l’archivio per il backup e invia gli aggiornamenti a un server scelto separatamente. Dopo un cambio di backend potrebbe quindi leggere un archivio e scrivere su un altro. Non usarlo per attivare o migrare dati.

Incremento previsto:

1. Identità opaca del backend basata sul percorso canonico, esposta dalle API locali e verificabile come precondizione delle scritture. Due copie con contenuti inizialmente identici devono essere distinguibili; revisione e contenuti da soli non bastano.
2. Opzione esplicita `--sqlite-file`, senza scoperta automatica. Letture selettive per SQLite, conservazione del comportamento JSON predefinito e nessuna dipendenza dai font del computer.
3. Prima di installare: origine solo locale, stessa identità e revisione del server, backup nuovo e verificato. SQLite con backup nativo; JSON copiato in streaming, senza costruire una stringa dell’intero archivio. Nessuna sovrascrittura di vecchi backup.
4. Aggiornamenti soltanto via i comandi HTTP validati del server. Precondizione di identità su ogni scrittura, revisioni monotone, arresto sui conflitti o risultati ambigui senza retry automatici. File/font preesistenti, progetti, profili e impostazioni da confrontare al termine.
5. Test su JSON/SQLite separati: copia errata ma identica, revisione obsoleta, server in sola lettura, errore di rete e font non esatto. Analisi reale soltanto in lettura, se utile; nessuna installazione personale implicita.

Non attivare il backend SQLite principale in questo incremento. I dati delle vecchie importazioni private rimangono sul JSON corrente; la loro procedura di salvataggio va poi coordinata con il runtime scelto prima di chiedere l’autorizzazione prevista da AGENTS.md.

Implementazione e risultati in [iteration-editor-font-audit-backend.md](iteration-editor-font-audit-backend.md). Aggiunta la modalità offline dopo il blocco auto-review della verifica con rete; l’analisi reale non effettua richieste esterne.
