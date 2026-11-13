# Righelli in mm e guide personali — 13 novembre 2026

Il pulsante **Mostra righelli** nella barra superiore abilita i righelli orizzontale e verticale. L’origine coincide con l’angolo superiore sinistro della pagina; numeri e intervalli seguono zoom e PAN, anche con la pagina spostata parzialmente fuori vista. Le tacche si diradano in modo adattivo, senza cicli proporzionali alle dimensioni fisiche del documento.

Dal righello superiore si trascina una guida orizzontale, da quello sinistro una verticale. Le linee si spostano trascinandole e si eliminano riportandole sul righello corrispondente o fuori dall’area di disegno. Con la linea a fuoco, frecce = 0,1 mm, Maiusc + frecce = 1 mm e Canc/Backspace elimina la guida. Invio su un righello aggiunge una guida al centro della pagina; le alternative numeriche sono in **Strumenti → Guide personali**. Il blocco lascia selezionare la grafica sottostante alle linee.

## Stato e interazioni

- `layoutGuides` è opzionale e appartiene alla scena della pagina: massimo 64 guide, con ID, asse e coordinata finita in mm entro ±10.000 mm, più visibilità e blocco. Ammesse guide esterne alla pagina. I vecchi JSON non ricevono impostazioni implicite o conversioni automatiche.
- `setLayoutGuides` passa dal medesimo validatore manuale/AI, con revisione, pagina, Undo/Redo e copie indipendenti. Un blocco preesistente richiede uno sblocco precedente a spostamenti/eliminazioni. Posizioni, geometrie, testo e file degli oggetti restano invariati.
- Il gesto mantiene soltanto una preview di vista: il rilascio produce un comando. Esc, pointer cancel, perdita di focus, cambio documento/revisione o variazioni del frame annullano la preview. La rotella è sospesa durante il gesto. Se un Undo rende obsoleta la preview, il successivo rilascio non la riapplica.
- La griglia e gli agganci esistenti includono le guide visibili, anche bloccate, con tolleranza in pixel; Alt sospende gli agganci. Le guide nascoste non generano bersagli.
- La visibilità dei righelli è una preferenza della vista. Le guide e le loro opzioni sono invece nel JSON, nell’autosalvataggio e nell’archivio. Le pagine esistenti conservano scene indipendenti; non è un ampliamento del multipagina.

## Output e persistenza

Le guide non sono oggetti del canvas né zone produttive. `productionDocument` le rimuove dalla proiezione destinata agli output. SVG e PNG prodotti con/senza guide risultano identici; anche le miniature hanno gli stessi byte e la stessa chiave cache. Il PDF usa lo stesso esportatore SVG: non è stata generata una nuova prova PDF o certificata la filiera Illustrator in questo incremento.

Roundtrip, sostituzione, duplicazione e riapertura su **JSON e SQLite temporanei** verificati; la chiave della miniatura resta uguale. Nessuna migrazione SQL. I sei schemi JSON generati includono il campo opzionale e il comando; gli schemi delle configurazioni lo incorporano senza modificare il codice commerciale.

Campione portabile [JSON](../fixtures/illustrator/layout-guides.TEST.json) / [SVG](../fixtures/illustrator/layout-guides.TEST.svg), con due guide e sole risorse font OFL TEST. Il generatore `scripts/capture-editor-layout-guides.ts` controlla gli oggetti invariati, l’assenza delle guide dallo SVG, richieste e scritture; schermate desktop/mobile ispezionate in `.local/previews/editor-layout-guides-*.png`.

## Verifiche

- **1.224 unitari / 175 file passati**, dieci nuovi casi di comandi, limiti, blocco, copie, agganci, cache, scene esistenti, righelli e persistenza. Log `.local/layout-guides-all-units.log`.
- **68 casi browser pertinenti distinti passati** fra guide, visibilità, punto geometrico, griglia/agganci, zoom, Mano/Space, disegno, pannelli e output. Log `layout-guides-browser-final.log`, `layout-guides-regressions.log`, `layout-guides-browser-accepted.log`. I sei casi della nuova funzione sono stati ricontrollati dopo le rifiniture; inclusi gesto touch Chromium, sospensione della rotella, Annulla durante il drag e confronto manuale/AI. Non è una nuova esecuzione della suite browser generale.
- **74 campioni JSON/SVG riaperti/esportati**, zero errori, richieste esterne e caricamenti di font personali (`layout-guides-artifacts.log`). Il verificatore controlla anche la conservazione delle guide nei progetti.
- Build/tipi, schemi e catture passati (`layout-guides-final-build.log`, `layout-guides-schemas.log`, `layout-guides-capture.log`).

**13 browser pubblici passati**, build pubblica e scansioni dei segreti locale/pubblica passate (`layout-guides-public-tests.log`, `layout-guides-public-build.log`, `layout-guides-secrets.log`, `layout-guides-public-secrets.log`). JavaScript della chat sempre `index-BG2r_x-8.js`.

La prima prova del righello orizzontale iniziava erroneamente nell’intersezione dei due righelli: corretta la posizione del gesto. L’aspettativa del drag libero con Alt è ora calcolata sui pixel interi del MouseEvent ricevuto da Fabric, conservando la precisione richiesta all’aggancio. Unità/browser finali passati; non sono stati allentati validatori o vincoli produttivi.

Archivio personale letto in sola lettura, invariato a **SQLite R638, 346 template, due composizioni, 219 font di cui 218 attivi e un profilo** (`layout-guides-archive.json`). Nessuna importazione, sostituzione di font o modifica ai progetti personali. Nessun deploy o intervento su Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout. Roadmap ancora aperta.
