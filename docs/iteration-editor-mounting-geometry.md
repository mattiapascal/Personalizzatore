# Fori e rispetto dei fissaggi nel controllo visuale — 13 novembre 2026

Il controllo **Controlla margini e zone**, nel profilo tecnico della pagina, ora analizza anche i fori scelti nella configurazione della targa. Riutilizza i punti di `plaqueMountingPoints`, le dimensioni attuali della pagina e la pittura effettiva del documento. I kit soltanto elencati nel profilo non generano ostacoli; incollaggio e staffe non generano fori. I fuoriporta mantengono le sole disposizioni a due punti.

## Dati fisici e comandi

In **Misure e fissaggio → Misure tecniche dei fissaggi**, amministratore e modalità TEST possono compilare il diametro reale e la distanza extra di rispetto dal bordo del foro. Sono campi svuotabili: vuoto/null significa dato mancante, zero è esplicito per il rispetto. Una digitazione numerica incompleta non azzera/cancella una misura nota; la cancellazione intenzionale del campo la riporta a dato mancante.

Il diametro era già nel documento; `plaque.clearanceMm` è opzionale e non viene aggiunto ai progetti precedenti. Non sono stati scelti diametri o distanze per i prodotti reali. Il campo richiede una misura verificata dall’amministratore: non si ricava dal simbolo visualizzato o dal nome «Midi/Maxi».

`configurePlaque` rimane l’unico comando per UI e simulazione AI, con revisione, validazione, copie e Undo/Redo. Il cliente può cambiare metodo, schema, distanze dal bordo e formato; non può cambiare direttamente diametro/rispetto tramite comando. Formato e disposizione conservano i valori fisici. Un cambio di metodo invalida i dati tecnici precedenti: fino al collegamento dei kit reali non possiamo attribuire a un accessorio il diametro dell’altro. Per assegnare nuove misure si sceglie prima il metodo, poi si compilano i campi in amministrazione.

## Diagnostica e vista

- Per ogni foro attivo ci sono due regole: disco del foro e disco di rispetto, con raggio `diametro/2 + extra`. Il secondo include anche il foro. Con quattro fissaggi sono otto regole; con le venti zone del profilo e il margine, il report ammette fino a 29 regole per pagina.
- Diametro mancante → dimensione sconosciuta per entrambe le regole. Diametro noto/rispetto mancante → foro verificabile, rispetto non configurato. Non si producono cerchi presunti o risultati positivi sui dati assenti. Senza profilo collegato il controllo rimane non configurato, come prima.
- Riutilizzata la scansione a passi di 0,025 mm, con i limiti di risorse dichiarati: vuoti, alpha, maschere, riferimenti, livelli nascosti e ordine di pittura non diventano rettangoli pieni. Tangenza/antialias conservano l’esito incerto. Il backend ripete il controllo sui byte del documento e produce lo stesso report del client.
- Margine e zone meccaniche condividono al massimo due renderer: sfondo pieno esentato dal solo margine delle targhe stampate; sfondo incluso nel controllo dei fori/rispetto. La sovrapposizione è una segnalazione diagnostica, non un nuovo blocco produttivo.
- Nella vista, il cerchio tratteggiato esterno compare soltanto con diametro e rispetto definiti. **Mostra sul canvas** usa la localizzazione generica esistente. Modificare il progetto invalida il report e rimuove il punto precedente.

Le zone di rispetto non entrano in SVG/PNG/miniature o nei livelli dei riferimenti tecnici. Gli stessi output risultano identici cambiando il solo rispetto; nei riferimenti restano i simboli fisici già previsti. Il PDF usa il medesimo esportatore SVG: nessuna nuova prova PDF o Illustrator è dichiarata in questo incremento. Il controllo resta diagnostico; conferma atomica, lavorabilità dell’incisione, kit reali e prezzi restano da completare.

## Campione e verifiche

Aprire il [laboratorio](http://127.0.0.1:5173/editor?workspace=1), usare **Riapri progetto JSON** e il [campione TEST](../fixtures/illustrator/mounting-geometry.TEST.json). Contiene una targa 100×60 mm con quattro fori e un profilo dimostrativo incorporato; nessuna di queste misure è una specifica assegnata al catalogo reale. Modificare i campi tecnici nel pannello della targa e avviare il controllo dal profilo. [SVG produttivo separato](../fixtures/illustrator/mounting-geometry.TEST.svg), con sole risorse font OFL TEST. Il generatore `scripts/capture-editor-mounting-geometry.ts` controlla stato/risorse invariati e richieste/scritture; catture desktop/mobile ispezionate in `.local/previews/editor-mounting-geometry-*.png`.

- **1.236 unitari / 177 file passati**, dodici nuovi casi per regole fisiche, dati mancanti/zero, ruoli, cambio metodo, due formati, tangenze, riquadri, cache e persistenza. Roundtrip, sostituzione, duplicazione e riapertura su JSON/SQLite temporanei; nessuna migrazione. Log `.local/mounting-geometry-all-units.log`.
- **45 browser pertinenti distinti passati**: otto nuovi dei fissaggi, sedici dell’analisi geometrica, tredici della localizzazione e otto dei flussi preesistenti di targhe/profili/miniature. Log `mounting-geometry-browser-final.log`, `mounting-geometry-browser-accepted.log`, `mounting-geometry-browser-delivery.log`, `mounting-geometry-regressions.log`. Gli otto casi nuovi sono stati ricontrollati dopo la correzione dei campi numerici incompleti. Non è una nuova esecuzione della suite browser generale.
- **75 campioni JSON/SVG riaperti/esportati**, zero errori, richieste esterne e caricamenti di font personali (`mounting-geometry-artifacts.log`); il verificatore controlla anche i dati della targa conservati nel progetto.
- Build/tipi, schemi generati e catture passati (`mounting-geometry-final-build.log`, `mounting-geometry-schemas.log`, `mounting-geometry-capture.log`). I sei schemi del documento/configurazioni incorporano il campo opzionale; nessuna modifica al codice commerciale.

**13 browser pubblici passati**, build pubblica e scansioni dei segreti locale/pubblica passate (`mounting-geometry-public-tests.log`, `mounting-geometry-public-build.log`, `mounting-geometry-secrets.log`, `mounting-geometry-public-secrets.log`). JavaScript della chat invariato `index-BG2r_x-8.js`.

Archivio personale letto in sola lettura, invariato a **SQLite R638, 346 template, due composizioni, 219 font di cui 218 attivi e un profilo** (`mounting-geometry-archive.json`). Nessuna importazione, sostituzione di font o modifica ai progetti personali. Nessun deploy o intervento su negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout. Roadmap ancora aperta.
