# Ridimensionamento e maniglie esterne — 12 novembre 2026

Il controllo di accoppiamento fra larghezza e altezza è ora un’icona a catena, attiva per impostazione iniziale. Compare fra le due misure per testo ordinario, immagini, rettangoli, ellissi, polilinee, Bézier e vettori SVG. Disattivandolo si modifica un solo asse. Il diametro resta il parametro del cerchio, la lunghezza quello della linea.

## Comportamento

- Valori numerici: centro fermo, anche per oggetti ruotati. La catena collega le misure; non modifica posizione, font scelto, sorgente dell’immagine o contenuto.
- Angoli degli oggetti singoli: proporzioni mantenute; **Shift durante il trascinamento** permette scala indipendente degli assi, secondo l’ultima precisazione del titolare.
- Maniglie laterali/verticali: un solo asse, lato opposto fermo. Nessun cambio di origine centrale durante il gesto; lo stato canonico continua a usare le coordinate storiche esterne.
- Testi: agli angoli si scalano insieme corpo, stili locali, crenatura, spaziatura e contorno; l’altezza rimane automatica. Con larghezza fissa, il trascinamento laterale modifica il box e reimpagina; il trascinamento verticale cambia il corpo e compensa la dilatazione orizzontale per mantenere la larghezza. Nessun testo nascosto. I nuovi ridimensionamenti numerici normalizzano la scala verticale nel corpo del testo.
- Immagini: deformazione libera esplicita conserva i byte originali e registra il rapporto dei pixel visualizzati (`pixelAspectRatio`), già presente nel modello per i sorgenti legacy. Esteso anche il comando `transformObject`: senza un rapporto coerente il validatore continua a rifiutare dimensioni incompatibili.
- Cerchio: la deformazione non uniforme lo converte in ellisse con lo stesso ID e stile, tramite `transformObject` validato. Undo recupera il cerchio originale. Non si autorizzano cambi arbitrari di tipo mediante l’ispettore.

Gruppi e selezioni multiple mantengono la scala uniforme già collaudata; anche il testo su tracciato continua a scalare insieme alla guida. Non si introduce una deformazione approssimata di membri ruotati: l’eventuale estensione non uniforme di queste strutture richiede un modello affine dedicato. La catena di questo incremento riguarda gli oggetti singoli sopra elencati.

## Fuori dal foglio

Le maniglie che oltrepassano il foglio vengono disegnate su un livello DOM dedicato, nelle stesse coordinate di Fabric; il gesto rimane quello di Fabric. Nessuna dilatazione del canvas produttivo o compensazione delle coordinate del JSON. Disponibili anche il doppio clic laterale dei testi, zoom e PAN. Fuori dal viewport occorre traslare la vista, come per gli altri strumenti.

Gli oggetti completamente esterni restano nel documento durante apertura/importazione, inserimento, modifiche numeriche e ridimensionamento. Il controllo di composizione conserva misure finite, limiti delle coordinate e dell’ingombro. I controlli produttivi di margine rimangono distinti. SVG ritagliato al foglio anche quando conserva oggetti invisibili all’esterno nel progetto editabile.

Il gesto di trascinare **il corpo** dell’oggetto interamente fuori continua ad attivare il cestino e la cancellazione esplicita; trascinare una maniglia non cancella l’oggetto. Nessuna eliminazione/spostamento implicito per recuperare i due template archiviati con rettangolo esterno: quei documenti sono ora riapribili, ma il ripristino reale richiede ancora controllo della copia e backup, da svolgere nell’incremento successivo.

## Evidenze

**899 test unitari / 134 file**, build, schemi, scansioni segreti; **61 browser pertinenti completi**, più casi separati per importazione con oggetto esterno e zoom/PAN a tutto schermo. Ricontrollo finale delle tre maniglie esterne dopo l’uniformazione del colore. **51 campioni JSON/SVG**, **13 browser pubblici** e runtime Worker passati. Nessuna nuova suite browser generale o verifica Illustrator.

I log intermedi sono conservati: aspettative storiche aggiornate per distinguere fuori foglio e limiti tecnici; prova del PAN corretta impostando il focus sul canvas, senza sottrarre la barra spaziatrice ai campi numerici; un primo campione aveva la maniglia oltre il viewport, poi collocata nel margine visibile. Scala verticale implicita normalizzata, nessun fallback sui font.

Nuovo [sorgente TEST](../fixtures/illustrator/resize.source.TEST.json), [JSON riapribile](../fixtures/illustrator/resize.TEST.json) e [SVG](../fixtures/illustrator/resize.TEST.svg). Corpo misto e crenatura, testo ruotato a larghezza fissa, immagine deformata esplicitamente e rettangolo che supera il foglio. Modifiche manuali seguite da comando AI simulato, Undo/Redo e sorgenti conservati. Generatore `scripts/capture-editor-resize.ts`; schermata locale in `.local/resize-capture/desktop.png`, ispezionata.

Prossimi lavori autorizzati: box vuoti dei due cartelli viari multipagina; controllo/ripristino delle due copie con rettangolo esterno; ulteriori capacità che sbloccano i template prioritari. In coda l’audit/reimportazione delle eventuali copie multipagina ridotte in passato a pagina singola, secondo [piano aggiornato](editor-multipage-plan.md#task-di-coda-richiesto-il-12-novembre).

Archivi personali invariati in questo incremento: 298 template totali, 296 attivi e due in attesa; due composizioni, 219 font, revisione 584. Nessun deploy o intervento Shopify/PitchPrint/BSS/prezzi/acquisti; generazione immagini AI esclusa.
