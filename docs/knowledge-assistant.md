# Risposte informative fondate sulle fonti — 7 novembre 2026

## Ambito richiesto e audit

Il titolare richiede risposte generiche sui prodotti del sito, sulle FAQ e su un file di conoscenze separato dalle regole, nella stessa cartella. L’applicazione può ora fornire informazioni su tutte le famiglie pubblicate; la scelta guidata della montatura rimane dedicata ai timbri. Nessuna modifica a prodotti, prezzi, varianti, tema, BSS/PitchPrint o acquisti.

Audit in sola lettura del 7 novembre: **1.412 prodotti pubblicati** con URL pubblico. Le FAQ effettive sono rese da `collapsible-faqs` sulle schede e sulle collezioni; non esiste una pagina FAQ pubblicata individuata dalla query di audit. Il template locale `page.faq.json` contiene esempi standard inglesi e non è usato come fonte. Verificate via HTTP homepage, collezione timbri per ufficio e timbro con firma autografa: 8 FAQ nei due campioni e testo editoriale della homepage. Esaminati anche pagamenti e contatti del footer pubblico. Non si assume che il template locale sia una copia aggiornata dello store: la conoscenza viene dai contenuti pubblici effettivi e dall’API autorizzata.

## Documento per il titolare

`CONOSCENZE_ASSISTENTE.md`, accanto a `REGOLE_ASSISTENTE.md`, contiene una lista di pagine e risposte scritte dal negozio. Soltanto la parte fra marcatori entra nelle conoscenze; guida ed esempi rimangono esclusi. Le regole di comportamento restano nel documento precedente.

Compilazione con `npm run assistant:generate`, controllo con `npm run assistant:check`/`npm run check`. Entrambi i moduli generati sono inclusi nella build; nessun filesystem nel Worker. Per rendere attiva online una modifica locale occorre il rilascio autorizzato di Cloudflare. Il push Git non è un deploy. I contenuti vanno scritti come fatti destinati al cliente: nessuna chiave, dato cliente, appunto interno o promessa non verificata. Paragrafi entro 1.800 caratteri; le informazioni lunghe vanno divise con righe vuote.

## Percorso della domanda

1. Il testo cliente viene protetto nel browser prima di qualsiasi invio. L’AI esistente interpreta il turno e produce una richiesta tipizzata: domanda informativa, query espansa, ambito negozio/prodotto ed eventuale riferimento all’articolo già citato.
2. Il programma cerca nell’indice locale. Il ranking è testuale, con query e sinonimi prodotti dall’AI: **non è un classificatore a parole chiave della frase cliente e non è ricerca vettoriale**. Non richiede embedding, vector store o un nuovo servizio a pagamento.
3. Vengono recuperate le FAQ delle schede pertinenti. Le informazioni generali del negozio escludono le descrizioni dei singoli articoli come fonte di condizioni generali. Le domande di seguito, quando riferite al prodotto appena citato, sono ristrette alle sue fonti: la resistenza generica di altri materiali non diventa una proprietà della targa in esame.
4. Al modello arrivano fino a 14 estratti, distribuiti fra fonti manuali, FAQ, pagine, misure e descrizioni. Il modello restituisce solo ID degli estratti selezionati e uno stato, senza prosa libera. Il programma verifica gli ID e compone fino a tre blocchi con testo della fonte e collegamenti propri del negozio. Se mancano evidenze lo dice; se vengono segnalate fonti in contrasto le mostra senza una riconciliazione inventata.

Una normale scelta timbro usa una chiamata AI; una risposta informativa usa al massimo due chiamate. Le due fasi hanno un unico tempo massimo e un solo turno attivo per sessione. I contatori registrano entrambe le chiamate. Nessuna nuova quota individuale; budget complessivo del pilota invariato.

Le citazioni sono estratti fedeli, non risposte liberamente riscritte dal modello. Questa scelta limita le affermazioni non sostenute da fonti e conserva condizioni e negazioni; può produrre risposte meno sintetiche di una sintesi generativa. La selezione delle evidenze è statistica e non garantisce di risolvere qualsiasi domanda.

## Aggiornamento e storage

- Query Admin GraphQL `KnowledgeProducts`, versione 2026-10, validata: solo `read_products`. Non vengono richiesti nuovi scope, app o accessi a ordini/clienti. Indicizzati solo prodotti attivi con URL pubblico del negozio; import paginato, controllo duplicati e cursori, massimo 5.000 prodotti e pubblicazione atomica.
- Lettura ogni cinque minuti con la pianificazione esistente; indice distinto dai profili timbro. SQLite conserva una riga per documento e aggiorna soltanto righe cambiate/rimosse: non riscrive tutti i 1.412 prodotti a ogni ciclo. È necessario per contenere le operazioni sul Free.
- Pagine/FAQ con cache di cinque minuti e massimo dieci minuti di tolleranza in errore. Indice prodotti oltre dieci minuti escluso dalla risposta. Una pagina 404/410 viene esclusa. Errori di import non sostituiscono l’ultima copia valida. L’import informativo fallito non interrompe l’aggiornamento del selettore.
- Massimo dodici pagine configurate; inoltre fino a due schede prodotto pertinenti, o tre schede già citate per il seguito. Si estraggono solo testo e FAQ, senza eseguire script. Massimo 2 MB per risposta HTML, cento documenti per pagina e paragrafi entro 1.800 caratteri. Si mantengono paragrafi completi, senza tagliare a metà una condizione.
- Solo URL HTTPS propri del negozio, percorsi pubblici consentiti e redirect interni verificati; nessun URL arbitrario scelto dal cliente o dall’AI. Le fonti esterne sono dati, non istruzioni. Nessun contenuto HTML viene eseguito nella chat.
- Cache contiene solo contenuti pubblici, senza query o testi cliente. I metadati amministrativi indicano numero prodotti, FAQ in cache, versione del documento e documenti cambiati. Nessun dump dell’indice o dei controlli interni nel bootstrap pubblico.

