# Librerie Immagini e Sfondi — 11 novembre 2026

## Funzionamento locale

L’amministrazione ha due sezioni distinte: [Immagini](http://127.0.0.1:5173/editor/admin?section=pictures) e [Sfondi](http://127.0.0.1:5173/editor/admin?section=backgrounds). Categorie creabili/rinominabili/archiviabili, più appartenenze per risorsa, ricerca, paginazione di 48 miniature, caricamento multiplo e archiviazione reversibile. I metadati e la larghezza iniziale in mm si modificano selezionando la scheda della risorsa. Ogni caricamento ha esito separato: un errore non annulla i file precedenti né viene conteggiato come successo.

Nell’editor, il pannello Strumenti contiene le icone **Apri libreria immagini** e **Apri libreria sfondi**. Si sceglie una miniatura, poi l’inserimento. Gli SVG possono entrare come vettori editabili oppure, per scelta esplicita, come immagine PNG; alcuni SVG con gradienti, maschere o caratteristiche non rappresentabili dal convertitore vettoriale richiedono questa seconda scelta. Nessun passaggio implicito ai pixel dopo un errore.

Per le bandiere il titolare ha richiesto dimensioni adatte agli adesivi: **larghezza iniziale 100 mm** su indicazione del 12 novembre (prima 50 mm), proporzioni conservate e riduzione soltanto se il canvas non contiene la misura. Il valore è modificabile nel backend per risorsa e nell’ispettore dopo l’inserimento; non si altera il file originale. La capacità di inserimento non certifica misure, materiale, abbondanze o prezzo di un adesivo commerciale.

Gli sfondi grafici riempiono il foglio con ritaglio centrale proporzionale. Vengono inseriti in fondo ai livelli e una scelta successiva sostituisce il precedente sfondo con un unico comando annullabile. Restano immagini normali, modificabili dall’ispettore; il pulsante **Rimuovi sfondo** ne rimuove soltanto l’oggetto collegato. I blocchi di eliminazione e i gruppi del template sono rispettati. SVG/PDF/progetti conservano gli oggetti, non collegamenti remoti a PitchPrint. La sagoma circolare usa il ritaglio già presente nel renderer.

## Stato unico e persistenza

`backgroundImageId` è un riferimento opzionale del documento v2, controllato dallo schema. `setBackgroundImage` inserisce/sostituisce/rimuove l’immagine atomicamente e funziona allo stesso modo per UI e AI simulata, con revisione, ID stabili, Undo/Redo e controlli delle proprietà. Le immagini normali usano `addObject`, gli SVG `insertObjects`. La scelta di uno sfondo non crea uno stato grafico separato. I comandi `applyTemplate` conservano il riferimento quando presente; cancellare l’oggetto pulisce il riferimento.

L’indice è `.local/editor-media/index.json`; gli originali e le miniature PNG sono blob identificati da SHA-256. I byte non sono nell’indice né nel repository. Le miniature vengono prodotte al caricamento e riutilizzate nelle visite successive, con download immutabile; cambiare titolo/categoria non le rigenera. Le anteprime del frontend scaricano soltanto la pagina visibile. Le operazioni usano revisione attesa, coda delle scritture e rinomina atomica dell’indice. Il download verifica nuovamente il checksum.

API di sviluppo `/__editor-local/media/`, solo loopback con intestazione dedicata e controllo dell’origine. File originali consegnati come download binari, con `nosniff` e CSP restrittiva; SVG passivi senza script, risorse esterne o font sostitutivi. Le dichiarazioni SVG standard possono essere tolte per la sola decodifica; gli originali sono conservati byte per byte. Non è un servizio online autenticato per clienti.

La libreria conserva JPEG originali fino a **40 MP / 12.000 px / 20 MB**; il documento grafico mantiene il tetto di 24 MP. Per gli originali più grandi il pulsante dichiara **copia ridotta (24 MP)** prima dell’inserimento. La libreria non cambia l’originale; nel JSON entra la copia JPEG scelta. WebP passivi vengono conservati in libreria e inseriti nel documento come PNG. Gli SVG non hanno una risoluzione fisica prefissata: solo miniature e inserimento esplicito come raster usano una dimensione di decodifica limitata. Nel progetto monocromatico il dialogo avverte della conversione B/N, conservando i colori dell’originale in libreria.

## Recupero PitchPrint

Inventario ottenuto in sola lettura con il client pubblico: la richiesta `assets/` del singolo design era filtrata e inizialmente nascondeva gli sfondi; la richiesta amministrativa generale ha restituito **726 immagini in nove categorie e 59 sfondi in quattro categorie**. Originali scaricati, checksum e manifest privati conservati. Venti errori di rete iniziali sono stati recuperati riutilizzando i file già arrivati; nessun download è stato sostituito con miniature.

**784 risorse preparate su 785:** 725 immagini e 59 sfondi. Resta sospesa `gs.svg`, una bandiera con testo/font non verificati: non viene renderizzata con un font del computer. Le altre **254 bandiere** hanno la larghezza iniziale di 50 mm. Le categorie originali sono conservate. I quattro sfondi di **Materiali** restano marcati come anteprima di materiale e non sono offerti al cliente come grafica stampata; gli altri 55 sfondi grafici sono distinti. Una futura anteprima materiale richiederà un proprio controllo di vista.

La migrazione locale è **completata: 784 risorse e 13 categorie**. Copia dell’indice prima di ogni avvio, deduplicazione per origine/hash, nessuna sovrascrittura di file cambiati. Il primo passaggio ha salvato 725 immagini e uno sfondo; il primo PNG più grande ha rilevato un esaurimento dello stack nella validazione base64 del server dev. Correzione con controllo ASCII iterativo e regressione dedicata, riavvio del solo processo locale e ripresa dei mancanti. Verificati su disco **tutti i 784 originali e tutte le loro miniature**, con SHA-256 coerenti. Resoconti, backup e sorgenti privati in `.local/pitchprint-migration/media/`. Archivio template/font invariato: 117 template, due composizioni, 219 file font, revisione 371. Zero scritture online.

La nuova libreria **non certifica automaticamente i template precedentemente bloccati**. Il convertitore PitchPrint rifiuta ancora sfondi/primi piani non esclusi esplicitamente: collocazione, colore del foglio, overlay, filtri, blocchi e ruolo produttivo devono essere convertiti e verificati prima di importare quei template. Le risorse ora recuperate rendono possibile quel lavoro, senza scambiare un materiale per grafica da produrre.

## Collaudo

**746 unitari / 115 file**, **487/487 browser completi**, **13 pubblici locali** e **34 campioni** passati. Dopo il riavvio e i ritocchi CSS, ricontrollati sette casi delle librerie, compresa una pagina mobile piena con 48 miniature e il pulsante Inserisci sempre visibile. Verifiche HTTP: 403 senza intestazione o con origine estranea, 200 per la lettura locale. Prova reale in sola lettura della bandiera italiana: tre vettori, **50 × 33,3333 mm**, zero errori/scritture e checksum degli archivi invariati. Build/schemi/segreti verificati; screenshot desktop/mobile ispezionati. Il controllo completo precede i soli ritocchi CSS e la sostituzione del decoder base64, coperti dai ricontrolli pertinenti.

Test in archivi temporanei: persistenza e originali, categorie incrociate, revisioni concorrenti, deduplicazione e conflitti, file corrotti, checksum, SVG attivi, materiali esclusi, comando sfondo manuale/AI, Undo/JSON, blocchi, JPEG grandi e separazione dei limiti di cache. Browser: scelta/categoria/ricerca, originale incorporato e JSON/SVG offline, SVG vettoriale/raster esplicito, bandiera a 50 × 25 mm, sfondo cover/sostituzione/rimozione, upload multiplo/archiviazione, mobile e JPEG reale da 30 MP.

Campione `fixtures/illustrator/media-library.source.TEST.json`, `.TEST.json` e `.TEST.svg`, generatore `scripts/capture-editor-media-library.ts`: sfondo incorporato e bandiera vettoriale di prova, comando AI di rimozione + Undo. Illustrator da verificare: 120 × 80 mm, bandiera 50 × 30 mm, colori e proporzioni, gruppo editabile, immagine di fondo, JSON riapribile senza libreria.

Nessun deploy, chiamata AI a pagamento o modifica a negozio, tema, BSS, prezzi, acquisti, font personali o archivio template. La chat pubblicata resta separata.

## Larghezza delle bandiere — 12 novembre

Il titolare ha precisato **100 mm di larghezza**, con proporzioni originali. Aggiornate le 254 risorse della categoria Bandiere tramite i comandi di metadati già esistenti: revisione della libreria **797 → 1051**. Solo `defaultWidthMm` cambia; categorie, altre risorse, originali e miniature verificati invariati, così come l’archivio dei template. Backup dell’indice SHA-256 `51d347589a07b8115a00eb6678df15e97b9a5ec62d4f5faca78cda80aab60f5f` e resoconto privati in `.local/pitchprint-migration/media/flags-100mm/`. Le dimensioni degli oggetti già presenti nei progetti non vengono riscritte.

Prova nell’editor effettivo, canvas TEST 120 × 80 mm: Italia **100 × 66,666667 mm**, tre vettori, Undo/Redo ed esportazione JSON/SVG verificati. Zero errori o scritture di prova; rete esterna bloccata e indice/archivio invariati durante il controllo. Screenshot ispezionato; originali vettoriali conservati. Questa modifica dei metadati non cambia il codice applicativo o le fixture di prova a 50 mm.
