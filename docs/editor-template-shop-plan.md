# Dal template ai prodotti reali

14 novembre 2026, dopo `8c9437a`. La precedente iterazione è progresso verificato: codice, contratti, UI, campioni e test sincronizzati. Ora completare il secondo ingresso cliente, riutilizzando il percorso prodotto→template già esistente e senza nuove funzioni avanzate di disegno.

La galleria predefinita deve mostrare i template reali con miniature in cache, ricerca/tag combinati, paginazione e dettaglio sempre raggiungibile. Il catalogo TEST resta accessibile esplicitamente; nessun ripiego silenzioso. Mostrare anche template senza associazioni o profili completi, spiegando il dato mancante invece di farli sparire.

Intersecare associazioni commerciali del template, prodotti/varianti correnti e profili tecnici versionati. Letture soltanto per i prodotti associati e configurati, massimo tre simultanee; errore di lettura senza graduatoria parziale. Nessuna dimensione o sagoma ricavata dal titolo. Timbri con variante primaria del laboratorio, senza scelta del colore del corpo. Profili condivisi fra prodotti e aree specifiche della variante.

Proporre automaticamente il formato fisso più piccolo che conserva le dimensioni della grafica e supera controlli/font/pittura/zone noti, ordinando come il selettore TEST per area utile geometrica, lato massimo e chiave stabile. Non ridurre automaticamente per scegliere un modello più piccolo all’ingresso. Gli altri modelli possono essere provati esplicitamente; una riduzione proporzionale deve rispettare tutti i vincoli e richiedere conferma. Varianti personalizzate non classificabili finché il cliente non indica il formato; eventuali misure iniziali sono quelle dichiarate del template, mai nominali inventati. Fissaggi secondo il profilo del nuovo supporto e scelte nell’editor; riferimenti originali da verificare.

Usare `shopProductDocument`, `fitShopTemplate`, `applyShopTemplate` e gli stessi comandi canonici manuali/AI. Rileggere template, profilo e prodotto prima dell’apertura, ricontrollare geometria e selezione e ignorare risposte obsolete. Nuova composizione con ID propri e origine del template/pagina; originale immutato. Conservare i formati multipagina già presenti, usando la sola pagina scelta nel nuovo progetto come nel percorso prodotto→template, senza sviluppare altre funzioni multipagina.

Ritorno alla galleria dopo chiusura senza salvataggio tramite la conferma esistente, preservando filtri/pagina/elemento scelto; salvataggio/conferma del nuovo progetto restano nel flusso canonico. Nessuna scrittura automatica nell’archivio principale. Test su archivi separati, regressioni dei percorsi esistenti e chat, JSON/SVG con font TEST, documentazione e GitHub sincronizzato. Nessun deploy, Shopify/PitchPrint/BSS/prezzo/acquisto modificato; compatibilità geometrica distinta dalla certificazione produttiva.

Implementato e collaudato: [resoconto](iteration-editor-template-shop.md). Originali e profili reali invariati; dati mancanti non compilati automaticamente.
