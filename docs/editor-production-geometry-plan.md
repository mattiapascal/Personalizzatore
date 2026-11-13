# Controlli geometrici dei profili — diagnosi e ordine di implementazione

13 novembre 2026. Preparazione iniziale in sola lettura durante il collaudo generale del [collegamento dei profili](iteration-editor-production-profile-link.md); nessuna modifica ai sorgenti durante quella suite. Dopo il prerequisito PDF è stato implementato il [primo controllo visuale di margini e zone](iteration-editor-production-geometry.md): analisi della pittura per riquadri, report diagnostico e API locale, senza blocco della conferma. Le guide restano distinte dalle regole finali di produzione. Il piano sotto riguarda anche il lavoro ancora necessario, non dichiara completato il motore produttivo.

## Evidenze che determinano il prossimo lavoro

1. Il documento conserva già un profilo per pagina, con ID/versione, area fissa o parametrica. `production-check.ts` e `text-production.ts` condividono le conferme locali; i minimi testuali e i campioni B/N non richiedono un nuovo documento o una seconda scena.
2. `objectGeometry` misura il frame trasformato, non necessariamente l’inchiostro. Un rettangolo senza riempimento può circondare la zona del datario senza stamparvi nulla; un’ellisse può non intersecare una zona benché si sovrappongano i rispettivi rettangoli. Non usare l’intersezione dei bounding box come prova di una violazione.
3. Un prototipo privato, `.local/profile-geometry-probe.ts`, ha verificato 23 casi sui predicati fra frame convessi e zone rettangolari/ellittiche: orientamento invertito, contenimento, tangenza senza sovrapposizione positiva, falso allarme dei bounding box e zona interna al vuoto di una cornice. È soltanto una prova dei predicati, non un controllo degli oggetti dipinti e non una certificazione di tutti i casi affini.
4. Il backend dispone già di Chromium e di un renderer locale per i PDF (`scripts/local-pdf-export.ts`). È riutilizzabile per eseguire lo stesso motore Fabric e gli stessi font del frontend, senza introdurre misure basate su font del computer.
5. Prima di riusarlo va corretto un difetto riprodotto: il PDF con WOFF2 valido e quello con WOFF realmente compresso falliscono con `UnverifiedTextGeometryError`. Il renderer invoca il serializzatore sincrono dopo il solo caricamento del font, senza attendere la copertura; inoltre blocca la richiesta locale di analisi WOFF2. L’editor e il percorso SVG pubblico hanno già il preflight asincrono necessario.
6. Una copia privata del modulo (`.local/prototype-local-pdf-export.ts`) ha dimostrato la correzione riusando `exportDocumentSvg` e l’analisi dei soli byte WOFF2 incorporati. La [correzione è ora applicativa e collaudata](iteration-editor-pdf-font-preparation.md): WOFF2, WOFF realmente compresso, stili locali, pagine diverse e riferimenti, senza fallback o scritture negli archivi. Le prove private precedenti restano in `.local/profile-link/pdf-font-probe.log`, `pdf-font-prototype.log`, `pdf-woff-probe.log`.

## Incremento completato: font del renderer PDF

Dopo l’esito terminale della suite generale è stato completato il [prerequisito PDF](iteration-editor-pdf-font-preparation.md):

- percorso SVG asincrono condiviso, senza duplicare la preparazione dei font;
- analisi WOFF2 in memoria, limitata ai byte esatti dei file del documento;
- glifi mancanti e stili simulati rifiutati, nessun fallback;
- sole risorse usate dalla scena preparate, originali e altre pagine conservati nel JSON;
- PDF effettivi WOFF2/WOFF, testo misto, risorse inutilizzate, errori, pagine e riferimenti collaudati con Poppler/qpdf e download reale;
- nuovo campione JSON/SVG/PDF, 1.131 unitari, 13 browser pertinenti e 68 campioni passati. Illustrator resta da collaudare.

## Motore di analisi geometrica

**Stato dopo il primo incremento:** protocollo per documento/revisione, analisi della pittura a 0,025 mm, profilo per pagina, margini/zone, riferimenti, sfondi espliciti, risorse limitate, backend e risposta obsoleta sono [implementati e collaudati come diagnostica](iteration-editor-production-geometry.md). Il passo della griglia non è una prova matematica di precisione: non usare ancora il report come approvazione automatica. Restano il collegamento alla conferma atomica con la gestione esplicita delle incertezze, i fissaggi selezionati e i controlli di incisione/vernici.

### Dati e risultato

L’input è una copia del documento canonico e del profilo versionato già collegato. Il risultato deve indicare documento/revisione, pagina, profilo/versione, regola e oggetti coinvolti. Tre esiti distinti: violazione dimostrata, controllo dimostrato nei limiti dichiarati, non verificabile/incompleto. Un errore di font, decoder, budget o precisione non diventa un esito positivo.

Non spostare/ridimensionare la grafica per far passare i controlli. Modifica manuale, comando AI simulato e successiva conferma devono usare gli stessi dati e gli stessi controlli. Cambiare pagina, testo, font, crop, maschera, colore/opacità o versione del profilo invalida l’esito relativo al contenuto modificato. Un esito obsoleto non deve autorizzare la conferma di una revisione successiva.

