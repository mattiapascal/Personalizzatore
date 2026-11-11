**Aggiornamento 11 novembre — fedeltà e font:** [ritagli frazionari, bordi in mm e griglia filtri stabile](iteration-editor-fractional-crop.md): 259/370 sorgenti convertibili, nessuna nuova importazione. [Protezione delle misure dei testi](iteration-editor-font-metric-guard.md) e recupero dei glifi mancanti disponibili; solo file incorporati, nessun font del computer. Le lacune avanzate sotto restano sospese.

**Aggiornamento 11 novembre — testi:** [stili dei caratteri importati e interlinee compatte](iteration-editor-pitchprint-text-styles.md), con file font esatti e altezza automatica. 144/370 sorgenti convertibili; nessuna ulteriore importazione nell’archivio. Effetti senza equivalenza, indici ambigui e varianti assenti restano errori espliciti.

**Aggiornamento 11 novembre:** [contorni reali e nuova analisi](iteration-editor-wide-strokes.md): 123/370 sorgenti convertibili, sei in più senza ulteriori importazioni nell’archivio. Le 117 bozze già importate conservano colori e stato «Da verificare»; [fori, anteprime persistenti e avvio adattato](iteration-editor-preview-cache-startup.md) completati. I riferimenti sotto alle sole palette B/N o a font del computer sono storici: la politica attuale usa esclusivamente file incorporati e ammette RGB nei progetti senza montatura timbro.

# Punto della situazione — funzioni mancanti al 10 novembre 2026

**Correzioni dal collaudo del 10 novembre:** [stato corrente](editor-local-status.md) e [ricollaudo](editor-retest-2026-11-10.md). Salvataggio manuale esplicito, sessioni separate, recupero senza modello, cancellazioni e controlli numerici corretti; targhe parametriche e primo riuso template su più misure disponibili localmente.

Ambiente solo locale: <http://127.0.0.1:5173/editor?workspace=1>. Questo elenco confronta l’editor effettivo con l’[inventario documentale PitchPrint](pitchprint-capabilities.md) e le richieste del titolare. Non dichiara una parità completa. Il censimento dell’account è ora disponibile: 473 sorgenti acquisiti in sola lettura, ancora da convertire/verificare individualmente.

Import SVG/PDF, scelta contorni/testo editabile, backend locale e font personali: [incremento aggiornato](iteration-editor-import-font-library.md). Il testo PDF editabile è ricostruito, non certificato identico. Google Fonts disponibile con ricerca, anteprime e scelta dello stile da aggiungere con un clic.

**Nuovo incremento:** [configurazioni indipendenti e varianti font](iteration-editor-configurations-font-variants.md). Carrello di prova locale con copie congelate, copia/sostituzione distinte, anteprima prima della conferma e confronto prima/dopo. Famiglie raggruppate e selezione di file di variante nell’ispettore; Google Fonts con scelta dello stile. Il riscontro sull’ambiguità della prima UI ha portato a separare modifica, controllo e conferma.

**Incremento per il collaudo del 10 novembre:** [profili versionati e zone visuali](iteration-editor-profile-zones-shop-acceptance.md), associazione a prodotto/variante reale con verifica server, nuova checklist con esiti/note/esportazione. Storico completo dei profili dal nuovo incremento; gli altri archivi hanno ancora contatori di versione senza una cronologia completa. Applicazione dei profili al canvas e zone dei template restano da implementare.

**Gestione font e profili:** [amministrazione della libreria](iteration-editor-font-administration.md), [backup/ripristino locale](iteration-editor-font-backup.md) e [schema tecnico in mm](iteration-editor-profile-preview.md). La preview tecnica non applica ancora i profili ai documenti.

**Incrementi durante l’assenza:** [bozze, galleria e cambio modello](iteration-editor-drafts-templates-products.md), [tinta globale dell’impronta e WOFF2](iteration-editor-imprint-woff2.md), [capacità estesa](iteration-editor-capacity.md). Autosalvataggio nel solo editor autonomo; backend con associazioni molti-a-molti e raccolta profili ancora non applicati al canvas. Il sottoinsieme editor resta di tre montature TEST.

**Priorità aggiornate dal titolare:** semplicità per tutti gli utenti, gestione completa dei font e vincoli adeguati ai casi reali. Le funzioni avanzate elencate sotto restano lacune dell’inventario, non attività da avviare ora. Prima prova proposta: associazione flessibile montature/template/progetti per i tre ingressi cliente. [Flussi e proposta aggiornata](editor-roadmap.md).

**Nuovo incremento amministrativo:** [miniature e tag](iteration-editor-archive-tags-shop.md), vocabolario riutilizzabile anche dall’editor, AND/OR, ordine dei tag persistente, copia cliente→template e anteprime font automatiche. Vero catalogo commerciale per collezioni/tag/stato disponibile, lettura di 1.597 prodotti e 73 collezioni; rimane da collegare l’intero catalogo ai profili/canvas. [Responsabilità profili/template](editor-profile-template-boundary.md), con definizione visuale delle zone del profilo ora disponibile.

