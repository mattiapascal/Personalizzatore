# Chat e anteprime — 6 novembre 2026

Repository inizialmente pulito su main. Richieste: più spazio alla chat, altezza stabile con scroll, requisiti rosso/verde compatti su colonne, prodotti come anteprime e dialogo naturale anche con refusi, messaggi poco pertinenti e richieste di spiegazione.

Incremento: layout desktop con chat prevalente e risultati compatti, chat di altezza fissa adattata al viewport, riepilogo in griglia e dettagli tecnici richiudibili. Anteprime da immagini prodotto Shopify già esistenti, senza generare fotografie; in assenza/errore immagine mostrare una sagoma etichettata come area dell'impronta. Dimensioni sempre dai metafield variante.

Dialogo: intento AI tipizzato; messaggi fuori tema, incomprensibili o di aiuto non modificano requisiti/selezione. Risposta breve e domanda utile, senza conferme tecniche ripetitive. Refusi chiari interpretati, dubbi chiariti senza correggere la grammatica al cliente. Test con trasporti controllati; valutazione reale limitata alla quota disponibile, senza aumentarla. Verifica visuale desktop/mobile. Nessuna modifica al tema o deploy.

## Risultato

Chat prevalente su desktop (colonne 1,35/0,85) e singola colonna sotto 960 px. Area messaggi ad altezza fissa adattata al viewport, indipendente dal numero di turni; scroll interno e pulsante per tornare all'ultimo messaggio. Leggere lo storico sospende lo scorrimento automatico; inviare una risposta lo riattiva. Riepilogo su quattro colonne desktop e due mobile, con stato testuale accessibile oltre al colore. Avvisi lunghi, JSON e informazioni sulla conversazione richiudibili. Schede prodotto in griglia con foto e dettagli delle regole richiudibili.

La query Admin legge `featuredMedia.preview.image`; vengono accettati solo URL HTTPS di immagini sul CDN Shopify. Foto prodotto, non rendering della personalizzazione e non necessariamente foto specifica della variante. Mancanza/errore foto → sagoma esplicitamente denominata «Area impronta». Le immagini non vengono inviate al modello AI. Query validata su Admin 2026-10 e lettura reale riuscita con le credenziali già configurate, senza richiedere nuovi permessi. Il validatore elenca anche scope generici del tipo Image: non sono stati aggiunti o autorizzati per questo progetto.

Lettura aggiornata: 76 profili su 66 prodotti, 74 con immagine; sono rientrate 10 varianti manuali con metafield ora compilati. Mancano ancora larghezza/altezza su plastica tondo (4 varianti) e Pocket Stamp R40 (1). Il caso «senza metafield» nei test è ora simulato esplicitamente, così la compilazione reale dei campi non invalida la regressione. Nessuna scrittura Shopify da questo progetto.

## Conversazione e contenuti

Prompt `stamp-requirements-v6-dialogue`. Il modello emette `dialogueAct` tipizzato: answer, off_topic, unclear, help. Le ultime tre categorie conservano requisiti, revisione e selezione, anche se il modello propone accidentalmente attributi incoerenti. Un chiarimento semantico su una scelta può sospendere i candidati; una spiegazione o divagazione non nasconde risultati già validi. Nessun parser aggiuntivo di parole chiave nel percorso AI reale.

`contentBrief` raccoglie testo esatto, tipo di contenuto (testo/grafica/misto), scopo (azienda/ex-libris/fedeltà/generale), soggetto grafico. Rimane solo in memoria e non viene incluso nel localStorage della sessione. Si chiede il contenuto prima della montatura quando il cliente parte dal bisogno; se ha già indicato montatura/forma, può proseguire senza ripetere la raccolta. Ex-libris: domanda su soggetto e nome/testo; nessuna capacità grafica inventata.

Per il testo effettivo, il browser misura le righe con Arial 7–9 pt e margine TEST 1 mm. Mostra un intervallo di ingombro, non una dimensione produttiva garantita. «Cerca usando questa stima» è una scelta esplicita; memorizza solo misura derivata, numero di righe e flag `sizeIsEstimate`. Un nuovo testo ritira la vecchia stima. Le grafiche e i contenuti misti non ricevono automaticamente un formato dal numero di righe: richiedono verifica dell'immagine/illustrazione, ancora da implementare.

