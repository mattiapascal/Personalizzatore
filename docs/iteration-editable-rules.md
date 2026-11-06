# Regole modificabili e scelta Cloudflare Free — 6 novembre 2026

## Risultato

`REGOLE_ASSISTENTE.md` è il documento per il titolare: istruzioni in italiano, esempi, mappa delle regole applicative e modello per proporre casi nuovi. La sola sezione delimitata viene compilata in `server/assistant-policy.generated.ts` e inclusa nelle istruzioni Responses tramite `server/interpretation-prompt.ts`. Contratto/tool e validazioni restano nel codice. Il prompt passa a v10 con suffisso derivato dall'hash del testo attivo; il modello e i suoi parametri non sono cambiati.

`assistant:generate` rigenera l'artefatto; `assistant:check` rifiuta disallineamenti. Avvio dev genera; test/build controllano. Non si legge il Markdown su filesystem durante la richiesta, evitando una nuova dipendenza Node nel runtime futuro. Una modifica non pubblica o aggiorna automaticamente versioni online. Note fuori dalla sezione attiva non consumano token e non cambiano l'hash; gli esempi attivi sì. Nessuna migrazione del provider, fine-tuning o apprendimento automatico dai clienti.

La separazione fra istruzioni, esempi e contesto segue la [guida ufficiale OpenAI](https://developers.openai.com/api/docs/guides/prompt-engineering). È una scelta implementata nel repository, senza creazione di prompt o risorse nell'account del fornitore.

Il testo attivo iniziale è di 5.820 caratteri. Insieme al contratto tecnico il prompt è più lungo del precedente; il limite di 12.000 caratteri attivi è un freno alla crescita, non un preventivo di costo o conteggio token. Molte frasi visibili restano composte dal programma: il documento lo dichiara e indica i file da modificare con Codex. Non promette che ogni nuovo caso sia risolvibile dal solo prompt.

Implementate anche le due correzioni già richieste in `advisor.ts`: «La scheda prodotto indica:» e rimozione della motivazione tecnica sulle preferenze non assegnate. Proposta e scelta esplicita restano distinte, senza alterare filtri o associazioni del prodotto. La pulizia completa della UI pubblica è ancora da completare.

Destinazione iniziale concordata: [Cloudflare Workers Free](cloudflare-free.md). Account già accessibile in Brave, verificato in sola lettura; nessuna risorsa, credenziale, rotta o configurazione creata/modificata. Il backend Workers è ancora da implementare. Nessuna modifica nel repository tema o nel negozio.

## Verifiche eseguite

- `npm run assistant:generate`: generazione riuscita, ripetibile, senza rete.
- `npm run check`: controllo coerenza, **179 unit test**, TypeScript/build e verifica credenziali nel bundle riusciti. La fase e2e del comando si è fermata perché il sandbox impediva l'ascolto su localhost (`EPERM`).
- `npm run test:e2e`, rieseguito con permesso di aprire la porta locale: **38 test browser superati**.
- Nuove regressioni: testo umano effettivamente presente nel payload, note/proposte escluse, modifiche e hash, CRLF, delimitatori assenti/invertiti/duplicati, vuoto/limite, serializzazione come stringa e artefatto aggiornato. Controllate anche le motivazioni commerciali del candidato.
- `git diff --check`: riuscito.

Nessuna chiamata AI reale o spesa in questa iterazione. I test del trasporto sono controllati: non certificano che il modello reale segua tutte le istruzioni riscritte. Prima del rilascio occorre un collaudo semantico mirato entro budget autorizzato. Nessuna prova CPU/quote/persistenza nel runtime Cloudflare e nessun collaudo Illustrator effettuati.

Prossimo incremento: separare gli adattatori HTTP/storage/consumi e provarli nel runtime locale Workers; successivamente integrazione minima nel tema e pacchetto di rilascio verificabile. Non pubblicare il solo `dist/` come se contenesse già le API.
