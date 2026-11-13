# Due cartelli con testo mascherato importati — 13 novembre 2026

Dopo l’[attivazione autorizzata di SQLite](iteration-editor-sqlite-activation.md), completata l’importazione locale delle due versioni di **Esiste la morte dopo la vita?**, a **250 × 125 mm** e **300 × 200 mm**. Titoli locali distinti con il formato; originali PitchPrint conservati. Entrambi hanno il tag **Da verificare**, senza associazioni prodotto o variante e senza certificazione produttiva.

## Grafica e riferimenti

Ogni composizione conserva nove testi editabili, l’immagine originale e sei maschere testuali. Colori, geometrie e file del font ITCErasStd-Bold sono identici alle [copie confrontate con il runtime originale](iteration-editor-pitchprint-text-masks.md). Nessun nuovo font, fallback, raster del testo o regola nel renderer legata al nome del cartello.

La sagoma bianca, il suo contorno e i fori rappresentano il supporto fisico. Sono stati classificati come **sfondo di riferimento**, secondo la separazione già concordata: sotto la grafica nell’editor e nelle miniature tecniche, esclusi dallo SVG produttivo e conservati nella tavola SVG con riferimenti. Il primo sorgente li conteneva fra gli oggetti ordinari, il secondo nel background vettoriale. Il collegamento allo sfondo è configurazione iniziale dell’importazione; le proprietà del gruppo vengono applicate dal comando canonico `setGroupProperties` in modalità amministrativa. ID e oggetti originali rimangono invariati.

Confronti indipendenti in Fabric 3.4.0, stesso font e immagine originali, senza rete:

- **250 × 125:** produzione zero pixel oltre soglia 24/255, errore medio 0,00042/255; tavola completa zero oltre soglia, media 0,00694/255.
- **300 × 200:** produzione zero oltre soglia, media 0,0000735/255; tavola completa zero oltre soglia, media 0,00423/255.

Per il riferimento produttivo vengono esclusi soltanto gli elementi nativi del supporto; per quello completo rimangono tutti presenti. Nessuna tolleranza aumentata. I 12 testi mascherati superano il controllo dell’inchiostro, senza falsi avvisi. Il verificatore iniziale non preparava i pixel prima di creare il DocumentStore: aggiunta la preparazione dal modulo corretto, mantenendo il rifiuto delle risorse non pronte. I due fallimenti del solo helper sono conservati.

## Salvataggio e verifiche effettive

Backup SQLite nativo completo prima dei due comandi `importPitchprintTemplate`, con identità HTTP e revisione come precondizioni. **627 → 628 → 629**, due nuovi record e nessuna sovrascrittura. Confrontati checksum e metadati di tutti i 339 record precedenti, tutti i 219 font e risorse, impostazioni e profili; ordine preesistente dei tag conservato. Il JSON originale resta invariato.

Riaperti entrambi i record attraverso il vero editor: oggetti, gruppi, font e collegamento allo sfondo uguali alle copie preparate. Ogni SVG produttivo contiene nove nodi testo editabili, un’immagine e le maschere; la tavola tecnica contiene lo sfondo prima del livello produttivo. Nessun avviso font o testo nascosto. Due passaggi sulle miniature amministrative: nel secondo nessuna lettura dei record. Zero errori browser, richieste esterne o scritture durante la verifica finale; schermate ispezionate. Illustrator da collaudare.

Questa è un’importazione di dati su funzionalità già verificate: nessun cambiamento al codice applicativo o nuova suite generale. Rimane il checkpoint del commit precedente: **1.041 unitari, 225 browser pertinenti, 13 pubblici e 63 campioni**. In questo incremento sono stati eseguiti i nuovi confronti completi dei due cartelli, il salvataggio/rilettura, gli export, le miniature e l’ispezione integrale SQLite.

Rapporti privati: `.local/pitchprint-migration/text-mask-templates-prepared/report.json`, `text-mask-templates-local-import/{report,verification}.json`; backup in `text-mask-templates-local-import/backup-r627/archive.sqlite`. Log `.local/text-mask-templates-{preparation-checked,backup,import,reopen,integrity}.log`. Grafica/font privati esclusi da Git.

## Stato e seguito

Principale **SQLite R629, 339 template, due composizioni e 219 font**, **92.991.488 byte (88,7 MiB)**; 297 risorse uniche. JSON logico ricostruito 539.727.002 byte, ora oltre 512 MiB: non rientra nel vecchio lettore monolitico. Il piano di ritorno al checkpoint R627 è quindi storico e rifiuterebbe i nuovi dati; per il ripristino conservare il backend SQLite e i suoi backup verificati, senza cancellare il registro o riaprire il vecchio JSON.

Censimento aggiornato `.local/pitchprint-migration/remaining-current-after-text-mask-import.json`: **14 prioritari rimasti**, sette primi piani da classificare, sei casi di simboli mancanti nei font originali e Gloria Hallelujah 700. Restano separati 112 sorgenti a priorità bassa e otto esclusi della categoria Templates PitchPrint. Nessun deploy o modifica commerciale, chat pubblicata preservata.

Nuova richiesta attiva del titolare: selezione di un singolo oggetto dentro un gruppo dai livelli e/o con Ctrl+clic. L’attuale selezione espande il gruppo, quindi servono un ambito esplicito e controlli condivisi per modificare un membro senza separare o alterare gli altri; non ancora implementato in questo checkpoint.
