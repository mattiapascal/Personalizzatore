# Collaudo editor locale — 10 novembre 2026

Checklist 2026-11-10-v1. Generata da src/editor-admin/acceptance.ts con npm run editor:collaudo. Gli esiti manuali non sono precompilati.

Pagina interattiva: <http://127.0.0.1:5173/editor/admin?section=acceptance>. Consente filtri, note persistenti ed esportazione del resoconto. Questo documento è la copia consultabile anche senza il server.

Usare copie con nome TEST. I profili e le zone amministrative sono preparatori e non governano ancora il canvas. Nessuna modifica al negozio pubblicato. Illustrator e produzione fisica richiedono verifica umana.

## Archivio

### 1. Miniature di template e composizioni

Ambiente: <http://127.0.0.1:5173/editor/admin?section=template>

1. Apri Template e poi Composizioni clienti.
2. Apri una voce con testo e una con immagine; confronta miniatura e anteprima grande.

**Risultato atteso:** Le anteprime rappresentano il progetto corretto. Una miniatura non caricabile non impedisce di usare l’elenco.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 2. Tag multipli, riuso, filtri e priorità

Ambiente: <http://127.0.0.1:5173/editor?workspace=1>

1. Salva una nuova copia TEST dall’editor con due tag, ad esempio «TEST collaudo, timbri».
2. Nell’archivio combina i due tag con AND e OR.
3. Riordina le priorità, salva e ricarica la pagina. Prova a riutilizzare i tag su una seconda copia TEST.

**Risultato atteso:** I tag restano disponibili senza riscriverli; filtri e ordinamento hanno effetto sull’elenco e rimangono coerenti al ricaricamento.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 3. Copia indipendente da cliente a template

Ambiente: <http://127.0.0.1:5173/editor/admin?section=composition>

1. Scegli una composizione TEST e copiala nei template.
2. Controlla grafica e tag nella copia. Modifica i metadati della copia.

**Risultato atteso:** Il template è una nuova voce con un nuovo documento; riferimento cliente vuoto. Il progetto di partenza rimane invariato.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

## Font

### 4. Anteprime font automatiche e menu

Ambiente: <http://127.0.0.1:5173/editor/admin?section=fonts>

1. Scorri la lista dei font installati senza premere Anteprima.
2. Apri l’editor in una nuova scheda, seleziona un testo e apri il menu Font.

**Risultato atteso:** I font attivi hanno una rappresentazione grafica in lista e nel menu. Eventuali errori hanno un pulsante di riprova, senza bloccare gli altri font.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 5. Installazione, varianti e progetto portabile

Ambiente: <http://127.0.0.1:5173/editor/admin?section=fonts>

1. Carica un font che puoi utilizzare nel sito, con nome TEST riconoscibile. Le informazioni facoltative possono restare chiuse.
2. Applica il font a un testo nell’editor; se possiede varianti, prova peso e corsivo.
3. Esporta JSON e riaprilo in una nuova scheda dell’editor con il medesimo formato.

**Risultato atteso:** Il font caricato appare nell’editor e viene conservato nel JSON. Non vengono simulati grassetto/corsivo quando esiste una variante reale selezionabile.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 6. Importazione Google Fonts

Ambiente: <http://127.0.0.1:5173/editor/admin?section=fonts>

1. Cerca una famiglia nel catalogo Google e controlla la sua anteprima.
2. Importa una variante non ancora presente e cercala nell’editor.

**Risultato atteso:** Il file entra nella libreria locale e diventa utilizzabile nel menu. È un download di font, senza generazione di immagini AI o acquisto di servizi.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 7. Backup dei font e verifica del ripristino

Ambiente: <http://127.0.0.1:5173/editor/admin?section=fonts>

1. Scarica il backup della libreria font.
2. Seleziona lo stesso file per visualizzare la proposta di ripristino. Non occorre confermare un ripristino per questa prova.

**Risultato atteso:** La proposta riconosce i font già presenti; non crea duplicati e mostra eventuali conflitti prima di modificare la libreria.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

## Prodotti e profili

### 8. Catalogo reale, collezioni e tag

Ambiente: <http://127.0.0.1:5173/editor/admin?section=products>

1. Controlla che sia indicato Catalogo Shopify reale. Cerca un prodotto noto.
2. Combina una collezione con uno o più tag e poi azzera i filtri.
3. Passa alla pagina successiva e apri il link di un prodotto pubblicato.

**Risultato atteso:** Prodotti e immagini corrispondono al negozio; le operazioni sono letture. L’elenco non cambia prezzi, disponibilità o associazioni nell’editor.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 9. Associazione locale a prodotto e variante

Ambiente: <http://127.0.0.1:5173/editor/admin?section=profiles>

1. Crea un profilo dal nome «TEST collaudo variante» e scegli il tipo di lavorazione.
2. Usa Associa prodotto Shopify, cerca un prodotto e scegli esplicitamente la variante.
3. Salva il profilo, ricarica e riaprilo. Non inserire misure che non hai verificato.

**Risultato atteso:** Prodotto e variante sono conservati e verificati sul server. Le misure mancanti restano vuote. Il profilo è locale e non abilita automaticamente quel prodotto nel canvas.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 10. Zone riservate visuali

Ambiente: <http://127.0.0.1:5173/editor/admin?section=profiles>

