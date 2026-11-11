# Template esclusi: priorità aggiornate — 11 novembre 2026

> **12 novembre — importazioni locali:** archivio a **137 template**, venti nuove copie fra contorni espansi e [riconoscimento degli sfondi inattivi](iteration-editor-inactive-page-assets.md). Sei candidati che sembravano richiedere sfondi non classificati avevano in realtà descrittori inattivi: ora corretti e importati, compresi tre Attenti al cane. Il benchmark dei soli corpi con sfondi esclusi resta 279/370; il confronto completo è un controllo ulteriore. Altri 135 candidati con ruoli determinabili sono in preparazione, senza salvataggi aggiuntivi; 29 richiedono ancora classificazione/capacità. I fondi vettoriali attivi restano un incremento da implementare.


> **Stato successivo — contorni espansi:** [resoconto](iteration-editor-stroke-outlines.md). **279/370 convertibili, 91 bloccati** con colori conservati e sfondi globalmente esclusi; prioritari **278/345 convertibili, 67 bloccati**. Nessuna regressione rispetto ai precedenti 259; recuperati anche i 21 arresti introdotti correttamente dagli assi fisici esatti. Quattordici nuove bozze complete salvate dopo confronto indipendente e backup, archivio a 131 template; Azienda Agricola è una copia derivata autorizzata, il suo sorgente grezzo resta bloccato. Sfondi SVG e ruoli ancora ignoti tengono sospesi sette dei nuovi candidati. Restano soprattutto glifi/font e maschere/opacità; i conteggi sotto sono storici.


> **Aggiornamento successivo — assi fisici esatti e immagini di pagina:** [dettagli](iteration-editor-page-images.md). La nuova analisi degli stessi 370 sorgenti, sempre con sfondi esclusi, rileva **238 convertibili / 132 bloccati**: **238/345 prioritari convertibili e 107 bloccati**, 25/25 a bassa priorità bloccati. Ventuno sorgenti prima accettati vengono ora fermati per contorni non uniformi, dopo aver eliminato i margini impliciti del passaggio SVG. Una sola delle 117 bozze già importate è fra questi 21: «Retro bottiglia classico», lasciata invariata. Al primo errore i contorni prioritari sono ora 42. I conteggi e le tabelle seguenti documentano la precedente analisi; non descrivono più il convertitore corrente. Nessun salvataggio reale. Un prototipo privato di espansione dei due contorni di Azienda Agricola ha superato il confronto pixel completo, ma non è ancora una funzione generale collaudata dell’importatore.

Il titolare assegna la **minima priorità** alle categorie **Biglietti da Visita**, **Templates PitchPrint** e a **tutti i template contenenti testo curvo**. Questa scelta cambia l’ordine del lavoro, non autorizza a scartare elementi o sostituire font nelle conversioni.

## Ricontrollo

Riesaminati con l’importatore attuale i 370 sorgenti a pagina singola acquisiti dall’account: **259 convertibili / 111 bloccati**, nessun nuovo recupero o regressione rispetto all’analisi dei ritagli frazionari. Colori conservati, sfondi/materiali esclusi come nelle analisi precedenti. L’inventario è la copia locale acquisita il 10 novembre; non è una nuova scansione dell’account online.

| Perimetro a pagina singola | Convertibili | Bloccati | Totale |
| --- | ---: | ---: | ---: |
| Prioritari, con l’eccezione autorizzata Azienda Agricola 99×139 | 258 | 87 | 345 |
| Biglietti da Visita / Templates PitchPrint | 1 | 12 | 13 |
| Testo curvo nelle altre categorie, esclusa l’eccezione | 0 | 12 | 12 |
| Totale | 259 | 111 | 370 |

L’inventario complessivo ha 473 sorgenti: altri 95 delle due categorie a bassa priorità sono multipagina, insieme a 8 delle categorie prioritarie. **Il multipagina resta escluso dall’editor.** I quattro sorgenti di numeri civici a nove pagine e i quattro di cartelli viari a due pagine possono essere valutati per estrazione di pagine utili come template autonomi.

Le categorie sono abbinate all’ID del file dell’inventario: in quattro sorgenti legacy il `designId` interno è diverso dall’ID nell’elenco. Usare solo il primo avrebbe lasciato senza categoria quattro template a bassa priorità e falsato il conteggio dei prioritari.

## Sorgenti multipagina prioritari: contenuto verificato

