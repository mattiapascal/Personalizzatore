# Controllo visuale di margini e zone — 13 novembre 2026

Nel pannello **Profilo tecnico della pagina**, quando un profilo è collegato, è disponibile **Controlla margini e zone**. Analizza la grafica risultante nelle pagine già presenti e riporta il margine e ciascuna zona riservata: nessuna sovrapposizione rilevata, sovrapposizione rilevata con punto in mm, vicinanza al limite da esaminare, dato mancante o controllo incompleto. Un risultato precedente viene nascosto quando cambia il contenuto, anche durante la richiesta.

È un controllo diagnostico campionato, **non un’approvazione produttiva**. Non è ancora collegato al blocco della conferma cliente: non cambiano salvataggi, appunti, comandi di disegno o il comportamento degli oggetti parzialmente fuori foglio. Non verifica punta da 0,5 mm, distanza di 30 mm fra vernici, zone di rispetto dei fissaggi o costi. Questi controlli restano nel [piano produttivo](editor-production-geometry-plan.md).

## Grafica effettiva e stato unico

`createGraphicTileRenderer` in `fabric-adapter.ts` riusa gli stessi oggetti Fabric, font esatti, filtri, crop, riflessioni, inclinazioni e maschere del canvas. La preparazione è quella asincrona dell’output SVG. Si legge una proiezione produttiva del documento canonico: riferimenti individuali e di gruppo, selezione, strumenti e guide non entrano nei campioni.

Non si usa il bounding box di un oggetto come prova di collisione. Una cornice può circondare una zona lasciandola vuota; un box di testo può sovrapporla senza che i glifi vi entrino. Contano fori, maschere, trasparenze, crop e ordine dei livelli. Nel timbro il bianco copre l’inchiostro precedente; su una targa stampata il bianco è pittura produttiva. La tinta dimostrativa del tampone non cambia l’analisi.

Il colore esplicito `paperColor` è parte della grafica esportata: partecipa alle zone riservate. Sui supporti stampati il colore del foglio e gli elementi identificati esplicitamente dal collegamento dello sfondo hanno l’esenzione dal solo margine a tutta pagina. Sui timbri e nelle incisioni il margine continua invece a considerare tutta la pittura, sfondi compresi. Una forma grande, chiara o senza nome di sfondo non riceve tale esenzione. I riferimenti rimangono esclusi da entrambi i controlli.

Il report vive fuori dal JSON del progetto e non invalida le miniature. Porta ID del documento, revisione/contenuto, pagina, profilo ID/versione, regola, campioni letti e punto rilevato. Gli eventuali ID di oggetti il cui frame include il punto sono soltanto candidati diagnostici, massimo otto con conteggio totale: non sono dichiarati responsabili della pittura e non vengono mostrati al cliente come violazioni individuali.

Il modulo puro `production-geometry.ts` definisce protocollo, griglia, fasce geometriche e classificazione dei campioni; `production-geometry-browser.ts` orchestra il renderer. Il confronto manuale/AI simulata, Undo/Redo e riapertura JSON usano sempre il documento e i comandi esistenti. Non esiste una seconda scena editabile o una correzione automatica per far passare l’esame.

## Risoluzione e risorse

- Passo di campionamento **0,025 mm**, 40 pixel/mm. È il passo della griglia, non una garanzia matematica di errore massimo né una nuova tolleranza produttiva.
- Riquadri al massimo **512×512 pixel**, buffer RGBA fino a 1 MiB ciascuno. Non è un tetto della memoria complessiva di font, decoder e cache Fabric.
- Budget globale dell’esame: **64 milioni di pixel letti**, **20 secondi** nel motore e **48 milioni di pixel sorgente distinti** fra le pagine. Il processo headless ha anche il termine massimo del renderer locale. Esaurimento o errore non diventano un risultato positivo.
- Per il margine rettangolare si leggono quattro fasce; per quello tondo si visitano soltanto le file della corona. Il clipping della pagina è nativo su ciascun riquadro, evitando una maschera bitmap del foglio completo a risoluzione implicita. Renderer condiviso fra regole quando la scena coincide; immagini/font preparati riusati.
- I campioni di antialiasing o entro la fascia di un pixel dal limite sono segnalati come vicini al bordo, senza trasformare un contatto tangente in una violazione certa. Particolari più piccoli della griglia e casi complessi richiedono ulteriore verifica: un risultato «nessuna sovrapposizione rilevata» non certifica l’assenza matematica di ogni dettaglio.

### Tempi osservati su fixture semplici

Misura del solo motore nel browser corrente, non del caricamento Chromium/HTTP e non una previsione per qualsiasi progetto cliente. Una forma centrale, nessuna zona aggiuntiva, margine 2 mm TEST; non sono prodotti o prezzi del catalogo. Dati in `.local/geometry-performance.json`.