1. Crea un profilo separato «TEST zone», con area rettangolare 100 × 50 mm: questi sono soltanto dati di prova.
2. Disegna un rettangolo e un’ellisse; seleziona, sposta e ridimensiona con le maniglie.
3. Prova i valori numerici, Annulla/Ripristina ed Esc durante un trascinamento. Prova a portare una zona fuori area.
4. Salva, ricarica e controlla le zone.

**Risultato atteso:** Le maniglie mantengono fermo il lato o angolo opposto; un gesto concluso vale una modifica. Una zona fuori sagoma viene rifiutata. Disegno e campi numerici condividono la validazione. Il salvataggio del profilo è esplicito.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 11. Versioni precedenti consultabili

Ambiente: <http://127.0.0.1:5173/editor/admin?section=profiles>

1. Sul profilo TEST modifica una zona e salva una seconda versione.
2. Apri Versioni precedenti e carica la prima nel modulo.
3. Controlla i dati prima di salvare e poi salva una nuova versione.

**Risultato atteso:** Caricare una versione riempie soltanto il modulo. Salvare crea una nuova versione; le versioni precedenti restano inalterate. Non è una certificazione produttiva.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 12. Fori e regole distinte per lavorazione

Ambiente: <http://127.0.0.1:5173/editor/admin?section=profiles>

1. Su un profilo targa TEST configura sola foratura con misure di prova e osserva lo schema.
2. Cambia area, schema dei fori e tipo di lavorazione senza sovrascrivere un profilo reale.

**Risultato atteso:** Gli offset dei fori sono fisici e restano in mm; le targhe incise mostrano 0,5 mm e 30 mm, quelle stampate non ereditano i vincoli dei timbri. Fori, accessori e regole sono ancora preparatori e non governano il canvas.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

## Editor

### 13. Workspace, selezione, livelli e navigazione

Ambiente: <http://127.0.0.1:5173/editor?workspace=1>

1. Usa Freccia e Mano; prova barra spaziatrice, rotella/gesture e zoom presso il puntatore.
2. Apri Livelli, trascina anche un livello non selezionato e confronta nome/anteprima con l’ispettore.
3. Seleziona un oggetto e clicca fuori dal canvas; entra ed esci dall’editing del testo.

**Risultato atteso:** La selezione è coerente nei pannelli, il riordino non richiede una selezione precedente e il canvas non salta quando appare la barra del testo.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 14. Testo, formattazione parziale e caselle

Ambiente: <http://127.0.0.1:5173/editor?workspace=1>

1. Singolo click seleziona il box; doppio click entra nel testo. In editing prova click e doppio click su una parola.
2. Formatta una selezione parziale, poi il box intero. Prova spaziatura, crenatura, interlinea e allineamento di una sola riga.
3. Scrivi direttamente nei campi numerici, poi usa le freccine. Ridimensiona con Larghezza automatica attiva e disattiva.

**Risultato atteso:** La selezione determina l’ambito della modifica. Il cursore senza selezione non cambia il font del testo. Interlinea a passi 0,1; nessun testo nascosto; maniglie e campi numerici hanno gli ancoraggi concordati.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 15. Importazione vettoriale, ritaglio e B/N

Ambiente: <http://127.0.0.1:5173/editor?workspace=1>

1. Importa SVG e PDF a pagina singola, scegliendo a turno testi editabili o contorni quando presenti.
2. Importa un’immagine, prova ritaglio dai quattro lati e maniglie; controlla Annulla.
3. Prova la rimozione del bianco su una copia B/N o grigia.

**Risultato atteso:** Le conversioni non cancellano l’originale del file scelto. Il ritaglio mantiene le proporzioni dei pixel visibili. La rimozione dello sfondo a colori rimane sospesa.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

## Progetti e formati

### 16. Template e cambio modello

Ambiente: <http://127.0.0.1:5173/editor/templates>

1. Usa un template TEST associato a più modelli. Controlla il modello iniziale proposto.
2. Prova un modello più piccolo, osserva l’anteprima e conferma solo se la grafica rispetta i limiti.
3. Controlla Annulla e il recupero della composizione originale nelle bozze.

**Risultato atteso:** Scelta iniziale del più piccolo compatibile senza riduzione automatica. La riduzione proporzionale è proposta solo quando valida e richiede conferma. Questo flusso usa ancora i tre modelli TEST.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

### 17. Caso numero civico 13 → 15

Ambiente: <http://127.0.0.1:5173/editor?workspace=1&configurations=1>

1. In una prova locale crea una composizione con numero 13 e aggiungi una configurazione.
2. Torna al disegno, cambia in 15 e aggiungi una seconda configurazione.
3. Controlla le due anteprime; prova separatamente la modifica esplicita della prima riga.

**Risultato atteso:** La prima configurazione conserva il 13 e la seconda il 15. L’aggiornamento di una riga esistente è una scelta esplicita. È un archivio dimostrativo, senza carrello Shopify.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:

## Produzione

### 18. Controllo umano di SVG in Illustrator

Ambiente: <http://127.0.0.1:5173/editor?workspace=1>

1. Esporta SVG e JSON da una composizione TEST rappresentativa.
2. Apri SVG in Illustrator e verifica misure in mm, font, testi editabili/contorni, tracciati, ritagli e resa.
3. Confronta con l’editor e annota le differenze; il collaudo di incisione/stampa resta separato.

**Risultato atteso:** Questa verifica non è certificata dai test browser. Segna Superata solo dopo l’ispezione effettiva; se Illustrator non è disponibile usa Da verificare.

Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare

Note:
