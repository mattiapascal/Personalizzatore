# Prossima versione — richieste editoriali del titolare

Registrate il 6 novembre 2026. Prime due correzioni implementate nell'incremento delle regole modificabili; la revisione completa dell'interfaccia pubblica rimane da fare.

- **Implementato:** nel dettaglio «Perché questo modello», «La scheda prodotto indica:». Origine: `src/selection/advisor.ts`, regola `P1_CATALOG_USE`.
- **Implementato:** rimossa dalla motivazione al cliente «Proposta iniziale da confermare: nessuna preferenza di montatura o forma è stata assegnata al cliente.». La distinzione tra proposta e scelta resta nel motore ed è verificata dai test. La chat indica già che la proposta iniziale va verificata; non viene aggiunta una frase ridondante alle motivazioni.
- **Da fare:** prima di una versione pubblica, rivedere anche `rules.ts` e `App.tsx`: nomi di piattaforma, ID/regole, profili TEST, stato ACTIVE/snapshot e strumenti del laboratorio non devono comparire come spiegazioni commerciali. Le incertezze realmente utili al cliente rimangono, in linguaggio naturale. Diagnostica e controlli del titolare richiedono una superficie riservata, non solo un dettaglio chiuso accessibile a tutti.

Criterio di accettazione: una sessione cliente vede motivazioni basate sulle caratteristiche del prodotto e sul suo uso; nessuna spiegazione interna rivolta allo sviluppatore. I testi che descrivono esplicitamente il trattamento dei dati verso il fornitore AI vanno valutati separatamente, senza nascondere informazioni necessarie sulla privacy.
