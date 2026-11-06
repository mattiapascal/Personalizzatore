# Prossima versione — richieste editoriali del titolare

Registrate il 6 novembre 2026. Correzioni implementate e separate dalla diagnostica del laboratorio.

- **Implementato:** nel dettaglio «Perché questo modello», «La scheda prodotto indica:». Origine: `src/selection/advisor.ts`, regola `P1_CATALOG_USE`.
- **Implementato:** rimossa dalla motivazione al cliente «Proposta iniziale da confermare: nessuna preferenza di montatura o forma è stata assegnata al cliente.». La distinzione tra proposta e scelta resta nel motore ed è verificata dai test. La chat indica già che la proposta iniziale va verificata; non viene aggiunta una frase ridondante alle motivazioni.
- **Implementato:** `src/public/` espone soltanto la chat cliente, foto, misure, motivazioni commerciali e link al prodotto. DTO ridotto, nessun laboratorio/ID di regola/profilo TEST nelle spiegazioni; comandi amministrativi protetti sul backend. La versione locale conserva gli strumenti tecnici. Verifica automatica in `tests/e2e/storefront.spec.ts`.

Criterio di accettazione: una sessione cliente vede motivazioni basate sulle caratteristiche del prodotto e sul suo uso; nessuna spiegazione interna rivolta allo sviluppatore. I testi che descrivono esplicitamente il trattamento dei dati verso il fornitore AI vanno valutati separatamente, senza nascondere informazioni necessarie sulla privacy.
