# Template esclusi: priorità aggiornate — 11 novembre 2026

Il titolare assegna la **minima priorità** alle categorie **Biglietti da Visita** e **Templates PitchPrint**. Questa scelta cambia l’ordine del lavoro, non autorizza a scartare elementi o sostituire font nelle conversioni.

## Ricontrollo

Riesaminati con l’importatore attuale i 370 sorgenti a pagina singola acquisiti dall’account: **259 convertibili / 111 bloccati**, nessun nuovo recupero o regressione rispetto all’analisi dei ritagli frazionari. Colori conservati, sfondi/materiali esclusi come nelle analisi precedenti. L’inventario è la copia locale acquisita il 10 novembre; non è una nuova scansione dell’account online.

| Perimetro a pagina singola | Convertibili | Bloccati | Totale |
| --- | ---: | ---: | ---: |
| Categorie prioritarie | 258 | 99 | 357 |
| Biglietti da Visita / Templates PitchPrint | 1 | 12 | 13 |
| Totale | 259 | 111 | 370 |

L’inventario complessivo ha 473 sorgenti: altri 95 delle due categorie a bassa priorità sono multipagina, insieme a 8 delle categorie prioritarie. **Il multipagina resta escluso dall’editor.** I quattro sorgenti di numeri civici a nove pagine e i quattro di cartelli viari a due pagine possono essere valutati per estrazione di pagine utili come template autonomi.

Le categorie sono abbinate all’ID del file dell’inventario: in quattro sorgenti legacy il `designId` interno è diverso dall’ID nell’elenco. Usare solo il primo avrebbe lasciato senza categoria quattro template a bassa priorità e falsato il conteggio dei prioritari.

## I 99 blocchi prioritari

Conteggi per **primo errore rilevato**. Sono gruppi esclusivi, ma un template può presentare altre incompatibilità dopo la correzione della prima: non sono promesse di recupero immediato.

| Primo blocco | Sorgenti | Intervento necessario |
| --- | ---: | --- |
| Font e simboli | 29 | 26 casi con simboli assenti in font già installati; 2 con mappa di Continuum Medium non verificabile; 1 con Gloria Hallelujah 700 non disponibile |
| Contorni con deformazione diversa sui due assi | 21 | Espansione fedele del tratto in geometria; non uniformare la scala o eliminare il bordo |
| Maschere/opacità | 21 | 7 rettangoli con opacità 0,9; 12 immagini con clip rettangolare; 2 testi con clip |
| Testo curvo legacy | 12 | Tradurre raggio, verso, spaziatura e trasformazioni nel testo su tracciato già presente |
| Testo giustificato | 4 | Collegare l’allineamento già supportato dall’editor verificando le differenze di impaginazione |
| Limite TEST di 200 elementi | 3 | 301/542/543 elementi foglia; compattazione senza perdita di proprietà o capacità maggiore collaudata |
| Altri casi | 9 | Formato, risorse, filtri, indici di stile e grafica vuota |
| **Totale** | **99** | |

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
3. Clip rettangolari e conversione del testo curvo, riutilizzando gli strumenti già disponibili.
4. Risorse anomale, filtri e casi residui; categorie a bassa priorità in coda.

## Evidenze e confini

Esecuzione privata `.local/analyze-priority-templates-readonly.ts`, log `.local/priority-template-analysis.log`, report `.local/pitchprint-migration/priority-analysis-2026-11-11.report.json`. Elenco nominativo completo con ID e categorie in `.local/pitchprint-migration/analisi-template-prioritari-2026-11-11.md`; contiene tutti i 99 casi e gli otto sorgenti multipagina prioritari. I dati sorgente e i file personali non vengono pubblicati nel repository.

**370 analisi completate, zero scritture amministrative/errori browser, hash dell’archivio invariato.** Restano 117 bozze importate; nessuna nuova importazione, correzione di template/font, associazione prodotto o approvazione produttiva. Il controllo è tecnico, non certifica la resa visiva di tutti i template o Illustrator. Nessun deploy o intervento su Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata.
