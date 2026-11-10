# Nodi dei tracciati — piano locale

Estendere l’ispettore del tracciato con una sezione Nodi: selezione di un vertice, coordinate assolute X/Y in mm, inserimento del punto medio del segmento successivo ed eliminazione entro i limiti strutturali. Evidenziare nel canvas il nodo selezionato con una sovrapposizione di vista, esclusa da JSON/SVG. Modifiche live attraverso lo stesso `updateObject` validato, con undo e rifiuto delle revisioni obsolete.

La rinormalizzazione deve mantenere fermi i vertici non modificati, compresi i tracciati ruotati; conservare ID, angolo, chiusura e aspetto. Questo richiede un aggiornamento del riquadro e del centro calcolato dai nodi, distinto dal normale ridimensionamento che conserva il centro. Nessuna seconda scena o metadati geometrici duplicati.

Rischi da provare: spostare/eliminare un vertice estremo, inserire tra ultimo/primo in un poligono, tracciati aperti piatti, casi degeneri, soglia di 512 nodi, selezione conservata nello storico e sovrapposizione esclusa dall’export. Prima modifica numerica testabile; trascinamento dei singoli nodi e curve Bézier saranno incrementi successivi.

## Implementazione e prove mirate

Sezione Nodi nell’ispettore dei tracciati, selettore del vertice, X/Y assolute live, inserimento del punto medio e cancellazione. I minimi sono due nodi per una linea aperta e tre per un poligono; massimo 512. Ultimo nodo aperto senza segmento successivo: inserimento disabilitato. L’ultimo nodo chiuso usa il segmento verso il primo. I casi degeneri sono rifiutati e le modifiche incomplete ripristinabili con Esc.

`path-nodes.ts` converte i punti in coordinate globali e li rinormalizza nel sistema locale ruotato, conservando ID, angolo, chiusura/aspetto e tutti i nodi non modificati. Lo store riceve lo stesso `updateObject`. `useInspectorDraft.replaceObject` aggiorna il centro calcolato dai nodi; le dimensioni ordinarie conservano invece l’ancoraggio centrale già richiesto.

L’adapter evidenzia i nodi con una sovrapposizione della vista, dimensioni costanti sullo schermo e nodo scelto marcato in verde. Non sono oggetti del documento. La scheda mantiene disponibili le normali maniglie del tracciato: **il primo incremento numerico è stato seguito dal trascinamento descritto sotto**.

**308 unitari** e **2 browser mirati** superati: vertice estremo ruotato, altri vertici fermi, angolo conservato, punto medio, cancellazione, minimi, campo invalido/Esc, undo e identità dello SVG con/senza guide. TypeScript valido. **Suite completa dell’editing numerico superata: 308 unitari, 98 browser laboratorio, build e controllo segreti.** Il campione `path-nodes.TEST.json/svg` si genera con `node --import tsx scripts/capture-editor-nodes.ts`; Illustrator non collaudato.

Stato del primo incremento: verificato; soltanto sviluppo locale.

## Prossimo incremento: trascinamento del nodo scelto

Il pacchetto Fabric 7.4.0 già installato espone `controlsUtils.createPolyControls` (`node_modules/fabric/src/controls/polyControl.ts`): controllo di un vertice con posizione sul tracciato e ancoraggio degli altri punti. Riutilizzarlo per il solo nodo scelto nella scheda Nodi, mantenendo visibili gli altri come riferimenti. La scheda Geometria ripristina le maniglie ordinarie. Il rilascio deve trasformare la preview in un `updateObject` tramite `movePathNode`, con una revisione, Escape e annullamento atomici; campo/zoom/file sospesi durante il gesto. Verificare soprattutto rotazione, tracciato piatto, preview/commit e ripristino dei normali controlli.


## Trascinamento implementato e verifiche mirate

La scheda Nodi rende trascinabile il solo vertice scelto nel selettore: controllo verde Fabric nativo, altri vertici come riferimenti. La scheda Geometria ripristina tutti i controlli ordinari. `PathNodeControls` conserva/ripristina i controlli originali; `modifyPoly` produce solo una preview, il rilascio passa a `movePathNode` e al medesimo `updateObject`. Angolo e altri vertici conservati. Durante il gesto file/ispettore/zoom/cambio formato sospesi; Esc ripristina la scena senza revisione e senza chiudere il workspace.

**4 browser mirati superati**: 0°/30°/90°, incluso tracciato piatto che diventa un angolo, preview/commit sugli stessi punti, revisione unica, altre coordinate ferme, Esc, ripristino dei controlli e gesto nel workspace reale con azioni sospese/undo. TypeScript valido. **Suite completa superata: 308 unitari, 102 browser laboratorio, build e controllo segreti.**
