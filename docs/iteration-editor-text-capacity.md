# Capacità tipografica e minimo del prodotto — 11 novembre 2026

Il minimo di 7 pt era inserito nello schema generale: bloccava anche progetti di stampa, porzioni di testo e importazioni senza montatura associata. Ora la capacità tecnica è **0,1–500 pt**, condivisa da documento, stili locali, comandi manuali/AI, ispettore, maniglie, altezza numerica e importazione SVG/PDF/PitchPrint. Il default dei nuovi testi resta 7 pt. Nessun testo viene ingrandito o sostituito automaticamente durante la riapertura.

La regola dei **timbri inchiostrati, minimo 7 pt**, è distinta e condivisa in `text-production.ts`. Un valore più restrittivo nel catalogo viene rispettato. Per i timbri a secco non si inventa una soglia quando il catalogo la lascia sconosciuta. I progetti liberi e le targhe non ereditano il minimo dei timbri. Il limite del corpo controlla i testi editabili: non riconosce lettere dentro loghi vettoriali o raster. Questo non collega ancora al canvas tutti i profili produttivi amministrativi né certifica la lavorabilità di una targa incisa.

## Comportamento verificabile

- Una bozza sotto soglia resta riapribile, modificabile e recuperabile. L’ispettore del testo segnala il minimo del modello e i caratteri non conformi, senza cambiare il corpo o spostare il canvas.
- Cambio montatura, scelta del modello minimo e applicazione del template controllano la soglia del modello. Una riduzione che porti anche una sola porzione stampata sotto soglia viene rifiutata; l’originale resta conservato. La riduzione SVG/PDF riceve la stessa soglia dalla sessione quando deve adattare la grafica.
- La conferma cliente nell’editor si ferma prima del salvataggio. La conferma delle configurazioni **di prova locali** ricontrolla la regola sia nel client sia nel server, su aggiunta e sostituzione. Versione/prodotto/variante del catalogo devono corrispondere; un flag targa non può eludere il vincolo di una montatura timbro.
- Il controllo considera i caratteri realmente stampati e i loro stili, anche con una scala verticale legacy. Esclude spazi/a capo e riferimenti, compresi quelli ereditati dai gruppi; una dimensione base inutilizzata non blocca una riga interamente composta da caratteri più grandi.

La prova del limite inferiore ha evidenziato anche un difetto preesistente: i risultati completi delle modifiche globali venivano fusi con l’oggetto vecchio, facendo riapparire `characterStyles` rimossi. Corpo, famiglia e pulsanti B/I ora sostituiscono correttamente lo stile completo, mantenendo centro o guida del testo su tracciato. Le modifiche parziali mantengono il percorso di aggiornamento parziale. Verificati anche 0,1 pt nel campo numerico, nell’altezza misurata e nel valore SVG esportato.

Documento e strumenti restano canonici, con ID e revisioni stabili, Undo/Redo e JSON. Schemi rigenerati dal sorgente; nessuna migrazione o riscrittura dei progetti personali. L’SVG generico rimane esportabile per lavorare su bozze e template: non equivale alla conferma di un timbro né a un’approvazione produttiva. I documenti restano marcati TEST/non validati per produzione.

## Campione e qualità della resa

[JSON piccolo testo](../fixtures/illustrator/small-text.TEST.json), [SVG](../fixtures/illustrator/small-text.TEST.svg), [sorgente TEST PitchPrint](../fixtures/illustrator/small-text.source.TEST.json), riproducibili con `node --import tsx scripts/capture-editor-small-text.ts` su Node 24 e server locale. Font Arimo reale già incluso con licenza, corpo 6 pt e primi tre caratteri a 3 pt; secondo testo a 8 pt, cornice 92 × 52 mm con tratto 0,2 mm. Due comandi manuale/AI seguiti da Undo ripristinano gli originali; riapertura e SVG dall’interfaccia verificati. Schermata a tutto schermo ispezionata.

Confronto indipendente del **solo testo** a 1200 × 720 px: zero differenze della maschera. La maschera complessiva differisce del **15,82%**, soprattutto sulla cornice: il sorgente usa un rettangolo SVG e l’importato un tracciato normalizzato. Misure e spessore coincidono; su un pixel di bordo rilevati RGB 153/207/235 contro 127/195/229, mentre i due pixel interni coincidono. Il confronto completo è conservato nel rapporto, non dichiarato identico né nascosto allargando la soglia. La normalizzazione rettangolo/tracciato e il collaudo Illustrator restano separati dalla capacità tipografica; non è un collaudo produttivo.

## Analisi reale e confini

**247/370 sorgenti a pagina singola convertibili, 123 bloccati**, contro 227 prima dell’incremento: **20 recuperi e zero regressioni**, archivio invariato durante l’analisi, zero scritture amministrative ed errori browser. Rapporto privato `.local/pitchprint-migration/text-capacity-analysis.report.json`. Ora si converte anche **Q12 con Alida originale**, conservando il corpo sotto 7 pt: l’associazione a un timbro inchiostrato richiederà una correzione esplicita. Il confronto diagnostico Q12 rileva 1,89% di differenza della maschera d’inchiostro e 4,78% RGB sopra soglia; nessuna equivalenza produttiva dichiarata.

Restano **117 template PitchPrint e due composizioni** nell’archivio personale: nessuna nuova importazione implicita. Font, categorie, impostazioni, prodotti e associazioni esistenti conservati. Nessun deploy, modifica alla chat pubblicata o intervento Shopify/tema/PitchPrint/BSS/prezzi/acquisti reali.

## Evidenze di collaudo

**680 unitari/105 file passati su Node 24**, **92 regressioni browser** pertinenti verificate fra esecuzione e ricontrollo e **25 campioni JSON riaperti/riesportati in SVG** senza errori o richieste esterne. Build, schemi e scansione segreti passati. Test specifici: capacità, stili locali e Unicode, riferimenti di gruppo, riduzioni, contesti obsoleti, rifiuti atomici della conferma locale. Richiesta deliberatamente non valida sul server locale reale: HTTP 422 per corpo sotto 7 pt, archivio configurazioni invariato. Le prove di salvataggio riuscito usano archivi temporanei.

I primi controlli hanno evidenziato test che trattavano 6 pt come errore universale: aggiornati al limite tecnico 0,1 pt e affiancati dai controlli produttivi espliciti a 7 pt. Il test cliente apre una composizione dall’archivio simulato, perché gli strumenti amministrativi di importazione JSON sono correttamente nascosti ai clienti.

La protezione globale delle metriche dei testi con font irrisolti, la fedeltà completa dei sorgenti ancora bloccati e i profili produttivi amministrativi applicati al canvas restano aperti. Nessuna nuova funzione avanzata di disegno aggiunta.

Dopo la correzione dell’ispettore: 90/92 casi browser passati nel primo giro. I due ricontrolli hanno aggiornato un’aspettativa sul gruppo da 1 mm, ora legittimo entro la capacità tecnica, e il testo del messaggio sullo stile sintetico già rifiutato dal controllo output. Tre casi ricontrollati passati, incluso il limite reale 0,1 pt; nessun allargamento dei criteri di conferma produttiva.
