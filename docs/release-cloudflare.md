# Rilascio della selezione assistita — 6 novembre 2026

## Ambito e stato

Il titolare ha autorizzato il primo rilascio diretto sulla pagina `https://www.incisoriasacchetti.it/pages/crea-timbro-online`, riferendo di aver creato una copia di backup. Scelta: Cloudflare Free e aspetto coerente con il tema. Nessun piano a pagamento o modifica a BSS, PitchPrint, prodotti, prezzi, varianti, carrello o checkout.

**Primo rilascio attivato il 6 novembre 2026.** Backend pubblicato, piano Free verificato nel pannello, widget Turnstile dedicato e catalogo aggiornato dal Cron. Il titolare ha verificato l’anteprima: «Chat visibile e risposta ricevuta». Assegnato poi `ai-timbro` alla sola pagina autorizzata: API riletta, titolo/handle/corpo identici a prima, URL normale HTTP 200 con iframe del servizio. In questa sessione l’ispezione nativa del browser non era affidabile (bianco anche sulla vecchia pagina; errore di acquisizione Safari): non dichiarare un collaudo visivo remoto desktop/mobile autonomo. Le verifiche responsive automatizzate sono locali.

## Versione distribuita

Correzione sessioni attuale: sorgente `7412f73`, Worker `6e76fd30-8146-49f9-9514-5f2fa78ef01f`. Nessun upload o modifica al tema per questa correzione. [Manifest verificato](releases/2026-11-06-session-fix.json).

Revisione grafica precedente, pubblicata sullo stesso servizio, piano Free, senza nuove migrazioni o modifiche ai segreti. Sorgente applicazione `aeb1f22`, versione Worker `59f55727-dbe8-49ff-ae43-4f653322831e`. La sola sezione tema è stata ricaricata per ridurre l’intestazione; i dodici file del rilascio sono stati riletti e confrontati con la worktree. [Manifest con commit, hash ed esiti](releases/2026-11-06.json).

## Due repository e base verificata

- Applicazione: `mattiapascal/Personalizzatore`; Worker, UI cliente, prompt, contratti e test restano qui.
- Tema: `mattiapascal/Mode-mio-5.2.0`; fetch eseguito, base `e465ac6`. Ramo isolato `feature/ai-stamp-assistant` nella worktree `.local/theme-ai-release`; la cartella tema originale rimane sul proprio `master`, senza aggiornamenti distruttivi.
- Theme live riletto: `Mode mio 5.2.0`, ID `187575402876`, ruolo MAIN. Pagina `689437639036`, handle `crea-timbro-online`, template originale `wide`.
- Rilevata una traduzione italiana già online e assente da Git: sincronizzata in un commit separato `d5a908f`. Non viene introdotto o modificato un comportamento checkout: si preserva il testo preesistente. Le nuove chiavi `ai_stamp` sono l'unico intervento nelle traduzioni durante il rilascio.
- Backup locale ignorato da Git: `.local/release-backups/page-before.json` e `locales-before.json`, con corpi originali e checksum. Il corpo originale della pagina resta conservato su Shopify; la nuova resa usa un template dedicato.

## Implementazione pubblica

`cloudflare/index.ts` instrada API/asset e pianificazione; `AssistantStore` usa SQLite in un Durable Object. Nessun filesystem Node e nessun timer dipendente dal laptop. Aggiornamento catalogo ogni cinque minuti, import paginato e sostituzione solo dopo successo; oltre dieci minuti senza lettura completa nuove proposte sospese. Fonte misure invariata: metafield delle varianti.

UI separata in `src/public/`: soltanto selezione, riepilogo compatto, foto, motivazioni commerciali e navigazione alla pagina prodotto. Nessun Fabric, demo, amministrazione, contatore globale o diagnostica del laboratorio. Nessun trasferimento automatico del testo a PitchPrint/BSS. L'iframe isola CSS/JS; font e colori provengono dalle impostazioni correnti del tema tramite messaggi con origine/sorgente controllati. Confermati online Nunito Sans, Raleway, rosso `#c71721`, raggio pulsanti 15 px. Niente modifiche ai CSS globali del tema.

Pagina dedicata `templates/page.ai-timbro.json`, sezione `ai-stamp-assistant.liquid`, caricatore `ai-stamp-embed.js` e sole chiavi di traduzione nuove. Template condiviso `wide` intatto. Link tradizionali verificati: `/pages/timbri` e `/pages/templates-timbri`.

