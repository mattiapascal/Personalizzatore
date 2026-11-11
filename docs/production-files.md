**11 novembre — foto nella cornice:** `raster-pan.source.TEST.json` → `raster-pan.TEST.json/svg`, tavola 100 × 80 mm, frame 40,2 × 28,1 mm ruotato 30° e riflesso orizzontalmente. Generatore `node --import tsx scripts/capture-editor-raster-pan.ts`: trascinamento manuale, freccia/Undo, AI simulata, Undo/Redo, download e confronto Canvas2D indipendente. Crop finale X 31,25/Y 19,5/100,5 × 70,25 px. Verificare in Illustrator tavola, cornice ferma, colori, ritaglio, trasformazioni e recupero dell’originale dal JSON. Collaudo umano non eseguito. [Resoconto](iteration-editor-raster-pan.md).

**11 novembre — riuso raster:** `raster-sharing.source.TEST.json` → `raster-sharing.TEST.json/svg`, 140 × 100 mm con quattro ID dello stesso PNG, due viste originali e due B/N, crop frazionari e trasformazioni distinti. Generatore `node --import tsx scripts/capture-editor-raster-sharing.ts`: gesto manuale e comando AI simulato/Undo dalla UI, controllo di una sola risorsa preparata e confronto Canvas2D indipendente. Verificare in Illustrator dimensioni, crop e orientamento dei quattro oggetti e la separazione dei parametri. Collaudo umano non eseguito. [Resoconto](iteration-editor-raster-sharing.md).

**11 novembre — sostituzione immagini:** `image-replacement.source.TEST.json` → `image-replacement.TEST.json/svg`, formato 100 × 60 mm, frame 30 × 15 mm a 30° e doppia riflessione. Generatore `node --import tsx scripts/capture-editor-image-replacement.ts`: pulsante manuale, comando AI simulato, Undo/Redo ed esportazioni UI, confronto Canvas2D indipendente e schermate desktop/mobile. Nuovo originale 80 × 20 px, finestra centrale 40 × 20 da X 20/Y 0. Verificare in Illustrator misure fisiche, crop, rotazione/riflessioni e recupero dell’originale dal JSON; collaudo umano non eseguito. [Resoconto e limiti](iteration-editor-image-replacement.md).

**Campione retino stabile:** `raster-grid.source.TEST.json` → `raster-grid.TEST.json/svg`, 60 × 40 mm, sorgente grigia 64 × 32 px e crop frazionario. Generatore `node --import tsx scripts/capture-editor-raster-grid.ts`: manuale, AI simulata e Undo sul medesimo documento; confronto dello SVG con scacchiera indipendente. In Illustrator verificare finestra, dimensione dei punti, posizione e recupero dell'originale dal JSON. Il PNG filtrato resta completo sotto un clip; il file non elimina definitivamente i pixel fuori finestra. Collaudo umano non eseguito.

**11 novembre — ritagli precisi:** [incremento e prove](iteration-editor-fractional-crop.md). `fractional-crop.source.TEST.json` → `fractional-crop.TEST.json/svg`, formato 100 × 60 mm, PNG RGB e JPEG EXIF con bordi frazionari, bordo destro modificato in mm e Undo di un comando simulato. Generatore `node --import tsx scripts/capture-editor-fractional-crop.ts`, con browser/server locale e archivio simulato. In Illustrator verificare dimensioni fisiche, bordi, riflessioni, rotazione e assenza di deformazione; prova umana non eseguita. SVG finale a 12 decimali; aggiornato lo storico `stamp-embedded.TEST.svg` con struttura invariata e zero differenze di pixel nel confronto del campione (`scripts/refresh-stamp-svg-precision.ts`). Gli SVG B/N mantengono la griglia filtrata completa sotto un clip vettoriale, così la retinatura non cambia col ritaglio.

**11 novembre — recupero senza metriche sostitutive:** [sorgente con carattere mancante](../fixtures/illustrator/font-geometry.source.TEST.json), [JSON corretto](../fixtures/illustrator/font-geometry.TEST.json), [SVG corretto](../fixtures/illustrator/font-geometry.TEST.svg). 80 × 40 mm, ABeeZee OFL incorporato; «ABC Ω» viene corretto in «ABC» conservando X/Y 10/10 mm, primo carattere a 9 pt sottolineato e resto a 18 pt. `scripts/capture-editor-font-measurement.ts`; controllare in Illustrator file, misure e stile locale. [Prove e limiti](iteration-editor-font-metric-guard.md). Il sorgente incompleto si recupera come JSON e non è esportabile in SVG finché il font non è corretto.

