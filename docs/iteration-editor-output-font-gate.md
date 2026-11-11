# Controllo font prima delle anteprime e dei file

Seguito: [disegno dei glifi protetto anche nel canvas](iteration-editor-canvas-font-guard.md). Le note sotto sul canvas descrivono il limite di questo incremento precedente; il percorso delle metriche irrisolte resta ancora aperto.

Incremento locale dell’11 novembre 2026, base `765e39e`.

Piano: un preflight rigoroso condiviso per SVG/PNG/PDF, miniature, anteprime dei template e riepiloghi locali. Rifiutare file non incorporati, caratteri mancanti, stili simulati e copertura sconosciuta prima di produrre l’immagine. Preservare JSON, documento e revisione; la correzione guidata resta esplicita. Considerare soltanto gli elementi produttivi, escludendo i riferimenti.

Aggiornare la chiave di cache soltanto per documenti con testo: le vecchie immagini potevano contenere glifi di fallback. Errori temporanei nell’analisi non devono restare memorizzati come sconosciuti per sempre. Verificare risultati asincroni obsoleti e PDF diretto lato server, oltre ai pulsanti UI. Il canvas interattivo ancora da correggere resta un percorso distinto, da proteggere senza perdere accesso al testo/JSON.

## Comportamento implementato

- `assertOutputFonts` usa i byte incorporati e richiede copertura nominale verificabile: file assenti, glifi mancanti, stili CSS simulati e mappe non analizzabili impediscono l’output. Il controllo delle bozze editabili resta distinto.
- `exportDocumentSvg`, PNG e miniatura condividono la preparazione prima del canvas: copia del documento produttivo, esclusione dei riferimenti, verifica dei font, caricamento dei soli file utilizzati e preparazione dei raster. Il documento originale resta invariato.
- Pulsante SVG, anteprime dei template, bozze, cambio modello e riepiloghi locali usano il percorso controllato. PDF controllato anche sul server prima di lanciare Chromium; nuove conferme locali controllate sul server con lo stesso preflight.
- SVG e PNG asincroni non scaricano un risultato di una revisione precedente quando il progetto cambia durante il controllo. Le anteprime non mostrano l’immagine del documento precedente in attesa della nuova.
- Chiavi delle miniature con testo aggiornate con `strict-nominal-1`: le immagini precedenti vengono ignorate e rigenerate una volta. I documenti senza testo mantengono la chiave; titolo/tag non provocano rigenerazione.
- Errori di copertura non memorizzati definitivamente. Riprova nelle anteprime e ricontrollo font consentono di ripetere un servizio WOFF2 temporaneamente non disponibile. L’archivio mostra «Font da correggere» per le miniature bloccate, con dettaglio del problema; JSON e apertura nell’editor restano disponibili.

La serializzazione sincrona `FabricAdapter.exportSvg` resta una primitiva interna per scene già preparate, test geometrici e generatori. I percorsi di output dell’applicazione passano dal wrapper controllato. Non certifica shaping complesso, Illustrator o produzione fisica. **Il canvas interattivo può ancora mostrare un glifo del browser nelle bozze errate: questo incremento ne blocca gli output, non conclude l’intera politica font.** Nessun allentamento del parser cmap, sostituzione automatica o modifica di un file personale.

## Verifiche

648 test unitari / 99 file, build/tipi e scansione segreti passati. Cinque nuovi browser controllano nove rifiuti prima della creazione di qualsiasi contesto canvas, JSON ancora scaricabile, correzione esplicita che sblocca SVG, PDF diretto con risposta 422, vecchia cache ignorata, retry WOFF2 e PNG obsoleto scartato. Tutti passati; 23 campioni JSON/SVG riaperti e riesportati, zero errori browser o richieste esterne.

Log: `.local/editor-output-font-gate-unit-final.log`, `editor-output-font-gate-build-final.log`, `editor-output-font-gate-secrets.log`, `editor-output-font-gate-browser-final.log` e `editor-output-font-artifacts.log`. Regressione estesa collegata ad avvio/zoom e template registrata separatamente. Archivi temporanei nei test, nessuna correzione alle 117 bozze reali. Nessun deploy o scrittura sul negozio, tema, BSS, PitchPrint, prezzi, carrello Shopify o chat pubblicata.

Regressione estesa: **194/202 nel comando iniziale**, otto campioni storici fermati dal nuovo controllo. Tre usavano grassetto CSS simulato, uno un font di sole icone per testo alfabetico e quattro il sottoinsieme ABeeZee con lettere che non contiene. Corretti esclusivamente i campioni: file Arimo grassetto reale, font alfabetico reale e testo `ABC` presente nel sottoinsieme. Due helper di archivio lasciano passare il servizio locale di lettura della copertura WOFF2, senza inviare quella richiesta al finto endpoint di scrittura. Nessun vincolo applicativo è stato allentato.

**Tutti gli otto ricontrolli passati**, in gruppi da 3 + 1 + 3 + 1: `editor-output-font-real-styles.log`, `editor-output-font-portable.log`, `editor-output-font-pitchprint.log`, `editor-output-font-library.log`. Complessivamente verificati tutti i 202 casi selezionati, senza presentare come verde il comando iniziale o dichiarare rieseguita l’intera suite del laboratorio. Le cinque prove di avvio/zoom e i cinque nuovi percorsi font sono passati anche nel comando esteso (`editor-preview-regression.log`).
