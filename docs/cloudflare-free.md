# Cloudflare Workers Free — pilota attivo

Scelta e pubblicazione autorizzate dal titolare il 6 novembre 2026. Il pannello Cloudflare conferma il piano Workers **Gratuito, 0 USD**. Non è stato attivato un piano a pagamento. Il primo pilota usa il servizio `incisoria-assistente-timbri.laboratorio-e32.workers.dev` e la sola pagina `/pages/crea-timbro-online`.

## Implementazione

- Ingresso HTTP/asset in `cloudflare/index.ts`, logica e storage SQLite in un Durable Object. Nessuna dipendenza dal processo Vite o dal laptop per il servizio pubblico.
- Import Shopify paginato e atomico ogni cinque minuti tramite Cron. Catalogo reale: 76 profili utilizzabili nella verifica del rilascio. Dopo dieci minuti senza lettura completa il servizio sospende nuove proposte e offre il catalogo tradizionale.
- Credenziali soltanto lato server, sessioni verificate con Turnstile e capacità casuali, quote prenotate atomicamente in SQLite. Nessun limite di aperture per IP né vincolo al cambio Wi-Fi/mobile. Reset della chat e UUID del client non azzerano i consumi. Il widget compare solo se richiede interazione e scompare al completamento.
- Primo periodo limitato a 1 USD globale senza rinnovo automatico, 0,05 USD e venti richieste per conversazione; quattro chiamate contemporanee globali. Questi tetti sono applicativi e distinti dalle quote Cloudflare/OpenAI.
- Nessun webhook o app proxy creato. Nessuna modifica a DNS, BSS, PitchPrint o acquisti.

I dettagli, le evidenze, i limiti e il ripristino sono in [release-cloudflare.md](release-cloudflare.md). Le istruzioni modificabili dal titolare sono in [REGOLE_ASSISTENTE.md](../REGOLE_ASSISTENTE.md).

## Aggiornamenti

`npm run assistant:generate` e `npm run check` modificano/verificano solo il progetto locale. Il push Git conserva la sorgente e non pubblica. `npm run check:release` prepara e verifica anche il pacchetto Workers, senza upload né costi AI. `npm run worker:deploy` esegue invece una **pubblicazione reale**, da usare in un rilascio autorizzato. Non esiste una pipeline automatica Git→Cloudflare.

## Limiti del piano

Le quote consultate per questo rilascio comprendono 100.000 richieste Worker al giorno e 10 ms di CPU per invocazione HTTP/Cron. La logica pesante è separata nell'oggetto SQLite; le sue quote restano distinte. Il tempo di rete non è CPU, ma il successo dei test locali non misura il carico remoto. La prova di carico/CPU rimane da eseguire e registrare. Se una quota viene raggiunta il servizio può interrompersi; il percorso ordinario ai prodotti resta disponibile.

L'hosting gratuito non include i token OpenAI. Le stime standard non certificano l'applicazione di promozioni o la fattura. Un passaggio a Paid richiederà una decisione esplicita del titolare: non è automatico e non cambia la qualità del modello AI.

Fonti ufficiali consultate per il rilascio: [limiti Workers](https://developers.cloudflare.com/workers/platform/limits/), [quote Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/).