**11 novembre — capacità e regole tipografiche:** [campione a 6/3 pt e controlli del prodotto](iteration-editor-text-capacity.md). Lo schema tecnico ammette 0,1–500 pt; la soglia del timbro si verifica separatamente. SVG di lavoro e JSON non costituiscono conferma produttiva.

**11 novembre — originali raster nello SVG:** modalità originale PNG/JPEG con file compresso incorporato, viewport di crop e orientamento EXIF esplicito. `pitchprint-images.TEST.svg` aggiornato; JSON invariato. Verificare in Illustrator ritagli, riflessioni e orientamenti: il confronto browser non sostituisce il collaudo umano. [Foto ad alta risoluzione](iteration-editor-high-resolution.md).

**11 novembre — immagini PitchPrint:** [JSON](../fixtures/illustrator/pitchprint-images.TEST.json) / [SVG](../fixtures/illustrator/pitchprint-images.TEST.svg), 160 × 100 mm, originale PNG sintetico a colori, ritaglio e riflessioni, scale fisiche indipendenti. Generatore `scripts/capture-editor-pitchprint-images.ts`; confronto Canvas2D indipendente e riapertura/export UI passati. Verificare in Illustrator tavola, ritagli, colori e trasformazioni; **non ancora collaudato in Illustrator**. [Dettagli](iteration-editor-pitchprint-images.md).

**11 novembre — riparazione font esplicita:** [JSON](../fixtures/illustrator/font-repair.TEST.json) / [SVG](../fixtures/illustrator/font-repair.TEST.svg), 80 × 40 mm, «ABC Ω»: corpo ABeeZee TEST, sola Omega in Arimo, due file OFL incorporati e copertura finale verificata. `scripts/capture-editor-font-repair.ts`. Verificare in Illustrator la faccia del singolo carattere, testo editabile, sottolineato e misure; non collaudato in Illustrator. [Percorso e limiti](iteration-editor-font-repair.md).

**11 novembre — testi misti PitchPrint:** [JSON](../fixtures/illustrator/pitchprint-text-styles.TEST.json) / [SVG](../fixtures/illustrator/pitchprint-text-styles.TEST.svg), 200 × 100 mm, due testi e cinque file font OFL incorporati. Sorgente sintetico separato; generatore `scripts/capture-editor-pitchprint-text-styles.ts`. Verificare in Illustrator varianti reali, stili locali, corpi, decorazioni, baseline e interlinee 0,8/0,9. Il confronto browser del campione coincide alla risoluzione provata; non è un collaudo Illustrator. [Dettagli e limiti](iteration-editor-pitchprint-text-styles.md).

**11 novembre — contorni ampi:** nuovo campione [JSON](../fixtures/illustrator/wide-strokes.TEST.json) / [SVG](../fixtures/illustrator/wide-strokes.TEST.svg), da [sorgente PitchPrint sintetico](../fixtures/illustrator/wide-strokes.source.TEST.json), 300 × 180 mm. Cornice ruotata 9,2 mm, cerchio 6 mm e curva 5 mm, tutti vettoriali e senza dipendenze da font. Rigenerare con `node --import tsx scripts/capture-editor-wide-strokes.ts`. Verificare in Illustrator tavola, spessori, curve e centro; il confronto browser indipendente non certifica la produzione. [Incremento e prove](iteration-editor-wide-strokes.md).

# JSON, SVG e collaudo Illustrator

**Aggiornamento del 10 novembre:** disponibile anche PDF locale, amministrativo e opzionale cliente. Export da SVG con Chromium; qpdf normalizza la pagina alle misure fisiche senza scalare la grafica. Test automatici di pagina e testo estraibile passati; campione HTTP 100×60 mm renderizzato e ispezionato. Fori/accessori restano dati tecnici nel JSON/riepilogo, i marcatori non entrano nei file grafici. Il titolare ha indicato Illustrator superato nel proprio report del 10 novembre: non estende automaticamente la certificazione ai nuovi PDF o a tutti i campioni storici sotto.

