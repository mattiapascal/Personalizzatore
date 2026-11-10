# Lavoro locale durante l’assenza del titolare

Mandato del 9 novembre 2026: proseguire sulle attività il cui comportamento è già definito, chiedendo prima le scelte che possono incidere sul prossimo sviluppo. Non autorizza deploy, spese o modifiche commerciali. Stato di partenza: [496 unitari e 291 browser](editor-local-status.md).

## Sequenza operativa

Avanzamento: implementati autosalvataggio/recupero e conflitti, associazioni/galleria template, cambio modello confermato e annullabile e backend per raccogliere profili/zone/fissaggi. [Consegna e limiti](iteration-editor-drafts-templates-products.md). Aggiunti [tinta globale dimostrativa e analisi WOFF2](iteration-editor-imprint-woff2.md), [capacità estesa e continuità delle bozze](iteration-editor-capacity.md). I profili non governano ancora il canvas; nessuna integrazione commerciale. Checkpoint integrale intermedio: **523 unitari, 306 browser laboratorio**, build/scansione segreti, 13 pubblici locali e 18 campioni passati. Esiti nello stato locale. Completate anche [amministrazione dei font](iteration-editor-font-administration.md) e [preview tecnica dei profili](iteration-editor-profile-preview.md). Aggiunto [backup/ripristino font](iteration-editor-font-backup.md), con preview senza scritture e protezione dei file esistenti. Ultimo checkpoint completo: **530 unitari/310 browser**; dopo la correzione delle etichette lunghe, **531 unitari e 5 browser font**, build e scansione segreti. Anche 13 pubblici locali e 18 campioni passati. Dettagli nello stato locale.

1. **Font:** completare i controlli dei formati disponibili e il comportamento dei file/varianti nei progetti; preservare i font già caricati e rendere comprensibili indisponibilità e limiti. Nessuna sostituzione silenziosa.
2. **Bozze locali:** autosalvataggio e recupero dopo ricaricamento, senza sovrascrivere configurazioni già confermate; identificativi distinti per bozza e configurazione, conflitti fra schede espliciti. Conservazione locale distinta dal futuro account Shopify.
3. **Profili produttivi:** separare capacità/limiti di sicurezza del laboratorio dai vincoli per famiglia e lavorazione. Migrazione compatibile dei documenti TEST; nessuna certificazione implicita. Inserire nel backend i dati e le regole già noti, con campi mancanti dichiarati tali.
4. **Template e prodotto:** template versionati indipendenti, compatibilità con più prodotti/varianti e regole di associazione gestibili nel backend locale. Ingresso montatura/template sul medesimo documento, anteprima del cambio formato, originale conservato e operazioni annullabili.
5. **Opzioni del prodotto:** tinta globale dell’impronta dei timbri; supporto/fissaggi delle targhe secondo configurazioni esplicite. Accessori e zone tecniche separati dalla grafica produttiva. Nessuna opzione cliente per il colore del corpo montatura.
6. **Collaudo e semplicità:** test unitari e browser pertinenti a ogni incremento; checkpoint completi quando necessari, verifica visiva dei percorsi desktop/mobile e documentazione dello stato. Non aggiungere strumenti avanzati di editing sospesi dal titolare.

L’ordine può adattarsi alle dipendenze e ai risultati delle prove. Non modificare la UI mentre è in corso una suite browser completa sullo stesso server.

## Tre preferenze sottoposte al titolare

- Montatura iniziale di un template: consiglio configurato dal commerciante oppure selezione automatica del modello più piccolo compatibile.
- Cambio a formato più piccolo: proposta di riduzione uniforme entro i vincoli, sempre con anteprima e conferma, oppure mantenimento delle dimensioni e adattamento manuale.
- Fissaggi: disponibilità anche della sola foratura senza accessori, oltre a nessun fissaggio e ai kit.

Risposte esplicite del titolare ricevute: montatura iniziale = modello compatibile più piccolo, scelto automaticamente; cambio a formato più piccolo = proposta di riduzione proporzionale soltanto entro i vincoli, con anteprima e conferma; fissaggi = ammessa anche la sola foratura. Proseguire autonomamente sulle attività già definite, come ulteriormente richiesto dal titolare.

## Dati da acquisire senza bloccare l’architettura

Misure reali di aree utili/zone riservate dei modelli speciali; fissaggi ammessi, diametri e distanze dai bordi; palette tamponi/vernici per prodotto; utensili e parametri di lavorazione dell’incisione e produzioni campione con tempi reali. Cercare prima nelle fonti locali disponibili, senza trattare gli handoff storici come prova dello stato live. In assenza di dati, usare soltanto fixture dichiaratamente TEST e mantenere il profilo non validato.

Le regole già confermate restano quelle della [roadmap](editor-roadmap.md): timbri minimo 7 pt e immagini B/N; incisione targhe minimo 0,5 mm nelle sole parti incise e distanza fra vernici differenti 30 mm; costo globale condizionato dalla punta richiesta, senza inventare tariffe o coefficienti. La sola stampa non eredita i vincoli dell’incisione.

## Perimetro conservato

Nessun deploy, modifica a tema/negozio/BSS/PitchPrint, prezzi, carrello/checkout/account reali o ordini. Nessun invio di messaggi esterni. Nessuna nuova chiamata AI a pagamento, generazione immagini, rimozione sfondo a colori o multipagina. Lo sviluppo mantiene un solo documento e comandi validati per manuale e simulazione AI.

Lasciare per successive decisioni le integrazioni online, le politiche di conservazione pubbliche, l’associazione autenticata dei progetti agli account e il collaudo Illustrator/lavorazione fisica. Un blocco su questi punti non impedisce di completare gli altri incrementi locali.
