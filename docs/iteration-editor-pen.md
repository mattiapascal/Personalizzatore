# Penna poligonale — piano locale

Riutilizzare `path` per costruire un tracciato cliccando i vertici nel canvas, oltre al pennello e alle forme predefinite. Anteprima tra ultimo punto e cursore; Maiusc vincola l’angolo a 45°, Alt sospende gli agganci. Invio/doppio clic termina aperto; clic sul primo punto con almeno tre vertici oppure un comando dedicato chiude. Backspace rimuove l’ultimo vertice, Esc annulla l’intera costruzione senza revisioni.

Una sola revisione al completamento tramite `addObject`, stessa geometria e validazione del tracciato. Massimo 512 punti, niente punti consecutivi troppo vicini o aggiunta doppia sul doppio clic. Pulsanti grafici Termina/Chiudi/Annulla nella barra dell’area di disegno per uso senza tastiera. Zoom/file/cambio formato sospesi durante la costruzione; toolbar fuori dal fieldset sospeso. Nessuna modifica di layout che sposti il canvas al primo clic.

Prove previste: tracciato aperto e chiuso, vertici e spessore, minimi, Maiusc/Alt/agganci, doppio clic, rimozione vertice, Esc nel workspace, storico/JSON/SVG e limite dei punti. Le curve Bézier restano un incremento distinto.

## Implementazione e prove mirate

Pulsante Disegna tracciato per punti, preview transitoria con primo nodo marcato, angoli a 45° con Maiusc e agganci condivisi con le primitive (Alt li sospende). Completamento aperto con Invio/doppio clic/pulsante, chiuso con clic sul primo nodo entro 8 pixel, Maiusc+Invio o pulsante. Due punti minimi aperti, tre chiusi; distanza minima di due pixel fra nodi consecutivi, massimo 512. Il secondo mouse-down del doppio clic è ignorato; Backspace elimina l’ultimo vertice, Esc o pulsante annulla tutto.

La barra Termina/Chiudi/Annulla compare già all’attivazione dello strumento e rimane disponibile durante la costruzione, mentre file, zoom e formato sono sospesi. Il contatore ha larghezza riservata: il canvas non si sposta al primo clic. Preview e marcatore sono esclusi dall’export. Solo il completamento produce `addObject` con la revisione iniziale e la stessa geometria `path`, senza nuovi comandi o formati.

**8 browser mirati superati**: aperto/chiuso in tre modi, doppio clic senza nodo duplicato, Backspace, clic degenere, Esc nel workspace, posizione del canvas stabile, aggancio iniziale e Maiusc, 512 nodi/revisione iniziale, export senza marcatore e undo. TypeScript valido. **Suite completa superata: 308 unitari, 110 browser laboratorio, build e controllo segreti.** Anche **13 browser della chat pubblica eseguiti localmente** superati prima dell’incremento; file pubblici/backend/tema preservati.

Campione `pen.TEST.json/svg` generabile con `node --import tsx scripts/capture-editor-pen.ts`: polilinea a quattro vertici e triangolo disegnati tramite UI. Illustrator non collaudato.

Stato: incremento verificato e campione generato; solo locale.