`bezier.TEST.json/svg` (`node --import tsx scripts/capture-editor-bezier.ts`): curva aperta a due nodi e curva chiusa a tre nodi disegnate con la penna, testo editabile. Controllare cubiche, maniglie, misure e spessori in Illustrator, senza guide della vista. **Collaudo Illustrator non eseguito.**

`jpeg-source.TEST.jpg` e `jpeg.TEST.json/svg` (`node --import tsx scripts/capture-editor-jpeg.ts`): calibrazione JPEG 40×24 px con orientamento EXIF 6, quindi 24×40 px orientati; due immagini con lo stesso originale, una intera 7,2×12 mm e una ritagliata a 12×40 px (3,6×12 mm) e riflessa. L’originale rimane JPEG nel JSON, lo SVG incorpora il derivato PNG binario. Verificare orientamento, crop, riflessione e misure. **Collaudo Illustrator e lavorazione non eseguiti.**

## Campioni locali — aggiornati al 9 novembre 2026

`text-lines.TEST.json/svg` (`node --import tsx scripts/capture-editor-text-lines.ts`): un solo box con tre righe; prima centrata, seconda giustificata esplicitamente, terza a destra; interlinea 1. Formati applicati dall’ispettore selezionando solo due caratteri per riga. Verificare in Illustrator spazi tra parole, posizioni, altezza e modificabilità; confrontare anche con una riapertura JSON. **Collaudo Illustrator non eseguito.**

`bezier-handles.TEST.json/svg` (`node --import tsx scripts/capture-editor-bezier-handles.ts`): curva chiusa con il secondo nodo reso simmetrico dopo averne spostato la maniglia entrante. Le operazioni non introducono vincoli persistenti. Verificare curve, nodi, misure e contorni in Illustrator; nessuna guida azzurra deve entrare nel file. **Collaudo Illustrator non eseguito.**

`refinements.TEST.json/svg` (`node --import tsx scripts/capture-editor-refinements.ts`): testo editabile con dilatazione 120% × 115%, spaziatura 0,2 pt e correzione −0,1 pt sulla prima coppia; gradiente RGB neutro convertito in nero con alpha proporzionale, sopra un rettangolo nero. Originale RGB conservato nel JSON, derivato PNG nello SVG. Controllare in Illustrator rapporto dei glifi, posizioni delle coppie, testo editabile, misure e sovrapposizione alpha; non equivale a certificazione produttiva binaria. **Illustrator e lavorazione non collaudati.**

`selection-area.TEST.json/svg` (`node --import tsx scripts/capture-editor-selection-area.ts`): gruppo di rettangolo/cerchio allineato come insieme al centro 29×11 mm dell’area 58×22. Controllare centro, distanze interne e struttura del gruppo in Illustrator. **Collaudo Illustrator non eseguito.**

`text-decoration.TEST.json/svg` (`node --import tsx scripts/capture-editor-text-decoration.ts`): box Arial 9 pt largo 38 mm, barrato/sopralineato locali e allineamento giustificato con ultima riga a sinistra. Verificare spazi, decorazioni e modificabilità del testo in Illustrator. **Collaudo Illustrator non eseguito.**

`selection-style.TEST.json/svg` (`node --import tsx scripts/capture-editor-selection-style.ts`): riempimento nero e contorno tratteggiato 0,3 mm applicati a rettangolo/cerchio raggruppati, gruppo portato in primo piano. Verificare centri, tratteggio e livelli in Illustrator. `path-operations.TEST.json/svg` (`node --import tsx scripts/capture-editor-path-operations.ts`): stella riflessa, nodi invertiti e contorno aperto con due estremità indipendenti. **Entrambi da collaudare in Illustrator.**

`preview-raster-300dpi.TEST.png` (685×260 px, bianco) e `preview-raster-transparent-150dpi.TEST.png` (343×130 px) sono export del progetto `raster-filters.TEST.json`, generati da `node --import tsx scripts/capture-editor-png-export.ts`. Contengono metadati fisici pHYs; non sostituiscono il JSON o SVG né certificano la risoluzione produttiva. **Collaudo umano non eseguito.**

