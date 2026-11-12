# Anteprime amministrative complete — 12 novembre 2026

Incremento successivo alle miniature delle pagine: usare anche nell’elenco amministrativo e nei dettagli la composizione tecnica di materiale, grafica e riferimenti. Particolarmente utile per template con solo supporto, la cui anteprima produttiva è correttamente vuota.

1. Aggiungere allo snapshot di lettura una chiave tecnica distinta, senza modificare schema persistito o archivio reale. Per documenti senza riferimenti conservare la chiave già in cache; prima pagina logica anche nei multipagina.
2. Rendere esplicita la modalità di ArchiveThumbnail e usare la modalità tecnica in elenco/dettagli. Il renderer produttivo e le relative chiavi restano disponibili; non riutilizzare una cache produttiva dove mancherebbero riferimenti. Con server precedente privo della nuova chiave, leggere il record e calcolare la chiave corretta.
3. Collaudare supporto senza grafica, cornice/fissaggi, materiali RGB e grafica monocromatica nei contratti già supportati; prima pagina indipendente da pagina attiva. Verificare cache al reload/metadati, invalidazione per modifica del solo riferimento e gestione errori/font senza fallback. Test solo in archivi isolati.
4. Verificare copie reali in sola lettura, integrità dell’archivio, build, regressioni pertinenti e chat pubblica. Documentare, salvare e sincronizzare il codice. Nessun deploy o associazione commerciale.

Rischi: immagini obsolete se si mescolano chiavi produttive/tecniche, costo di preparazione su elenchi grandi, perdita dei controlli font. Riutilizzare preparazione progressiva e cache esistenti; nessun ampliamento dei contratti colore o nuova migrazione dei dati.

## Esito

Completati i quattro punti: [implementazione e verifiche](iteration-editor-admin-reference-previews.md). Archivio invariato; confronto dei sorgenti prioritari nel prossimo incremento.