Nel laboratorio gli stessi adattatori usano file locali ignorati da Git. Se l’invio di contesto catalogo non è abilitato la consultazione informativa rimane disattivata.

## Autorità e limiti

Le misure dei timbri rimangono quelle dei profili costruiti dai metafield variante `custom.larghezza` e `custom.altezza`. Le descrizioni o FAQ numeriche in mm/cm non diventano una fonte alternativa per l’impronta: se manca un profilo valido non viene inventata una misura. I dati informativi non cambiano requisiti, revisione, candidato o grafica.

Non si leggono prezzi o disponibilità di variante per ricostruire un preventivo e non si interpretano opzioni BSS. Le descrizioni non certificano prezzo finale, disponibilità o tempi di consegna; per condizioni non presenti nelle fonti la risposta rimanda alla scheda/negozio. Lo stato degli ordini rimane escluso.

Le fonti del file manuale sono dichiarazioni del titolare: non vanno considerate automaticamente più aggiornate o compatibili con ogni prodotto. Le fonti che non emergono nei limiti del recupero possono non essere trovate. Cambi strutturali del tema possono richiedere aggiornamenti dell’estrattore FAQ e nuove fixture. Nomi commerciali ambigui possono ancora richiedere la conferma privacy; non è stato ampliato indiscriminatamente il vocabolario dei nomi per aggirare tale controllo.

Il formato di risposta viene negoziato dal client: una scheda già aperta con la vecchia interfaccia riceve l’invito a ricaricare per le informazioni, senza un tool sconosciuto. Il percorso timbri continua a funzionare. Il segnale di compatibilità non è un’autorizzazione né sostituisce Turnstile.

## Verifiche e collaudo reale

Test automatici di compilazione/esclusione note, fonti esterne e redirect, parser HTML/FAQ, import parziale, conservazione delle misure, selezione ID, privacy prima di entrambe le chiamate, budget, compatibilità e preservazione della selezione. Browser: risposta con fonte, assenza di dati trovati e conservazione delle scelte. Runtime SQLite: import informativo e risposta a due fasi, persistenza e guardie preesistenti.

Collaudo reale finale su sei domande sintetiche: file grafico pronto, materiali Crystal Sign, seguito sull’uso esterno della stessa targa, spedizione gratuita, risposta dal documento locale e richiesta estranea. **6/6**, stima standard **0,0294 USD**. Due esecuzioni diagnostiche precedenti hanno individuato problemi di instradamento/fonti e sono state corrette; consumo stimato delle tre esecuzioni **0,08577225 USD**. Nessun dato cliente usato nel collaudo. I costi sono stime a listino, non fatture o garanzia di applicazione di token promozionali.

`npm run eval:knowledge` esegue il test reale separato, entro 0,25 USD per esecuzione e 1 USD aggregato noto+riserve nel registro di test; non parte con i normali controlli. L’invio di fonti al modello è motivato dal tool calling della [documentazione OpenAI](https://developers.openai.com/api/docs/guides/function-calling). La query usa i [campi prodotto Shopify](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/product).

## Verifica online del rilascio

Il primo import remoto aveva completato il catalogo ma nessuna pagina FAQ. Dopo aver reso espliciti `Accept: text/html` e l’identificazione del servizio nelle richieste, la verifica remota ha letto tre pagine e otto FAQ iniziali. Non è stato ricostruito il codice di rifiuto delle richieste iniziali: non attribuire senza prova il problema a una regola WAF specifica. È stata aggiunta diagnostica riservata degli errori pagina, senza testi cliente; il bootstrap pubblico non la espone.

Verifica finale: 1.412 prodotti, 76 profili timbro, due voci manuali, tre pagine e otto FAQ in cache; nessun errore pagina. Due aggiornamenti completati in circa 10,6 e 8,4 secondi di tempo totale, con zero documenti cambiati. Non è una misura CPU o prova di carico. Contatori aggregati conservati: 24 chiamate, 0,088604 USD stimati, nessuna riserva pendente e budget 1 USD invariato. Pagina HTTP 200 e hash degli asset remoti identici al pacchetto locale. Nessuna chiamata OpenAI durante questa verifica amministrativa.

Il [manifest](releases/2026-11-07-knowledge.json) registra la versione distribuita. Il collaudo AI reale resta quello su richieste sintetiche; non si dichiara un nuovo collaudo umano remoto con Turnstile su telefono.
