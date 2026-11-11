**11 novembre — testi importati e interlinea:** [stili dei caratteri e righe compatte](iteration-editor-pitchprint-text-styles.md). File esatti per ogni variante, corpo/colori/decorazioni locali e altezza automatica senza ritagli per interlinee 0,1–3; default 1/passo 0,1 conservati. **642 unitari, 183 browser pertinenti, 22 campioni, build/schemi/segreti passati**. Analisi reale: **144/370 convertibili**, 21 in più e nessuna regressione sui 123 precedenti. Archivio personale invariato; nessuna nuova importazione o pubblicazione.

**11 novembre — contorni fisici estesi:** [incremento e verifiche](iteration-editor-wide-strokes.md). Limite di capacità 100 mm condiviso da forme/guide/comandi/import e ispettori, passo 0,05 mm conservato; maggiore precisione delle matrici SVG intermedie. **639 unitari, 113 browser pertinenti, 21 campioni, build/schemi/segreti passati**. Analisi reale: **123/370 convertibili**, sei in più, nessuna regressione sui 117 precedenti, nessuna nuova importazione o modifica all’archivio personale. Campione 300 × 180 mm, Illustrator da collaudare.

**Nuovo incremento 11 novembre:** [fori, PNG persistenti e avvio/zoom](iteration-editor-preview-cache-startup.md). «Oltre i 100a» corretto nel solo archivio locale, revisione 365; altri record/font conservati. Confrontati 117 sorgenti e 216 vettori: tre regole perse, solo il caso segnalato mostra differenze nei pixel a 1024 px. Cache PNG IndexedDB con fingerprint dello snapshot, caricamento diretto del progetto senza TEST transitorio e adattamento iniziale della vista a tutto schermo con 24 px di margine. Stato delle prove aggiornato nel documento collegato.

