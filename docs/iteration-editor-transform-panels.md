# Trasforma, menu Modifica e pannelli riposizionabili — 13 novembre 2026

Incremento esclusivamente locale. Nessun deploy, modifica al negozio o migrazione dell’archivio. Il laboratorio continua a usare il backend SQLite già autorizzato.

## Comportamento

- Pulsante **Trasforma** nella barra superiore, con inclinazione orizzontale, riflessione orizzontale/verticale, allineamento e distribuzione. L’allineamento geometrico non compare più nell’ispettore; quello dei paragrafi rimane nella scheda Testo.
- Inclinazione su testo libero, testo su tracciato, rettangoli, cerchi, ellissi, linee, poligoni, Bézier, vettori e immagini. Il valore descrive la pendenza fisica del riquadro, indipendentemente dalla dilatazione del testo. Quando sono selezionati più elementi imposta l’inclinazione di ciascun riquadro conservandone il centro; non deforma globalmente le distanze della composizione. La riflessione, invece, riflette anche le posizioni rispetto al centro dell’intera selezione.
- **Allinea alla pagina** attivo: ogni oggetto/gruppo selezionato raggiunge il bordo o il centro effettivo della pagina. Il margine è zero, non il vecchio margine TEST di 1 mm. Un gruppo resta un’unità.
- Casella disattivata: allineamento fra le unità della selezione. Un clic senza trascinare su un elemento già selezionato sceglie il **master**, evidenziato con un contorno più marcato. Il master rimane fermo. Un gruppo scelto come master usa il proprio ingombro complessivo. La scelta disattiva la casella pagina; riattivarla azzera il master. Una selezione differente o un cambio documento/pagina lo azzerano. Trascinamento, Maiusc e Option/Alt non scelgono un master.
- **Livelli** limitato a gerarchia, selezione dei livelli, raggruppamenti e ordine. Le sezioni Gruppi/Ordine sono separate; il pulsante per selezionare un singolo membro ha un’icona distinta dalla freccia dello strumento Selezione.
- **Modifica** contiene selezione generale, duplica/elimina e appunti. Incolla adattando e Svuota appunti hanno icone distinte da Incolla/Elimina oggetto. Shortcut e menu contestuale restano disponibili.
- Popup Livelli, Modifica, Trasforma e Prodotto/fissaggi trascinabili dall’intestazione. I pulsanti di chiusura non trascinano il pannello. Posizione conservata nella vista anche chiudendo/riaprendo, contenimento nella finestra e controllo dei cambi di dimensione. Intestazione raggiungibile da tastiera: frecce 10 px, Maiusc+freccia 1 px, Home o doppio clic ripristinano l’ancoraggio al pulsante. La posizione è stato della vista, non del progetto, e non viene salvata nell’archivio.

## Contratti e geometria

Documento v2 esteso con proprietà opzionali `skewXDeg`, `mirrorX`, `mirrorY`; nessuna riscrittura automatica dei documenti esistenti. Per il testo libero viene riutilizzato `textSkewXDeg`. La composizione fisica è rotazione × inclinazione × riflessione; l’adattatore converte al diverso ordine di Fabric tenendo conto dei segni e delle scale dei pixel/glyph. Curve, caratteri, file immagine, maschere e stili rimangono editabili.

Nuovi `inclineObjects` e `reflectObjects`, con elenco di ID e revisione obbligatori. L’ambito esplicito `targetScope: object` permette il solo membro selezionato di un gruppo e richiede un unico ID. `alignObjects` accetta `referenceObjectId`, che deve appartenere alla selezione; il gruppo del master non viene tradotto. `alignObjectsToArea` accetta margine e allineamento individuale delle unità. I vecchi comandi senza questi parametri conservano il comportamento precedente.

Tutti passano dal normale motore di comandi, blocchi del template, validazione produttiva e cronologia. Azioni manuali e simulazione AI non hanno percorsi di scrittura alternativi. Scelta del master e movimento dei pannelli non creano revisioni grafiche.

Cornici inclinate misurate e raggruppate sui quattro angoli trasformati; maniglie grafiche con riferimento opposto e ridimensionamento proporzionale agli angoli, salvo Maiusc. Corrette conversione della scala delle immagini, trasformazioni/inverse dei nodi, ritaglio e offset del testo sul percorso. Contorni trasformati usati per la verifica di uscita dal foglio; l’inviluppo della penna è conservativo per evitare eliminazioni premature. I limiti di sicurezza restano attivi anche dopo la trasformazione. La riflessione non trasforma il testo in contorni o bitmap.

## Collaudo

Campione portatile `object-transforms.TEST.json/svg`, generatore `scripts/capture-editor-object-transforms.ts`. Il confronto automatico usa SVG di riferimento costruiti trasformando un’esportazione neutra, indipendentemente dalla scomposizione Fabric. Campioni e catture non certificano Adobe Illustrator: è necessaria un’ispezione umana di testo, contorni, maschere e misure.


- **1.076 unitari / 156 file**, log `.local/transform-unit-final.log`; tipi e build verificati. Ultimi cambiamenti successivi sono soltanto il posizionamento dei popup prima del primo disegno e lo stile delle X, ricontrollati nel browser.
- **270 casi browser distinti**, ricavati da 267 successi nella selezione estesa e 22 successi nel ricontrollo finale. Le due interruzioni della prima esecuzione riguardavano aspettative UI precedenti (cinque azioni dentro Livelli e chiusura di un popup già chiuso): adattati i percorsi, senza alzare timeout o ridurre controlli grafici. Log `.local/transform-browser-regression.log`, `.local/transform-browser-last.log` e riepilogo `.local/transform-browser-coverage.json`. Sei casi sui popup/master/livelli ricontrollati dopo il dettaglio visivo finale; non dichiarata una nuova esecuzione estesa dopo quel cambiamento.
- Dieci confronti grafici con SVG trasformati indipendentemente; 64 gesti sulle maniglie del testo inclinato/riflesso e 21 su forme/immagini, incluso il comando validato al rilascio. Separazione del testo da un cerchio inclinato preserva la trasformazione del percorso.
- Riprodotto separatamente un difetto nelle maniglie dopo l’uscita dal ritaglio: il set ripristinato mancava delle coordinate. Ora vengono ricalcolate prima del render; test dedicato negativo prima della correzione e positivo dopo, senza ignorare l’errore.
- **13 browser pubblici**, Worker `--dry-run`, runtime Worker/SQLite e controlli segreti superati. Il JavaScript pubblico rimane `index-BG2r_x-8.js`. Nessun deploy.
- **65 campioni JSON riaperti e riesportati in SVG**, senza errori browser, richieste esterne o caricamenti di font dalla libreria reale; log `.local/transform-artifacts-final.log`.
- Catture in `.local/group-member-capture/` e `.local/object-transforms-capture/`: API simulate, zero errori/richieste esterne/scritture. Lo script attende il ridisegno prima di rilevare le coordinate del canvas; l’aggancio di un trascinamento viene verificato prima del rilascio.
- Archivio reale letto dall’API ordinaria e da SQLite in sola lettura: R629, 339 template, due composizioni, 219 font, integrità `ok`. Nessun salvataggio dei campioni nel principale. Dati privati, screenshot e log non sono pubblicati su GitHub.

Non certificati Illustrator, trackpad/dispositivi fisici o equivalenza produttiva universale. I limiti dei profili restano quelli espliciti del documento e del prodotto. Le posizioni dei popup non sopravvivono al ricaricamento della pagina; restano conservate durante l’uso della stessa vista.
