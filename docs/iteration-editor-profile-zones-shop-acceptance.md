# Profili versionati, zone visuali, varianti Shopify e collaudo raggruppato

Incremento locale del 9 novembre 2026, su mandato di procedere autonomamente e raccogliere le prove del titolare per la mattina del 10 novembre. Nessuna modifica a negozio, tema, chat pubblicata, PitchPrint, BSS, prezzi, acquisti o servizi a pagamento.

## Percorsi utilizzabili

- Collaudo: <http://127.0.0.1:5173/editor/admin?section=acceptance>
- Profili: <http://127.0.0.1:5173/editor/admin?section=profiles>
- Prodotti reali: <http://127.0.0.1:5173/editor/admin?section=products>
- Workspace esistente: <http://127.0.0.1:5173/editor?workspace=1>

Avviare con Node della `.nvmrc` e `npm run dev` se necessario. Il collaudo richiede la stessa origine e lo stesso browser per ritrovare gli esiti salvati; esportarli per conservarli altrove.

## Associazione amministrativa a prodotto e variante

Il profilo può ora avere un’associazione al catalogo TEST esistente oppure a un prodotto/variante Shopify reale. Il selettore riutilizza ricerca, collezioni, tag, pagine e immagini del navigatore commerciale. Dopo la scelta del prodotto legge le varianti su richiesta; se sono più di una richiede una scelta esplicita. Il colore del corpo della montatura non diventa una scelta cliente.

La nuova query costante `EditorShopVariants`, Admin API **2026-10**, richiede `read_products` e legge soltanto ID, titolo, stato, SKU e opzioni descrittive delle varianti. Niente prezzi, disponibilità, clienti o scritture. Pagine da 50, massimo 2.000 varianti, rilevazione cursori ripetuti, duplicati e prodotto cambiato durante la lettura; timeout e retry limitato in caso di throttling. Cache in memoria di dieci minuti, richieste concorrenti condivise, copie indipendenti dei risultati. Endpoint locale `GET /__editor-local/admin/shop-product?id=...`, con le protezioni loopback/header/origine preesistenti.

Al salvataggio il server ricontrolla le varianti tramite una lettura aggiornata: non si fida dei nomi o dell’appartenenza dichiarati dal frontend. Se la variante non appartiene al prodotto o la lettura fallisce, non salva nulla. Conserva ID e nomi verificati con data della lettura. Un prodotto non attivo è segnalato nel selettore; l’associazione resta una bozza amministrativa.

**Nessuna dimensione utile viene dedotta dal titolo, SKU o dalle opzioni.** Area utile, margine e dati tecnici restano espliciti. L’associazione non rende automaticamente il prodotto utilizzabile nel canvas e non certifica compatibilità produttiva.