`raster-filters.TEST.json/svg` e `raster-gradient.TEST.png` si generano con `node --import tsx scripts/capture-editor-raster.ts --filters`: gradiente con soglia 160, diffusione, luminosità +8/contrasto +20 e bianco trasparente. Verificare dettaglio dei punti alla misura fisica 24×12 mm e la resa reale della lavorazione; non è vettorializzazione. **Collaudo Illustrator e lavorazione non eseguiti.**

`clipboard.TEST.json/svg` si genera con `node --import tsx scripts/capture-editor-clipboard.ts`: gruppo rettangolo/cerchio copiato e incollato con ID nuovi, poi spostato di 6 mm. Verificare in Illustrator che i due gruppi siano separabili senza modificare contorni o ordine e che il testo resti editabile. **Collaudo Illustrator non eseguito.**

`raster-crop.TEST.json/svg` si genera con `node --import tsx scripts/capture-editor-raster.ts --crop`: finestra 120×80 px della sorgente 160×80, risultato 18×12 mm riflesso orizzontalmente. Verificare in Illustrator che il PNG incorporato contenga solo il ritaglio e che misure/riflessione corrispondano alla preview; l’originale si recupera dal JSON. **Collaudo Illustrator non eseguito.**

`raster-source.TEST.png` (calibrazione 160×80 px) e `raster.TEST.json/svg` si generano con `node --import tsx scripts/capture-editor-raster.ts`: immagine 24×12 mm, soglia 160 e bianco trasparente. JSON conserva i byte originali; SVG incorpora un PNG derivato binario, non un vettore. Controllare misure, DPI, alpha, pixel e resa in Illustrator. **Collaudo Illustrator non eseguito.**

`pen.TEST.json/svg` si genera con `node --import tsx scripts/capture-editor-pen.ts`: polilinea a quattro vertici e triangolo costruiti con la penna. Controllare spessori, coordinate dei vertici e assenza dei marcatori di costruzione in Illustrator. **Collaudo Illustrator non eseguito.**

`path-nodes.TEST.json/svg` si genera con `node --import tsx scripts/capture-editor-nodes.ts`: campione tracciati con primo nodo della polilinea spostato a X 36 mm tramite ispettore. Verificare nodi e segmenti in Illustrator, nessuna guida verde nel file. **Collaudo Illustrator non eseguito.**

`fonts.TEST.json/svg` si genera con `npm run capture:inspector -- --fonts`: box largo 30 mm con altezza automatica, Georgia base 9 pt, «Città» Times New Roman 12 pt grassetto e «Testo» Courier New corsivo/sottolineato. Controllare presenza delle famiglie, metriche, a capo e testi editabili in Illustrator; font non incorporati. **Collaudo Illustrator non eseguito.**

`polygons.TEST.json/svg` si genera con `npm run capture:selection -- --polygons`: triangolo, pentagono e stella a cinque punte/tratto 0,25 mm. Verificare nodi, misure e giunzioni in Illustrator. **Collaudo Illustrator non eseguito.**

`paths.TEST.json/svg`, formato fixture 4913 da 58×22 mm, si genera con `npm run capture:selection -- --paths`: polilinea 12×5 mm/tratto 0,3 mm e triangolo chiuso 5×2 mm. Verificare nodi modificabili, giunzioni/cap arrotondati, regola pari/dispari e misure in Illustrator. **Collaudo Illustrator non eseguito.**

`ellipses.TEST.json/svg`, formato fixture 4913 da 58×22 mm, si genera con `npm run capture:selection -- --ellipses`: ellisse 12×4 mm a 15°, tratto 0,3 mm. Verificare in Illustrator raggi/rotazione, spessore, resa dei gruppi e testo editabile. **Collaudo Illustrator non eseguito.**

`lines.TEST.json/svg`, formato fixture 4913 da 58×22 mm, generati con `npm run capture:selection -- --lines`: linea orizzontale 38 mm/tratto 0,3 mm e verticale 6 mm/tratto 0,2 mm tratteggiato. Misurare in Illustrator distanza tra estremità geometriche e ingombro comprensivo dei cap arrotondati, rotazione a 90°, stile dei tratti e testi. **Collaudo Illustrator non eseguito.**

## Scala e rotazione dell’insieme — 8 novembre 2026

