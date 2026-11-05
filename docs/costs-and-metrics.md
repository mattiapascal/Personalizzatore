# Costi e misure

Questo incremento esegue **zero chiamate a modelli AI**, non richiede chiavi e non produce consumo token. Il mock è un parser locale; zero spesa API in questa prova non è una stima di costo per una sessione con LLM. Nessun costo mensile misurato, nessuna infrastruttura acquistata.

Prima di scegliere provider/modello, concordare budget e dati trattabili, poi misurare almeno 20 sessioni sugli stessi scenari di `tests/selection.test.ts` includendo chiarimenti, correzioni e fallback.

Record minimo server redatto: session ID pseudonimo, prompt/model version, tool, input/output/cached tokens riportati dal provider, latenza, numero di richieste, errori e retry. Non conservare testo personale o loghi nei log. Tariffe da verificare alla data della misura, nella valuta dichiarata dal fornitore.

```text
costo_sessione = Σ (input_non_cached * tariffa_input
                  + input_cached * tariffa_cached
                  + output * tariffa_output) / unità_tariffa
costo_mese = sessioni_previste * costo_medio_misurato
             + backend + storage + eventuali servizi
```

Riportare media, mediana, p95, campione e casi massimi, distinguendo errori/retry. Definire quote per richieste/token/sessione, timeout, limite mensile e blocco prima di superare il budget. L'API sostituibile non implementa ancora questi controlli server: restano gate prima dell'AI reale e del deploy.