| Categoria | Nome nell’inventario | Pagine | Contenuto |
| --- | --- | ---: | --- |
| Numero civico con bordo blu, con variazioni | 15×10 MODELLI / 16×12 MODELLI | 9 ciascuno | Impaginazioni alternative per 1/2/3 cifre, con o senza lettera/subalterno |
| Numero civico con bordo blu | 15×10 modelli / 16×12 modelli | 9 ciascuno | Impaginazioni alternative per 1/2/3 cifre, con o senza lettera/subalterno |
| Cartello viario | 80×25 tre righe / 80×25 due righe | 2 ciascuno | Fronte e Retro, esplicitamente etichettati nel sorgente |
| Cartello viario | 60×20 tre righe / 60×20 due righe | 2 ciascuno | Fronte e Retro, esplicitamente etichettati nel sorgente |

Le varianti dei civici possono diventare alternative selezionabili; le facciate dei viari devono conservare una relazione produttiva. I nomi dei viari non coincidono con le tavole sorgente: 900 × 400 mm nei due «80×25», 700 × 400 mm nei due «60×20». Prima di qualsiasi associazione verificare misure nominali/utili da catalogo e BSS, senza dedurle dai nomi o assumere che l’intera tavola sorgente sia l’area da produrre.

Il titolare propone ora di valutare il multipagina. Consigliata una prima modalità fronte/retro, con progetto unico, comandi riferiti alla tavola, miniature, salvataggio/conferma di tutte le facciate, SVG per facciata e PDF multipagina. È una proposta in discussione: non è ancora una funzione implementata o una migrazione dei progetti esistenti.

## Gli 87 blocchi prioritari

Conteggi per **primo errore rilevato**. Sono gruppi esclusivi, ma un template può presentare altre incompatibilità dopo la correzione della prima: non sono promesse di recupero immediato.

| Primo blocco | Sorgenti | Intervento necessario |
| --- | ---: | --- |
| Font e simboli | 29 | 26 casi con simboli assenti in font già installati; 2 con mappa di Continuum Medium non verificabile; 1 con Gloria Hallelujah 700 non disponibile |
| Contorni con deformazione diversa sui due assi | 21 | Espansione fedele del tratto in geometria; non uniformare la scala o eliminare il bordo |
| Maschere/opacità | 21 | 7 rettangoli con opacità 0,9; 12 immagini con clip rettangolare; 2 testi con clip |
| Testo giustificato | 4 | Collegare l’allineamento già supportato dall’editor verificando le differenze di impaginazione |
| Limite TEST di 200 elementi | 3 | 301/542/543 elementi foglia; compattazione senza perdita di proprietà o capacità maggiore collaudata |
| Altri casi | 9 | Formato, filtri, risorse, indici di stile e grafica vuota |
| **Totale** | **87** | |

La ricerca ricorsiva ha individuato 13 template con testo curvo. Il titolare autorizza ora una sola eccezione: **Azienda Agricola 99×139** torna ad alta priorità con esclusione del solo elemento «Nome del vino», che reinserirà manualmente. Copia derivata preparata con sette elementi e manifest della rimozione; sorgente originale invariato per SHA-256. Il template è ancora bloccato dai filtri immagine. Gli altri **12 template curvi** restano in coda, compreso Azienda Agricola 99×93. I prioritari erano 99 prima dell’abbassamento di priorità dei testi curvi, poi 86; ora sono 87 per questa eccezione. Queste differenze non rappresentano recuperi tecnici.

### Font

I 26 casi di simboli assenti sono 13 titoli presenti in entrambe le raccolte Targhe ottone/Targhe ottone 2. Mancano simboli come forbici, pallini, rombi e stelle; non manca il font del resto della scritta. Occorre correggere soltanto il simbolo con una scelta esplicita o una geometria verificata. Nessun fallback del computer o cambio generale del font.

Per Continuum Medium il file è installato. L’ispezione delle due sottotabelle Unicode formato 4 rileva nel segmento terminatore U+FFFF un `idRangeOffset` 65535, rifiutato dal parser attuale perché dispari. Si può valutare una copia normalizzata e verificata, conservando l’originale e senza cambiare i glifi. Non è stata eseguita alcuna riparazione.

Gloria Hallelujah 700 riguarda «Vogliamo solo coccole»: resta necessaria una decisione esplicita sullo stile, se la variante originale non è recuperabile.

### Maschere e contorni

