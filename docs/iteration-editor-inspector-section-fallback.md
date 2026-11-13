# Geometria resta attiva dopo il fallback — 13 novembre 2026

Precisazione del titolare alla richiesta di mantenere la scheda dell’ispettore quando cambia l’oggetto: se la scheda non è disponibile e viene mostrata Geometria, questa diventa la nuova scheda attiva. Tornando a un oggetto compatibile con la vecchia scheda non si deve ripristinarla automaticamente.

Esempi verificati: Testo → rettangolo mostra Geometria → un altro testo mantiene Geometria; Ritaglio → testo mostra Geometria → immagine mantiene Geometria. Una scelta esplicita successiva (per esempio Ritaglio) viene mantenuta nei successivi cambi compatibili. Le schede disponibili per entrambi gli oggetti, come Riempimento tra due forme, restano attive normalmente.

`ObjectInspector.tsx` registra la scheda effettivamente mostrata nella memoria della vista durante il commit del layout, prima del disegno del pannello. Il fallback aggiorna anche lo stato locale, così non riemerge una preferenza precedente. Non cambia il documento, la revisione, la selezione di caratteri o i valori degli oggetti. Il rimontaggio per oggetto e la riconfigurazione delle maniglie continuano a isolare i rispettivi dati.

**Sei browser pertinenti passati**, compresi i due casi aggiornati sulla scheda persistente, con controllo di valori del testo, crop differenti, selezione/deselezione, proprietà proprie del destinatario e revisioni. Build/TypeScript passati. Log `.local/inspector-fallback-browser.log` e `.local/inspector-fallback-build.log`. Nessuna modifica a dati personali, negozio o chat pubblicata; nessun deploy.

## Esito del collaudo generale precedente

Prima di questa precisazione è terminata la suite del [collegamento dei profili](iteration-editor-production-profile-link.md) sul commit `41e196a`: **685/689 passati**, quattro falliti. Tre attese usavano ancora gli indici nativi PitchPrint 5/2 invece dei ranghi locali da 1 già richiesti e confermati dal titolare. Il quarto scenario separava un gruppo con proprietà del template usando implicitamente il ruolo cliente, invece della modalità amministrativa dell’importazione.

Aggiornate le sole attese dei tre casi e dichiarato il ruolo amministrativo nel quarto; lasciati intatti i confronti indipendenti dei pixel, geometrie, gerarchie e proprietà. Tutti e quattro passati nella successiva esecuzione di sei casi, insieme alla correzione della scheda. Non è una nuova suite generale verde sul codice successivo: l’esito originale resta registrato come quattro fallimenti. Nessuna logica dell’importatore o dei blocchi è stata cambiata per far passare quei test.

Durante il collaudo è stato anche preparato il [piano dei controlli geometrici](editor-production-geometry-plan.md). Il problema PDF dei font compressi, inizialmente risolto soltanto nel prototipo privato, è stato poi [corretto nel renderer applicativo](iteration-editor-pdf-font-preparation.md). I due casi dell’ispettore restano passati anche nel successivo gruppo di 13 browser pertinenti.
