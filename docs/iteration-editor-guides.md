# Griglia e agganci — 8 novembre 2026

## Piano dell’incremento

Aggiungere griglia opzionale e agganci durante il trascinamento a griglia, bordi e centri del foglio e delle altre unità. Guide temporanee di allineamento; Alt sospende l’aggancio. Tolleranza costante in pixel visibili, convertita in millimetri in base allo zoom. I gruppi si muovono come unità.

Assunzioni: guide e impostazioni sono solo vista, non oggetti del documento o dati produttivi. Nessun cambiamento di revisione quando si attivano; JSON/SVG devono rimanere identici. Lo spostamento risultante passa agli stessi comandi validati esistenti. Nessun aggancio nascosto su valori dell’ispettore o comandi AI. Griglia nominale 1 mm, configurabile nel laboratorio; densità della griglia visuale limitata per non rallentare formati grandi.

Verifiche: priorità e tolleranza deterministiche; zoom; gruppi, Alt ed Esc; nessuna guida nei file; nessun reset dello stato di scrittura; controlli desktop/mobile. Non si aggiungono righelli, guide personali persistenti o nuove regole produttive in questo incremento.

## Implementazione e prove

Nuovi controlli a icone nel pannello Oggetti: Mostra griglia e Aggancia alla griglia e agli oggetti, con passo nominale in mm. Entrambi spenti per default. Il calcolo usa il centro dell’ingombro per la griglia e bordi/centri delle altre unità e del foglio; a parità di distanza privilegia il riferimento geometrico rispetto alla griglia. Un gruppo viene considerato come una unità. Tolleranza 6 pixel CSS, convertita in mm secondo lo zoom; Alt sospende gli agganci durante il gesto.

La preview viene aggiornata dopo aver ricalcolato le coordinate Fabric nell’evento `object:moving`, che altrimenti può precedere l’aggiornamento dei limiti. Il rilascio continua a inviare `moveObject`/`moveObjects` con revisione validata. Le metriche delle unità sono memorizzate soltanto durante la vista della stessa scena per non ricreare tutti gli oggetti ad ogni movimento. Guide temporanee rimosse al rilascio/Esc/render canonico. Disegno della griglia limitato nella densità, rispettando la sagoma tonda; nessun oggetto guida nella scena.

Verifiche mirate superate: sei unitari sul calcolo, quattro browser per oggetto/gruppo, Alt e tolleranza a zoom 100%/400%. Provata uguaglianza completa di documento e SVG prima/dopo attivazione della griglia. `npm run capture:selection -- --guides` produce soltanto anteprime, senza riscrivere i campioni JSON/SVG; ispezionare `editor-guides-{desktop,mobile}.png`. Nessun costo AI o accesso al negozio. Le impostazioni non persistono dopo il reload.


Regressione completa dopo entrambi gli incrementi: `npm run check` superato con **266 unitari, build, controllo segreti e 75 browser laboratorio**. Nessuna modifica ai file pubblici; nessuna pubblicazione.
