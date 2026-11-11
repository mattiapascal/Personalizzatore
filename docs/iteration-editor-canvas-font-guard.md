# Testi non verificati nel canvas — 11 novembre 2026

Base `0aba319`. Il turno precedente ha prodotto codice verificato e sincronizzato: è stato **progresso**. Il controllo degli output era già rigoroso; il canvas interattivo poteva ancora disegnare glifi del browser assenti dal file richiesto. Questo incremento protegge il disegno dei glifi senza modificare il documento canonico o sostituire automaticamente un font.

## Comportamento

- Ogni testo interattivo passa per `TextRenderGuard`: in attesa del preflight o in presenza di problemi viene disegnato soltanto un riquadro vettoriale arancione con diagonali. L’intero box resta un segnaposto anche se manca un solo carattere; non viene presentato come anteprima produttiva.
- La verifica usa `inspectDocumentFonts`, quindi gli stessi byte/font/stili nominali già controllati negli output. Geometria, selezione e zoom non autorizzano nuovi caratteri e non producono revisioni. Una risposta di una verifica precedente non autorizza un testo o un file diverso.
- La vista legge anche testo e stili correnti di Fabric durante l’immissione, prima di ogni disegno. Un carattere appena digitato o incollato non viene disegnato con un altro font in attesa di Esc/commit. Non viene cancellato dal contenuto originale.
- Gruppi e testo su tracciato usano lo stesso contenitore protetto. Le guide vettoriali restano tali. Gli altri oggetti e i testi verificati continuano a essere visibili.
- Un avviso in sovrimpressione distingue attesa e font da correggere; non occupa spazio nel layout del canvas. Retry esplicito dopo problemi temporanei WOFF2, selezione e correzione già esistente per i soli caratteri mancanti, Undo/Redo conservati. Il pannello font è accessibile anche in modalità cliente quando esiste un testo bloccato, entro i permessi del documento.

`protectTextRendering` viene attivato dall’editor applicativo prima del primo render. Le primitive sincrone di geometria e i test di riferimento non cambiano contratto. SVG/PNG/PDF/miniature continuano a usare il controllo di output precedente e non esportano i segnaposto. Nessun nuovo schema o comando grafico: apertura, modifiche manuali/AI e correzione passano ancora dal modello comune.

## Limiti da mantenere espliciti

**Il disegno dei glifi è protetto; la politica completa sui font non è ancora conclusa.** `measureFabric`, la costruzione dei box e alcune operazioni tipografiche possono ancora interrogare le metriche del browser prima del controllo nominale. Le misure dei testi irrisolti non diventano verificate grazie al segnaposto. La vecchia correzione può inoltre usare quelle metriche per mantenere il centro. Il prossimo passo deve proteggere anche il percorso delle misure e predisporre il recupero dei testi senza inventare l’ingombro originale, preservando contenuti, stili, coordinate e scelta esplicita dei file.

Il controllo riguarda copertura nominale e stili del file, non una certificazione di shaping complesso, Illustrator o lavorazione fisica. Nessuna modifica ai font personali, ai template reali, a Shopify/tema/BSS/PitchPrint, prezzi, carrello/checkout o chat pubblicata. Nessun deploy.

## Prove

Cinque nuovi unitari coprono attesa, cache indipendente dalla geometria, risposta obsoleta, cambio dei byte a parità di ID, errori, retry, rimozione/chiusura e analisi reale dei font. **653 unitari / 100 file passati**. Build/tipi e scansione segreti finali passati. La prima ripetizione dopo l’aggiornamento dei messaggi aveva un’asserzione sul vecchio nome «Variante font»: aggiornata al nuovo invito a scegliere il file dello stile, poi rieseguita tutta la suite.

Quattro nuovi browser passati: nessuna chiamata di disegno testuale prima della verifica o per font mancanti/simulati/non analizzabili, gruppi e tracciato compresi; selezione/correzione/Undo/Redo senza spostare il canvas; digitazione di Ω fuori dal sottoinsieme senza un solo disegno del glifo prima della correzione; attesa WOFF2, errore e retry senza revisioni. I test distinguono deliberatamente il disegno dalle misurazioni ancora da proteggere.

I 23 campioni JSON/SVG esistenti sono stati riaperti/riesportati, zero errori browser e richieste esterne. Nessuna nuova geometria: riutilizzato il campione `font-repair.TEST`, senza riscriverlo. Schermate ispezionate a 1440 × 900 e 390 × 844: `.local/previews/editor-canvas-font-blocked-desktop.png`, `editor-canvas-font-blocked-mobile.png`, `editor-canvas-font-corrected-desktop.png`. Zero errori browser o richieste amministrative di scrittura; il JSON resta invariato durante il retry.

Log privati: `.local/editor-canvas-font-guard-unit.log`, `editor-canvas-font-guard-build.log`, `editor-canvas-font-guard-browser.log`, `editor-canvas-font-guard-artifacts.log`, `editor-canvas-font-guard-capture.json`. Illustrator non collaudato.

**99/99 browser di regressione passati**, log `.local/editor-canvas-font-guard-regression.log`: font, testo/editing, gruppi, tracciati, template, avvio e zoom. Dopo la copia immutabile delle risorse nella cache e la correzione dei messaggi sono passati altri **8/8 browser mirati** (`editor-canvas-font-guard-final-browser.log`). Non è stata rieseguita l’intera suite browser.