`group-transforms.TEST.json/svg`: generati con `npm run capture:selection -- --transforms`, variante fixture 4913 da 58×22 mm. Testo con stili locali, rettangoli e cerchio; un gruppo persistente e una trasformazione uniforme dell’intera selezione (fattore 1,05, 8°). Tratti e raggi scalati insieme alla geometria. Verificare in Illustrator misure, cerchio non deformato, tratti, testi modificabili e stili misti. **Collaudo Illustrator non eseguito.**

## Gruppi e selezione — 8 novembre 2026

`selection.TEST.json/svg`, generati con `npm run capture:selection`, contengono testo a stili misti, due forme raggruppate e una separata, area 58×22 mm del formato fixture 4913. Gli oggetti restano piatti nel JSON e i gruppi sono riferimenti a ID; nello SVG il gruppo è vettoriale. Verificare in Illustrator posizioni, ordine, separazione dei membri e testo editabile. **Collaudo Illustrator non eseguito.** Anteprime rigenerate dopo l’attesa del ridisegno; stato aggiornato in [trasformazioni dell’insieme](iteration-editor-group-transforms.md). [Prove e limite temporaneo della verifica browser](iteration-editor-selection.md).

## Box e stili dei caratteri — 8 novembre 2026

`text-box.TEST.json/svg` è generato con `npm run capture:inspector`: area 58×22 mm, box largo 30 mm con altezza automatica misurata dal testo, corpo base 9 pt, «Città» 12 pt/grassetto e una parte corsiva/sottolineata. Riaprire sul formato fixture 4913. Controllare in Illustrator dimensioni del box, impaginazione e ritaglio, stili misti, accenti e modificabilità dei singoli intervalli. **Collaudo Illustrator non eseguito.** La preview browser è distinta dalla certificazione produttiva.

## Trasformazioni — 8 novembre 2026

Il documento canonico passa a **v2**, con import validato dei v1 a rotazione zero. I vecchi JSON restano apribili; i nuovi non vanno aperti con il vecchio editor. SVG rimane un artefatto distinto, a dimensioni fisiche.

`transforms.TEST.json/svg` aggiungono un rettangolo 10×5 mm a 30°, «COPIA» a 10 pt/−15°, allineamento e ordine livelli. Generazione: `npm run capture:editor -- --transforms`. Riapertura su `http://127.0.0.1:5173/editor`, formato 4913 del catalogo fixture. Verificare in Illustrator angoli, tratto 0,25 mm, misure e modificabilità dei testi; **non collaudati in Illustrator**. Le anteprime sono in `.local/previews/editor-transforms-{desktop,mobile}.png`.

## Campione gestione oggetti — 8 novembre 2026

`objects.TEST.json` e `objects.TEST.svg` in `fixtures/illustrator/` aggiungono al campione 58×22 mm una copia del testo, un rettangolo 10×5 mm e un cerchio raggio 2 mm (tratto 0,25 mm, da considerare separatamente nelle misure esterne). Generati da Fabric con `npm run capture:editor`; il JSON è associato alla variante 4913 del catalogo fixture, non alla versione del catalogo live. Riaprirlo in demo o tramite il trasporto fixture dello script. [Prova e risultati](iteration-editor-objects.md).

Checklist umana aggiuntiva: aprire l’SVG in Illustrator, misurare tavola/forme/tratto, modificare separatamente «TEST · Città» e «COPIA», salvare e confrontare con la preview browser. **Tutte queste prove Illustrator restano da eseguire.** Gli screenshot desktop/mobile sono stati ispezionati; il controllo visivo browser non certifica l’output produttivo.

## Campioni precedenti e formati

Il JSON è il progetto sorgente riapribile nel laboratorio, con UUID, versione schema, revisione e ID oggetti. L'SVG è un output distinto, generato da Fabric e non reimportato come progetto. Entrambi sono TEST e non certificati per produzione.

Fixture: `fixtures/illustrator/stamp.TEST.json` e `stamp.TEST.svg`. Profilo isolato, non collegato a un ID Shopify: area 58×22 mm, Arial 9 pt nel campione, minimo TEST 7 pt, nero/bianco, margine TEST 1 mm. Il canvas visualizza 8 px/mm, mentre l'export imposta misure fisiche e viewBox 464×176. Lo zoom non cambia le dimensioni fisiche del file.

