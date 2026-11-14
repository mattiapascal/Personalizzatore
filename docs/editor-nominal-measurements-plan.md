# Misure nominali da Shopify, proposte da verificare

14 novembre 2026, dopo `520bf87`. Verificate in sola lettura sul negozio le definizioni PRODUCTVARIANT `custom.larghezza` e `custom.altezza`: tipo `number_decimal`, descrizione «Valore espresso in millimetri.». Sono dimensioni nominali; non certificano margini/area produttiva. Nessuna inferenza dai titoli.

Aggiungere un endpoint locale separato per leggere definizioni e misure di tutte le varianti di un prodotto, con paginazione, ID/fonte verificati, limiti, cache e nessun risultato parziale su errori. Non modificare la query commerciale delle varianti né il catalogo/chat pubblici. Un cambio delle definizioni/unità impedisce le proposte automatiche.

Nel pannello delle aree per variante un’azione esplicita legge le misure e presenta un riepilogo selezionabile. Precompilare soltanto aree nuove o campi mancanti di aree fisse; mantenere valori già impostati, modalità personalizzate, sagome note, zone e margini. Per nuove aree la sagoma deve essere scelta esplicitamente, anche in gruppo. Selezione e conferma dell’area utile precedono la precompilazione del solo modulo; il salvataggio resta un’azione distinta e versionata.

La proposta dipende dall’intero modulo e dalle varianti lette: cambi di dati/prodotto, risposte obsolete, ID incoerenti, misure non valide o zone/margini incompatibili non devono sovrascrivere il modulo. Nessuna scrittura automatica ai profili reali, migrazione, modifica Shopify o prezzo. Collaudare lettura, errori e paginazione, piano puro, UI desktop/telefono, flusso dati fino al JSON/SVG e regressioni della chat; confrontare in sola lettura un prodotto reale con la lettura tramite plugin.
