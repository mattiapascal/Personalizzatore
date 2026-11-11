# Ritaglio preciso delle immagini — 11 novembre 2026

Base `eac22eb`. Alcuni sorgenti PitchPrint contengono bordi di ritaglio frazionari: il precedente vincolo dei pixel interi li rifiutava. Il documento conserva ora queste coordinate senza arrotondarle. L'ispettore espone i quattro bordi in millimetri con passo 0,1; i gesti sulle maniglie rimangono continui.

## Comportamento

- Restano almeno un pixel sorgente per lato e i controlli di appartenenza all'originale. Non aumentano i limiti dei file (20 MB/24 MP) né il numero di immagini. Una tolleranza di 1e-9 pixel riguarda soltanto gli errori delle somme in virgola mobile; importazioni sotto un pixel rimangono invalide.
- Il passaggio mm↔pixel usa separatamente la scala di ogni asse e considera le riflessioni. I dettagli rimasti conservano posizione e scala anche nelle immagini ruotate. Ripristino, Esc, Undo/Redo e riapertura JSON mantengono gli originali.
- Canvas e SVG della modalità originale usano una finestra esatta sulla risorsa completa: niente bitmap intermedia ridimensionata. Il JPEG resta compresso nell'SVG, con orientamento EXIF esplicito e rimozione dei soli metadati APP1 dalla copia esportata.
- Soglia, mezzitoni e rimozione del bianco lavorano sulla griglia completa dei pixel originali. Cambiare il ritaglio cambia solo la finestra visibile: non ricampiona il testo o il retino e non riavvia la diffusione dell'errore sul nuovo bordo. Il bitmap elaborato viene riutilizzato per gli stessi parametri, con cache limitata; nello SVG è ritagliato mediante clip vettoriale. Può essere più grande del precedente bitmap tagliato, ma conserva il disegno dei dettagli.
- Le miniature persistenti con immagini interessate ricevono una nuova chiave una volta; titoli, tag e documenti senza quelle immagini non provocano rigenerazioni aggiuntive.
- Nei campi di ritaglio, le frecce della tastiera e i pulsanti numerici applicano lo stesso passo e raggiungono il massimo effettivo anche quando non coincide con un decimo. La visualizzazione evita arrotondamenti oltre i limiti.
- Manuale e simulazione AI continuano a eseguire `updateObject` sullo stesso documento validato, senza nuovi comandi paralleli.

## SVG e campioni

La serializzazione finale SVG usa almeno 12 decimali per evitare che un fattore di scala piccolo, moltiplicato per migliaia di pixel, alteri le dimensioni fisiche. Il valore globale Fabric viene ripristinato alla fine della serializzazione sincrona.

Nuovo campione portabile: [sorgente PitchPrint TEST](../fixtures/illustrator/fractional-crop.source.TEST.json), [JSON dopo la modifica](../fixtures/illustrator/fractional-crop.TEST.json), [SVG](../fixtures/illustrator/fractional-crop.TEST.svg), due immagini PNG/RGB e JPEG/EXIF in 100 × 60 mm. Generatore `scripts/capture-editor-fractional-crop.ts`: importazione, bordo destro impostato dall'ispettore, comando AI simulato e Undo, riapertura canonica e confronto con Canvas2D indipendente ricavato dal sorgente. Il confronto SVG dà 0,4543% dei pixel con differenza significativa, errore medio 0,0351/255; non è un'identità di pixel. Schermate desktop/mobile private ispezionate.

Secondo campione: [prima del ritaglio](../fixtures/illustrator/raster-grid.source.TEST.json), [JSON finale](../fixtures/illustrator/raster-grid.TEST.json), [SVG](../fixtures/illustrator/raster-grid.TEST.svg), formato 60 × 40 mm. `scripts/capture-editor-raster-grid.ts` confronta il retino ordinato con una scacchiera costruita indipendentemente dai filtri, dopo comando manuale, comando AI simulato e Undo. Zero pixel con differenza superiore a 24/255, errore medio 0,8077/255: l'antialiasing non è identico. Gli originali restano nei JSON.