| Formato TEST | Pixel letti | Riquadri | Tempo motore |
|---|---:|---:|---:|
| Rettangolare 58×22 mm | 497.904 | 14 | 22 ms |
| Rettangolare 1100×400 mm | 9.813.104 | 234 | 140 ms |
| Circolare 3000×3000 mm | 50.603.768 | 3.168 | 2.424 ms |

In queste prove il maggiore riquadro è 41.984 pixel, circa 164 KiB RGBA; non è una misura della RAM totale. Il caso aggiuntivo con quattro PNG validi da 16 MP ciascuno verifica l’esito incompleto prima della decodifica, con zero pixel letti e documento conservato. Il controllo rimane disponibile anche nella copia archivio di prova: il guard permette questa diagnostica di sola lettura, lasciando bloccate configurazioni, chat e scritture estranee.

## Backend e risultato obsoleto

`POST /__editor-local/check-geometry` riceve soltanto il documento, lo valida e lo analizza in una propria pagina Chromium. Nessuna maschera o misura dichiarata dal client viene accettata come prova. Richiede loopback, intestazione locale, origine coerente e JSON, con limite di progetto e un esame alla volta. È una richiesta di sola lettura: non salva progetti, profili o configurazioni.

`withLocalGraphicRenderer` è il servizio comune a diagnostica e PDF: risponde in memoria all’analisi WOFF2 dei soli byte incorporati noti, impedisce le altre scritture/API e le richieste esterne e chiude il browser anche in errore. Le regressioni PDF effettive restano passate dopo l’estrazione del servizio. Glifi mancanti, stili simulati e font non verificabili impediscono un risultato positivo; nessun font del computer viene utilizzato.

L’interfaccia confronta documento e revisione del contenuto prima di mostrare il report. Una risposta arrivata dopo importazione, modifica, Undo/Redo o cambio del profilo non viene visualizzata come attuale. La sola selezione o il cambio di vista non modificano la grafica. Report raggruppato per pagina, pulsante blu coerente con `#08c`, viste desktop e compatta ispezionate.

## Collaudo e campione

**1.144 unitari / 161 file passati**, di cui 13 nuovi. **32 browser pertinenti distinti passati**: gruppo di 31 più il caso aggiuntivo delle sorgenti grandi, con quattro ricontrolli della politica degli sfondi. Inclusi 16 nuovi geometrici, sei PDF reali e regressioni dei profili, font e scheda dell’ispettore. Provati cornice vuota, box senza glifi nella zona, dimensione del font che introduce una collisione, ellipse e tangente, fori/clip/maschere, immagine trasparente con crop frazionario, knockout/ordine dei livelli, colore del foglio, riferimenti ereditati, sfondo esplicito, dati mancanti/errori/budget, WOFF2 e pagine parametriche esistenti. Verificati anche i comandi manuali/AI, Undo/Redo, report obsoleto e le protezioni dell’endpoint.

Controllo effettivo passato su **1100×400 mm rettangolare e 3000×3000 mm circolare**, senza bitmap completa del foglio. Confrontati quattro riquadri con il PNG a 150 dpi del campione di trasformazioni: testo, testo su percorso, curve, immagini, shear e riflessioni, differenza premoltiplicata media inferiore a 0,5/255. Non è una certificazione di tutte le possibili maschere o dei dettagli sotto griglia.

**69 campioni JSON/SVG riaperti/esportati**, zero errori browser, richieste esterne o file font personali letti. **13 browser della chat pubblica**, pacchetto Worker `--dry-run` e controlli segreti passati; bundle pubblico sempre `index-BG2r_x-8.js`. Archivio ordinario confermato in sola lettura a **SQLite R630: 339 template, due composizioni, 219 font e un profilo**.

Log `.local/geometry-unit.log`, `geometry-regressions.log`, `geometry-source-budget.log`, `geometry-background-policy.log`, `geometry-build.log`, `geometry-artifacts.log`, `geometry-public.log`, `geometry-worker-package.log`, `geometry-secrets.log`, `geometry-public-secrets.log`. Generatore `node --import tsx scripts/capture-editor-production-geometry.ts`; [JSON](../fixtures/illustrator/production-geometry.TEST.json) e [SVG](../fixtures/illustrator/production-geometry.TEST.svg) 100×60 mm, con Arimo TEST e profilo incorporati. Da una scena libera si sposta un rettangolo nella zona, lo stesso comando AI produce lo stesso documento, Undo libera la zona e Redo ripristina il rilievo. Originali e output restano distinti; il report e le guide non compaiono nello SVG. Schermate e report in `.local/production-geometry-capture/`.

Non è stata rieseguita la suite browser generale; non sostituire il risultato storico 685/689 con questa selezione. **Illustrator non collaudato**. Nessuna applicazione di profili o modifica ai template/font personali, nessuna migrazione, nessun deploy o modifica commerciale online.