**Stato corrente 11 novembre:** [117 bozze PitchPrint importate con colori conservati](iteration-editor-pitchprint-colors.md), tag «Da verificare», nessuna associazione prodotto. Tutte riaperte/riesportate in SVG in sola lettura; controllo font distinto con 20 casi di simboli assenti e due coperture non verificabili. Le note sotto sull’attesa di autorizzazione sono superate. [Archivio locale](http://127.0.0.1:5173/editor/admin?section=template).

# Handoff — sviluppo locale del configuratore grafico

**Ultimo incremento del 10 novembre:** [proprietà oggetti e modulo cliente](iteration-editor-object-properties.md), ordine 1 prima di 5 e blocchi nel motore; [importazione nativa PitchPrint](iteration-editor-pitchprint-import.md), letti/acquisiti 473 design, 370 a pagina singola. 39 varianti Google installate esatte con licenze; 57 combinazioni/40 famiglie manuali, nessun fallback su famiglia/peso/corsivo. Prova reale 400×300 mm con 13 elementi/3 file font, sorgente e archivio preservati. [Stato e verifiche](editor-local-status.md); acquisizione non equivale a conversione di massa. Nessun deploy o scrittura online.

**Aggiornamento del 10 novembre, correzioni del collaudo:** [stato corrente](editor-local-status.md), [decisioni e modifiche](editor-corrections-2026-11-10.md), [ricollaudo aggiornato](editor-retest-2026-11-10.md). Salvataggio manuale/ricarica/chiusura in alto a destra, sessioni cliente/admin/test distinte, recupero JSON indipendente dal modello, eliminazione confermata di font/design e font alfabetici, numeri più accessibili, zone stabili e profili duplicabili, più/tutte le varianti condivise. Nuova [targa parametrica locale](http://127.0.0.1:5173/editor/plaque?workspace=1&mode=customer): misure e fissaggi nel documento, popup dedicato, fuoriporta colla/due viti e scatolati solo staffe. Un template si usa su più misure con anteprima della centratura/riduzione proporzionale; adattamento pienamente responsivo ancora futuro. PDF locale con misure fisiche esatte, opzionale cliente disattivo per default. [Studio del catalogo e architettura senza profili duplicati](editor-catalog-signage-study-2026-11-10.md). Proprietario conferma refuso 120×60 cm e autorizza riparto del costo confezione; funzione deterministica implementata, prezzi reali ancora scollegati. Profili reali/zone produttive non ancora applicati al canvas; store/BSS/PitchPrint/chat preservati. **Verifiche complete correnti nello stato locale; i conteggi sotto sono storici.**

**Nuovo task autonomo, 9 novembre:** [profili, zone visuali, varianti reali e collaudo](iteration-editor-profile-zones-shop-acceptance.md). Prodotto/variante verificati sul server in sola lettura, storico delle versioni, disegno con maniglie/coordinate/Undo/Redo e contenimento nella sagoma, nuova sezione `/editor/admin?section=acceptance` con 18 prove e resoconto persistente/scaricabile. Lettura reale varianti e archivio personale invariato verificati. Profili ancora non applicati al canvas, zone dei template e collegamento completo all’editor da implementare. **547 unitari/72 file, 319 browser laboratorio, build/scansione segreti e 13 browser pubblici locali passati**. Schermate desktop/mobile ispezionate, archivio personale invariato; nessun test Illustrator o fisico. Stato e verifica completa in [editor-local-status.md](editor-local-status.md).

**Ultima richiesta amministrativa completata, 9 novembre:** [archivio visuale, tag e catalogo reale](iteration-editor-archive-tags-shop.md). Miniature, tag multipli condivisi/riutilizzabili anche nell’editor, filtri AND/OR, priorità trascinata e salvata, copia cliente→template indipendente e font automatici. Nuovo navigatore `/editor/admin?section=products`: lettura reale **1.597 prodotti/73 collezioni/99 tag**, con aggiornamento in sola lettura e cache privata. Il catalogo commerciale è distinto dai tre formati tecnici TEST del canvas. [Scelta profili/template e futura definizione visuale delle zone](editor-profile-template-boundary.md); non sono ancora regole applicate al canvas. **538 unitari, 314 browser laboratorio, build/segreti e 13 browser pubblici locali passati**, screenshot desktop/mobile ispezionati e archivio personale preservato. [Stato corrente](editor-local-status.md). Solo locale, AI mantenuta in demo, nessuna scrittura sul negozio o deploy.

**Punto di ripresa finale del 9 novembre:** [stato verificato](editor-local-status.md), [guida di collaudo](editor-collaudo-locale.md), [lacune e priorità](editor-gap-review.md). Ultimo comando completo verde: **530 unitari/310 browser**, build e segreti; anche 13 browser pubblici locali e 18 campioni passati. Poi correzione circoscritta delle etichette font lunghe: **531 unitari, build e 5 browser font passati**, senza ripetere l’intera suite. Tutto solo locale, font personali conservati. Profili ancora separati dal canvas, sottoinsieme editor di tre modelli, integrazioni commerciali future. Nessun collaudo Illustrator. Le sezioni sotto sono lo storico degli incrementi.

**Backup font locale:** [export e ripristino](iteration-editor-font-backup.md) con ID/file/licenze/date/stato conservati. Preview senza scritture, aggiunta dei soli mancanti, nessuna sovrascrittura dei presenti, collisioni bloccanti e ricontrollo dopo conflitto di revisione. Comando `restoreFontLibrary`, endpoint dedicati protetti e nuovo schema JSON. 2 browser mirati e verifica HTTP temporanea passati; checkpoint completo nello [stato corrente](editor-local-status.md).

**Schema produttivo nel backend:** [preview in mm](iteration-editor-profile-preview.md) di area, margini, zone e forature; 2 browser, 15 unitari pertinenti e build passati. Profili ancora separati dal canvas. Ultimo checkpoint completo precedente: **525 unitari/307 browser**, build e scansione segreti. Server dev aggiornato per le nuove API, libreria personale preservata.

**Amministrazione font:** [ricerca/filtri, campioni, download e metadati/licenze](iteration-editor-font-administration.md). File e copie nei progetti conservati; nome/fonte/licenza Google protetti lato API. Nuovo `updateFontMetadata`, schemi esportati aggiornati, 4 browser pertinenti e 10 unitari backend passati, verifica completa registrata nello [stato corrente](editor-local-status.md). [Prova guidata per il titolare](editor-collaudo-locale.md).

**Nuovo checkpoint autonomo:** [capacità estesa](iteration-editor-capacity.md) a 200 oggetti/100 gruppi, 4.000 caratteri e 100 righe per box, corpo fino a 500 pt; [tinta globale e WOFF2](iteration-editor-imprint-woff2.md) nel documento unico, preview/carrello coerenti e analisi nominale dei font WOFF2 singoli supportati. SVG produttivo monocromatico, colori soltanto dimostrativi. Configurazioni precedenti e template mantengono la tinta; bozza protetta prima dell’apertura di un altro progetto. **523 unitari, 306 browser, build/scansione segreti, 13 browser pubblici locali e 18 campioni passati.** Le note sotto su WOFF2 non analizzati e i vecchi limiti sono storiche. [Stato corrente](editor-local-status.md). Nessun deploy o collaudo Illustrator.

**Sviluppo durante l’assenza del titolare, 9 novembre:** [bozze, template, cambio modello e preparazione profili](iteration-editor-drafts-templates-products.md). IndexedDB locale con recupero esplicito e conflitti protetti; galleria `/editor/templates`, associazioni molti-a-molti e modello iniziale più piccolo che contiene la grafica senza riduzione; proposta di riduzione al cambio esplicito, entro i vincoli, con conferma. Nuovi comandi `applyTemplate` e `changeFormat`, Undo/Redo compresa montatura. Backend Profili produttivi per dati verificati, zone riservate e sola foratura/kit; **raccolta dati, non ancora vincoli applicati nel canvas**. Catalogo editor resta il sottoinsieme TEST di tre modelli, non quello esteso della chat. Decisioni esplicite e [piano autonomo](editor-autonomous-plan.md) registrati. [Checkpoint corrente](editor-local-status.md); nessun deploy, spesa o collaudo Illustrator.

**Aggiornamento successivo al riscontro positivo sulla UI:** [controllo font incorporati](iteration-editor-font-preflight.md). Caratteri mancanti e stili simulati segnalati nella bozza e bloccanti per conferma/aggiunta/sostituzione locale, con la stessa analisi in browser e API. Rispetto dei font sulle selezioni, accenti equivalenti e WOFF compresso. WOFF2/mappe non supportate dichiarate sconosciute; nessuna certificazione dei font di sistema, shaping o Illustrator. La gestione font non è ancora completa. [Checkpoint aggiornato](editor-local-status.md). Nessuna modifica al negozio.

**Aggiornamento 9 novembre — configurazioni e usabilità:** [prova locale e varianti font](iteration-editor-configurations-font-variants.md). Link `/editor?workspace=1&configurations=1`: anteprima e conferma separate; riepilogo ampio, copia da aggiungere distinta dalla modifica di una riga, confronto prima/dopo, conferma rimozione. Snapshot immutabili, retry idempotente e conflitti fra schede nel solo archivio locale. Dopo il riscontro del titolare sull’ambiguità, priorità alla chiarezza del percorso. Famiglie/varianti font reali nell’ispettore e Google Fonts con scelta stile; copertura glifi ancora non integrata. [Verifiche aggiornate](editor-local-status.md). Profili reali, associazioni prodotti/template, prezzi, account e carrello Shopify ancora da collegare; nessun deploy. Questo aggiornamento prevale sui checkpoint storici sotto.

**Aggiornamento 9 novembre — importazioni/backend/font:** SVG e PDF vettoriali locali, scelta contorni/testo editabile (PDF orizzontali ricostruiti, da controllare); CSS semplice, riferimenti locali e clip rettangolari. Font caricati nel backend ora disponibili nel frontend e portabili nel JSON. Gestione locale di font/impostazioni/template/composizioni. [Dettagli e limiti](iteration-editor-import-font-library.md). Google Fonts con ricerca/anteprime e aggiunta dello stile normale con un clic disponibili nel backend locale. Suite corrente registrata in `editor-local-status.md`; nessun deploy o collaudo Illustrator.

**Stato corrente, 9 novembre 2026:** [editor-local-status.md](editor-local-status.md) e [riepilogo delle funzioni mancanti](editor-gap-review.md). Completati [testo su tracciato](iteration-editor-text-on-path.md) con allineamento, maniglia, baseline/ascendente/discendente, scostamento verticale in mm e separazione, e [Mano/PAN](iteration-editor-pan.md) accanto alla freccia o temporaneo con Space. **432 unitari, build e controllo segreti passati**; suite browser **261/263 passati e 2 timeout**, entrambi poi passati isolati senza modifiche (log `.local/editor-path-pan-offset-complete-check.log` e `.local/editor-path-pan-offset-timeout-recheck.log`). Non dichiarare verde l’intero comando iniziale. **13 browser pubblici locali**, **15 campioni JSON/SVG riaperti ed esportati**, senza errori o rete esterna. Ultimo checkpoint interamente verde precedente: 426/243. Ispettore, geometria, testo, livelli, crop e richieste precedenti documentati nello stato locale. Sfondo a colori/AI sospeso, multipagina escluso. Nessun deploy o modifica commerciale. Illustrator non collaudato; il JSON mantiene il testo su percorso come oggetto unico, lo SVG usa glifi testuali trasformati individualmente.

Gli aggiornamenti sotto sono lo storico degli incrementi: per riprendere usare prima lo stato sintetico collegato sopra.

**Operazioni tracciati e ispettore multiplo verificati, 9 novembre 2026:** [tracciati](iteration-editor-path-operations.md), [stile](iteration-editor-selection-style.md), [livelli](iteration-editor-selection-order.md). Riflessioni nel foglio, inversione/apertura dei nodi, stile comune e riordino di gruppi/selezioni, tutti con comandi e storico condivisi. `npm run check`: **358 unitari, 137 browser laboratorio, build e controllo segreti** superati. Campioni `path-operations.TEST` e `selection-style.TEST`, Illustrator da collaudare. Tipografia completata nell’aggiornamento sopra.

**Filtri locali e PNG di bozza verificati, 9 novembre 2026:** [luminosità/contrasto/mezzitoni](iteration-editor-raster-filters.md), [export PNG](iteration-editor-png-export.md). Sorgenti e pixel binari conservati; bozza a 150/300/600 dpi bianca o trasparente, indipendente da vista e Retina. `npm run check`: **344 unitari, 129 browser laboratorio, build e controllo segreti** superati; 13 browser pubblici locali superati. Campioni raster e PNG in `fixtures/illustrator`; nessun collaudo Illustrator o lavorazione. Prossimo incremento: [operazioni sui tracciati](iteration-editor-path-operations.md).

**Ritaglio/riflessioni e appunti editor verificati, 9 novembre 2026:** [ritaglio](iteration-editor-raster-crop.md), [clipboard](iteration-editor-clipboard.md). Crop non distruttivo, ripristino originale, riflessioni e gruppi; copia/taglia/incolla con ID nuovi e singolo `insertObjects` validato. `npm run check`: **332 unitari, 122 browser laboratorio, build e controllo segreti** superati. Corretto soltanto il sincronismo di un test chat; codice pubblico invariato. Campioni `raster-crop.TEST` e `clipboard.TEST`, Illustrator da collaudare. Filtri ed export completati nell’aggiornamento sopra.

**Importazione PNG verificata, 9 novembre 2026:** [dettagli](iteration-editor-raster.md). Originale locale nel JSON, conversione binaria/soglia/inversione/bianco trasparente, dimensioni protette, rotazione/copie/gruppi e comandi comuni. PNG con struttura/CRC/dati compressi controllati prima del commit; limite 256 KB/1 MP, quattro immagini TEST. JSON fino a 10 MB; SVG incorpora raster derivato. `npm run check`: **323 unitari, 116 browser laboratorio, build e controllo segreti** superati. Campione `raster.TEST` e `raster-source.TEST.png`; Illustrator non collaudato. [Ritaglio/riflessione](iteration-editor-raster-crop.md) e [copia/taglia/incolla](iteration-editor-clipboard.md) completati nell’aggiornamento sopra.

**Penna per punti verificata:** [dettagli](iteration-editor-pen.md), anteprima, chiusura, Maiusc/Backspace/Esc e pulsanti nella barra. `npm run check`: **308 unitari, 110 browser laboratorio, build e controllo segreti** superati. Anche 13 browser pubblici locali passati; codice pubblico preservato. Campione `pen.TEST`, Illustrator da collaudare. PNG completato nell’aggiornamento sopra.

**Nodi numerici verificati:** [dettagli](iteration-editor-path-nodes.md), coordinate assolute, inserisci/elimina, guide di vista e aggiornamento dei soli vertici scelti anche dopo rotazione. `npm run check`: **308 unitari, 98 browser laboratorio, build e controllo segreti** superati. Campione `path-nodes.TEST`, Illustrator da collaudare. Aggiunto poi trascinamento del nodo scelto con Fabric nativo: 4 browser mirati e suite completa passati, **308 unitari e 102 browser laboratorio**, build e controllo segreti. Penna completata nell’aggiornamento sopra.

**Font locali verificati:** [dettagli](iteration-editor-fonts.md). Sette famiglie, anche sui caratteri selezionati; controllo disponibilità e blocco della sostituzione silenziosa, font non incorporati. `npm run check`: **302 unitari, 96 browser laboratorio, build e controllo segreti** superati. Campione `fonts.TEST.json/svg` e anteprime, Illustrator non collaudato. Nodi aggiornati nella sezione sopra.

**Pennello e forme poligonali verificati:** [tracciati](iteration-editor-freehand.md), [poligoni/stelle](iteration-editor-polygons.md). `path` vettoriale, 2–512 punti, disegno manuale, semplificazione, chiusura/riempimento, trasformazioni e storico comuni. Triangolo/pentagono/stella; JSON locale fino a 5 MB. `npm run check`: **297 unitari, 94 browser laboratorio, build e controllo segreti** superati. Campioni `paths.TEST` e `polygons.TEST`, Illustrator non collaudato. Font completati nell’aggiornamento sopra.

**Ellissi verificate:** [incremento](iteration-editor-ellipses.md), `npm run check` con **285 unitari, 86 browser laboratorio, build e controllo segreti** superati. Disegno diretto, raggi indipendenti, proporzioni, rotazione, maniglie, intersezione effettiva per il cestino e contorni trasparenti. Campione `ellipses.TEST.json/svg`; Illustrator non collaudato. Pennello completato nell’aggiornamento sopra.

**Disegno diretto verificato:** [uso e risultati](iteration-editor-lines.md). Linee tra estremità, rettangoli fra angoli e cerchi dal centro; Maiusc, Alt, Esc e unico comando al rilascio. `npm run check`: **277 unitari, 82 browser laboratorio, build e controllo segreti** superati; anteprime desktop/mobile ispezionate. Ellissi completate nell’aggiornamento sopra.

**Linee vettoriali verificate:** [documento](iteration-editor-lines.md). Tipo `line`, lunghezza/rotazione/contorno nell’ispettore, maniglie, gruppi e JSON/SVG. 270 unitari, 77 browser laboratorio, build e controllo segreti superati. Campione `lines.TEST.json/svg`, `npm run capture:selection -- --lines`; Illustrator non collaudato. Disegno diretto completato nell’aggiornamento sopra. Nessun deploy, dipendenza nuova o AI reale.


**Griglia/agganci e tastiera verificati:** [guide](iteration-editor-guides.md), [tastiera](iteration-editor-keyboard.md). Griglia opzionale, aggancio durante il trascinamento a bordi/centri/griglia, Alt sospende, tolleranza 6 pixel visibili; impostazioni e guide escluse da JSON/SVG. Frecce 0,1 mm, Maiusc 1 mm, Alt 0,01 mm; Cmd/Ctrl per selezione, gruppi, copia, storico e cancellazione. Campi e testo conservano i propri tasti. Baseline completa: 266 unitari, 75 browser laboratorio, build e controllo segreti superati. Lavoro successivo in corso: [linee vettoriali](iteration-editor-lines.md), da completare e collaudare prima di considerarlo consegnato.


**Ultimo incremento verificato: trasformazioni dell’insieme e spessori.** [Dettagli](iteration-editor-group-transforms.md): scala uniforme e rotazione di gruppi/selezioni multiple, maniglie e ispettore live, stesso `transformObjects` validato. Freccine del contorno a 0,05 mm con supporto dei valori precisi. 260 unitari, 67 browser laboratorio e 13 browser pubblici locali superati, build e controllo segreti. Le prove sospese sui contorni trasparenti sono ora eseguite; il precedente blocco dell’auto-review non è più attivo. Campione `group-transforms.TEST.json/svg` e catture aggiornate; Illustrator da collaudare. Si prosegue autonomamente con le funzioni manuali locali per richiesta del titolare, senza deploy né immagini AI.


**Ultimo incremento locale: selezione e gruppi.** [Stato, prove e limiti](iteration-editor-selection.md). Aggiunti Maiusc/riquadro, gruppi semplici, copia/elimina/spostamento della selezione, ispettore multiplo, allineamenti e distribuzione; cursori del testo corretti anche in rotazione. Nuovi testi centrati; clic seleziona il box, doppio clic non in scrittura entra nel punto, doppio clic già in scrittura seleziona la parola. Ultima richiesta: forme trasparenti agganciabili sul solo contorno, con passaggio dei clic attraverso l’interno. **254 unitari e build finali passati; 61 browser passati prima di quest’ultima modifica, nuovi test sui contorni ancora da eseguire.** Auto-review dell’avvio browser bloccata per limite d’uso del servizio: non aggirare il blocco e non dichiarare eseguite le prove mancanti. Screenshot desktop del nuovo campione da rigenerare con attesa del ridisegno. Nessun deploy. Questo aggiornamento prevale sulle sezioni precedenti/storiche.


**Aggiornamento ispettore e testo dell’8 novembre 2026:** [documento operativo](iteration-editor-inspector.md). Proprietà live, centro come riferimento, uscita parziale ammessa/cestino per trascinamento totalmente esterno, box a larghezza fissa/automatica e altezza sempre automatica e formattazione dei soli caratteri selezionati. L’altezza fissa è sospesa per richiesta del titolare; importare i primi box fissi li adatta senza perdere contenuti. Il resize del box mantiene fermo il lato opposto e non cambia il font; override Unicode nel documento v2, stesso `updateObject` validato per UI e simulazione. Collegamenti tra box non implementati. Nessun deploy. Verifiche finali: 246 unitari e 55 browser laboratorio, build/controllo segreti; 13 browser pubblici locali superati, codice pubblico preservato. Campione `text-box.TEST.json/svg` e `npm run capture:inspector`; Illustrator non collaudato. Questo aggiornamento prevale sulle limitazioni storiche sotto.

**Area di disegno a tutto schermo aggiunta su richiesta del titolare:** `http://127.0.0.1:5173/editor?workspace=1`. [Documento](iteration-editor-workspace.md): stessa bozza, canvas centrale, due pannelli richiudibili, zoom/fit ed eventuale fullscreen browser. Vista normale sempre disponibile; nessuna pubblicazione. Per riprendere usare questi aggiornamenti prima delle sezioni storiche sotto.

Comandi dell’editor ora a icona, con tooltip e nomi accessibili, su richiesta successiva. Verifica finale con questa UI: **233 unità, 51 browser laboratorio**, build e scansione credenziali superati. Nessuna dipendenza aggiunta; 13 regressioni pubbliche locali già superate nella sessione.

**Incremento trasformazioni successivo, 8 novembre:** [risultati](iteration-editor-transforms.md). Accesso diretto `http://127.0.0.1:5173/editor`; documento v2 con import v1, pannello proprietà, scala/rotazione manuale, ordine livelli e allineamenti all’area per singoli oggetti. 233 unità e 47 browser laboratorio superati; campioni `transforms.TEST.json/svg`. Restano gruppi/selezione multipla, snap, stile completo, font/import/elaborazione immagini e Illustrator. Le descrizioni dello schema v1 e delle trasformazioni bloccate sotto sono storiche.

**Incremento locale completato l’8 novembre 2026:** [risultati e prova](iteration-editor-objects.md), [piano](editor-roadmap.md), [matrice PitchPrint e fonti ufficiali](pitchprint-capabilities.md). Aggiunti creazione/selezione/duplicazione/eliminazione oggetti e scene vuote riapribili, con gli stessi comandi validati della simulazione AI. Verificati 218 test unitari, 40 browser laboratorio e 13 browser pubblici locali. Nessun deploy. Le sezioni sotto descrivono la base antecedente a questo incremento quando divergono.

Nuove priorità esplicite del titolare: prima strumenti manuali di disegno/elaborazione; **multipagina escluso e generazione immagini AI rinviata**. Prossimo incremento: proprietà numeriche, trasformazioni, livelli e allineamenti. Template/prodotti/opzioni e archivio richiedono specifica propria; nessuna integrazione commerciale autorizzata qui.

Aggiornato l’8 novembre 2026 tramite lettura del repository. Base applicazione: `5ddbc84`. Questo documento prepara il lavoro della prossima chat: non autorizza la sostituzione di PitchPrint nel negozio o un deploy.

## Obiettivo e confini

Sviluppare nel laboratorio locale il configuratore destinato, dopo collaudo e autorizzazione separata, a sostituire PitchPrint. Partire dai timbri e conservare un’architettura estendibile alle altre famiglie. Riutilizzare il prototipo Fabric esistente; l’editor deve funzionare manualmente anche senza AI.

La chat e il selettore sono già pubblicati, mentre il canvas è soltanto nel laboratorio locale. Preservare questa separazione. Nessuna modifica al Worker pubblico, al tema, a PitchPrint, BSS, prezzi, varianti, carrello, checkout o ordini durante questa fase. Nessuna migrazione BSS V1/V2. I dati economici rimangono responsabilità del Preventivometro/BSS, non dell’editor.

## Letture iniziali

1. `AGENTS.md`: vincoli operativi e autorizzazioni circoscritte.
2. `01_Specifica_Progetto.md`: specifica originale; il vecchio nome `01_Specifica_Progetto_Codex.md` non esiste in questa cartella.
3. Questo documento: stato locale e perimetro della nuova fase.
4. `README.md`: avvio e comandi attuali.
5. `docs/production-files.md`: formati e checklist umana Illustrator.
6. `docs/iteration-variant-dimensions.md`: fonte autorevole delle misure.
7. `docs/handoff-review.md` e `docs/integrations.md`: responsabilità e riferimenti ai progetti esterni.
8. `docs/release-cloudflare.md` e `docs/releases/2026-11-07-knowledge.json`: distinguere il servizio già online dal laboratorio.
9. Se si modifica l’AI, leggere anche `REGOLE_ASSISTENTE.md`, `CONOSCENZE_ASSISTENTE.md` e `docs/knowledge-assistant.md`.

`docs/iteration-canvas.md`, `docs/architecture.md` e varie sezioni di `docs/test-results.md` descrivono incrementi storici. Le frasi «nessun LLM reale», «nessun aggiornamento Shopify» o «nessun deploy» non rappresentano più lo stato generale: AI, sincronizzazione e pubblicazione della sola chat sono state completate successivamente. Rimane attuale il limite specifico: **nessun collegamento del modello reale ai comandi grafici**.

## Cosa esiste nel codice

- `src/editor/model.ts`: schema del documento canonico e degli oggetti, `GraphicCommandSchema`, validazione e `DocumentStore`, con revisioni monotone e ID stabili. Lo store non è in un file `store.ts` separato.
- `src/editor/fabric-adapter.ts`: renderer Fabric, misure, scrittura diretta nel canvas tramite IText, trascinamento ed esportazione SVG.
- `src/editor/EditorLab.tsx`: UI del laboratorio, import/export JSON, undo/redo, conflitti di formato e pannello sviluppatore per comandi JSON simulati.
- `src/App.tsx`: passaggio dal candidato al canvas; associazione prodotto/variante/versione e testo raccolto nella chat.
- `src/public/`: interfaccia pubblica separata, priva di editor Fabric. Non aggiungere qui il nuovo editor in questa fase.
- `tests/editor.test.ts` e `tests/e2e/local.spec.ts`: regressioni del modello e dei gesti browser.
- `fixtures/illustrator/`: esempi JSON/SVG di prova; alcune fixture sono storiche, leggere le note prima di usarle.

Funzionalità presenti: selezione prodotto → «Prova nel canvas», testo modificabile direttamente nel canvas, trascinamento, undo/redo, salvataggio e riapertura JSON, SVG con dimensioni fisiche, cambio prodotto con conservazione degli oggetti solo se validi nel nuovo formato. Un errore deve conservare il progetto precedente.

Perimetro effettivo: oggetti testo/rettangolo/cerchio; testo Arial, massimo 8 righe e 480 caratteri; colori nero/bianco. Scala e rotazione degli oggetti bloccate nell’adapter. I soli comandi grafici attuali sono `moveObject`, `setText` e `setObjectStyle`. Gli esempi AI del pannello grafico sono simulati, anche se l’assistente commerciale usa già OpenAI.

## Cosa manca per sostituire PitchPrint

- Gestione completa degli oggetti: aggiunta, eliminazione, duplicazione, ridimensionamento, rotazione, ordinamento, allineamenti e selezione multipla; definire l’ordine di implementazione.
- Loghi e immagini SVG/raster, gestione sicura dei file importati, font aggiuntivi e metriche affidabili; gruppi e scene complesse.
- Comandi grafici AI reali, tipizzati e validati, sullo stesso store delle modifiche manuali; gestione delle risposte obsolete e dei conflitti.
- Autocomposizione che valuti l’ingombro effettivo, senza deformare loghi o ridurre caratteri sotto il limite del profilo.
- Profili produttivi confermati, area utile e margini reali, regole specifiche di lavorazione.
- Salvataggio persistente dei progetti/file e futura approvazione della bozza; definire prima privacy, accessi e conservazione.
- Integrazione nel tema e trasferimento di configurazione/file al percorso commerciale: fase futura, con autorizzazione e contratto dedicati.
- Collaudo produttivo Illustrator e prove su dispositivi fisici.

Non trattare questi punti come funzioni già disponibili o come un mandato a implementarli tutti nel primo incremento.

## Invarianti da preservare

Un solo documento grafico: gesti manuali e AI passano dagli stessi comandi validati, con ID e revisioni. Fabric non deve diventare una seconda fonte di verità. Unità canoniche mm/pt; pixel soltanto per visualizzazione.

JSON editabile e SVG di produzione sono artefatti distinti. Gli attuali documenti hanno `fixture: true`, `validatedForProduction: false` e profilo `TEST-stamp-v1`: non rimuovere questi indicatori per far apparire certificato il prototipo.

Le dimensioni nominali dei timbri derivano esclusivamente dai metafield variante `custom.larghezza` e `custom.altezza`. Non sostituirli con titolo, opzioni o descrizione. Dimensione nominale, area utile e margine produttivo non sono sinonimi. I 7 pt, il margine TEST di 1 mm e il nero/bianco del prototipo non sono regole universali.

I contenuti originali e i dati identificativi raccolti nella chat rimangono sul dispositivo per la composizione; verso OpenAI devono passare per la protezione privacy già esistente. Non introdurre un nuovo invio diretto di testo o file privati. Non cambiare budget, segreti o impostazioni di condivisione per attivare prove.

## Prima iterazione consigliata

1. Rileggere istruzioni, verificare Git, strumenti e codice attuale; non presumere che il conteggio prodotti o lo stato live siano immutati.
2. Avviare il laboratorio e riprodurre candidato → canvas → modifica diretta → JSON → riapertura → SVG.
3. Proporre una sequenza di piccoli incrementi, con criteri di accettazione; primo candidato: aggiungere/duplicare/eliminare oggetti con comandi condivisi e undo/redo. Valutare eventuali migrazioni dello schema prima di modificare i documenti esistenti.
4. Implementare il primo incremento locale concordato nel mandato della nuova chat, aggiungendo test significativi e mantenendo le regressioni commerciali.
5. Registrare risultati e limiti; consegnare file campione per il collaudo umano Illustrator. Nessun deploy.

## Avvio e verifiche

Dalla cartella del progetto, Node fissato in `.nvmrc`:

```sh
nvm use
npm ci
npm run dev
```

Aprire `http://127.0.0.1:5173`; dal candidato usare «Prova nel canvas». `.env.local` è privato e ignorato da Git: verificarne solo la configurazione necessaria, senza mostrarne i valori. Le letture catalogo locali possono usare l’accesso già configurato; le prove dell’editor devono poter usare fixture e trasporti di test.

```sh
npm run check
npm run schemas
```

`npm run check` comprende unit test, build, scansione dei segreti nel client e browser del laboratorio. Se cambiano moduli condivisi con il pubblico, usare anche `npm run check:release` (preparazione e test, senza pubblicazione). Non usare `worker:deploy` in questa fase. Gli script `eval:*` fanno chiamate AI reali e richiedono un budget autorizzato; non sono necessari al primo sviluppo manuale dell’editor.

Baseline documentata del 7 novembre: 211 test unitari, 38 browser laboratorio, 13 browser pubblici, runtime Worker/SQLite e controllo segreti superati. Questi test **non sono stati rieseguiti per questo handoff** e non certificano Illustrator. Il nuovo agente deve eseguire le verifiche appropriate alle proprie modifiche.

## Repository e documenti esterni

Continuare nel repository `mattiapascal/Personalizzatore`; verificare il ramo e le modifiche prima di lavorare. Il tema è un altro repository, con regole proprie. Non copiarvi automaticamente il laboratorio e non pubblicare l’editor insieme alla chat.

I documenti originali degli altri progetti non sono tutti duplicati qui. Per una futura integrazione rileggere gli handoff aggiornati e i rispettivi `AGENTS.md` nelle cartelle:

- `/Users/davide/Documents/Shopify/Temi/Mode mio 5.2.0`
- `/Users/davide/Documents/Shopify/Preventivometro`

La lettura storica è riassunta in `docs/handoff-review.md`, ma non prova lo stato attuale del negozio, del tema o del Preventivometro.

## Aggiornamento font e operazioni massive — 10 novembre

[Operazioni massive](iteration-editor-bulk-operations.md), [categorie e usabilità dei font](iteration-editor-font-usability.md). Importazione massiva analizzata prima del salvataggio, provenienza/hash per evitare duplicati; associazioni commerciali locali massive e recupero delle associazioni originali da `global.pprint` in sola lettura. Font multipli, categorie grafiche distinte dalle famiglie tipografiche, matrice compatta con intestazioni fisse e anteprime dimensionate sulla cella. Libreria personale classificata su richiesta; dati privati e copie dei font esclusi da Git. Scorrimento del menu font corretto: hover senza richiamo automatico della voce. Nomi interni illeggibili rifiutati nei nuovi caricamenti; copia riparata del font senza nome con verifiche strutturali e browser. Stato e conteggi effettivi in `editor-local-status.md`.

Risoluzione font PitchPrint aggiornata: [alias verificati](iteration-editor-pitchprint-font-aliases.md), risposta tipizzata con hash ricontrollato dal browser, metadati canonici e avviso di collegamento. I file originali e le versioni caricate vengono equiparati solo con byte identici. Nessuna installazione o importazione reale implicita nel riconoscimento.

Politica successiva del titolare: [solo font incorporati e caricamento rapido](iteration-editor-library-font-policy.md). Prevale sulle sezioni storiche che offrivano font del computer. Vecchi progetti leggibili ma scelta esplicita dei file necessaria prima di render/misure; canvas senza attesa dell’intera libreria.

[Varianti reali e collaudi portabili](iteration-editor-font-regressions.md): B/I e cambio famiglia su stili misti, famiglie a stile unico, menu limitato a libreria attiva/documento corrente/preparazioni. Controllo completo **616 unitari e 363 browser**, 13 pubblici e 19 artefatti passati. Il corpus non dipende dai font del Mac. Nuovi generatori verificati e limiti dei vecchi comandi in `production-files.md`. Prossimi lavori: recupero rigoroso delle dichiarazioni CSS originali, migrazione dei generatori storici, poi collegamento dei profili reali al motore grafico. Nessun ampliamento commerciale autorizzato.

Correzione successiva alla schermata di caricamento: [dettagli](iteration-editor-library-font-policy.md). Timeout complessivo di otto secondi per elenco/primo font, annullamento alla chiusura e **Riprova**; un errore non crea una bozza senza testo. Documenti iniziali incorporati indipendenti dall’elenco. **616 unitari, build/segreti e 15 browser mirati passati**, non un nuovo controllo completo. Libreria reale: canvas in 1174/1059 ms, zero scritture/errori. Nessun deploy.

[Gruppi PitchPrint](iteration-editor-pitchprint-groups.md): trasformazioni ricorsive, ordine e proprietà dei figli, blocchi ereditati; selezione esterna unica con avviso per annidamenti. Label/ordine propri del gruppo restano bloccanti, da gestire con un contratto dedicato. **620 unitari, build/segreti, 11 browser pertinenti e 20 artefatti passati**; nuovo campione 100 × 60 mm con font incorporato e confronto pixel indipendente. Analisi reale: 112/370 convertibili, tre recuperati grazie ai gruppi; zero scritture/errori e dati personali invariati. Nessun collaudo Illustrator o deploy. Il catalogo precedente non costituisce da solo una prova dei pesi CSS divergenti: non allentare la risoluzione dei font su tale base.

Seguito: [proprietà e gerarchia dei gruppi](iteration-editor-group-properties.md) supera il blocco label/ordine e conserva anche i contenitori singoli. Nuovo `setGroupProperties` amministrativo, ereditarietà dei blocchi/riferimenti, campi dei figli compilabili senza separazione, appunti e archivio con gerarchia. **627 unitari**, build/segreti, **374 browser completi**, 13 pubblici e 20 artefatti passati. Corretti anche avvio fissaggi, recupero JSON offline e controllo dei membri bloccati nei comandi multipli. **117/370 convertibili**, cinque in più, nessuna regressione o scrittura nell’archivio reale. Campione e anteprima ispettore aggiornati; Illustrator non collaudato.

**11 novembre — importazione effettiva ancora da autorizzare:** 117 JSON completi preparati privatamente, zero salvataggi reali. Il primo piano non esplicitava abbastanza che 37 conversioni perdono i colori: una seconda domanda sostituisce la prima, offrendo 79 vettoriali B/N, tutte le 117 prove TEST B/N oppure attesa della fedeltà completa. Anche sfondi/materiali sono esclusi. Piano in `.local/pitchprint-migration/import-plans/ready-drafts.md`, dati in `prepared-drafts.jsonl`. Non trattare il solo via libera alla vecchia domanda generica come approvazione delle differenze chiarite nella seconda. Prossima estensione tecnica individuata: contorni reali 3,49–9,20 mm oggi fermati dal limite TEST di 2 mm; palette completa ancora necessaria per importare fedelmente i sorgenti a colori.


**11 novembre — autorizzazione ricevuta ed eseguita:** il titolare richiede tutte le 117 bozze con colori conservati, anche per targhe stampate. [Incremento RGB e importazione](iteration-editor-pitchprint-colors.md): 117 template salvati nell’archivio locale, tag «Da verificare», zero associazioni; revisione 247 → 364, due composizioni preesistenti e font invariati. Backup verificato e manifest privati in `.local`. I JSON B/N preparati prima non sono stati usati. `colorMode` e modalità raster originale condividono i validatori manuali/AI; nessun allentamento della politica font. Quanto scritto sopra sull’attesa di autorizzazione è storico e superato. b4e5af4 sincronizzato su GitHub con approvazione esplicita; nessun deploy o scrittura sul negozio.

Esito finale dell’incremento colori: **633 unitari, build/schemi/segreti, 376 casi browser verificati in due esecuzioni, 13 pubblici e 20 artefatti passati**. Log intermedio con due arresti conservato; completamento a server stabile 138/138, riepilogo distinto per caso 376/376. 117 record effettivi riaperti e riesportati in sola lettura; 95 senza segnalazioni di copertura, 20 con simboli assenti e due non verificabili automaticamente. Dettagli e prossimi passi in `iteration-editor-pitchprint-colors.md`.