Aggiornato anche lo storico `stamp-embedded.TEST.svg`, senza cambiare il JSON. `scripts/refresh-stamp-svg-precision.ts` verifica struttura, testo, attributi e dati dei font invariati; solo tre coordinate/fattori acquisiscono decimali, differenza massima 0,000044. Il confronto di quel campione a 1160 × 440 dà zero pixel differenti. Non è un collaudo Illustrator.

## Analisi dei sorgenti reali, senza importazioni

**259/370 convertibili, 111 bloccati**, dodici recuperi e nessuna regressione sui 247 precedenti. Sono recuperati anche «Cani addestrati alla guardia 2», «Cani da guardia addestrati» e «Non accarezzare». L'analisi usa i sorgenti completi con font verificati; non certifica automaticamente la resa o la lavorabilità.

Per i tre cartelli sono state confrontate separatamente le fotografie con un riferimento Canvas2D indipendente: rispettivamente 0,0137%, 0,1190% e 0,0398% di pixel significativamente diversi. Questo confronto riguarda **solo le immagini**: tipografia e composizione completa richiedono revisione. Rapporti privati in `.local/pitchprint-migration/image-audit/fractional/` e `fractional-crops-analysis.report.json`. Zero scritture amministrative/errori browser, archivio invariato per hash durante le prove. Restano 117 template effettivamente importati, nessuna nuova associazione.

## Verifiche e limiti

**700 unitari / 109 file**, tipi/build, schemi e scansione segreti passati. **52 browser immagini/ritaglio**, **13 browser pubblici locali** e **28 campioni riaperti/esportati** passati; zero errori/richieste esterne nella raccolta campioni. **Regressione completa: 427/427 browser laboratorio passati in una sola esecuzione finale**, dopo la pulizia conclusiva del renderer. Tipi/build e scansione segreti finali in `fractional-complete-build.log` e `fractional-complete-secrets.log`. Le prove dei numeri controllano anche il limite minimo di un pixel e i 96 estremi mm/scala/riflessione. Il server locale espone la stessa chiave delle miniature del renderer, verificato in sola lettura. I log intermedi sono conservati: il primo controllo di 44 casi conteneva un errore sul passo vicino al massimo, poi corretto. Una successiva esecuzione immagini ha dato 43 passati e nove aspettative obsolete sulle dimensioni interne delle bitmap, corrette verificando il viewport/pixel visibili: i 52 casi sono poi passati; la prima compilazione dopo la riscrittura dei test segnalava due variabili inutilizzate, rimosse.

Il filtraggio dell'immagine intera mantiene il retino coerente ma richiede memoria proporzionale al file completo, anche per un piccolo ritaglio. I limiti attuali e la cache non costituiscono un collaudo di quattro foto da 24 MP su ogni telefono. Non sono stati eseguiti collaudi Illustrator o lavorazioni fisiche. Nessun deploy, modifica alla chat pubblicata o scrittura su Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout.

Log: `.local/fractional-grid-{unit,browser-final,build-verified,schemas,secrets,public-build,public-browser,public-secrets,artifacts,server-key}.log`; campioni in `fractional-crop-capture-final.log` e `fractional-grid-capture.log`, regressione completa in `fractional-complete-browser.log`. La documentazione distingue i log intermedi falliti dagli esiti finali.

## Prossimo incremento manuale individuato (ora completato)

Il seguito è documentato in [sostituzione immagini](iteration-editor-image-replacement.md): aggiunta la modalità `cover` e l’azione dell’ispettore, con prove dedicate. La nota sotto registra il punto di partenza.

La sostituzione dell'immagine era disponibile nel modulo cliente tramite `replaceImageSource`, ma non ancora nella scheda Immagine dell'ispettore. Il comando attuale inserisce il nuovo originale proporzionalmente dentro l'ingombro precedente, azzera crop/riflessioni e può ridurre l'ingombro a ogni sostituzione successiva. Per mantenere davvero una cornice durante la sostituzione occorre una modalità esplicita che conservi geometria/rotazione e calcoli un crop centrale del nuovo originale, senza deformarlo né introdurre un secondo documento. Riutilizzare caricamento, preparazione, comandi e protezione delle revisioni esistenti; provare sostituzioni ripetute con rapporti diversi, Undo/Redo, filtri incompatibili e blocchi. Non basta collegare il pulsante al comportamento attuale e dichiarare conservata la cornice.
