# Formati locali oltre un metro — 12 novembre 2026

Il cartello viario 1100 × 400 mm è bloccato dal limite tecnico del laboratorio, non da un vincolo produttivo. Estendere l’editor a 3000 mm per lato con limiti centrali, senza cambiare gli schemi della selezione/chat pubblicata.

1. Formato grafico locale distinto dal catalogo pubblico; dimensioni oggetti fino a 3000 mm, coordinate fino a ±10000 mm, font fino a 2000 pt e comandi coerenti. Conservare mm/pt, comandi manuali/AI e rifiuto atomico oltre limite.
2. Ispettori di oggetto/selezione/nodi, guide testo, targhe, profili e zone coerenti. Nessuna modifica di prezzi o associazioni commerciali.
3. Memoria del canvas limitata considerando anche DPR: massimo 8192 pixel per lato e 16 MP per superficie. Zoom massimo effettivo dipendente dal formato, stessi gesti e PAN. SVG serializzato senza allocare il bitmap della tavola intera; PNG conserva i limiti già presenti e segnala risoluzioni troppo grandi. Anteprime a risoluzione limitata.
4. Unitari su soglie, comandi, multipagina e budget; browser desktop/mobile con grandi formati, selezione, geometria, AI/Undo, zoom/PAN e SVG invariato dalle operazioni di vista. Campione JSON/SVG indipendente e confronto del cartello reale con font esatto. Nessuna importazione reale prima del confronto e del controllo capacità archivio.
5. Regressioni pertinenti e pubbliche, documentazione e Git sincronizzato. Nessun deploy; Illustrator da collaudare.

I due template con maschere sui testi ruotati rimangono in coda: la prima ispezione mostra clip path con skew e riflessioni, non normali ritagli delle immagini. Non rimuoverli per aggirare il blocco.

## Esito

[Incremento completato](iteration-editor-large-format.md): formati e font estesi, budget e serializzazione verificati, cartello reale importato con backup e riaperto. Restano il collaudo Illustrator e i blocchi specifici degli altri 26 sorgenti prioritari.