## Sessioni, consumi e privacy

- Turnstile verificato dal server con controllo hostname/azione; le sole verifiche client non sono sufficienti. Il widget è dedicato all'assistente.
- Capacità casuale server: token nel browser e digest nello storage. L'UUID scelto dal client non controlla la quota. Un reset della chat non azzera il credito; un reload nella stessa scheda può riusare la capacità fino a scadenza. Nessun tetto di aperture per IP: reti condivise e passaggi Wi-Fi/mobile non identificano una persona. Restano quattro chiamate concorrenti globali, una per conversazione e il massimo tecnico di cinquecento capacità attive per il servizio.
- Il server non conserva l’IP originale e non genera più bucket HMAC per le nuove aperture. Le capacità si identificano con token opachi, senza vincolo alla rete. Capacità e contatori per sessione scaduti vengono eliminati dall’aggiornamento pianificato; i vecchi bucket non vengono consultati e si eliminano alla scadenza. Il conteggio globale aggregato rimane. Nessuna chat o mappa privata nel registro.
- Tetto iniziale globale **1 USD complessivo senza rinnovo automatico**. Nel servizio pubblico non ci sono più il tetto di 0,05 USD per conversazione o limiti numerici di venti messaggi/duecento richieste; il laboratorio conserva il proprio limite locale configurato. Il registro prenota il costo prima della rete e sostituisce le riserve note con il costo dei token. Un timeout senza uso noto conserva la riserva. Non è una fattura e non presume l'applicazione di token promozionali. Per ampliare il budget occorre una decisione esplicita del titolare; non azzerare lo storage per aggirarlo.
- Originali e mappa privacy solo in memoria browser. Stessa protezione e conferma a due passaggi già collaudata; controllo aggiuntivo server prima del provider. Il filtro resta euristico, non una garanzia universale di anonimizzazione. Informazione visibile sul fornitore AI; trattamento OpenAI distinto dalla mancata archiviazione sul nostro backend. Le impostazioni di condivisione/retention del progetto OpenAI non vengono cambiate automaticamente.
- Endpoint amministrativi protetti da segreto separato, nessun pulsante pubblico di refresh. Segreti caricati solo nel Worker, mai in template/JS o manifest. Logging delle richieste Worker disabilitato. Nessun inoltro automatico dei redirect verso destinatari diversi: `redirect:manual` e rifiuto delle risposte non riuscite.

## Comandi e aggiornamenti delle regole

`npm run assistant:generate` e `npm run check` operano soltanto in locale. Anche un push Git non pubblica.

`npm run worker:package` compila UI/backend e prepara un dry-run senza upload. `npm run check:release` aggiunge al controllo locale il pacchetto Workers, test SQLite/HTTP simulati, browser cliente e ricerca delle credenziali negli asset pubblici. Non genera spesa AI.

`npm run worker:deploy` è invece un comando di **pubblicazione reale**: prepara il pacchetto e lo invia all'account Cloudflare autenticato. Usarlo solo nel contesto di un rilascio autorizzato, dopo i controlli. È distinto dai comandi di modifica locale riportati nel promemoria in cima a `REGOLE_ASSISTENTE.md`.

Un cambiamento delle sole istruzioni richiede rilascio del backend; il tema non va aggiornato se URL del servizio e contratto API restano compatibili. Un cambiamento del caricatore/template richiede anche il commit tematico e l'upload dei soli file coinvolti. Conservare commit sorgente, hash degli asset e ID versione Worker. Nessuna pipeline automatica Git→deploy.

## Verifiche e completamento prima dell'attivazione della pagina

Verifiche locali già eseguite: 189 unit test, 38 browser laboratorio, dieci browser cliente, build TypeScript dei due runtime e controllo credenziali negli asset. Test runtime Workers/SQLite superato con soli dati TEST e rete simulata: import multipagina, errore conservativo, privacy prima della rete, origine, quota server indipendente dal reset, concorrenza, contatori/catalogo dopo riavvio e limiti di apertura sessioni. Non è un test CPU del servizio remoto né un collaudo Illustrator.

Theme Check locale: 277 file, nessun errore; tredici warning in file preesistenti, nessuna segnalazione sui nuovi file. Validatore Liquid ufficiale della skill superato su tutti i dodici file, dopo aver installato le sue dipendenze in una cartella di strumenti isolata. Anche la successiva modifica della sola sezione è stata rivalidata (revisione 3). Nessuna dipendenza aggiunta al tema.

