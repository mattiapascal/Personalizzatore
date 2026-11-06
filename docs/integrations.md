# Confini e conferme necessarie

## Dimensioni variante — 6 novembre 2026

Definizioni reali lette in sola lettura: `custom.larghezza` (Larghezza) e `custom.altezza` (Altezza), owner PRODUCTVARIANT, tipo `number_decimal`, descrizione «Valore espresso in millimetri.». Sono ora la fonte dimensionale esclusiva. Entrambi richiesti validi; nessun valore preso dal titolo in loro assenza. Descrizioni discordanti vengono segnalate, senza prevalere sui metafield. Il 4913 restituisce 58.0×22.0; selettore/canvas/SVG usano gli stessi 58×22 mm.

Catalogo aggiornato: 66 profili su 64 prodotti, 16 con avvisi descrittivi. Quindici varianti su quattro prodotti hanno i campi vuoti: legno/ottone (7), legno tondo (3), plastica tondo (4), Pocket Stamp R40 (1). Sono sospese; nessun dato compilato o modificato su Shopify. Il conteggio 62 e le regole precedenti riportate sotto sono storici. Dettagli in [iteration-variant-dimensions.md](iteration-variant-dimensions.md).

## Aggiornamento backend/chat — 5 novembre 2026

Aggiornamento successivo montature: letti anche descrizioni, `custom.short_description`, titoli/opzioni delle varianti; nessun campo creato o modificato. 228 prodotti nell'ambito, 214 attivi con URL, 62 profili su 50 prodotti. 165 prodotti esclusi o da verificare, inclusa una referenza con tre varianti utilizzabili e una discordante. Dettagli e regole in [iteration-mounts.md](iteration-mounts.md); i conteggi sotto descrivono l'incremento precedente.

La sincronizzazione ricostruisce i profili e li applica automaticamente ai risultati quando non ci sono gesti/richieste in corso. Oltre dieci minuti senza lettura riuscita, proposte e SVG sono sospesi; JSON e requisiti restano disponibili. La nuova query è **VALID** contro Admin 2026-10 (`read_products`), eseguita in sola lettura anche dal backend reale.

Il titolare ha configurato direttamente chiave OpenAI e token Admin nel file privato `.env.local`. Nessuna credenziale è stata copiata dagli handoff o inviata in chat/Git. Provider reale verificato con frasi inventate. Catalogo Admin collegato in sola lettura, query `title:timbr*`, API 2026-10: lettura completa riuscita, 3 profili censiti e 211 prodotti attivi/pubblicati da verificare. Timer 300 secondi a server aperto, cache atomica, versioni e aggiornamento manuale. Il numero dipende dall'ambito query, non è un censimento di tutti i prodotti del negozio.

La query è stata validata sia dal connettore sia dal validatore Shopify 2026-10: **VALID**, scope `read_products`. Nessuna mutazione, nuova app, nuova sottoscrizione webhook, modifica tema, BSS, PitchPrint, prezzo, variante o checkout. La conferma nel browser del cliente dell'acquistabilità resta distinta dalla presenza dell'URL Admin.

Conferma esplicita del titolare: **No-AI limita le funzioni generative offerte da PitchPrint all'utente e non riguarda questo progetto**. Il tag rimane nei dati Shopify e non viene modificato. Le vecchie note di audit che lo indicavano ignoto sono superate da questa conferma. `warning-pitchprint` e il funzionamento futuro dell'integrazione rimangono da collaudare, senza modificarli.

## Verifiche iniziali del primo incremento

Shopify connesso al dominio atteso, piano Basic. Letti soltanto metadati negozio, risultati di ricerche circoscritte, dettagli di tre prodotti e `Product.onlineStoreUrl`. URL canonici restituiti dall'Admin API, non emessi dal modello. Nessuna mutazione, installazione app, login CLI con nuovi permessi, intervento sul tema, test carrello o ordine. HTTP diretto alle pagine limitato con 429: la raggiungibilità reale tramite browser cliente rimane da ricontrollare. Non ripetuti tentativi automatici.

Le fixture sanitizzate sono in `fixtures/products/shopify-stamps.TEST.json`: prodotto/variante, titolo, handle, URL, tag e nominali. Prezzo e disponibilità deliberatamente null. Le quantità inventario lette non autorizzano deduzioni di disponibilità; stato ACTIVE e URL non garantiscono acquistabilità. Il listino Admin non coincide necessariamente con il prezzo storefront, che può comprendere sovrapprezzi.

