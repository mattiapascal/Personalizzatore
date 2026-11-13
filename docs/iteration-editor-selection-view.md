# Adatta alla selezione — 13 novembre 2026

Nella barra dello spazio di disegno, accanto ad **Adatta all’area**, è disponibile **Adatta alla selezione** con icona distinta. Inquadra l’ingombro degli elementi selezionati, utile per i dettagli di un documento grande. Include i contorni e le geometrie ruotate/inclinate/riflesse; un membro scelto direttamente nei livelli conserva il proprio ingombro, mentre un gruppo selezionato usa l’intero insieme. Sono gestiti anche oggetti parzialmente fuori dal foglio.

È una sola azione sulla vista: zoom e traslazione nel viewport esistente. Non cambia documento, misure fisiche, selezione, ID, revisioni, filtri o storico. I successivi movimenti/modifiche restano negli stessi comandi manuali e AI simulati; la vista non insegue automaticamente gli oggetti durante il lavoro. PAN, rotella e slider continuano a funzionare; Adatta all’area ripristina la vista del foglio.

Le dimensioni DOM reali determinano il fattore, con **48 px di margine** per lasciare spazio anche alle maniglie e alla rotazione. Il limite bitmap/Retina del canvas intero resta invariato: se raggiunto, una selezione piccola può non riempire la vista. Se la selezione è troppo grande anche allo zoom minimo, l’avviso lo dichiara senza fingere un adattamento completo. Nei formati compatti i pannelli laterali vengono richiusi prima dell’inquadratura.

Una selezione con font non misurabili non riceve un riquadro stimato: appare un avviso chiudibile, senza spostare la vista né sostituire caratteri/font. Una nuova selezione misurabile resta utilizzabile. Richieste superate da una nuova azione di zoom o da selezione/contenuto diversi vengono annullate; nessun commit grafico è prodotto da un adattamento in attesa.

I pulsanti della barra e dei suoi pannelli rispondono a Space con l’azione nativa, senza attivare Mano. Space sul canvas conserva il PAN temporaneo esistente; testo e campi mantengono il comportamento previsto.

## Prove

- **1.270 unitari / 181 file passati** (`.local/selection-view-all-units.log`), inclusi sette nuovi casi di ingombro esatto, ID, gruppi, coordinate esterne, contorni/rotazioni, font non verificato, centro/scala, Retina e limiti. I sette casi sono stati ripetuti dopo il margine per le maniglie (`selection-view-unit-final.log`).
- **60 browser locali pertinenti passati**: dieci nuovi per desktop/mobile, gruppi/membro diretto, oggetto esterno, movimento manuale/AI, Undo/PAN, font problematico, tastiera, grande formato, richieste superate, buffer Retina e rotazione effettiva dopo l’inquadratura (`selection-view-delivery-browser.log`); cinquanta regressioni su camera, tastiera, guide, localizzazione dei rilievi, maniglie e foto (`selection-view-regression-browser.log`). Non è una nuova esecuzione della suite browser generale.
- JSON, SVG normalizzato, PNG e miniature identici prima/dopo la sola vista. Il [campione JSON](../fixtures/illustrator/selection-view.TEST.json) e [SVG](../fixtures/illustrator/selection-view.TEST.svg) contiene quattro oggetti e un gruppo, con font OFL e immagine generata TEST. Il generatore `scripts/capture-editor-selection-view.ts` verifica l’assenza di modifiche; rapporto `.local/selection-view-capture.json`. Schermate dell’area intera e della selezione desktop/mobile in `.local/previews/editor-selection-view-*.png`, ispezionate visivamente. Nessun nuovo collaudo Illustrator.
- **78 campioni JSON/SVG riaperti ed esportati**, senza errori browser o richieste esterne e senza caricamenti di font personali (`.local/selection-view-artifacts.log`).
- Build locale/pubblica e scansioni dei segreti passate; **13 browser pubblici passati** (`selection-view-public-tests.log`). JavaScript della chat invariato: `index-BG2r_x-8.js`.

Archivio principale letto senza scritture: **SQLite R638, 346 template, due composizioni, 219 font e un profilo**, invariato (`.local/selection-view-archive.json`). Nessun nuovo schema di documento o comando grafico, migrazione, deploy, funzionalità multipagina o generazione immagini AI. Negozio, tema, PitchPrint, BSS, prezzi, carrello e checkout online invariati.