Completati: rinnovi di accesso eseguiti dal titolare, Worker/SQLite/widget sul Free, upload segreti senza esposizione, lettura iniziale e successivi aggiornamenti pianificati, upload limitato dei dodici file tema con checksum remoti identici, anteprima verificata dal titolare e assegnazione del template. Il collaudo AI reale del prompt v11 supera 4/4 casi sintetici: stima standard 0,0139305 USD, di cui 0,0101085 USD per una sessione di tre turni. Le tre esecuzioni diagnostiche di questa fase sommano circa 0,039969 USD, senza certificare fattura o token promozionali.

Limiti ancora aperti: prova di carico/CPU e quote nel servizio remoto Free, collaudo visivo remoto su più dispositivi, raccolta amministrativa di casi nuovi con consenso e collaudo produttivo Illustrator. Nessuna di queste verifiche è sostituita dai test locali. Il pilota conserva tetti prudenziali e percorso alternativo al catalogo.

## Rollback

Primo ripristino: riportare il template della pagina da `ai-timbro` a `wide`. Corpo, titolo e handle originali non vengono cancellati e tornano al percorso precedente. La nuova sezione e il caricatore non sono inclusi negli altri template: il ripristino non richiede sostituire tutto il tema. Se necessario ripristinare i soli file introdotti/modificati dalle copie verificate, senza toccare modifiche concomitanti.

Per il backend, ripristinare una versione Worker verificata o disattivare l'assistente; non cancellare il registro consumi durante un rollback. Mantieni l'aggiornamento catalogo o segnala esplicitamente il servizio non disponibile. Nessuna migrazione BSS o operazione su carrello/ordini fa parte del ripristino.

## Revisione della chat richiesta durante il rilascio

Il titolare ha richiesto maggiore altezza della conversazione e aspetto simile a WhatsApp chiaro: sfondo `#efeae2`, messaggi ricevuti bianchi, inviati `#d9fdd3`, testo scuro e code laterali, senza spunte. Font e azioni prodotto restano quelli del tema. Titolo pagina compatto e sottotitolo ridondante rimosso. La conversazione occupa lo spazio fino al compositore, senza crescere con la cronologia; riepilogo, informazioni e reset seguono sotto. Rimosso «Mostra i modelli» pubblico perché i risultati sono già presenti.

Invio con **Invio**, nuova riga con **Maiusc+Invio**; composizione IME non invia. Una freccia accessibile da 44 px nel campo sostituisce il grande pulsante. La verifica privacy continua a intervenire prima della trasmissione. La modalità laboratorio mantiene il comportamento precedente. Cache Vite pubblica separata da quella del laboratorio, per non invalidare il modulo Fabric di un server locale già aperto.

## Correzione reti condivise e controllo antirobot

Segnalazione del titolare: il primo accesso da telefono era bloccato da «Hai già avviato più conversazioni». Causa nel codice: tre aperture/giorno per IP condiviso, più verifica completata lasciata visibile quando il successivo avvio sessione falliva. Il titolare ha chiesto di non penalizzare gli utenti umani.

Rimosso il limite di aperture per IP e il vincolo della capacità all’IP. Ogni nuova capacità richiede ancora Turnstile verificato lato server, con hostname e azione corretti. Restano token casuali, origine controllata, scadenza, massimo tecnico delle capacità, prenotazioni di costo, tetti globali/per chat e concorrenza. Il registro consumi non è stato cancellato o azzerato. Nessuna modifica Shopify o al prompt AI.

Widget configurato con `appearance: interaction-only`, come da [documentazione Cloudflare](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/). Dopo esito positivo il riquadro scompare subito, anche se l’avvio della chat è lento o fallisce. Le callback duplicate non avviano sessioni aggiuntive. Un reload riusa la capacità quando lo storage browser è disponibile; se il browser lo nega la verifica può ripetersi, senza blocco giornaliero per IP.

Verifiche di questa correzione: 189 test unitari, 10 browser pubblici desktop/mobile, TypeScript/build Workers, controllo credenziali e runtime SQLite con rete simulata. Il runtime verifica dodici aperture aggiuntive sulla stessa rete, rifiuto prova non valida, cambio rete conservando lo stesso credito, persistenza e arresto al budget globale. Non sono chiamate reali ad OpenAI né un collaudo fisico del telefono del titolare. Manifest della correzione: `releases/2026-11-06-session-fix.json`.
