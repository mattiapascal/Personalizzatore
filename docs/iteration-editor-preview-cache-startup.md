# Fori PitchPrint, miniature persistenti e apertura dell’editor — 11 novembre 2026

## Cerchio di «Oltre i 100a»

Il tracciato originale dichiara `fillRule: evenodd`. L’importatore ricostruiva le geometrie Fabric omettendo questa proprietà, applicando così `nonzero`: i due cerchi con orientamento uguale diventavano un disco pieno. Il documento canonico e il renderer supportavano già entrambe le regole.

L’importatore ora conserva la proprietà originale e rifiuta valori sconosciuti. Il campione browser con due cerchi verifica il foro trasparente, il rosso, la riapertura JSON e la regola esportata in SVG; `nonzero` resta distinto e non viene trasformato universalmente in `evenodd`.

Corretto il solo tracciato rosso nella bozza locale segnalata, tramite `replaceRecord` validato, controllo delle revisioni e backup completo con hash verificato. Archivio 364 → 365; template versione 1 → 2. Geometrie, testi, ID, colori e metadati conservati. Gli altri 118 record e i font sono identici al momento della correzione; sorgente PitchPrint non modificato. Evidenza privata `.local/pitchprint-migration/import-plans/ring-hole-correction.json`.

## Controllo rapido sugli altri template

Confrontati i **117 sorgenti**, **500 oggetti sorgente** e **216 vettori canonici**, ricontrollando gli hash degli originali. Tre tracciati avevano perso `evenodd`. A 1024 px sul lato maggiore, sia sul tracciato isolato sia sulla composizione completa:

| Template | Pixel diversi nella composizione | Esito |
| --- | ---: | --- |
| Oltre i 100a | 235565 | Foro ripristinato nella bozza locale |
| Freccia | 0 | Differenza del campo senza differenza visibile nel confronto |
| Targa direzionale con freccia | 0 | Differenza del campo senza differenza visibile nel confronto |

Il controllo degli altri template è stato eseguito in sola lettura: le due differenze strutturali prive di effetti nel confronto restano registrate. L’analisi riguarda questa regola, non certifica tutte le proprietà del sorgente né dettagli inferiori alla risoluzione del confronto. Rapporti privati con collegamenti alle bozze: `all-117-fill-rule-audit.json` e `controllo-117-regole-riempimento.md`, nella cartella `.local/pitchprint-migration/import-plans/`.

## Cache PNG delle miniature

Elenco e dettaglio amministrativo riusano ora immagini PNG fino a **512 px** sul lato maggiore, salvate in **IndexedDB nel browser e nell’origine locale utilizzati**. Il primo passaggio genera l’immagine; i successivi ricaricamenti la leggono dalla cache. Cancellare i dati del browser o cambiare browser/origine richiede una nuova generazione. Non si tratta di file condivisi fra browser o di una cache su un servizio remoto.

Lo snapshot del backend fornisce `previewKey`, SHA-256 del contenuto effettivamente renderizzato e della versione del renderer. Una cache valida evita di rileggere il documento completo, scaricare/preparare i font e avviare Fabric. Titolo, tag, revisioni, label/blocchi e informazioni descrittive dei font non invalidano il PNG. Cambiamenti a geometrie, ordine, pitture, sorgenti raster, caratteri/font usati, riferimenti visibili e tinta effettiva generano una nuova chiave. Gli aggiornamenti del renderer devono incrementare `ARCHIVE_PREVIEW_RENDERER`.

Limiti: 64 MB/2000 immagini persistenti con eliminazione delle meno usate; cache in memoria 128 immagini/16 MB. Preparazione ancora serializzata e vicina alla zona visibile. L’URL temporaneo viene rilasciato quando la riga viene smontata. Il PNG non incorpora file font o sorgenti JSON; documento editabile e output produttivo restano separati. Un errore di spazio o disponibilità IndexedDB lascia utilizzabile la miniatura in memoria e il progetto originale.

File: `preview-key.ts`, `preview-cache.ts`, `ArchiveThumbnail.tsx`, snapshot amministrativo ed esportazione PNG condivisa. La cache non scrive nell’archivio e non incrementa le sue revisioni. Nessuna nuova dipendenza.

## Apertura e zoom iniziale

L’editor prepara ora il record richiesto da archivio o galleria, i suoi font e le immagini **prima di creare la sessione e il canvas**. La composizione TEST non viene più creata e mostrata in attesa del template. Errori e versioni/associazioni obsolete mostrano recupero/Riprova senza aprire un progetto sostitutivo. Rimangono il recupero JSON e i controlli tipizzati dell’applicazione template; dati amministrativi e copie cliente conservano i comportamenti precedenti.

Nell’area a tutto schermo il canvas resta nascosto fino al primo adattamento: pagina intera centrata, circa **24 px per lato** di margine minimo. Il calcolo usa le dimensioni effettive dell’area disponibile, dopo toolbar e pannelli. Viene ripetuto all’apertura di un documento/formato diverso e al cambiamento dello spazio disponibile finché la vista resta in modalità adatta; zoom manuale e gesture conservano la vista scelta. Il limite inferiore è ora **1%**, necessario per formati grandi, anziché 25%; massimo 400% invariato. La vista e il PAN non cambiano geometrie o revisioni del progetto.

## Verifiche

- **635 unitari/95 file passati**, inclusa equivalenza della chiave server/browser e invalidazione selettiva.
- Build TypeScript/Vite e controllo segreti passati.
- Primo gruppo di sei browser su foro/cache/archivio/colore passato; 28 regressioni pertinenti passate prima dell’ulteriore modifica all’avvio.
- Tre nuove prove di avvio: caricamento ritardato senza canvas TEST, formato 1000 × 800 mm interamente visibile su desktop/telefono, errore e recupero del documento richiesto.
- La vecchia prova di versione template obsoleta attendeva ancora il canvas TEST dopo l’errore: aggiornata per verificare la sua assenza. Il primo giro di avvio ha dato 14/15; la regressione finale comprende il caso aggiornato.
- Template reale: corona RGBA `[205,36,43,255]`, foro `[0,0,0,0]`; al reload la lettura del record resta una sola. Apertura adattata e schermate ispezionate; zero errori browser/scritture e archivio invariato durante il controllo. `.local/editor-ring-cache-real-verification-final.log` e `.local/previews/editor-ring-fixed.png`.

**Regressione finale: 76/76 browser mirati passati** su avvio/recupero, archivi, template, PitchPrint, PNG, workspace, zoom e PAN. Il caso della versione obsoleta aggiornato è passato. Log: `.local/editor-cache-startup-browser-final.log`; unitari in `editor-cache-startup-unit-final.log`, build in `editor-startup-fit-build.log`, scansione in `editor-hole-cache-secrets.log`. Non è stata rieseguita l’intera suite di 382 browser: il controllo completo precedente resta distinto. Nessun deploy, modifica a Shopify/BSS/PitchPrint online, prezzi, acquisti o chat pubblicata. Illustrator e lavorazione fisica non sono stati collaudati in questo incremento.
