# Piano di test e accettazione

## Incremento locale

| Area | Evidenza automatica | Limite |
|---|---|---|
| Selezione | 14 scenari tabellari: vuoto, famiglia, montatura, misure esatte/intermedie/eccessive, manuale, tascabile, rotondo, fuori famiglia, non so, logo, orientamento | Tre referenze, nessuna idoneità di righe/font dedotta |
| Sessione | Cambio requisiti, scelta invalida, ID sconosciuti, storage corrotto, scadenza e catalogo modificato | LocalStorage, nessun backend multiutente |
| AI | Schema strict, tool whitelist, prompt ostile, revisioni, provider malformato/offline/timeout, fallback guidato | Provider reale non collegato |
| Documento | Manuale→AI sullo stesso ID, rifiuto fuori area/minimo font/colore/ID/stale, undo/redo e import con revisione monotona | Profilo TEST e metriche sintetiche negli unit test |
| Browser | Richiesta→domanda→candidato→href reale, persistenza e revisione requisiti; nessuna richiesta esterna del flusso | Non apre né collauda lo storefront |
| Fabric reale | Trascinamento effettivo, aggiornamento comune, rifiuto stale, export JSON/SVG, riapertura e cambio sezione | Chromium macOS, font Arial locale |
| Golden SVG | Nuovo export Fabric dopo import del JSON confrontato byte per byte col campione versionato | Baseline tecnica; altri OS/font possono richiedere revisione motivata |
| Mobile/sicurezza | Viewport 390×844, niente overflow pagina, stringa HTML non interpretata, no chiavi client, audit runtime | Non audit WCAG completo né pen test |

`npm run check` è il comando di regressione. `npm run schemas` mantiene i contratti JSON Schema allineati. `npm run capture:lab` è uno strumento esplicito per aggiornare il campione e fare QA visiva, non un test che riscrive i propri attesi.

## Gate ancora richiesti

- Confermare area utile e profili stampabili, tag No-AI, disponibilità/pubblicazione corrente e metafield dimensionali reali.
- Integrare provider server e valutare 10–20 conversazioni con risposte LLM, chiarimenti, cambi requisiti, prompt injection e fallback; misurare token/costi con budget.
- Eseguire la checklist Illustrator con prove umane e registrare misure/font/editabilità.
- Aggiungere fixture 3–8 righe, font, loghi vettoriali/raster, gruppi e casi complessi prima dell'adozione editor.
- Prima del deploy: test su dev/tema duplicato, osservazione e rollback del solo assistente, autorizzazione esplicita. Qualsiasi futuro test carrello/prezzi deve usare click reale e verificare il percorso BSS documentato dagli handoff; non è stato eseguito ora.
