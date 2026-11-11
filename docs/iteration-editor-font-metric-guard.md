# Misure dei testi e recupero delle bozze — 11 novembre 2026

Base `d9f9cb4`. L’incremento precedente ha reso visibile nell’ispettore il punto mediano assente da AmoretScript-Regular. Questo lavoro affronta il percorso separato delle metriche: un segnaposto nel disegno non impediva a Fabric di misurare prima il glifo sostitutivo del browser.

## Contratto delle misure

`measureFabric` e `measureTextFrame` richiedono ora file caricati, copertura ricavata dai byte e assenza di stili simulati per tutti i caratteri effettivamente usati. Il controllo riguarda anche gli override. In assenza della prova sollevano `UnverifiedTextGeometryError` prima di costruire il testo Fabric; non restituiscono dimensioni presunte.

La validazione in modalità bozza può differire esclusivamente questa condizione tipizzata sui testi. Errori diversi, geometrie delle forme e validazione stretta restano bloccanti. Un progetto con testo incompleto resta recuperabile; non diventa per questo idoneo alla produzione. I comandi che derivano allineamenti, centri, scale o adattamenti continuano a richiedere misure reali e falliscono senza una revisione parziale. Spostamenti letterali X/Y, contenuti e metadati non richiedono di inventare il centro del testo. I font non incorporati restano un errore distinto e bloccante: non diventano una bozza autorizzata grazie al differimento delle metriche. Anche il testo di un gruppo con un altro membro già visibile passa dal controllo.

## Canvas, ispettore e digitazione

- Prima di costruire un testo non verificato, la vista crea un marcatore vettoriale arancione alle coordinate originali. Usa il vecchio box dichiarato se presente, altrimenti una dimensione convenzionale: **non è l’ingombro del testo**, non entra nei comandi, non è esportabile e non viene presentato tra le misure dell’ispettore.
- Il marcatore e le selezioni/gruppi che lo contengono conservano la selezione ma bloccano i gesti che potrebbero salvare i suoi limiti come geometria del testo. Gli agganci omettono le unità con ingombro sconosciuto. Dopo la verifica viene ricostruito il testo reale, senza una revisione grafica.
- L’ispettore espone la causa, il font e un campo di recupero del contenuto. Una modifica conserva prefisso/suffisso Unicode, stili locali e allineamenti, senza ricentrare il testo tramite misure sostitutive. Rimane disponibile anche la correzione dei soli caratteri dal pannello Font del progetto. Undo/Redo ripristinano testo e condizioni precedenti.
- Durante l’immissione diretta, `_measureChar` non invia al canvas nativo caratteri non verificati o coppie che li contengano e non inserisce valori sostitutivi nella cache Fabric. I valori provvisori servono soltanto a completare il ciclo di input; `measureFabric` rifiuta comunque quella scena. Il contenuto digitato e X/Y vengono conservati, non scartati.
- Le misure aggiuntive del testo su tracciato usano soltanto caratteri realmente presenti e verificati. Eliminato il campione artificiale «Mg» per cursore/selezione: un font di simboli non deve dipendere dalla presenza di lettere latine.
- Il controllo WOFF2 viene preparato in parallelo al caricamento della risorsa, senza attendere l’intera libreria. Retry, risultati obsoleti e cambio documento conservano la protezione esistente.

Non cambia lo schema JSON né il catalogo dei comandi. Le modifiche continuano a passare dallo store canonico con gli stessi validatori manuali/AI. Anche il serializzatore SVG di basso livello rifiuta ora un testo non verificato: non può esportare il marcatore come se fosse il testo.

## Campione e prove

[Prima della correzione](../fixtures/illustrator/font-geometry.source.TEST.json), [JSON corretto](../fixtures/illustrator/font-geometry.TEST.json), [SVG corretto](../fixtures/illustrator/font-geometry.TEST.svg): 80 × 40 mm, file OFL ABeeZee incorporato. «ABC Ω» contiene un simbolo assente; il recupero in «ABC» mantiene X/Y 10/10 mm e il primo carattere a 9 pt sottolineato, con il resto a 18 pt. `scripts/capture-editor-font-measurement.ts` verifica anche un comando manuale, uno AI simulato e due Undo sullo stesso documento.

Catture desktop/mobile in `.local/previews/editor-font-geometry-*`, ispezionate. Zero misure native della Omega nel file che non la contiene, zero errori browser e zero scritture amministrative. Anche AmoretScript originale ricontrollato in sola lettura: font caricato, punto mediano assente, archivio personale invariato. Nessuna correzione automatica dei dati reali.

**692 unitari / 108 file**, tipi/build, build pubblica e scansioni segreti passati. **421 casi browser locali verificati fra esecuzione e ricontrolli**, con report per caso in `.local/metric-case-coverage.json`; non sono 421 casi di un’unica esecuzione finale. Il primo controllo completo ha dato 397 passati/22 falliti; dopo le correzioni sono passati 28 ricontrolli (tutti i 22 casi, più verifiche ulteriori), poi 85 regressioni dei font e 17 dei gruppi/metriche. Le esecuzioni si sovrappongono: non sommare i conteggi. Zero casi rimasti senza esito positivo nel resoconto.

Tra le correzioni emerse: avvio e aggiunta testo con un solo file che non contiene TEST, stile di colore dei testi modificabile senza centri presunti, tutti i membri dei gruppi verificati indipendentemente dalla visibilità dei fratelli e nessun salvataggio dei limiti provvisori di un testo in editing. Alcune vecchie fixture usavano grassetti sintetici o caratteri fuori dal sottoinsieme WOFF2: corrette con file/stili veri o testo contenuto nel file, mantenendo separati i casi intenzionalmente errati. Il test del punto di zoom usa ora lo zoom fisico del canvas, anziché la percentuale arrotondata del campo UI; soglia invariata.

**26 campioni riaperti/riesportati**, zero errori browser o richieste esterne; **13 browser pubblici locali passati**, build pubblica finale con lo stesso bundle della prova, chat preservata. Log in `.local/metric-{all-unit-final,build-final,secrets-final,recheck-browser,final-regressions,groups-final,artifacts-final,public-browser,public-build-final,public-secrets,capture-final}.log`. Log della prima esecuzione e dei primi test mirati conservati, senza presentarli come esecuzioni interamente verdi.

## Limiti

È una protezione dei percorsi metrici sulla base della **copertura nominale** e delle varianti reali del file. Non certifica shaping complesso, sequenze emoji/variation selector, disegni difettosi dentro il file font o la resa in Illustrator. Questi casi richiedono prove ulteriori; non dichiarare conclusa una certificazione universale dei font.

Il profilo produttivo e l’approvazione finale restano distinti dalla possibilità di recuperare una bozza. Nessun deploy o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello/checkout o chat pubblicata. Nessun font privato aggiunto al repository. Il campione SVG richiede ancora il collaudo umano Illustrator.
