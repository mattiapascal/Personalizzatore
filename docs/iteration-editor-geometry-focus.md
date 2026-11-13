# Mostrare un rilievo sul canvas — 13 novembre 2026

Nel risultato di **Controlla margini e zone**, ogni sovrapposizione o vicinanza al limite dotata di coordinate offre **Mostra sul canvas**. Il pulsante centra il punto nella vista e lo indica con un mirino: rosso per la sovrapposizione, ambra per un contatto incerto. La scheda in sovrimpressione mostra regola e coordinate in mm; la piccola X nasconde il punto senza spostare la vista.

Si conserva lo zoom scelto, salvo i limiti bitmap già presenti quando si apre una pagina molto grande. PAN e zoom restano disponibili; premere di nuovo Mostra ricentra il punto. Sul formato compatto i pannelli che coprono il canvas vengono richiusi. Se il rilievo appartiene a un’altra pagina già presente nel documento, il passaggio usa il comando `selectPage` esistente, senza modificare dimensioni o contenuti.

## Documento e vista

`geometry-focus.ts` verifica ID del documento, revisione del contenuto, pagina e ID/versione del profilo prima di accettare il punto. Le piccole approssimazioni sul bordo vengono limitate alla sagoma; coordinate impossibili sono rifiutate. Il mirino non seleziona un presunto oggetto responsabile deducendolo dal bounding box.

`GeometryPointMarker` è una decorazione DOM del renderer, con dimensione fissa di **32 pixel sullo schermo**, anche su Retina e cambiando zoom. Non intercetta i clic: l’oggetto sottostante può essere selezionato e spostato normalmente tramite gli stessi comandi validati. Colore dimostrativo del tampone e filtri del disegno non alterano il mirino.

Il punto appartiene soltanto alla vista: non aggiunge livelli, proprietà del documento o revisioni grafiche; non entra in JSON, SVG, PNG, PDF o miniature. Una modifica del contenuto, un cambio pagina/profilo, l’avvio della scrittura o di un gesto di disegno lo rimuovono. Non viene ripristinato da Undo o dalla riapertura della vista estesa. Un nuovo controllo lo cancella anche se la richiesta fallisce. Il report rimane [diagnostico e campionato](iteration-editor-production-geometry.md), senza diventare un’approvazione produttiva.

## Verifiche

- **1.158 unitari / 162 file passati**, inclusi 11 nuovi casi su identità/revisioni, profili, bordi rettangolari e tondi, pagine già esistenti e traslazione a zoom differenti. Includono anche le regressioni del [riavvio locale del resolver font](iteration-editor-runtime-restart.md).
- **47 browser pertinenti distinti passati**: 43 nel gruppo principale e quattro PAN nel ricontrollo successivo. Tredici nuovi casi coprono centratura, zoom, PAN, chiusura, contenuto obsoleto/Undo, pagina diversa, mobile, Retina, cliente/oggetto bloccato, errore del controllo e modifica dell’oggetto attraverso il mirino. Confrontati gli SVG prima/dopo normalizzando soltanto gli ID variabili, PNG identici e JSON canonico invariato. Inclusi 16 casi del motore geometrico, sei PDF effettivi, profili e i due casi dell’ispettore: **Geometria resta attiva dopo il fallback**.
- Build/TypeScript e build pubblica passati; scansione dei segreti dei due bundle passata. JavaScript pubblico invariato: `index-BG2r_x-8.js`.
- **69 campioni JSON/SVG riaperti e riesportati**, zero errori/richieste esterne o letture di font personali; **13 browser pubblici passati** nel laboratorio.

Log `.local/geometry-focus-all-units.log`, `geometry-focus-browser-regressions.log`, `geometry-focus-pan.log`, `geometry-focus-build.log`, `geometry-focus-public-build.log`, `geometry-focus-secrets.log`, `geometry-focus-public-secrets.log`, `geometry-focus-artifacts.log` e `geometry-focus-public.log`. Non è una nuova esecuzione della suite browser generale.

## Campione riproducibile

`node --import tsx scripts/capture-editor-geometry-focus.ts` riusa il [JSON TEST 100×60 mm](../fixtures/illustrator/production-geometry.TEST.json) e il relativo [SVG](../fixtures/illustrator/production-geometry.TEST.svg), senza creare una seconda versione del progetto. Catture desktop/compatta ispezionate in `.local/geometry-focus-capture/`; report con hash del sorgente, JSON/SVG riesportati, documento invariato e zero errori, richieste esterne o scritture amministrative. **Illustrator non collaudato**.

Archivio principale confermato in sola lettura: **SQLite R630, 339 template, due composizioni, 219 font e un profilo**. Nessuna importazione, modifica ai dati personali o migrazione; nessun deploy o modifica alla chat e al negozio pubblicati.