### Geometria e pittura

- Usare i bounding box soltanto per escludere rapidamente oggetti sicuramente lontani dalla zona, non per dichiarare una collisione.
- Per rettangoli semplici, linee, cerchi ed ellissi, distinguere riempimento, contorno, spessore e trasparenza. Considerare rotazione, inclinazione e riflessioni con lo stesso ancoraggio fisico del renderer.
- Vettori/curve: conservare fori, regola di riempimento, contorni aperti, cap/join/miter, clip e maschere. La precisione di approssimazione va dichiarata; i casi sul confine entro tale errore restano incerti.
- Testi: file e metriche verificati, stili locali, linee/giustificazione, dilatazioni e testo su tracciato. Non sostituire il testo con il box di contenimento per provare una violazione.
- Raster: analizzare il risultato di crop, filtri, alpha, orientamento e maschere. Il controllo B/N attuale riguarda ancora l’intera immagine; non dichiararlo già equivalente a un controllo della sola parte visibile.
- I riferimenti individuali/di gruppo sono esclusi dalla grafica da produrre. Sfondi/materiali e cornici tecniche non vanno confusi con l’inchiostro.
- L’ordine dei livelli conta: un controllo per oggetto non può ignorare un successivo knockout bianco o una maschera. Per il timbro contano i segni effettivi dell’impronta, senza il colore dimostrativo del tampone. Per una targa stampata il bianco può invece essere un colore produttivo: non cancellarlo per analogia con il timbro.

### Margine, sagoma e zone

Il valore proviene dal profilo: `null` resta un dato mancante, zero è un valore esplicito. Non estendere il margine TEST di 1 mm a ogni lavorazione. Definire separatamente i casi di fondo produttivo a tutta pagina già identificato come sfondo: l’eccezione non può dipendere dal colore o dalle grandi dimensioni di un oggetto.

Le zone meccaniche rimangono fisiche al cambio formato, come nel collegamento parametrico. I fori/accessori selezionati e le loro zone di rispetto vanno analizzati dalla configurazione effettiva; i kit soltanto disponibili nel profilo non devono diventare fori o ostacoli già presenti.

Preservare la richiesta di poter lavorare temporaneamente con oggetti parzialmente fuori foglio e di non cancellarli implicitamente. Il controllo finale e la modifica della bozza sono momenti distinti; non reintrodurre il vecchio errore generico durante un normale trascinamento parziale.

### Renderer e budget

Riutilizzare il renderer locale già presente, dopo la correzione dei font, con risorse incorporate e rete limitata al laboratorio. Non fidarsi di una misura o di una maschera dichiarata dal client come prova per l’API di conferma: il backend deve poter ripetere il controllo.

Per le scansioni raster usare riquadri e limiti espliciti, non una bitmap dell’intera tavola da 3000 mm. Il primo controllo diagnostico legge a passi di 0,025 mm, con tetto di 64 MP/20 s e sorgenti distinte fino a 48 MP; provati formati fino a 3000 mm. Questi limiti non certificano il massimo errore dei contorni, i dettagli sotto griglia o la memoria totale delle cache Fabric. Prima del blocco produttivo completare tali verifiche e trattare le incertezze esplicitamente. La precisione numerica del controllo non è una nuova distanza produttiva né un nuovo minimo fisico imposto al cliente.

## Regole di lavorazione successive

- Timbri inchiostrati: preservare minimo 7 pt e impronta B/N; non dedurre tali regole per timbri a secco o targhe.
- Targhe incise: 0,5 mm riguarda le parti incise, non i vuoti. Il corpo del font o il bounding box di un logo non certificano lo spessore minimo dei dettagli. Modellare la punta e collaudare casi reali prima di attribuire una classe produttiva/costo.
- Vernici differenti: il valore confermato è 30 mm, non 3 mm. Le variazioni dei pixel di antialiasing non sono automaticamente colori produttivi differenti; servono zone/colore di lavorazione definiti.
- Targhe stampate: non ereditare punta, distanza vernici o corpo minimo del timbro. Non inventare nuove restrizioni per renderle simili alle incisioni.
- Nessuna stima di prezzi/tempi macchina senza parametri calibrati e fonte commerciale autorevole. BSS/Preventivometro e integrazione online rimangono fuori da questa fase.

## Accettazione del prossimo incremento geometrico

Coprire almeno: cornice vuota intorno a una zona; ellisse con bbox sovrapposti ma nessuna intersezione; contatto tangente; bordo dipinto realmente dentro la zona; testo con box sovrapposto ma glifi fuori; stili locali che cambiano l’ingombro; foro vettoriale; maschera; raster trasparente/crop frazionario; bianco di knockout e ordine dei livelli; riferimento ereditato; pagina tonda; profilo parametrico su due formati; dati mancanti; revisione obsoleta; rifiuto atomico di conferma senza alterare bozza o configurazioni già congelate.

Questo piano non autorizza nuovi deploy, servizi a pagamento, migrazioni di dati, modifiche a Shopify/tema/PitchPrint/BSS/prezzi/carrello online/checkout o nuove funzioni avanzate di disegno. Il lavoro rimane locale e incrementale.
