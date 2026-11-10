# Archivio visuale, tag e prodotti reali

Incremento locale del 9 novembre 2026. [Piano iniziale](iteration-editor-archive-catalog-plan.md). Nessuna pubblicazione o modifica allo store.

## Archivio e tag

Nelle sezioni **Template** e **Composizioni clienti** ogni riga mostra una miniatura della composizione. La generazione riusa il documento canonico e l’esportatore esistenti, comprese risorse incorporate e colore dell’impronta; non ricostruisce la grafica da descrizioni. Le miniature vengono richieste quando vicine all’area visibile. Le esportazioni sono serializzate; cache SVG fino a 32 elementi/16 MB e URL temporanei rilasciati quando la riga esce dall’area visibile. Una miniatura non disponibile non impedisce la selezione del progetto. Le risorse del renderer restano condivise: non è un collaudo di grandi archivi con centinaia di font/immagini differenti.

L’import JSON è raccolto in una sezione richiudibile, lasciando spazio all’elenco. Il pannello del dettaglio conserva modifica, duplicazione, esportazione e archivio precedenti.

I tag sono assegnabili nel backend e nel salvataggio dell’editor. Il campo accetta più tag separati da virgole, offre un menu dei tag già salvati e consente di rimuovere singoli tag. Il vocabolario è condiviso fra template e progetti; rimane disponibile anche se un tag viene rimosso da tutti i record. I tag di vecchi archivi vengono riconosciuti senza richiedere una migrazione manuale. Maiuscole, spazi ripetuti e accenti Unicode equivalenti non producono doppioni; si conserva la prima etichetta leggibile.

**Filtra per tag** offre intersezione (tutti/AND) o unione (almeno uno/OR), combinabili con ricerca testuale e stato archiviato. **Ordina elenco** permette priorità dei tag, nome o ultima modifica.

**Ordine predefinito dei tag**: trascinamento della maniglia, frecce accessibili e conferma tramite **Salva ordine predefinito**. La priorità è condivisa e persistente; si confronta prima la presenza del primo tag, poi dei successivi, infine il nome. Un riordino non modifica i documenti o le versioni dei template. Revisione obsoleta, tag mancanti/sconosciuti o duplicati sono rifiutati senza scritture parziali. I nuovi tag si aggiungono in fondo all’ordine salvato.

Campo compatibile `tagOrder` nell’archivio locale, comando `setTagOrder`. Rimangono massimo 20 tag per record, 40 caratteri per tag e 4.000 etichette condivise, entro il limite generale dell’archivio. I tag dell’archivio sono distinti dai tag prodotto Shopify.

## Progetto cliente → template

**Copia nei template** crea record e documento con nuovi ID, revisione grafica 0 e versione archivio 1. Conserva grafica, testi, immagini, font e tag; non copia il riferimento cliente o associazioni commerciali. Il contenuto grafico non viene anonimizzato: la copia resta modificabile dal titolare. Originale e configurazioni del carrello non vengono toccati. Nuovo comando `compositionToTemplate`, con revisione attesa e controllo del tipo sorgente.

## Font

Le anteprime di tutti i font installati si caricano automaticamente, con tre richieste concorrenti e cancellazione quando si lascia il pannello. Un errore mostra un messaggio sul singolo font e la possibilità di riprovare; il resto della libreria continua a funzionare. Nessun caricamento del catalogo Google viene avviato automaticamente.

Il campione resta personalizzabile. La libreria installata precede il modulo di caricamento e il backup. Dati descrittivi, licenza e provenienza sono raccolti sotto **Informazioni sul font**; i campi facoltativi del caricamento sono richiudibili. Conservazione e backup restano invariati. Famiglia/peso/stile tecnici continuano a servire per riconoscere le varianti; le informazioni di licenza/provenienza aiutano a rintracciare risorse e condizioni d’uso senza obbligare l’operatore a compilarle.

## Vero catalogo del negozio

Nuova sezione [Prodotti del negozio](http://127.0.0.1:5173/editor/admin?section=products): lettura completa di prodotti, collezioni e appartenenze, ricerca per nome/handle/tag, collezione, tag prodotto AND/OR, stato e paginazione a 24 elementi. Data dell’ultima lettura e **Aggiorna da Shopify** espliciti. Attivo è uno stato di catalogo, non una verifica di disponibilità.

Verificato in sola lettura il negozio collegato. Lettura reale completata: **1.597 prodotti, 73 collezioni, 99 tag prodotto**, comprese bozze e archiviati. È un risultato alla data della lettura, non una garanzia futura del conteggio. Il connettore ha confermato il totale di 1.597 prodotti; la lista locale è stata ottenuta dall’adattatore Admin dedicato.

Query Admin **2026-10**, tutte validate: prodotti con paginazione, collezioni e pagine aggiuntive delle appartenenze di un prodotto. Nessuna mutazione o query prezzi/clienti/ordini nel nuovo adattatore. Richieste con credenziali solo nel server; dominio vincolato al negozio previsto, redirect non seguiti, timeout e limiti di dimensione/paginazione. Immagini limitate al CDN Shopify e link pubblici al dominio del negozio.

Cache privata `.local/editor-shop-catalog.json`, sostituita atomicamente solo dopo una lettura completa. Validità ordinaria di dieci minuti, refresh esplicito disponibile; un errore conserva l’eventuale copia precedente e lo segnala. Nessun ripiego nascosto sui fixture. Limiti locali: 5.000 prodotti/collezioni, 20 MB del catalogo. Endpoint `GET /__editor-local/admin/shop-catalog[?refresh=1]`, protetto come il resto del backend locale. Schema esportato `ShopBrowserCatalog.json`.

Il server locale precedente era avviato in demo con Shopify disabilitato tramite ambiente; è stato riavviato leggendo la configurazione privata esistente, **mantenendo AI_PROVIDER=demo**. Nessuna chiamata AI a pagamento. La chat pubblicata, Worker, tema e integrazioni commerciali non sono stati modificati.

**Limite operativo:** consultare un prodotto commerciale non lo rende automaticamente apribile nel canvas. Associazioni tecniche, dimensioni utili e regole vanno collegate ai profili verificati; l’editor/template gallery mantiene ancora i tre formati TEST precedenti. Questo incremento non cambia la versione catalogo dei progetti salvati.

## Profili e template

La raccomandazione è un modello ibrido descritto in [profili e template](editor-profile-template-boundary.md). Qui non è ancora stato aggiunto un editor visuale delle zone: lo schema dei profili rimane un’anteprima dei campi inseriti. Non spostare tutti i vincoli produttivi dentro ogni template.

## Verifiche

Sette nuovi unitari su vocabolario, persistenza/ordine, AND/OR, copia indipendente, paginazione completa, cache/concorrenza e errori. Cinque browser mirati passati, inclusi i tre nuovi flussi; nove regressioni pertinenti passate. Lettura reale e sei schermate desktop/mobile dell’archivio/font/catalogo verificate; nessun errore browser, file dell’archivio personale confrontato e rimasto identico. Le scritture di prova usano cartelle temporanee e dati TEST.

Checkpoint completo e log nello [stato locale](editor-local-status.md). Nessun collaudo Illustrator o produzione fisica, nessun deploy, modifica BSS/PitchPrint, prezzi, checkout o account.

Fonti ufficiali: [prodotti](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/products), [collezioni](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/collections), [Product](https://shopify.dev/docs/api/admin-graphql/2026-10/objects/Product). La validazione delle query è stata eseguita con la skill Shopify, con telemetria disattivata.