Esempi aggiuntivi reali Fabric generati con `npm run capture:mounts`: `wood-round-35.TEST.*` (legno Ø35), `pocket-square-12.TEST.*` (tascabile 12×12) e `emboss-round-41.TEST.*` (a secco Ø41). JSON associati a variante e catalogo TEST; SVG con misure fisiche, cerchio/rect e testo vettoriali, clipPath nei tondi. Riaprire ogni JSON solo sulla corrispondente variante e versione di catalogo, oppure rigenerare con la versione corrente. Non importarlo su una referenza diversa. Questi file sono destinati al collaudo, non approvati per produzione.

Dal 6 novembre il comando cattura `automatic-round-30.TEST.*` al posto del legno: sul legno mancano i metafield dimensionali obbligatori e il vecchio esempio Ø35 rimane storico, con dati allora estratti dalle opzioni. I tre esempi correnti (automatico Ø30, tascabile 12×12, a secco Ø41) usano esclusivamente larghezza/altezza dei metafield variante e versioni TEST v2. Nessuno prova l'avvenuto collaudo Illustrator.

Il canvas interattivo ora si apre da un prodotto reale, a differenza della fixture di riferimento: JSON include Product/Variant ID e versioni catalogo/profilo commerciale. SVG usa le dimensioni nominali del modello corrente (47×18, 58×22 o 70×25 nel campione). I vincoli di impaginazione rimangono TEST, con `validatedForProduction: false`; l'area nominale non è ancora area utile certificata. Aggiunto testo multilinea fino a 8 righe: richiede un nuovo collaudo umano Illustrator, non deducibile dal golden SVG monoriga.

`npm run fixtures:editor` rigenera il JSON canonico. Con il server locale acceso, `npm run capture:lab` genera SVG effettivo da Fabric e anteprime locali. Per aggiornare il riferimento SVG, rivedere la diff e annotare il motivo; non trattare una rigenerazione come verifica Illustrator. Il test golden confronta il riferimento con un nuovo export dopo import del JSON.

## Checklist umana obbligatoria

Stato attuale di ogni voce: **NON ESEGUITO in questa iterazione**. L'esito visivo storico riferito nella specifica non sostituisce questi controlli.

| Prova in Adobe Illustrator | Risultato richiesto | Stato |
|---|---|---|
| Aprire stamp.TEST.svg | Nessun errore; rettangolo e testo vettoriali distinti | Da eseguire |
| Misurare tavola e bordo | Tavola 58×22 mm; bordo nominale 54×18 mm con tratto 0,25 mm | Da eseguire |
| Selezionare e riscrivere il testo | Testo ancora editabile, font Arial risolto; accenti e simboli corretti | Da eseguire |
| Confrontare browser/Illustrator | Coordinate, allineamento, tratto e dimensioni coerenti | Da eseguire |
| Salvare e riaprire | Nessuna variazione inattesa o rasterizzazione | Da eseguire |
| Legno Ø35 e a secco Ø41 | Tavola fisica corretta, cerchio/ritaglio e testo modificabili, nessuna variazione al salvataggio | Da eseguire |
| Tascabile 12×12 | Misura fisica e testo piccolo leggibile; regole produttive specifiche confermate dal laboratorio | Da eseguire |
| Testo a 7 pt / 3–8 righe / altri font | Fixture aggiuntive e verifica produttiva per profilo | Da eseguire sui campioni e sui font locali |
| Logo vettoriale/raster, gruppi e rotazioni | Tracciati preservati, raster identificato come raster | Da eseguire sui campioni locali; import SVG/PDF locale con limiti documentati |

Registrare versione Illustrator/OS, font installati, dimensioni rilevate, screenshot e difformità. Non dichiarare file produttivo finché non è stato verificato dal laboratorio. Import PNG/JPEG e conversione binaria sono implementati localmente; import SVG/PDF disponibile con limiti; vettorializzazione dei raster ancora distinta e da sviluppare.

## Verifica tecnica degli ultimi campioni

`node --import tsx scripts/verify-editor-artifacts.ts` ha riaperto i dieci campioni `raster`, `raster-crop`, `clipboard`, `raster-filters`, `path-operations`, `selection-style`, `text-decoration`, `selection-area`, `bezier` e `jpeg`: oggetti/gruppi identici ai JSON, nuova esportazione SVG senza valori non finiti, 0 errori browser e 0 richieste esterne. Risultati locali in `.local/editor-artifact-smoke.json`. Non sostituisce il collaudo Illustrator.

