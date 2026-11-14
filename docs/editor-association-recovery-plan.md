# Recupero delle associazioni originali verificate

14 novembre 2026, dopo `82b830a`. Proseguire il recupero locale dei legami template/prodotto richiesto dal titolare, senza modificare Shopify, PitchPrint o il negozio.

Le copie attuali del catalogo e delle associazioni sono del 10–11 novembre. Prima di applicare legami, rileggere in sola lettura configurazioni Shopify e contenuti delle categorie PitchPrint: aggiornare solo Shopify e usare categorie vecchie produrrebbe legami obsoleti. Limitare il client PitchPrint a login, identificazione del dominio e letture; nessuna selezione/cambio dominio, pubblicazione, clonazione o modifica dei design.

Usare ID design di provenienza e ID prodotto esatti. Nessun abbinamento da titolo o misure. Tenere separati casi diretti e categorie, sorgenti mancanti, configurazioni non interpretabili, prodotti assenti/inattivi, template cliente/archiviati e collegamenti già presenti. Aggiungere soltanto i prodotti mancanti; non ampliare le varianti di un legame già configurato manualmente. Le associazioni commerciali non certificano misure, materiali, prezzi o compatibilità produttiva.

Preparare piano revisionabile e prova sulla copia SQLite completa, backup verificato del principale prima del recupero locale e controllo atomico di revisione/versioni tramite comando amministrativo esistente. Verificare che documenti grafici, font, profili, composizioni, tag e miniature non cambino; controllare UI e idempotenza. Salvare dati commerciali privati e copie soltanto in `.local`, codice/test/documentazione nel repository. Conservare il ripristino senza scambiare automaticamente il file attivo. Nessun deploy o acquisto.
