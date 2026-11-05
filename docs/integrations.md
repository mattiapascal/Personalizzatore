# Confini e conferme necessarie

## Stato verificato in questa iterazione

Shopify connesso al dominio atteso, piano Basic. Letti soltanto metadati negozio, risultati di ricerche circoscritte, dettagli di tre prodotti e `Product.onlineStoreUrl`. URL canonici restituiti dall'Admin API, non emessi dal modello. Nessuna mutazione, installazione app, login CLI con nuovi permessi, intervento sul tema, test carrello o ordine. HTTP diretto alle pagine limitato con 429: la raggiungibilità reale tramite browser cliente rimane da ricontrollare. Non ripetuti tentativi automatici.

Le fixture sanitizzate sono in `fixtures/products/shopify-stamps.TEST.json`: prodotto/variante, titolo, handle, URL, tag e nominali. Prezzo e disponibilità deliberatamente null. Le quantità inventario lette non autorizzano deduzioni di disponibilità; stato ACTIVE e URL non garantiscono acquistabilità. Il listino Admin non coincide necessariamente con il prezzo storefront, che può comprendere sovrapprezzi.

## Impatto degli handoff aggiunti dall'utente

Letti l'handoff principale del tema (aggiornamenti fino al 27 luglio 2026), l'handoff principale Preventivometro (24 luglio), le sezioni FAQ e le parti del registro personalizzazioni pertinenti a product form, PitchPrint/BSS e prezzi. Consultato l'avviso di superamento del vecchio handoff tecnico Summa. Mappa e limiti della verifica in `docs/handoff-review.md`.

| Confine | Fonte / conseguenza |
|---|---|
| Prezzo timbri | `custom.sovrapprezzo`, accessori e add-on BSS nel tema. Non usare prezzo variante base per un preventivo dell'assistente |
| Fonte economica targhe | Preventivometro: motori canonici, configurazione V17 e contratto 2.0.0. Non duplicare formule in questo progetto |
| BSS online | Hook concatenati e properties necessarie alla trasformazione; non rimuoverle né riscriverle |
| Foratura targhe | Nel runtime dinamico selezione e sovrapprezzo appartengono a BSS; niente doppio conteggio nel Preventivometro |
| PitchPrint | Select OptionX stabili, sincronizzazione prima dell'apertura, properties private e campi tecnici conservati; nessuna automazione da questo prototipo |
| Catalogo grafiche | Flusso esistente usa pp_design/pp_autostart/pp_catalog_flow: non applicarli senza integrazione autorizzata e test dedicati |
| FAQ | Fonti Shopify già strutturate potenzialmente riutilizzabili per conoscenza assistente; non usarle come vincoli tecnici o prezzi senza verifica |

Il contratto **Preventivometro V2** non è la migrazione **BSS Storefront V2**. Gli handoff non autorizzano nuove operazioni esterne: le autorizzazioni storiche erano circoscritte ad altre sessioni.

## Da confermare con Shopify / titolare

- Significato dei tag `No-AI` e `warning-pitchprint` nei prodotti scelti; prima di provider reale o uso pubblico, confermare eventuali restrizioni. Non inferire che No-AI significhi NO-PITCH.
- Profili stampabili per modello/variante: area utile, margini, minimo font, colori, linee, regole logo e font disponibili. Le dimensioni del titolo sono nominali, non collaudo grafico.
- Definizioni e valori correnti dei metafield dimensionali variante (`custom.larghezza/altezza/spessore`, mm secondo handoff). Non sono stati letti in questa iterazione.
- Stato attuale tema pubblicato e app blocks; la copia locale del tema è indietro di 12 commit rispetto al proprio tracking locale, senza fetch effettuato. Gli handoff non provano lo stato live di novembre.
- Accesso dev store/tema duplicato e permessi minimi per un futuro adapter catalogo server. Snapshot/cache con scadenza, gestione prodotti ritirati e varianti speciali prima del rilascio.
- Politica retention e trattamento dati per richieste reali, loghi e progetti.

## Da supporto BSS, senza migrazione

La non coesistenza V1/V2 è già riferita dall'utente: non ripetere la domanda. Acquisire invece risposta su:

- rollback V2→V1 e salvaguardia di set opzioni, formule e configurazioni;
- stabilità/versione degli hook prezzo e attributi usati dal tema (`bssFixSupportCustomExtraPrice`, `bssFixSupportCustomAttributeWhenAddToCart` e correlati);
- ciclo DOM/eventi, campi dimensionali, add-on e convivenza con PitchPrint;
- modalità supportata di test su dev/tema duplicato e procedura verificabile di ripristino.

Nessun messaggio al supporto inviato. Nessuna scrittura su BSS/PitchPrint o negozio autorizzata da questo documento.