Query validata contro lo schema Shopify; log privato `.local/editor-shop-variants-validation.log`. Riferimenti usati: [Product](https://shopify.dev/docs/api/admin-graphql/2026-10/objects/Product), [ProductVariant](https://shopify.dev/docs/api/admin-graphql/2026-10/objects/ProductVariant). Skill [Shopify](</Users/davide/.codex/plugins/cache/openai-curated-remote/shopify/4.1.3/skills/shopify/SKILL.md>), telemetria disattivata.

## Zone riservate visuali nel profilo

Il nuovo `ZoneDesigner` permette rettangoli ed ellissi, selezione, spostamento, otto maniglie, misure e nomi editabili, griglia 1 mm, Maiusc per proporzioni, Esc per annullare il gesto e Undo/Redo. Le icone riutilizzano il sistema dell’editor; i campi numerici preservano la digitazione diretta e usano passi di 0,1 mm. X e Y delle zone sono misure dal bordo superiore sinistro; le maniglie mantengono il lato o angolo opposto.

Un trascinamento produce un solo comando al rilascio. Preview e annullamento non scrivono sul disco. Gesti e valori numerici usano gli stessi comandi tipizzati `addZone`, `updateZone`, `removeZone`, con revisione attesa, ID stabili, massimo 20 zone e aggiornamenti atomici. Il disegno aggiorna il modulo; **solo Salva profilo locale persiste i dati**.

La zona deve entrare completamente nella sagoma, anche quando l’area è tonda. Il contenimento ellittico usa il massimo radiale della curva, non gli angoli del suo box; è collaudato anche contro campionamento fitto deterministico. Il validator del profilo e lo schema di anteprima condividono questo controllo. Se il titolare restringe l’area e alcune zone diventano invalide, può correggerle una alla volta; il salvataggio finale le verifica tutte. Non viene spostata o ridotta automaticamente alcuna zona fisica.

Queste zone **non sono ancora blocchi applicati dal motore grafico cliente**. Non entrano nell’SVG produttivo. Non costituiscono una verifica di collisione fra grafica e zone meccaniche nel workspace attuale.

## Storico dei profili

Ogni modifica o archiviazione di un profilo conserva integralmente la versione precedente nel nuovo campo opzionale `productionProfileHistory`. Gli archivi precedenti rimangono leggibili: nessuna migrazione obbligatoria e nessuna ricostruzione inventata delle versioni già perse prima di questo incremento.

Il modulo consente di consultare le versioni precedenti e caricarle come base. Il caricamento non modifica il profilo salvato; un successivo salvataggio crea una nuova versione crescente e mantiene lo storico. Limite 2.000 snapshot storici, nel limite complessivo dell’archivio locale di 32 MB; il superamento viene rifiutato senza cancellare versioni. Il controllo di revisione dell’archivio impedisce sovrascritture da una seconda finestra. Lo storico è una preparazione al futuro riferimento versionato nei documenti; il documento grafico attuale non lo usa ancora.

## Collaudo del titolare

La nuova sezione **Collaudo** raccoglie 18 prove in sei gruppi: archivio, font, prodotti/profili, editor, progetti/formati, produzione. Ogni prova ha passi, risultato atteso e collegamento alla pagina locale in una nuova scheda.

Esiti possibili: Da eseguire, Superata, Problema, Da verificare; note libere, filtri per gruppo/esito, contatore ed esportazione Markdown/JSON. Gli esiti partono sempre da Da eseguire; nessun risultato automatico certifica una prova manuale. Persistenza nel solo browser con checklist versionata, sincronizzazione fra schede e controllo di revisione prima di una modifica. In assenza di memoria browser la pagina resta utilizzabile e il resoconto è scaricabile. Azzeramento con conferma esplicita; progetti, profili e font non vengono toccati.

Non contiene dati produttivi inventati o modifiche Shopify. Usare copie marcate TEST durante le prove di scrittura. Illustrator e lavorazione fisica rimangono controlli umani distinti.

## Verifiche e limiti

Unit test nuovi: contenimento rettangolare/tondo/ellittico, massimo radiale, comandi e revisioni, Undo/Redo, ancoraggi, storico immutabile e conflitti, paginazione/cache varianti, verifica server, resoconto manuale. Browser nuovi: disegno e maniglie, salvataggio/versioni, forme tonde e annullamento, associazione prodotto/variante, checklist con persistenza/esportazione e memoria indisponibile. Archivi temporanei separati nelle prove che scrivono.

Verifica reale privata `.local/editor-profiles-live-smoke.json`: lettura di un prodotto reale con cinque varianti, selezione e schermate senza salvataggio, zero errori browser, hash dell’archivio personale invariato. Non prova misure utili, disponibilità, regole BSS o idoneità produttiva.

Checkpoint completo passato: **547 unitari/72 file, 319 browser laboratorio, build/TypeScript e scansione segreti**, log `.local/editor-profiles-complete-check.log`; **13 browser pubblici locali** passati, log `.local/editor-profiles-public.log`. Schermate desktop/mobile di zone e checklist ispezionate, senza overflow né errori, archivio personale invariato (`.local/editor-zones-capture.log`). Risultati e limiti anche nello [stato corrente](editor-local-status.md). Verifica HTTP effettiva con server locale separato e archivio temporaneo: lettura varianti reali, salvataggio con nomi canonici, storico, rifiuto di revisione obsoleta/variante estranea/header mancanti, atomicità e archivio personale invariato (`.local/editor-profiles-http.log`). Dopo l’ultima precisazione testuale sulle zone preparatorie e l’aggiunta del generatore della checklist: build/TypeScript e 7 browser pertinenti passati (`.local/editor-profiles-final-{build,browser}.log`). Nessun test Illustrator o produzione fisica dichiarato eseguito.

Restano come incremento successivo il riferimento a profili verificati nel documento canonico, l’applicazione dei loro vincoli a tutti i comandi manuali/AI, le zone proprie dei template e il collegamento dei prodotti reali alla galleria/editor. Questo passaggio richiede di separare il formato grafico generale dallo schema timbri usato dalla chat e di verificare importazioni, trasformazioni e snapshot con le stesse regole. Non basta disegnare una zona in sovrimpressione per proteggerla.