Il testo raccolto arriva nella prima bozza del canvas tramite i comandi revisionati già usati per le modifiche manuali. Inizializzazione atomica: se non entra, resta la bozza originale e un avviso; nessuna deformazione o riduzione arbitraria del carattere. Cambiare sezione/prodotto conserva le modifiche già effettuate e non reimposta il testo dalla chat.

## Limiti di spesa: chiarimento e modifica richiesta dal titolare

La segnalazione «Quota AI esaurita» era dovuta alla somma delle riserve massime locali: 0,98840325 USD contro limite prudenziale 1 USD, dopo 84 chiamate complessive incluse le eval dell'agente. I token noti corrispondevano a circa **0,1011135 USD** a tariffa standard del collaudo, non 2 EUR di spesa verificata. Registro e report non sono fattura e non verificano lo sconto promozionale.

Su indicazione del titolare, `.env.local` usa `AI_ENFORCE_LOCAL_LIMITS=false`: niente blocco per budget/richieste cumulativi locali; conteggio informativo e limiti dell'account come riferimento. Non è stato cancellato/azzerato il registro, alzato il budget di collaudo o modificato l'account OpenAI. Restano una chiamata alla volta, 10/minuto, timeout, limiti input/output, controllo origine e validazione dei tool. I nuovi ambienti mantengono il guard locale attivo per default. `eval:ai` forza il guard prudenziale per i collaudi dell'agente.

La documentazione ufficiale distingue avvisi e **Enforce a hard limit**; anche l'applicazione di un limite rigido non è istantanea. Le impostazioni effettive dell'account del titolare non sono state ispezionate o modificate. [OpenAI Spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

## «Imparare» e gestione amministrativa — proposta, non implementazione

Il prototipo usa il contesto recente, ma non aggiorna autonomamente il modello né conserva un archivio clienti. Un futuro pannello «Casi da rivedere» potrebbe mostrare il problema riconosciuto, la correzione proposta e l'esito dei test; approvazione, modifica o scarto da parte del titolare. Una correzione approvata diventa caso di regressione, poi aggiornamento versionato di istruzioni/regole o conoscenza, con collaudo e ritorno alla versione precedente. Raccolta e conservazione di dati reali richiedono prima una politica concordata. Non sono attivi archivio chat, apprendimento automatico, fine-tuning o pannello amministrativo.

## Evidenze

- `npm run check`: 82 unit test, 22 browser e2e, build TypeScript/Vite e controllo credenziali nel client superati.
- Copertura nuova: altezza stabile della chat su più turni, storico/scroll/resize, quattro/due colonne, immagini/fallback, brief non persistente, stima e apertura testo nel canvas, recupero fuori tema senza perdere selezione o nascondere risultati, nuova configurazione quota informativa.
- Due frasi TEST con AI reale: **2/2 superate** (divagazione sul calcio con conservazione dei requisiti; testo con refusi e richiesta di stima). 4.705 input/240 output, stima standard 0,00460875 USD, riserva 0,032136 USD; prove eseguite prima di disattivare il guard locale. Nessun cliente reale. Non è una regressione completa del corpus linguistico.
- `capture:chat`: desktop/mobile e scheda con foto reale, AI bloccata; nove foto caricate nella cattura, anteprime ispezionate. Nessun taglio orizzontale o sovrapposizione rilevato. Chromium emulato, non dispositivo fisico. Nessun collaudo Illustrator aggiuntivo.
- Corrette due debolezze emerse nei primi e2e: attesa dell'effettivo avvio della chat prima di contare le risposte; distinzione fra scroll volontario e resize. La suite completa è poi passata. Nessuna dichiarazione di successo dei primi tentativi falliti.

Fonti applicate: [OpenAI Docs — function calling](https://developers.openai.com/api/docs/guides/function-calling) per il contratto strict; documentazione/schema Shopify per la lettura delle anteprime. Le scelte conversazionali e la stima TEST sono implementazioni locali, non garanzie dei provider.
