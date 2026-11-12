# Originali PitchPrint recuperati senza fallback alla preview — 13 novembre 2026

L’adattatore recupera l’indirizzo degli originali mancanti quando il vecchio sorgente contiene soltanto `src` in `https://pitchprint.io/lowres/`, con identificatore immagine legacy di 32 cifre esadecimali minuscole ed estensione PNG/JPG/JPEG. Il rapporto con `assets/<basename>` è osservato nel codice pubblico originale e verificato sui file recuperati. Nessuna condizione sul titolo o sull’ID del template, modifica del sorgente o cambio del motore grafico.

Il file originale viene richiesto, verificato, decodificato e passato alla mappa pixel/mm già esistente. Mancanza, corruzione, ritaglio invalido o limiti superati bloccano la conversione. Non si richiede né si usa la preview come ripiego. Una `url` esplicita continua a prevalere; miniature, altri host, credenziali, porte, query, frammenti e indirizzi legacy non riconosciuti non autorizzano il recupero. I file incorporati e gli originali già dichiarati mantengono il comportamento precedente.

Il rapporto amministrativo registra il recupero e l’indirizzo originale. La copia canonica conserva i byte nei normali oggetti immagine: nessuna nuova dipendenza da PitchPrint per riaprirla, nessun formato parallelo. Cropping frazionario, rotazione, riflessioni, gruppi, manuale/AI, Undo e JSON/SVG usano gli stessi comandi e controlli.

## Verifiche

Due test unitari aggiunti alle prove delle immagini: indirizzi ammessi e rifiuti, priorità dell’originale esplicito, sorgente immutabile. Due browser aggiunti: confronto Canvas2D indipendente con originali 64×48 e preview TEST intenzionalmente diversa 16×12; crop frazionario, gruppi/riflessioni, identità dei byte, manuale/AI/Undo e JSON. Prova del client amministrativo reale con una sola richiesta per lo stesso originale riusato, errore 404 e dati corrotti: vecchia anteprima convertita rimossa, nessuna copia salvabile, zero richieste alla preview o scritture d’archivio.

**957 test unitari in 144 file, 51 browser pertinenti e 59 campioni** passati; build TypeScript/laboratorio e pacchetto Worker dry-run passati. **13 browser pubblici**, schemi e scansioni segreti passati. Bundle pubblico invariato `index-BG2r_x-8.js`. Non una nuova suite generale: la baseline precedente comprendeva 630 scenari distinti verificati fra esecuzione e ricontrolli.

[JSON](../fixtures/illustrator/recovered-originals.TEST.json), [SVG](../fixtures/illustrator/recovered-originals.TEST.svg), [sorgente TEST](../fixtures/illustrator/recovered-originals.source.TEST.json). Generatore `node --import tsx scripts/capture-editor-recovered-originals.ts`: usa solo i byte sintetici del relativo helper, mai la rete per gli indirizzi TEST. Tre immagini, un gruppo, nessun font; cattura ispezionata, zero errori, richieste esterne o scritture personali. Illustrator da collaudare.

## Server di sviluppo: validatori rimasti in memoria

La prima preparazione reale dopo l’estensione ha rilevato nel servizio font una vecchia istanza del validatore JSON, ancora contraria ai vettori senza pittura. L’errore riportava il vecchio messaggio «Vettore non normalizzato, degenere o invisibile» sui due record appena aggiunti. I file erano già validi per il codice corrente; nessuna modifica o ripetizione dei salvataggi.

Confermata la fine di tutte le scritture, arrestato il solo Vite principale e riavviato con `npm run dev -- --strictPort`, Node 24 e heap massimo 4 GiB. JSON, font e ambiente SQLite separato conservati. Nuove letture reali e riapertura/cache delle due etichette passate, SHA archivio ancora `e214d2f51ccee7c47f349b1fa81b955b0e1e76b13841ea15aa61b2dfc3013b0f`.

**Procedura operativa:** dopo modifiche a schemi/validatori condivisi con il backend, non affidarsi soltanto all’HMR del browser. Attendere la fine delle scritture, riavviare il server locale e verificare via HTTP lettura dei record e risoluzione font prima di altre importazioni. Non è stato introdotto un riavvio automatico che possa interrompere un salvataggio. I test con store isolati non provano che un vecchio server residente abbia ricaricato tutte le dipendenze.

## Quattro cartelli importati

L’importatore ordinario, sui sorgenti originali immutati, prepara i quattro Passo Carrabile: 40×60 cm e 25×45 cm, con/senza stemma. Originali JPEG/PNG e stemma conservati; riferimenti nativi completi e produttivi con **zero pixel oltre soglia**, errore medio massimo **0,000128/255**. Nessuna soglia aumentata. Le dimensioni fisiche nel documento rimangono in mm. Rapporti e byte verificati in `.local/pitchprint-migration/recovered-originals-prepared/`.

Salvate tutte e quattro con backup verificato: **revisione 623 → 627**, **337 template attivi, due composizioni e 219 font**. Conservati record precedenti, font, impostazioni, profili e priorità tag; nessuna sovrascrittura o associazione prodotto. Quattro riaperture e miniature/cache passate, schermate ispezionate; zero letture dei record al secondo passaggio, zero errori o scritture durante il controllo. Rapporti e backup in `.local/pitchprint-migration/recovered-originals-local-import/`.

Backup SHA `e214d2f51ccee7c47f349b1fa81b955b0e1e76b13841ea15aa61b2dfc3013b0f`, archivio finale SHA `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb`. Audit: **16 prioritari rimasti**, 112 a bassa priorità e otto esclusi Templates PitchPrint.

Il JSON principale misura **535.456.964 byte (circa 510,7 MiB)**, vicino al limite operativo di 512 MiB; margine residuo circa 1,35 MiB. Il Node 24.17.0 in uso espone `MAX_STRING_LENGTH = 536870888` unità UTF-16: alzare semplicemente il limite del JSON non risolve la lettura monolitica dominata da base64 ASCII. Per il lotto successivo aggiornare la copia efficiente già predisposta, confrontare contenuti/chiavi miniature e rollback con la revisione corrente, senza attivarla o sostituire il JSON principale implicitamente. Nessun deploy, modifica commerciale, migrazione o attivazione SQLite. I sette primi piani delle etichette restano in attesa della classificazione richiesta al titolare; nessun font sostitutivo introdotto per gli altri casi.