**Nuovo incremento:** [proprietà degli oggetti e modulo cliente](iteration-editor-object-properties.md), ordine crescente, blocchi validati, riferimenti non produttivi e formati/limiti testo. [Importazione nativa PitchPrint](iteration-editor-pitchprint-import.md), 39 varianti Google esatte installate e 57 combinazioni manuali, senza fallback. Ancora da completare le strutture native non supportate e il collaudo visivo dei template; non avviare una migrazione di massa non verificata.

## Richieste recenti implementate

- Ispettore live con geometria X/Y, larghezza/altezza e rotazione, senza riepiloghi duplicati. Testo: font su riga dedicata, corpo/dilatazione e interlinea/spaziatura in coppia; contenuto editato nel canvas, senza textarea e informazioni font superflue.
- Box di testo centrati e a larghezza automatica di default, compreso «TEST · Città»; altezza sempre dal contenuto. Doppio clic laterale attiva la larghezza automatica. Le maniglie cambiano corpo/dilatazione oppure il solo box secondo la spunta. Misure numeriche riferite al centro; maniglie con ancoraggio opposto.
- Stili sui caratteri selezionati; nessun cambio di font/corpo con il solo cursore. Spaziatura fine e crenatura additiva. Interlinea 1/passo 0,1, allineamenti per righe anche parzialmente selezionate e giustificazione parole/lettere con i parametri richiesti.
- Livelli in dropdown, riordino anche senza selezione, identità e anteprima coerenti con l’ispettore, azioni di selezione/clipboard/duplica/elimina raccolte e X distinta. Tema #08c, esterno #b9c8cc.
- Crop con quattro bordi e maniglie, preview e ripristino dell’originale.
- Testo su linee, Bézier, poligoni, cerchi ed ellissi; sinistra/centro/destra, giustificato ricondotto al centro; singola riga, maniglia di scorrimento, scostamento verticale in mm, baseline/ascendente/discendente, inversione e separazione. Guida conservata nel documento unico. SVG con caratteri testuali trasformati individualmente: il collegamento editabile al percorso è conservato nel JSON; l’editabilità come unico testo curvo in Illustrator non è certificata.
- Mano accanto alla freccia, PAN persistente dal pulsante o temporaneo con Space, senza cambiare zoom/selezione/documento. Rotella e pinch attorno al puntatore.

## Funzioni grafiche ancora da sviluppare

| Area | Cosa manca |
| --- | --- |
| Loghi e vettori | Import SVG/PDF e fori già disponibili con limiti documentati. Restano unione, sottrazione e intersezione di forme; conversione diretta del testo in contorni nell’editor/esportazione; vettorializzazione dei raster. Non confondere quest’ultima con conversione bianco/nero o rimozione sfondo. |
| Font e tipografia avanzata | Font propri portabili, famiglie raggruppate e file di varianti/pesi/corsivi selezionabili. Caratteri mancanti e stili simulati dei font incorporati segnalati e controllati dalla conferma locale, anche per WOFF2 singoli supportati. Ricerca/filtri, campioni, download e dati descrittivi/licenze locali disponibili. Restano assi variabili, collezioni/mappe non supportate, shaping e distribuzione remota; backup/ripristino locale della libreria disponibile. Stili di testo riutilizzabili e flusso tra box sono avanzamenti sospesi. Sono selezionabili esclusivamente file della libreria o incorporati nel progetto; i vecchi riferimenti a famiglie del computer sono superati. Le misure nominali rifiutano i caratteri non verificati prima della costruzione del testo. |
| Nodi e aspetto degli oggetti | Vincoli persistenti di tangenza dei nodi Bézier; estremità/giunzioni e tratteggi più completi; opacità degli oggetti. Palette RGB già disponibile nei documenti a colori; vincoli del profilo ancora da completare. L’anteprima globale monocolore dei timbri è disponibile, senza riscrivere gli oggetti B/N. Le operazioni singole sulle maniglie Bézier sono già presenti. |
| Livelli e componenti | Gruppi annidati e blocchi per oggetto/operazione con ereditarietà e validazione dei comandi già presenti. Restano visibilità dedicata, elementi fissati sopra/sotto e componenti riutilizzabili. |
| Fotografie e immagini | Modalità originale RGB/grigi e conversione B/N già disponibili; restano vincoli completi dei profili, saturazione/tinta/sfocatura/rumore e altri filtri; sostituzione dell’immagine mantenendo la cornice; maschere foto e segnaposto. Crop, riflessioni, luminosità/contrasto, soglia, mezzitoni e alpha dei grigi sono già disponibili. |
| Risorse e anteprima | Gallerie di immagini, simboli/clipart e sfondi; mockup 2D e, se utile, 3D. Distinzione esplicita tra elementi di anteprima e file da produrre. |
| Impaginazione | Righelli e guide personali salvate; vincoli tra oggetti e campi/form collegati; ridimensionamento guidato dell’area singola e sagome arbitrarie. Griglia/agganci, distribuzione e area circolare sono già presenti. |
| Elementi tecnici | Scelta fissaggi/misure di targa e posizionamento automatico ora disponibili nel prototipo, con politiche fuoriporta/scatolati condivise. Restano cambio supporto reale, associazioni accessori/varianti/prezzi, sagome e diametri verificati, zone di rispetto e istruzioni produttive complete. Requisito prioritario del flusso prodotto. QR e altre geometrie tecniche restano successivi. |

