**Campione aggiornato successivamente:** [zoom interno](iteration-editor-raster-zoom.md), stesso risultato grafico con zoom 200%/Undo aggiuntivi; revisione finale attuale 9. I numeri delle revisioni nel resoconto storico sotto si riferiscono alla versione precedente del generatore.

# Spostare la foto nella cornice — 11 novembre 2026

Base `f985be9`. Completamento manuale del ritaglio: la fotografia può scorrere dentro la finestra visibile senza spostare o ridimensionare la cornice. Il file originale e i filtri rimangono invariati. Il PAN del foglio resta disponibile separatamente.

## Uso

Selezionare un’immagine, aprire **Ritaglio** nell’ispettore e attivare **Sposta foto nella cornice**. Trascinare dentro l’immagine: il dettaglio segue il puntatore e si ferma al bordo dell’originale, senza esporre zone vuote. Il segno centrale indica il modo attivo. Premere di nuovo il pulsante per tornare alle otto maniglie che cambiano i bordi del ritaglio.

I campi Orizzontale/Verticale foto hanno passo 0,1 mm e indicano lo scostamento della fotografia rispetto alla posizione centrata. Zero centra; valori positivi spostano il contenuto a destra/in basso lungo gli assi della cornice, anche se ruotata. Le riflessioni sono rispettate. **Centra foto nella cornice** azzera entrambi. Un asse senza pixel nascosti è disabilitato; con immagine intera occorre prima ritagliare almeno un bordo.

Esc annulla il gesto in corso. Space continua a spostare il foglio mantenendo lo zoom, senza cambiare il documento o uscire dal modo contenuto. Freccia e Mano ripristinano i rispettivi strumenti. Il trascinamento è verificato anche con il dito in Chromium mobile emulato; rimane da provare su dispositivi fisici.

## Documento e comandi

La modifica cambia soltanto l’origine della finestra sorgente `crop.leftPx/topPx`: conserva larghezza/altezza del crop, posizione/dimensioni della cornice, rotazione, riflessioni, byte originali e filtri. Il movimento usa scale separate dei due assi e l’inversa della rotazione. Il controllo non ricampiona o rifiltra il bitmap durante il gesto.

La preview Fabric non sostituisce lo stato canonico. Al rilascio viene inviato un solo `updateObject` validato con la revisione catturata all’inizio; nessun comando per click, spostamento nullo, limite già raggiunto o ritorno al punto iniziale. Gli input numerici e l’AI simulata usano lo stesso comando. Un aggiornamento concorrente rende obsoleto il gesto e preserva lo stato più recente; Undo/Redo conservano tutti i dati. Nessun nuovo schema JSON o comando parallelo.

Il blocco delle trasformazioni continua a proteggere la cornice: è permesso cambiare il contenuto come già previsto dalla policy del crop. In questo modo è esposto soltanto il controllo interno, senza sbloccare movimento/scala/rotazione. Uscendo vengono ripristinati controlli e blocchi precedenti. Il blocco di selezione rimane applicato.

È la finestra rettangolare dell’immagine esistente: non introduce maschere arbitrarie, oggetti maschera indipendenti o il contratto completo dei segnaposto foto dei profili. Questi restano lavori distinti della roadmap.

## Campione portabile

[Sorgente](../fixtures/illustrator/raster-pan.source.TEST.json), [JSON finale](../fixtures/illustrator/raster-pan.TEST.json), [SVG finale](../fixtures/illustrator/raster-pan.TEST.svg): tavola 100 × 80 mm, cornice 40,2 × 28,1 mm a 30°, riflessa orizzontalmente, PNG RGB sintetico 160 × 120 px incorporato. Nessun font o dato personale richiesto.

`node --import tsx scripts/capture-editor-raster-pan.ts` esegue un vero trascinamento dalla UI, un aggiornamento AI simulato, Undo/Redo e download JSON/SVG. Il [completamento successivo da tastiera](iteration-editor-raster-pan-keyboard.md) aggiunge anche una freccia e Undo prima dell’AI; stesso risultato grafico finale, revisione 7. La finestra finale è X 31,25 / Y 19,5 / larghezza 100,5 / altezza 70,25 px; le proprietà della cornice e della sorgente sono confrontate con quelle iniziali. Il confronto SVG con Canvas2D indipendente dà zero pixel con differenza superiore a 24/255, errore medio 0,000237/255. Non è un’identità assoluta di pixel. Schermate desktop/mobile private ispezionate; zero errori browser e scritture amministrative.

Collaudo umano **Illustrator non eseguito**: verificare tavola, cornice, ritaglio, rotazione, riflessione e recupero dell’originale dal JSON. Il confronto browser non certifica la filiera produttiva.

## Verifiche

**713 unitari / 111 file**, tipi/build e scansione segreti passati. **91/91 browser pertinenti passati** nell’esecuzione finale, inclusi i 22 nuovi casi: combinazioni di rotazioni/riflessioni/zoom, scale indipendenti, pixel confrontati con riferimento, touch, Retina, limiti/no-op, Esc, aggiornamenti concorrenti, blocchi, campi live, centro, AI/Undo/Redo e JSON riaperto. Comprese regressioni di crop, EXIF, PNG/JPEG, filtri, condivisione raster, sostituzione e PAN.

**13/13 browser pubblici locali**, build pubblica e scansione segreti passati. **31 campioni JSON riaperti/riesportati**, zero errori browser o richieste esterne. Non è stata rieseguita l’intera suite browser: l’ultimo controllo completo documentato era 427/427 su `587c44e`.

Log in `.local/raster-pan-{all-unit-final,regressions,build-verified,secrets-verified,public-build,public-browser,public-secrets,artifacts,capture}.log`; confronto in `.local/raster-pan-capture.json`. Conservati anche i primi tentativi: una parentesi mancante nel callback ha fermato la prima build ed è stata corretta; i primi test pixel campionavano il nuovo indicatore centrale invece della fotografia (3 passati/17 falliti). Il campione è stato spostato fuori dall’indicatore e controllato anche prima del gesto, senza allargare la tolleranza; poi 20/20 e infine 91/91 con touch e Space.

Nessun import o modifica dell’archivio personale, nessun deploy o intervento su Shopify, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata.
