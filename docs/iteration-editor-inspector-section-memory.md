# Scheda dell’ispettore mantenuta — 13 novembre 2026

Su richiesta del titolare, il cambio di oggetto conserva la scheda scelta nell’ispettore, quando disponibile anche per il nuovo elemento. Testo → Testo mantiene Testo; forma → forma mantiene Riempimento/Contorno; immagine → immagine mantiene Immagine/Ritaglio.

Precisazione successiva del titolare: se la scheda non esiste per il nuovo tipo, Geometria diventa la nuova scheda attiva e rimane tale nei cambi successivi. Testo → forma → Testo mantiene Geometria. Una scelta esplicita successiva sostituisce la scheda attiva. [Correzione e verifiche](iteration-editor-inspector-section-fallback.md). Anche deselezione e passaggio temporaneo alla selezione multipla non la azzerano. La preferenza appartiene alla vista corrente dell’editor; non è scritta nel documento o nell’archivio e non sopravvive al ricaricamento della pagina.

Il rimontaggio dell’ispettore per ID resta attivo: vengono conservati soltanto il nome della scheda, non bozze, valori, stili o selezioni di caratteri dell’oggetto precedente. Le modalità di ritaglio e i loro controlli vengono riconfigurate sul nuovo oggetto. Nessun nuovo comando grafico, dato produttivo o migrazione aggiuntiva.

## Verifiche della versione iniziale

I risultati seguenti precedono la precisazione sul fallback; per il comportamento attuale e i ricontrolli usare il resoconto collegato sopra.

- Due nuovi casi browser: testo/forma, valori del font propri del nuovo oggetto, applicazione del colore al solo destinatario, fallback, deselezione/selezione multipla senza revisioni; due immagini con ritagli differenti, aggiornamento dei valori e delle maniglie, ritorno dal testo e sorgente pixel immutabile.
- **35 browser pertinenti passati**, comprendenti gli altri test di ispettore, ritaglio, gruppi e tastiera. Il primo tentativo del test immagini leggeva lo stato prima che il caricamento della fixture fosse concluso: aggiunta l’attesa del documento completo, senza cambiare timeout o codice applicativo per mascherare il problema.
- Verifica sul vero template **Azienda tecnologia**, in sola lettura: selezionati `pp-1`…`pp-4` mantenendo Proprietà template, valori **1, 2, 3, 4**; documento invariato e zero errori, richieste esterne o scritture. Cattura privata `.local/pitchprint-form-order/inspector-real/properties-retained.png` ispezionata.
- Con il precedente [incremento sugli ordini PitchPrint](iteration-editor-pitchprint-form-order.md), **49 browser pertinenti distinti** verificati nelle due esecuzioni. **1.089 unitari / 157 file**, build/tipi e schemi superati per il nuovo contratto; successivo cambiamento soltanto di stato della vista, coperto dalle prove browser.
- Controlli finali superati: **13 browser pubblici**, **65 campioni JSON/SVG** senza errori o richieste esterne, runtime Worker/SQLite e scansioni dei segreti dei due bundle. Pacchetto Worker verificato con `--dry-run`; JavaScript pubblico invariato (`index-BG2r_x-8.js`). Nessun deploy o modifica al negozio.

Log `.local/inspector-section-regression.log`, `.local/inspector-section-types.log`, `.local/inspector-section-build.log` e `.local/pitchprint-form-order/inspector-real/report.json`. Gli altri controlli di consegna sono riportati nello stato locale. Non è un nuovo collaudo umano Illustrator.