## Testo su tracciato

`text-path.TEST.json/svg`, generati da `node --import tsx scripts/capture-editor-text-path.ts`, mostrano «TEST · Città» su ellisse con scostamento verticale +0,8 mm. Il JSON mantiene testo e guida come un unico oggetto editabile; lo SVG conserva i glifi come testi trasformati individualmente, senza convertire in contorni. Confronto Canvas/SVG locale passato per font misti, dilatazione, rotazione, baseline/ascendente/discendente e verso invertito. Verificare in Illustrator misure, posizione e modificabilità: non è certificata la modifica come unico testo collegato al percorso. **Collaudo Illustrator non eseguito.**

## Import SVG/PDF e testi editabili

`svg-import.TEST` e `pdf-import.TEST` mostrano vettori con fori e contorni importati; i file sorgente TEST sono separati. `text-import.TEST` contiene due righe importate da SVG come box editabili (Arial e Times New Roman) e una cornice. Generazione: `node --import tsx scripts/capture-editor-text-import.ts`. Verificare in Illustrator testi, font, posizioni e misure; nessuna certificazione produttiva. La modalità PDF editabile ricostruisce righe e non garantisce identità dell’impaginazione. I file reali del titolare restano privati in `.local` e non fanno parte delle fixture. [Limiti e libreria font](iteration-editor-import-font-library.md).

### Alias PitchPrint e facce font

Nuovo campione [JSON](../fixtures/illustrator/pitchprint-font-alias.TEST.json) / [SVG](../fixtures/illustrator/pitchprint-font-alias.TEST.svg), 100 × 40 mm e ABeeZee incorporato con licenza OFL. Generazione tramite `scripts/capture-editor-pitchprint-font-alias.ts`; fonte sintetica, comandi manuali/AI e Undo/Redo. Controllate riapertura, identità del file e glifi. Negli SVG attributi e stili inline mantengono il nome della faccia esatta, distinto dalla famiglia amministrativa. Resta da verificare in Illustrator il riconoscimento della faccia e l’editing dei testi; nessun nuovo esito umano dichiarato. [Dettagli](iteration-editor-pitchprint-font-aliases.md).

## Campioni con font incorporati — aggiornamento del 10 novembre

La [politica corrente](iteration-editor-library-font-policy.md) esclude i font del computer. I campioni storici e i loro vecchi comandi di generazione riportati sopra conservano le dipendenze originarie e non costituiscono oggi una prova portabile. Per il collaudo attuale usare `stamp-embedded.TEST.json/svg`, `node --import tsx scripts/verify-editor-artifacts.ts` (23 copie TEST in `.local/verified-fixtures`) e `node --import tsx scripts/capture-editor-font-styles.ts` (testo misto con quattro file reali). I generatori storici restanti vanno migrati prima di riutilizzarli con la politica corrente.

[Varianti, copie di prova e verifiche](iteration-editor-font-regressions.md). Originali conservati; nessuna sostituzione automatica sui progetti reali. Misure fisiche, struttura, risorse e glifi controllati in browser; Illustrator rimane da verificare sul nuovo corpus.

Nuovo campione [gruppi JSON](../fixtures/illustrator/pitchprint-groups.TEST.json) / [SVG](../fixtures/illustrator/pitchprint-groups.TEST.svg), da [sorgente nativo sintetico](../fixtures/illustrator/pitchprint-groups.source.TEST.json). Sei elementi, due gruppi, testo editabile e Arimo incorporato; 100 × 60 mm. `node --import tsx scripts/capture-editor-pitchprint-groups.ts` controlla confronto grafico, comandi manuali/AI, storico, riapertura e glifi. In Illustrator verificare soprattutto scala fisica, riflessioni dei vettori, posizione e modificabilità del testo ruotato; esito umano ancora mancante. [Limiti della conversione](iteration-editor-pitchprint-groups.md).

Aggiornato il campione con [proprietà e gerarchia](iteration-editor-group-properties.md): due gruppi esterni e un sottogruppo conservato nel JSON, con label e priorità proprie. La geometria produttiva e il file font restano identici. Il generatore salva anche l’anteprima dell’ispettore amministrativo dei gruppi; nessun nuovo esito Illustrator.
