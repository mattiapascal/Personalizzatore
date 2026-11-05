# Lettura degli handoff esterni — 5 novembre 2026

Percorsi forniti dall'utente, consultati in sola lettura:

- `/Users/davide/Documents/Shopify/Temi/Mode mio 5.2.0`
- `/Users/davide/Documents/Shopify/Preventivometro`

## Documenti e ordine di autorità

1. `MIGRAZIONE_MODE_5_2_0_HANDOFF.md`: letto per intero, 1.402 righe; aggiornamenti 24–27 luglio e storico delle integrazioni. La sua descrizione delle properties private più recente prevale sulle sezioni storiche che citano `Preview`/`File caricato` pubblici.
2. `Preventivometro/AGENTS.md`, `README.md`, `docs/PREVENTIVOMETRO_HANDOFF.md`: letti; il principale ha 914 righe. Distingue sorgenti canoniche, modello economico, mapping e input owned by BSS. Le parti finali aggiornano paragrafi precedenti rimasti come storico.
3. `FAQ_METAOBJECT_HANDOFF.md`: letti gli aggiornamenti iniziali e il flusso operativo/editoriale; fonte utile per distinguere FAQ dirette, da tag e gruppi, non specifica del futuro motore produttivo.
4. `MIGRAZIONE_MODE_5_2_0_PERSONALIZZAZIONI.md`: censite sezioni e lette quelle pertinenti a product form, varianti, PitchPrint, BSS/sovrapprezzi/accessori e costing. Registro molto ampio, non un nuovo mandato di migrazione.
5. `docs/TARGA_SUMMA_HANDOFF_TECNICO.md`: letto l'avviso iniziale di superamento parziale e i riferimenti; il corpo è storico. Non importate formule economiche o vecchi valori nel personalizzatore.

## Verifiche locali mirate

Stato Git senza fetch e senza scritture: tema `master...origin/master [behind 12]`; Preventivometro `agent/targa-mutoh-handoff...origin/agent/targa-mutoh-handoff`, nessuna modifica locale segnalata. Questo tracking può essere a sua volta datato: nessuna equivalenza con tema live dichiarata.

Conferme nel codice locale, non certificazioni live:

- `assets/product-costing-surcharge.js:12–13`: fallback dimensionali includono ancora `po_number_field926202/926203`, oltre a name generici. Gli handoff citano anche altri ID reali di test: non esiste un selettore universale da assumere.
- `assets/custom-scripts.js`: hook `bssFixSupportCustomExtraPrice`, `bssFixSupportCustomAttributeWhenAddToCart` e concatenazione degli originali; funzione `ppSyncCurrentVariantToPitchPrint`.
- Il registro personalizzazioni descrive l'invio dei tag prodotto all'iframe PitchPrint. Non trovato nei tre file ispezionati un significato esplicito di `No-AI`: resta da confermare con il titolare/PitchPrint.

## Decisioni per questo progetto

- Tre responsabilità separate: Personalizzatore (selezione/grafica), Preventivometro (regole economiche), tema (runtime storefront e bridge app).
- Niente copia del price bridge né delle formule di costo nell'assistente.
- Collegamento prodotto canonico senza autoapertura editor, parametri variante, opzioni o scritture carrello.
- Nella fase successiva, inventario delle integrazioni su snapshot corrente prima di progettare adapter reali. Test con click reale su tema duplicato solo dopo autorizzazione: gli handoff documentano bug non riprodotti dal solo FormData.
- Non riaprire i tre casi Mutoh già approvati per verosimiglianza; queste approvazioni non equivalgono a misure fisiche e non collaudano Illustrator.
- Il vecchio handoff Summa dice ancora che il runtime non è compatibile V2; il principale più aggiornato riporta invece runtime 2.0.0 pubblicato e testato a luglio. Registrare il conflitto cronologico, verificare lo stato attuale prima di ogni futura integrazione.

Non letti file `.env`, token o credenziali dei progetti esterni. Nessun loro script di pubblicazione o sincronizzazione è stato eseguito.