Il messaggio generico «maschera, ombra, skew o opacità» non significa che tutti i 21 casi richiedano effetti complessi. Sette primi blocchi sono rettangoli grigi al 90% nei timbri/datari; dieci immagini appartengono alle classi energetiche, due ai cartelli; due clip riguardano testi. I clip rilevati sono rettangolari. Gli elementi dei datari non risultano automaticamente marcati come riferimenti nei flag sorgente: il recupero grafico non prova la corretta gestione produttiva dell’area riservata.

I 21 contorni deformati comprendono, al primo punto di blocco, 14 path e 7 rettangoli. Anche differenze piccole di scala deformano il tratto: non allargare semplicemente la tolleranza per far passare il template.

### Casi singoli

- Il cartello viario monofacciale è 1100 × 400 mm, oltre il limite tecnico attuale di 1000 mm.
- Azienda Agricola ha filtri Kodachrome/tinta/saturazione e anche testo curvo: rimuovere il primo blocco non lo rende automaticamente pronto.
- Un Corrieri: Cane onnivoro usa un PNG con orientamento EXIF.
- Io abito qui usa un’immagine su un host CloudFront non compreso fra gli archivi ammessi; verificare origine e formato prima di ampliare gli host.
- Il QR Agenzia Entrate incontra una firma/intestazione immagine non valida; non trattarlo come un semplice aumento del limite di peso.
- Un Modello generico del timbro 4928 ha indici di stile oltre la fine del testo.
- Due etichette contengono SVG senza elementi visibili; la targhetta metallica di Segnaletica non contiene elementi convertibili dopo l’esclusione dello sfondo.

## Attenti al Cane

Nelle tre categorie relative ai cartelli: **23 sorgenti a pagina singola, 9 convertibili e 14 bloccati**. Convertibile non significa già presente nell’archivio.

| Primo blocco | Cartelli bloccati |
| --- | --- |
| Contorni deformati — 4 | Cani addestrati alla guardia (300 × 200); Corrieri: Cane onnivoro (250 × 125); Morde e Sbrana 3; Qui si spara a vista |
| Clip — 4 | Esiste la morte dopo la vita? nei due formati; Kung-Fu; Morte e Sbrana 2 |
| Numero elementi — 3 | Il cane è buono, mia moglie no; Rappresentanti nei due formati |
| PNG EXIF — 1 | Corrieri: Cane onnivoro (300 × 200) |
| Host risorsa — 1 | Io abito qui |
| Variante font — 1 | Vogliamo solo coccole |

## Ordine consigliato

1. Compatibilità circoscritte: giustificazioni, mappa Continuum, opacità semplice, limiti di capacità/formato con collaudi adeguati.
2. Contorni deformati e simboli: coinvolgono molte targhe/cartelli; preservare l’aspetto e i font del testo.
3. Clip rettangolari, riutilizzando gli strumenti già disponibili.
4. Risorse anomale e casi residui. Biglietti da Visita, Templates PitchPrint e tutti i template con testo curvo restano in coda.

## Evidenze e confini

Esecuzione privata `.local/analyze-priority-templates-readonly.ts`, log `.local/priority-template-analysis.log`, report `.local/pitchprint-migration/priority-analysis-2026-11-11.report.json`. Elenco nominativo completo con ID e categorie in `.local/pitchprint-migration/analisi-template-prioritari-2026-11-11.md`; contiene tutti gli 87 casi prioritari e gli otto sorgenti multipagina prioritari. I dati sorgente e i file personali non vengono pubblicati nel repository.

**370 analisi completate, zero scritture amministrative/errori browser, hash dell’archivio invariato.** Restano 117 bozze importate; nessuna nuova importazione, modifica dell’archivio template/font, associazione prodotto o approvazione produttiva. Unica trasformazione del sorgente: copia derivata di Azienda Agricola 99×139 senza il testo curvo, su richiesta esplicita; originale conservato. Il controllo è tecnico, non certifica la resa visiva di tutti i template o Illustrator. Nessun deploy o intervento su Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata.

**Sequenza richiesta dal titolare:** sviluppare e collaudare prima le funzioni necessarie, poi convertire i template non a bassa priorità. La sola rimozione di un blocco non equivale a un’anteprima approvata. Per Azienda Agricola è richiesta la conversione esplicita dell’immagine in grigi, bianco→alpha proporzionale e tinta scelta; non ignorare silenziosamente i filtri originali.
