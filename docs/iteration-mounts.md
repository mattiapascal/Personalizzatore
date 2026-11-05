# Estensione montature — 5 novembre 2026

## Piano prima delle modifiche

Repository pulito su main. Il catalogo collegato contiene tre profili espliciti e 211 prodotti in revisione; molti di questi sono accessori o timbri con diciture fisse, non montature liberamente personalizzabili.

1. Leggere dal catalogo reale descrizioni, varianti/opzioni e dati tecnici esistenti, senza creare o modificare metafield. Usare solo dati espliciti (misure in mm, diametri, tag di montatura, personalizzazione dichiarata); non dedurre misure da numeri di modello.
2. Ampliare i profili a manuale, tascabile e a secco, forme rettangolare/quadrata/tonda, mantenendo i profili TEST e la produzione non approvata. Ogni variante dimensionale deve avere un profilo identificabile, senza scegliere arbitrariamente la prima variante.
3. Distinguere formato dell'impronta da dimensioni della scocca; i dati discordanti o incompleti vanno in revisione. Escludere accessori, diciture fisse, componibili e datari/numeratori con zone riservate non definite.
4. Eliminare le interruzioni delle domande per manuali/tondi; aggiungere le nuove opzioni ai contratti AI e al riepilogo. Richieste di diametro e forma quadrata devono essere comprese e validate.
5. Canvas e SVG tondi devono usare un limite circolare reale, non il quadrato circoscritto; verificare angoli dei testi, bordo e cambio modello. Supportare piccole montature senza creare un documento iniziale fuori area. Conservare le fixture/JSON storiche.
6. Test automatici per profili e varianti, regole, selezione → canvas → JSON/SVG e regressioni; verificare il catalogo reale aggiornato. Nessuna modifica al negozio, tema, BSS, PitchPrint o checkout; nessun deploy.

Evidenze iniziali: i timbri manuali tondi espongono l'opzione `Diametro (mm)` con ID variante distinti. Il timbro in plastica ha una variante 45 mm mentre la descrizione breve elenca solo 30/35/40: discordanza da trattare esplicitamente. Il Trodat Ideal a secco espone due varianti circolari 41/51 mm e una rettangolare 51×25 mm. La query corrente per titoli include anche inchiostri/cuscinetti e diciture fisse: non abilitarli come montature grafiche.

## Implementazione ed esito

Lettura reale completa: 228 prodotti, 214 ACTIVE con onlineStoreUrl nell'ambito `title:timbr*`. Profili derivati: **62 varianti su 50 prodotti** (37 automatici, 13 manuali, 9 tascabili, 3 a secco; 33 rettangoli, 22 tondi, 7 quadrati). Sono conteggi di profili, non di modelli commerciali distinti. **165 prodotti** esclusi o da verificare: 106 esclusioni di perimetro e 59 revisioni; la referenza plastica tondo compare anche nei profili con i tre diametri coerenti. Nessun prezzo/disponibilità presunto.

Regole `mount-rules-v1` in `server/mount-profiles.ts`:

- Titolo/tag dichiarano il meccanismo; il tascabile ha priorità anche se autoinchiostrante. Descrizione/scheda devono dichiarare personalizzazione libera, logo o composizione. Accessori/diciture fisse/componibili/datari/numeratori richiedono altri flussi.
- Formato da opzione esplicita `Diametro (mm)`, titolo variante con unità oppure titolo prodotto con unità. Conversioni cm→mm aritmetiche; nessuna misura ricavata dal numero del modello o dall'handle.
- La descrizione breve esistente controlla la coerenza dei formati; non si ruotano implicitamente misure discordanti. Varianti non lette integralmente, forma quadrata con lati diversi e diametri assenti nell'elenco tecnico restano in revisione. Non viene risolto automaticamente quale fonte Shopify sia corretta.
- Un profilo per variante e chiave composta Product GID + Variant GID. La pagina prodotto apre la variante tramite `?variant=ID`, senza scrivere opzioni o avviare PitchPrint.
- Tutti i limiti produttivi ignoti restano null. Fonte e misure sono nominali; anche il timbro a secco usa soltanto un profilo grafico TEST, senza certificare materiale carta, spessori o rilievo.

