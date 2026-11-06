# Costi e misure — aggiornamento 5 novembre 2026

**Comprensione, 6 novembre:** tre esecuzioni TEST da sette turni (v6 baseline, v7, v8), 48.810 input e 3.095 output complessivi: circa **0,050535 USD** a tariffa standard. Ultima v8: 16.968 input/1.083 output, **0,0175995 USD**, riserva prudenziale 0,11441625 USD sotto il tetto 0,15 USD dell'esecuzione. Il test con fatti catalogo è stato respinto prima dell'esecuzione; la versione v8 effettivamente eseguita forza la condivisione a false e controlla l'assenza di fatti, titoli completi e GID. Registro osservato dopo le prove, incluse altre interazioni locali: 112 richieste, 157.748 input/11.039 output noti, **0,1679865 USD** a tariffa standard; riserva cumulativa 1,44005775 USD, informativa. Non è una fattura, non verifica la promozione e non cambia il tetto utente di 2 EUR. `eval:loyalty` applica il proprio tetto conservativo anche con il guard cumulativo disattivato.

**Aggiornamento 6 novembre:** la segnalazione di quota dipendeva dalle riserve cumulative (0,98840325 USD su 1 USD), non da una fattura di 2 EUR. I token noti dopo 84 chiamate, incluse eval dell'agente, valevano circa 0,1011135 USD a listino standard. Su indicazione del titolare il laboratorio privato usa ora `AI_ENFORCE_LOCAL_LIMITS=false`: contatore informativo, limiti di spesa gestiti nell'account, nessun blocco per budget/richieste cumulativi locali. Nuove installazioni: guard attivo per default. Non è stato azzerato il registro né modificato il budget del provider. `eval:ai` conserva il guard prudenziale per i collaudi. Il comportamento storico descritto sotto resta disponibile quando il guard è attivo.

Due prove linguistiche v6 aggiuntive superate: 4.705 input/240 output, stima standard 0,00460875 USD. Consumo/fatturazione effettivi e promozione restano da verificare sul provider. Avvisi e **Enforce a hard limit** hanno effetti diversi, e l'enforcement può avere ritardo: [OpenAI Spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

Il titolare ha autorizzato un massimo di **2 EUR per il collaudo**. La configurazione privata usa un limite locale prudente di **1 USD** e 100 richieste. Nessun hosting o servizio aggiuntivo acquistato.

Modello configurato: gpt-5.4-mini-2026-03-17, Responses API con function calling strict e prompt versionato. Listino standard verificato il 5 novembre 2026: 0,75 USD/milione token input e 4,50 USD/milione token output. Per prudenza non scontiamo il caching nel contatore. [Fonte OpenAI](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

## Quote locali

Prima di ogni chiamata si riserva il costo di un input sovrastimato (byte UTF-8 del payload più overhead) e dell'output massimo. La riserva non viene rimborsata su errori/timeout: è un limite conservativo, non la spesa fatturata. Si blocca prima di oltrepassare la quota configurata. Il registro .local/ai-meter.json conserva soltanto contatori, token e riserva USD; nessun prompt o dato cliente.

Scritture atomiche e lock fra processi impediscono di azzerare o sovrascrivere la quota facendo partire più istanze. Se un crash lascia la directory di lock, il servizio si blocca: prima di rimuoverla occorre verificare che non ci siano richieste in corso. Non cancellare il registro per aggirare il limite. Il massimale vale per questo laboratorio, non per altre applicazioni che usino lo stesso account OpenAI.

Limiti ulteriori: una chiamata AI alla volta, 10 richieste/minuto, massimo richieste totale, input 1200 caratteri, body HTTP 16 KB, output massimo 1600 token, timeout provider 20 secondi e client 25 secondi. Nessun retry automatico a pagamento.

## Collaudi effettivi

Ultimo incremento montature, prompt v5: quattro frasi inventate superate, 6.367 token input e 300 output, stima a listino 0,00612525 USD, riserva 0,05445 USD. Registro complessivo osservato dopo la prova: 82 richieste, 86.841 input e 6.972 output noti, stima standard 0,09650475 USD; riserva prudenziale 0,95626725 USD su limite 1 USD. Il poco margine della riserva può interrompere presto nuovi collaudi: non azzerare il registro né aumentare il tetto senza autorizzazione. Gli aggiornamenti del catalogo non effettuano chiamate AI.

I primi 20 casi linguistici TEST hanno superato 16/20 prove. Dopo la revisione del contesto: 18/20 (uno dei due insuccessi era un errore di trasporto/contratto). La successiva regressione con contesto esteso ha superato 19/20: il modello chiedeva inutilmente al cliente di riscrivere in mm una misura esplicita in cm. Il prompt v4 chiarisce che la conversione è aritmetica consentita; il caso mirato è poi passato.

Sono inoltre stati eseguiti due dialoghi end-to-end reali di quattro risposte, incluso il percorso finale con catalogo collegato: montatura, forma, dimensioni, riepilogo verde e candidati 4913/4915. Dati inventati, nessun cliente reale. I risultati non garantiscono affidabilità assoluta né costituiscono un'eval di traffico produttivo.

Ogni report locale contiene data, modello, versione prompt, oracoli TEST, esiti e token aggregati. La stima a listino è (input * 0,75 + output * 4,50) / 1.000.000 USD. I timeout senza usage restano coperti dalla riserva ma non sono quantificati nella stima a consuntivo dei token noti.

## Token promozionali e dati

Il titolare ha riferito di aver abilitato la condivisione per il progetto Personalizzatore Shopify. La sua schermata elenca gpt-5.4-mini fra i modelli del gruppo con quota gratuita giornaliera. La chiave locale è stata fornita dal titolare e il provider risponde; non abbiamo verificato nel pannello Billing l'effettivo sconto o consumo della promozione. Il contatore non assume costo zero e non misura la quota gratuita residua.

La condivisione è un opt-in distinto da store:false. Quest'ultimo evita la persistenza dello stato della Response, non revoca le impostazioni di condivisione e non promette zero retention. Per il collaudo usiamo solo testi inventati. [OpenAI Data controls](https://developers.openai.com/api/docs/guides/your-data).

Prima di stimare un costo mensile servono sessioni rappresentative, media/mediana/p95 di richieste, token e latenza, traffico atteso, storage e backend. Queste misure di carico e una fattura effettiva non sono ancora disponibili.
