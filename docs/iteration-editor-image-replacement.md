# Sostituzione immagine nell’ispettore — 11 novembre 2026

Base `587c44e`. La scheda Immagine dell’ispettore ha un pulsante grafico «Sostituisci immagine mantenendo la cornice». Sceglie un PNG/JPEG locale e riempie l’ingombro corrente con un ritaglio centrale proporzionale. Sostituzioni successive conservano lo stesso ingombro, evitando riduzioni progressive o deformazioni del nuovo originale.

## Documento e comandi

`replaceImageSource` acquisisce il parametro opzionale `fit: 'cover' | 'contain'`. La nuova azione usa `cover`: conserva ID, X/Y, larghezza/altezza fisiche, rotazione, riflessioni, livello, proprietà e gruppi; ricalcola la finestra sulla nuova sorgente e rimuove l’eventuale deformazione `pixelAspectRatio` del file precedente. Il ritaglio può essere frazionario e conserva il vincolo minimo di un pixel per lato. Una sorgente troppo piccola o con proporzioni che richiederebbero meno di un pixel viene respinta, senza stirarla.

L’assenza del parametro e `contain` esplicito mantengono il comportamento precedente del modulo cliente: immagine intera inserita proporzionalmente dentro lo spazio disponibile, centro conservato, crop e riflessioni azzerati. È distinto dall’azione dell’ispettore, il cui nome e la cui didascalia indicano il mantenimento della cornice e il ritaglio centrale. Non è stato cambiato il comportamento del modulo per i loghi da mostrare interamente.

La «cornice» è l’ingombro corrente dell’oggetto, compreso il suo crop. Non viene introdotta una seconda maschera indipendente: i controlli di ritaglio esistenti possono poi cambiare quell’ingombro secondo le loro regole. Una cornice persistente con spostamento interno della fotografia resta un possibile incremento separato.

Il renderer continua a ricevere il documento canonico; nessuna modifica diretta al canvas. Manuale e AI simulata eseguono il medesimo comando validato. Il JSON conserva la nuova risorsa completa e il ritaglio; Undo/Redo in memoria recuperano anche le immagini precedenti. I filtri rimangono: un nuovo originale incompatibile con la rimozione del bianco viene rifiutato, senza modificarli silenziosamente. I limiti restano 20 MB, 24 MP e lato massimo 12000 pixel.

## Caricamento e interfaccia

- Il selettore file conserva callback e revisione del momento in cui viene aperto. Un cambio del documento prima della scelta invalida l’operazione; non la applica a una selezione diversa.
- La preparazione usa il percorso asincrono già esistente: strumenti sospesi, verifica di documento/revisione prima del commit, vecchia immagine conservata se il caricamento fallisce.
- Campi incompleti/bozze locali non ancora applicate impediscono l’apertura del nuovo selettore. Il file input si azzera dopo la scelta, consentendo di riprovare con lo stesso file.
- Selezione e trasformazioni bloccate mantengono le regole del motore. Il comando può aggiornare un campo immagine autorizzato nel modulo senza sbloccare le proprietà del template; non aggira i blocchi degli altri elementi.
- Il nome file nella barra superiore va a capo anche dentro parole lunghe, così su mobile non si sovrappone ai pulsanti. Schermate desktop/mobile finali ispezionate in `.local/previews/editor-image-replacement-*`.

## Campione portabile

[Sorgente prima della sostituzione](../fixtures/illustrator/image-replacement.source.TEST.json), [JSON finale](../fixtures/illustrator/image-replacement.TEST.json), [SVG](../fixtures/illustrator/image-replacement.TEST.svg): formato 100 × 60 mm, cornice 30 × 15 mm ruotata di 30° con due riflessioni. Il generatore `scripts/capture-editor-image-replacement.ts` esegue dalla UI una sostituzione manuale con PNG verticale, una seconda tramite comando AI simulato con PNG orizzontale, Undo e Redo. La finestra finale è X 20/Y 0, 40 × 20 pixel dell’originale 80 × 20; l’ingombro fisico resta invariato.

Confronto SVG con Canvas2D indipendente, ricavato direttamente da sorgente e trasformazioni fisiche: 0,7987% dei pixel con differenza superiore a 24/255, errore medio 0,0333/255. Non è un’identità di pixel. Zero errori browser e scritture amministrative nel generatore. Nessun font del computer o risorsa remota richiesti.

Il campione richiede ancora collaudo umano Illustrator: dimensioni, crop, orientamento/riflessioni e recupero del nuovo originale nel JSON. Non certifica lavorazioni, profili o memoria disponibile sui dispositivi clienti. La preparazione delle risorse conserva anche sorgenti precedenti utili allo storico: sessioni con molte sostituzioni di foto grandi richiedono una prova specifica della memoria.

## Verifiche

**707 unitari / 110 file**, tipi/build, schemi e scansione segreti passati. **68/68 browser pertinenti passati in un’unica esecuzione finale**, inclusi i quattro nuovi percorsi, crop, JPEG/EXIF, filtri, gruppi/proprietà e layout/barra del canvas. **13/13 browser pubblici locali** passati, build pubblica e scansione segreti passate. **29 campioni riaperti/esportati**, zero errori browser e richieste esterne. L’intera suite browser di 431 casi non è stata rieseguita: il controllo completo precedente era 427/427 sul commit base.

Sette nuovi unitari verificano i due assi del crop, sostituzioni ripetute manuali/AI, metadati di deformazione, JSON/gruppi/storico, compatibilità `contain`, minimo di un pixel, atomicità degli errori e blocchi. I browser aggiungono PNG e JPEG EXIF, confronto visivo, fallimenti dei file/filtri senza perdita del redo, richiesta diventata obsoleta durante il file chooser e cambio formato esterno mentre la decodifica è sospesa.

Log privati: `.local/image-replacement-{all-unit,regressions,build-verified,schemas,secrets-verified,public-build,public-browser,public-secrets,artifacts,capture-final}.log`. Conservati anche gli esiti intermedi: un primo unitario confrontava il centro in virgola mobile con uguaglianza esatta; corretto con tolleranza 1e-12 mm. La prima build segnalava un evento `onCancel` non presente nei tipi React dell’input: sostituito da listener nativo con cleanup. Il primo browser attendeva «Firma» per un file di soli dodici byte: il parser segnalava correttamente «PNG troncato»; ora sono verificati entrambi i casi, file corto e firma errata.

Nessun dato personale modificato, nuova importazione di template, deploy o scrittura su Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout. La chat pubblicata resta separata.

## Prossimo consolidamento individuato (ora completato)

Seguito completato in [riuso dei pixel](iteration-editor-raster-sharing.md). La nota sotto registra la situazione di partenza.

La preparazione delle immagini era indicizzata per ID risorsa; i caricamenti manuali assegnano un nuovo UUID anche quando il file è identico. Verificare e ridurre le decodifiche/bitmap duplicate tra questi ID, condividendo i pixel soltanto dopo aver verificato byte, MIME e dimensioni, senza riscrivere gli ID canonici. Mantenere il rifiuto di ID riutilizzati per file differenti e le garanzie Undo/Redo; provare anche richieste contemporanee e filtri. È un miglioramento di memoria/caricamento, senza nuovi strumenti avanzati o modifiche all’archivio.