Il cliente viene interpretato dall'AI con tool strict aggiornati (`stamp-requirements-v5-mounts`), non dal parser dei dati di catalogo. Nuovi requisiti: materiale per manuali, forma quadrata, diametro distinto dall'ingombro. Le domande proseguono per tutte le montature. Il riepilogo include il materiale quando pertinente; una correzione da tondo a rettangolare ritira il vecchio diametro.

La stessa variante scelta arriva nel documento e nel link Shopify. Cerchio reale per validazione e clipPath SVG; testo e bordo restano oggetti vettoriali editabili nel laboratorio. Cambi variante conservano oggetti/ID quando entrano; altrimenti JSON precedente salvabile e scelta esplicita di una nuova bozza. I 62 documenti iniziali sono validi con metriche Fabric browser.

## Mantenimento dell'aggiornamento

Il backend importa e ricostruisce i profili all'avvio, ogni 300 secondi e su richiesta manuale. Nuovi ID coerenti entrano senza aggiornare un registro manuale; rimozioni/archiviazioni/non pubblicazione escono. Ogni import è completo e atomico; cache precedente conservata su errore. La cache è legata a query e versione regole e il contenuto ha un hash separato dalla data di verifica.

La UI interroga lo stato ogni dieci secondi e applica automaticamente il nuovo catalogo fuori da una chiamata AI o scrittura nel canvas. Requisiti preservati, candidati rivalutati; le bozze non vengono approvate automaticamente sulla nuova versione. Oltre dieci minuti (o due intervalli, se maggiori) senza lettura completa riuscita, nuove proposte e SVG sono sospesi. Il JSON rimane esportabile. Una lettura riuscita ripristina la freschezza anche se il contenuto è identico.

Il timer funziona **solo con il server locale aperto**. Al riavvio rilegge subito Shopify. Un servizio attivo a computer spento richiede hosting/webhook/autenticazione e autorizzazione separata: nessuno creato o pubblicato.

Per rigenerare consapevolmente le fixture: `npm run catalog:audit` legge i dati in `.local/mount-audit.json`; `npm run fixtures:mounts` genera i profili TEST e nove fonti di regressione sanitizzate. Questi comandi non modificano Shopify. `npm run schemas` allinea i contratti JSON. `npm run capture:mounts` produce tre coppie JSON/SVG reali Fabric e anteprime usando fixture e bloccando traffico esterno.

## Verifiche e limiti

- 69 test unitari e 18 browser e2e superati; build e controllo credenziali nel bundle superati. Comprendono conflitti delle fonti, nuovi ID, varianti/link esatti, cache incompatibile, freschezza, cerchio, cambio variante, reset bozza e tutti i formati iniziali.
- Query Admin 2026-10 validata: **VALID**, scope `read_products`; lettura backend reale verificata con 62 profili e stato fresco. Nessuna mutazione Shopify.
- Quattro casi AI inventati superati: manuale con refuso e diametro in cm, tascabile autoinchiostrante quadrato, timbro a secco, materiale con refuso e contesto. 6.367 token input/300 output noti, stima standard 0,00612525 USD, riserva 0,05445 USD. Il corpus storico di 20 casi non è stato rieseguito integralmente con v5.
- Tre esempi JSON/SVG acquisiti: legno tondo 35 mm, tascabile quadrato 12 mm, a secco tondo 41 mm. Anteprime tondo desktop/mobile ispezionate: nessuna sovrapposizione o taglio del formato rilevati. Prove mobile Chromium emulato, non dispositivo fisico.
- **Illustrator non collaudato**. Resta da confermare area utile, font/margini/tratti per ogni montatura, soprattutto a secco, e correggere le fonti discordanti tramite un'attività Shopify separatamente autorizzata. Loghi/scene complesse e comandi grafici AI naturali restano nel backlog.

Nessuna modifica BSS/PitchPrint/tema/prezzi/varianti/carrello/checkout, nessun deploy e nessun nuovo servizio esterno.
