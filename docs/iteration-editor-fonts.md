# Font locali — piano

Superare il solo Arial con un piccolo catalogo esplicito di famiglie già installate sulla macchina di sviluppo: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana e Trebuchet MS. File individuati nelle cartelle di sistema macOS; nessuna copia, distribuzione, embedding o download di font. Le famiglie devono restare installate anche sulla postazione Illustrator. Font personalizzati/web e relative licenze restano successivi.

Il selettore nell’ispettore segue la stessa distinzione già richiesta: box selezionato modifica l’intero testo, intervallo selezionato modifica soltanto quei caratteri. Nome nel documento, metriche reali Fabric, stesso `updateObject`, JSON e SVG con testo editabile. Il vecchio v1 rimane limitato ad Arial; il documento v2 ammette la nuova lista.

Verificare disponibilità tramite confronto delle metriche con diversi fallback generici; `document.fonts.check()` da solo non dimostra la presenza di un font di sistema. Scelte non disponibili disabilitate e errore esplicito se una risorsa del progetto non è presente, evitando un export con sostituzione silenziosa. Testare stili misti, accenti, conservazione del centro, altezza automatica e import/undo. Il collaudo Illustrator resta umano.

## Implementazione e prime prove

Famiglie ammesse nel v2 sia nel testo base sia nei run dei caratteri. L’ispettore offre il selettore, stato Misto e scelte mancanti disabilitate; modifica globale o selettiva usa gli stessi comandi già presenti. Prima di misurare/renderizzare, l’adapter verifica i font base e degli intervalli; un font mancante blocca il comando/importazione senza alterare scena e redo. V1 resta limitato ad Arial.

`fonts.ts` confronta tre stringhe (anche con accenti) e tre fallback generici con Canvas 2D, cache per documento browser. È una verifica di disponibilità della famiglia, non una certificazione di tutti i glifi o varianti. `node --import tsx scripts/check-editor-fonts.ts` ha confermato **tutte le sette famiglie presenti** nella macchina/macOS e una famiglia inesistente assente, senza richieste esterne.

**302 unitari** e **5 browser mirati** superati: golden storico, stili selettivi e box; font sul testo intero con centro conservato, font su cinque caratteri, selezione e stato Misto conservati, sostituzione globale che rimuove soltanto gli override del font, accenti, SVG `<text>/<tspan>`, JSON e undo. Nessuna richiesta di file font. Schemi aggiornati, TypeScript valido. **`npm run check` completo superato: 302 unitari, 96 browser laboratorio, build e controllo segreti.**

Campione `fonts.TEST.json/svg` generato con `npm run capture:inspector -- --fonts`, base Georgia e intervalli Times New Roman/Courier New, box 30 mm e altezza automatica. Font non incorporati. **Illustrator non collaudato.** Il laboratorio richiede Arial per la bozza iniziale; non è stata verificata una macchina priva di quella famiglia.

Stato: incremento verificato e anteprima desktop ispezionata; nessuna chiamata esterna, dipendenza nuova o modifica online.
