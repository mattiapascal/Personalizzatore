# Distanza precisa tra gli oggetti — 13 novembre 2026

Nel pannello **Trasforma → Spaziatura** si può impostare una distanza in millimetri e applicarla in orizzontale o verticale, con due icone distinte dalla distribuzione esistente. Le frecce cambiano il valore di 0,1 mm; sono accettati anche valori frazionari più precisi e zero. Scrivere il valore prepara la distanza: la disposizione avviene premendo l’icona dell’asse. Valori vuoti, negativi o superiori al limite tecnico disabilitano i pulsanti.

Servono almeno due oggetti o gruppi distinti. La distanza si misura tra gli ingombri comprensivi di contorni e trasformazioni; un gruppo rimane un’unità e conserva le distanze interne. Non è la distanza minima tra i singoli tratti dipinti di forme irregolari. L’ordine iniziale lungo l’asse rimane stabile; a parità di posizione prevale l’ordine dei livelli. Nessun cambiamento di dimensioni, rotazione, testo, filtri, stile o ordine dei livelli.

Senza master rimane fermo il primo elemento a sinistra/in alto. Con un master scelto tramite clic su un elemento già selezionato, rimane fermo il suo intero gruppo e gli altri vengono disposti sui due lati. L’opzione **Allinea alla pagina** continua a riguardare gli allineamenti; la spaziatura è sempre tra gli oggetti. La distribuzione a spazi uguali tra gli estremi, già disponibile per tre unità, rimane distinta.

Il nuovo comando `spaceObjects` è tipizzato, con revisione e ID, e viene eseguito dallo stesso store per UI e simulazione AI. È un solo passaggio annullabile/ripetibile. Sono rifiutati master estranei, ID mancanti o duplicati, gruppi incompleti, revisioni obsolete, misure non verificabili e risultati oltre i limiti geometrici. Un errore lascia invariati documento e Redo. Restano validi i blocchi cliente ereditati dai gruppi; non sono introdotti font sostitutivi. Nessuna migrazione del formato documento.

L’intestazione di Trasforma ora rimane visibile durante lo scorrimento interno, conservando X e presa per trascinare il pannello anche su telefono.

## Prove e campione

- **1.282 unitari / 182 file passati**, inclusi dodici nuovi casi sui due assi, master estremi/intermedio, gruppi, affini, distanza zero/frazionaria, ordine stabile, blocchi, errori atomici e Redo (`.local/object-spacing-all-units.log`).
- Il campione [JSON](../fixtures/illustrator/object-spacing.TEST.json) e [SVG](../fixtures/illustrator/object-spacing.TEST.svg), **120 × 80 mm**, contiene quattro oggetti e un gruppo, con solo Arimo OFL incorporato e pixel generati TEST. Distanza orizzontale 3 mm; nessun font personale o dato del cliente. Generatore: `node --import tsx scripts/capture-editor-object-spacing.ts`.
- **26 browser pertinenti passati** (`.local/object-spacing-delivery-and-regression.log`): sei casi nuovi e venti regressioni di selezione, trasformazioni, master, gruppi, maniglie e vista. Non è una nuova esecuzione della suite browser generale. Il collaudo browser confronta UI e simulazione AI, Undo/Redo, riapertura JSON, SVG con font/raster incorporati, master su canvas, gruppi, campi invalidi, passi numerici, blocchi cliente, testo non misurabile e chiusura del pannello dopo scorrimento. I log intermedi conservano gli errori dei riferimenti dei test, corretti senza cambiare le funzioni esistenti.

- **79 campioni JSON/SVG riaperti ed esportati** senza errori browser, richieste esterne o font personali (`.local/object-spacing-artifacts.log`). Catture desktop/mobile finali ispezionate: intestazione, X e spaziatura restano accessibili; `.local/object-spacing-capture-final.log` registra zero errori e scritture amministrative.
- Build locale/pubblica, schemi e scansioni dei segreti passati; **13 browser pubblici passati** (`.local/object-spacing-public-tests.log`). JavaScript della chat invariato: `index-BG2r_x-8.js`.

Archivio principale letto senza scritture: **SQLite R638, 346 template, due composizioni, 219 font e un profilo** (`.local/object-spacing-archive.json`, selettore locale ancora SQLite). Nessuna migrazione, deploy, nuova funzione multipagina o generazione immagini AI. Negozio, tema, PitchPrint, BSS, prezzi, carrello e checkout invariati.

Illustrator resta da collaudare manualmente: misure fisiche, glifi editabili, ingombri ruotati e distanza tra i tre elementi/gruppi. Il limite di 10.000 mm per il valore della distanza è un tetto tecnico, non un formato produttivo ammesso; il risultato deve comunque superare tutti i limiti del documento.
