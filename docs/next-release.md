# Prossima versione — richieste editoriali del titolare

Registrate il 6 novembre 2026. Da implementare e verificare nel prossimo incremento; nessun testo dell'interfaccia modificato da questa nota.

- Nel dettaglio «Perché questo modello», sostituire «La scheda Shopify indica questo uso:» con **«La scheda prodotto indica:»**. Origine: `src/selection/advisor.ts`, regola `P1_CATALOG_USE`.
- Togliere dalla motivazione al cliente «Proposta iniziale da confermare: nessuna preferenza di montatura o forma è stata assegnata al cliente.». La distinzione tra proposta e scelta resta valida nel motore; la diagnostica va mantenuta nei test/dati interni. Eventuale testo commerciale: **«Una prima proposta: verifichiamo insieme misure e personalizzazione.»**, fuori dall'elenco delle motivazioni quando ridondante.
- Prima di una versione pubblica, rivedere anche `rules.ts` e `App.tsx`: nomi di piattaforma, ID/regole, profili TEST, stato ACTIVE/snapshot e strumenti del laboratorio non devono comparire come spiegazioni commerciali. Le incertezze realmente utili al cliente rimangono, in linguaggio naturale. Diagnostica e controlli del titolare richiedono una superficie riservata, non solo un dettaglio chiuso accessibile a tutti.

Criterio di accettazione: una sessione cliente vede motivazioni basate sulle caratteristiche del prodotto e sul suo uso; nessuna spiegazione interna rivolta allo sviluppatore. I testi che descrivono esplicitamente il trattamento dei dati verso il fornitore AI vanno valutati separatamente, senza nascondere informazioni necessarie sulla privacy.
