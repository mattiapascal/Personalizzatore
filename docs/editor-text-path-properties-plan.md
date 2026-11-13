**Incremento completato e verificato il 14 novembre:** [risultati e limiti](iteration-editor-text-path-properties.md). Piano conservato come riferimento delle scelte.

# Proprietà del tracciato associato al testo — piano locale

Conservare separatamente dalla geometria i dati originali del tracciato (`editor`, `visible`) nel binding canonico del testo. I vecchi progetti senza metadati restano leggibili, senza migrazioni. Associazione/separazione usano i comandi esistenti, con stessa revisione, Undo/Redo e ID.

- Label, ordine, dati modulo e blocchi del tracciato non sostituiscono quelli del testo. Separando, tornano al tracciato. Non eliminare proprietà per superare lo schema stretto.
- Il cliente non può consumare un tracciato protetto aggirandone selezione/eliminazione/trasformazioni. I binding preparati dall’amministratore conservano i vincoli del componente: immutabilità dei metadati, protezione da eliminazione e da modifiche geometriche del percorso. Modifiche ai caratteri e scorrimento del testo non devono spostare un percorso bloccato.
- Visibilità originale conservata per il ripristino; mentre associato, Mostra tracciato è la scelta esplicita di visualizzazione della guida.
- Un tracciato Riferimento non trasforma il testo in riferimento. Se mostrato, resta visibile nel progetto e nei file/anteprime tecniche, separato dalla grafica produttiva; non deve apparire nei normali SVG/PNG/PDF/miniature. Le proiezioni devono conservare le misure tipografiche, senza font sostitutivi.
- Appunti, duplicazione, JSON, controlli B/N e chiavi delle anteprime rispettano questi dati. Nessuna scrittura agli archivi personali, deploy, nuova funzione multipagina o immagini AI.

Verifiche: proprietà/visibilità, customer/admin, comandi normali e tentativi tramite updateObject, trasformazioni e font, riferimento e separazione, legacy, export produttivo/tecnico anche PDF locale e campione TEST portabile. Build/schemi/segreti, regressioni editor e chat, poi sincronizzazione Git.