## Completamenti necessari per l’uso reale

| Area | Cosa manca |
| --- | --- |
| Salvataggio | Salvataggio manuale dell’archivio, aggiornamento versionato, ricarica/chiusura esplicite e recupero d’emergenza con miniature disponibili nel solo editor autonomo, con copie indipendenti e conflitti fra schede. Restano storico completo delle revisioni recuperabili, salvataggio remoto, accessi e conservazione dei dati. Il contatore di versione dei record non conserva da solo le versioni precedenti. Congelamento delle configurazioni, copia indipendente e sostituzione esplicita della singola riga (caso 13/15) ora disponibili nella prova locale, con retry e conflitti; manca il collegamento al carrello/ordine Shopify. JSON e archivio backend locale, Undo/Redo in memoria. |
| Produzione | Raccolta dei profili nel backend disponibile, senza ancora applicazione nel canvas. Regole per lavorazione da implementare/collaudare: targhe incise con punta da 0,5 mm per le sole zone incise, senza estendere la soglia agli spazi vuoti/timbri; stima del tempo/costo globale della targa in base alla punta imposta dai dettagli più fini, da calibrare e collegare al Preventivometro; colori vernice e distanza minima fra colori diversi 3 cm = 30 mm; timbri monoimpronta, testo minimo 7 pt e immagini B/N. Altri profili tecnici da completare: misure utili, DPI minimi, margini/abbondanze e taglio; approvazione di una revisione immutabile; collaudo Illustrator e lavorazione fisica. PDF locale a dimensioni fisiche disponibile, senza certificazione produttiva; export JPEG e gestione CMYK/spot/ICC/sovrastampa da valutare secondo la filiera. Anche SVG, JSON e PNG della bozza disponibili. |
| Template e catalogo | Archivio locale con tag/ricerca/anteprime/versioni, associazioni molti-a-molti a tre montature TEST, galleria con modello compatibile più piccolo e cambio modello confermato disponibili. Un template di targa si riutilizza su più misure con centratura/riduzione proporzionale confermata; vincoli di impaginazione responsiva ancora da realizzare. Il catalogo commerciale completo è consultabile per collezioni/tag; restano il collegamento di tutti i prodotti al canvas/profili reali, compatibilità con opzioni e backend online autenticato. Vocabolario/tag combinati e priorità condivise sono disponibili. I contatori di versione non sono uno storico completo dei record. |
| AI grafica | Collegare un assistente reale ai comandi già validati, con budget e prove dedicate. Oggi solo simulazione di comandi, nessuna generazione immagini. |
| Integrazione online | Collegamento al negozio e sostituzione di PitchPrint solo in una fase autorizzata successiva, con ambiente di prova e rollback. Prezzi, BSS, carrello e checkout restano fuori da questo lavoro locale. |

## Scelte già prese

- Multipagina escluso, non è una funzione da recuperare.
- Generazione immagini AI rinviata per i consumi.
- Rimozione dello sfondo a colori, anche tramite AI, sospesa. La rimozione locale del bianco dai veri grigi è già presente.
- Nessun deploy o cambiamento al negozio durante questo incremento.

## Ordine proposto per il lavoro successivo

1. Consolidare la prova locale di template/montatura con il catalogo esteso e dati tecnici verificati; mantenere la scelta del modello minimo compatibile e l’adattamento confermato.
2. Completare la gestione font oltre alle varianti, WOFF2 e controllo dei caratteri incorporati: distribuzione remota autenticata delle risorse, shaping e assi variabili secondo necessità, mantenendo esclusi i font del computer. [Amministrazione locale della libreria](iteration-editor-font-administration.md) ora disponibile.
3. Portare i vincoli dal profilo TEST ai profili reali, incluse le aree non editabili dei datari/numeratori, quindi supporti/fissaggi delle targhe. I nuovi limiti di capacità non certificano la lavorabilità.
4. Consolidare recupero e revisioni confermate; preparare il successivo collegamento autenticato con account, carrello e ordine, separato dall’autosalvataggio su questo browser.
5. Collaudo Illustrator e verifica dei contratti prezzo BSS su ambiente autorizzato prima dell’integrazione commerciale.

Operazioni booleane e altri strumenti avanzati di editing sospesi. Generazione immagini AI esclusa; bicolore solo per modelli particolari a priorità bassa; rimozione sfondo a colori resta sospesa.

È una proposta per il confronto, non l’avvio automatico di nuove integrazioni o servizi.

Verifiche correnti e log nello [stato locale](editor-local-status.md). Lettura reale del catalogo e schermate desktop/mobile verificate, archivio personale preservato. Illustrator risulta superato nel collaudo riferito dal titolare del 10 novembre; non è una nuova verifica dell’agente né una certificazione di tutti i casi produttivi.
