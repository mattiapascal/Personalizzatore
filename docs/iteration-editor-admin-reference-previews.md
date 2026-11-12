# Anteprime amministrative con riferimenti — 12 novembre 2026

## Risultato

L’elenco amministrativo e i dettagli di template e composizioni cliente ora mostrano l’anteprima completa: materiale di riferimento sotto, grafica produttiva al centro, riferimenti superiori e fissaggi sopra. Anche un template con il solo materiale ha un’immagine riconoscibile. JSON, contenuti produttivi e file esportati restano distinti e invariati.

Per i multipagina viene mostrata la prima pagina nell’ordine del documento, indipendentemente da quella attiva al momento del salvataggio. Il riepilogo dei dettagli indica numero di pagine e misure/oggetti della pagina mostrata, evitando di presentare le misure del retro accanto all’anteprima del fronte.

## Cache e contratti

Lo snapshot di lettura include `technicalPreviewKey` oltre alla chiave produttiva esistente. Nessun nuovo campo nel formato persistito o migrazione dell’archivio. I documenti senza riferimenti mantengono la stessa chiave e riusano le immagini già in cache. I riferimenti hanno una chiave distinta: cambiare il solo supporto rigenera l’anteprima completa ma conserva quella produttiva. Titoli, tag e altre modifiche non grafiche non rigenerano le immagini.

`ArchiveThumbnail` espone una modalità esplicita e carica il renderer tecnico già usato dalle miniature delle pagine. Preparazione progressiva, coda seriale, limiti di memoria e IndexedDB restano attivi. Con uno snapshot precedente privo della nuova chiave viene letto il record e calcolata la chiave tecnica corretta; non si presenta per errore una vecchia miniatura produttiva priva dei riferimenti.

I controlli dei font includono anche i testi di riferimento. Font o glifi errati producono un messaggio e lasciano accessibile il progetto, senza font del computer o sostituzioni implicite. I contratti colore esistenti non sono estesi.

## Verifiche

- **906 unitari / 136 file** passati: `.local/admin-reference-all-unit.log`. Verificati hash server/browser, prima pagina logica, chiavi distinte, metadati stabili e assenza di mutazioni dello stato.
- **69 browser pertinenti completi** passati: `.local/admin-reference-pertinent-browser.log`. Dopo il miglioramento del riepilogo dei dettagli, **otto ricontrolli pertinenti** passati: `.local/admin-reference-detail-browser.log`, inclusa l’asserzione sulle misure del fronte mentre nel documento è attivo il retro. Test su archivi temporanei isolati.
- **54 campioni JSON/SVG** riaperti/esportati senza errori browser o rete esterna: `.local/admin-reference-artifacts.log`. Nessun cambiamento al renderer produttivo; riusato il campione `page-strip` per la composizione tecnica.
- **13 test pubblici**, runtime Worker locale, build locale/pubblica e controlli segreti passati. Bundle pubblico invariato `index-BG2r_x-8.js`. Il primo tentativo Worker nel sandbox non poteva aprire la porta localhost; il successivo test autorizzato è passato.
- **21 template reali** verificati in sola lettura: sei targhette metalliche, sette datari e otto multipagina. Dopo ricaricamento: zero richieste dei record per le miniature, zero nuove rasterizzazioni, zero errori/scritture. Archivio identico prima/dopo tramite SHA-256. Dettagli della targhetta con solo supporto e della 110 × 70 con viti fotografati e ispezionati. Rapporto privato `.local/pitchprint-migration/admin-reference-previews/report.json`.

Archivio invariato: **313 template attivi, due composizioni, 219 font, revisione 603**. Nessun deploy o scrittura commerciale. Non una nuova suite browser generale; Illustrator non collaudato.

## File e lavoro successivo

Aggiornati snapshot del server, tipi delle risposte di lettura, `ArchiveThumbnail`, elenco e dettagli amministrativi. Aggiunti casi unitari/browser e helper di prova con supporto/cornice/fissaggi e retro di formato diverso.

Prossimo: riesaminare i 16 confronti prioritari ancora oltre soglia usando gli originali completi delle immagini di pagina e distinguendo tavola tecnica e grafica produttiva. Non abbassare le soglie di confronto o rimuovere contenuti per farli passare. Restano separati classificazioni dei primi piani, originali mancanti, glifi/font, formato viario oltre un metro, PNG e maschere ruotate.
