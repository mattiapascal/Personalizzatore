# Fedeltà dei contorni grandi — 12 novembre 2026

Tre sorgenti prioritari ancora sospesi contengono la stessa cornice arrotondata: «20x30», «Modello» e la versione ruotata «30x20», categoria Cartello metallico personalizzabile. Il confronto corrente classifica rispettivamente 1,43%, 1,43% e 2,37% dei pixel di grafica come differenti, pur con errore medio piccolo. Non importarli usando soglie più larghe.

1. Riprodurre sul codice corrente e isolare trasformazione fisica, precisione dell’espansione e campionamento del riferimento. Contorno analitico indipendente mediante normali della curva originale, senza usare l’importatore o il motore dei contorni per costruirlo.
2. Correggere la causa dimostrata. Preservare geometria e vincoli canonici; manuale/AI, Undo/Redo, JSON/SVG e font rigorosi. Non mediare i due assi del tratto per farli sembrare uguali.
3. Campione sintetico con cornici grandi ruotate e pagina dagli assi arrotondati; prove fisiche e confronti indipendenti. Controllare tutti i contorni esistenti e le immagini/multipagina.
4. Solo dopo fedeltà verificata, preparare nuovamente i tre sorgenti interi, controllare capacità residua, backup e importazione locale idempotente. Non sovrascrivere record presenti o perdere riferimenti del supporto.
5. Regressioni appropriate, documentazione ed evidenze, sincronizzazione Git. Archivio JSON attivo a revisione 618; SQLite separato non si attiva. Nessun deploy o modifica commerciale; Illustrator resta umano.

Esito: causa individuata nella riduzione del confronto, non nella geometria. Implementata media RGBA esatta con alpha anche nel PNG mascherato, cache selettiva, prova analitica e controllo di difetti deliberati. Tre sorgenti importati con backup, 260 regressioni pertinenti complete e repository da sincronizzare: [rapporto](iteration-editor-contour-fidelity.md).