## Impatto degli handoff aggiunti dall'utente

Letti l'handoff principale del tema (aggiornamenti fino al 27 luglio 2026), l'handoff principale Preventivometro (24 luglio), le sezioni FAQ e le parti del registro personalizzazioni pertinenti a product form, PitchPrint/BSS e prezzi. Consultato l'avviso di superamento del vecchio handoff tecnico Summa. Mappa e limiti della verifica in `docs/handoff-review.md`.

| Confine | Fonte / conseguenza |
|---|---|
| Prezzo timbri | `custom.sovrapprezzo`, accessori e add-on BSS nel tema. Non usare prezzo variante base per un preventivo dell'assistente |
| Fonte economica targhe | Preventivometro: motori canonici, configurazione V17 e contratto 2.0.0. Non duplicare formule in questo progetto |
| BSS online | Hook concatenati e properties necessarie alla trasformazione; non rimuoverle né riscriverle |
| Foratura targhe | Nel runtime dinamico selezione e sovrapprezzo appartengono a BSS; niente doppio conteggio nel Preventivometro |
| PitchPrint | Select OptionX stabili, sincronizzazione prima dell'apertura, properties private e campi tecnici conservati; nessuna automazione da questo prototipo |
| Catalogo grafiche | Flusso esistente usa pp_design/pp_autostart/pp_catalog_flow: non applicarli senza integrazione autorizzata e test dedicati |
| FAQ | Fonti Shopify già strutturate potenzialmente riutilizzabili per conoscenza assistente; non usarle come vincoli tecnici o prezzi senza verifica |

Il contratto **Preventivometro V2** non è la migrazione **BSS Storefront V2**. Gli handoff non autorizzano nuove operazioni esterne: le autorizzazioni storiche erano circoscritte ad altre sessioni.

## Da confermare con Shopify / titolare

- `No-AI` chiarito dal titolare come sopra; verificare gli avvisi e il percorso PitchPrint per ogni futura integrazione pubblica.
- Profili stampabili per modello/variante: area utile, margini, minimo font, colori, linee, regole logo e font disponibili. Le dimensioni del titolo sono nominali, non collaudo grafico.
- Dati discordanti: plastica tondo variante 45 mm contro scheda 30/35/40; Q30 nominale 30×30 contro descrizione breve 17×17; altri modelli con misure/forme discordanti nell'elenco locale. Non correggere automaticamente Shopify né scegliere la fonte più comoda. Datari/numeratori richiedono aree riservate documentate; i timbri a secco richiedono specifiche proprie su carta, tratto e rilievo.
- `custom.larghezza/altezza` verificati e collegati il 6 novembre; completare i campi sulle 15 varianti segnalate richiede un'attività Shopify autorizzata separatamente. `custom.spessore` esiste ma non viene usato per l'area dell'impronta.
- Stato attuale tema pubblicato e app blocks; la copia locale del tema è indietro di 12 commit rispetto al proprio tracking locale, senza fetch effettuato. Gli handoff non provano lo stato live di novembre.
- Accesso dev store/tema duplicato per il rilascio. Il backend locale legge già con accesso Admin; servono ancora profili dei nuovi modelli, servizio persistente e gestione produttiva dei casi/varianti speciali.
- Politica retention e trattamento dati per richieste reali, loghi e progetti.

## Da supporto BSS, senza migrazione

La non coesistenza V1/V2 è già riferita dall'utente: non ripetere la domanda. Acquisire invece risposta su:

- rollback V2→V1 e salvaguardia di set opzioni, formule e configurazioni;
- stabilità/versione degli hook prezzo e attributi usati dal tema (`bssFixSupportCustomExtraPrice`, `bssFixSupportCustomAttributeWhenAddToCart` e correlati);
- ciclo DOM/eventi, campi dimensionali, add-on e convivenza con PitchPrint;
- modalità supportata di test su dev/tema duplicato e procedura verificabile di ripristino.

Nessun messaggio al supporto inviato. Nessuna scrittura su BSS/PitchPrint o negozio autorizzata da questo documento.
