# Ricerca nel menu dei font — 13 novembre 2026

Il menu corrente mostra le famiglie con anteprima e scelta da tastiera, ma non consente una ricerca visibile per nome. Con una libreria reale di oltre duecento file, lo scorrimento resta poco pratico.

Incremento: campo «Cerca font» nel popup dell’ispettore e della correzione caratteri, filtro locale sui nomi già disponibili, conteggio/nessun risultato, pulsante grafico per svuotare la ricerca. Conservare anteprime, varianti reali, file non ancora caricati disabilitati, stabilità di righe/scroll e scelta esplicita. Query nuova a ogni apertura; Escape annulla, frecce/Invio scelgono soltanto un file disponibile. Durante la composizione IME, Invio non deve confermare prematuramente.

Nessuna ricerca esterna o caricamento aggiuntivo dovuto alla digitazione. Nessun nome cercato salvato nel documento, nessun nuovo font del computer. Cambiare font usa l’attuale comando validato e conserva i comportamenti box/selezione di caratteri. Tastiera e touch, menu piccolo e assenza di risultati, caricamento ritardato, Undo e JSON/SVG da verificare su risorse TEST; archivio reale invariato. Nessun deploy o migrazione.

Riferimento semantico: [WAI-ARIA searchbox](https://www.w3.org/TR/wai-aria-1.2/#searchbox) e [controllo del discendente attivo](https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant); la verifica automatica non equivale a un collaudo umano con VoiceOver.

**Completato:** [funzione, campione e verifiche](iteration-editor-font-search.md). Ricerca locale nei due menu, popup ancorato anche sopra il pulsante, selezione parziale e comandi condivisi conservati. 1.200 unitari e 41 browser pertinenti passati; nessuna scrittura ai dati personali.
