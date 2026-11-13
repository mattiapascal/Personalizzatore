# Testi inclinati e maschere: prossima capacità grafica — 13 novembre 2026

## Evidenza locale

I due sorgenti prioritari «Esiste la morte dopo la vita?» (250 × 125 e 300 × 200 mm) contengono ciascuno sei IText mascherati. Non sono testi curvi. Il preflight attuale rifiuta la maschera sul testo e lo skew; eliminare soltanto un controllo non produce una conversione valida.

Diagnosi in pagina vuota, usando il runtime **Fabric 3.4.0 originale già salvato localmente**, con tutte le richieste bloccate. Le matrici native dei testi hanno assi non ortogonali: scostamento circa **−0,76455…−0,76457°** prima della conversione fisica della pagina. Le maschere sono rettangoli trasformati; nel piano della pagina le matrici risultano allineate agli assi, mentre i box nominali dei testi non sono interamente contenuti nei rettangoli. Il solo confronto degli ingombri non dimostra quindi un ritaglio dei glifi.

Seconda prova con il file font esatto risolto dal catalogo locale, verifica della copertura dei caratteri e FontFace caricato. Confrontati separatamente i 12 testi nel runtime nativo, a scala 2, con maschera originale e senza maschera: **zero pixel con differenza alpha oltre 24 e zero pixel pieni eliminati**. Undici casi hanno differenza alpha nulla; uno ha una differenza totale di quattro livelli alpha sul canvas di circa un milione di pixel. I controlli con la maschera spostata cancellano effettivamente l’inchiostro, dimostrando che il confronto non è vuoto o insensibile.

Questa è una prova dei soli testi, non del template completo, delle esportazioni, dell’editor nuovo o dei futuri contenuti modificati. Non autorizza a rimuovere le maschere o dichiarare importabili le due copie. Le dimensioni usate nella prima diagnosi geometrica sono quelle serializzate, mentre la seconda prova dipinge realmente i glifi del file esatto.

Un primo script diagnostico aveva trattato i comandi H/V dei percorsi legacy come coordinate L, producendo valori non finiti. Corretto interpretando esplicitamente M/L/H/V/Z e rifiutando coordinate non finite. Nessun codice applicativo o sorgente modificato per quell’errore. Il parser legacy conserva H/V, a differenza della normalizzazione del parser attuale: i riferimenti devono tenerne conto.

Rapporti privati: `.local/pitchprint-migration/text-mask-diagnosis-20261113/report.json` e `native-paint.json`; log `.local/native-text-affines-diagnosis.log` e `native-text-mask-paint.log`. Zero richieste esterne, sorgenti e archivio invariati. Nessun font sostitutivo o stile sintetico.

## Incremento da realizzare

1. Definire la rappresentazione canonica delle trasformazioni inclinate del testo, conservando testo, stili dei caratteri, box, allineamenti, proprietà e gruppi. Riutilizzare le matrici e i limiti geometrici; nessun riconoscimento per titolo o ID.
2. Verificare le matrici contro il riferimento 3.4.0, inclusi origini, scala non uniforme, rotazione e gruppi. L’attuale `pitchprintTransform` assume assi ortogonali: aggiungere una proprietà senza correggere centro e ingombri non basta.
3. Allineare renderer, misure fisiche, selezione/maniglie, X/Y centrali, rotazione, ridimensionamento e comandi validati. Manuale e AI simulata devono operare sullo stesso oggetto, con Undo/Redo, appunti e JSON. Non sostituire il testo con raster o contorni non editabili.
4. Estendere coerentemente il supporto delle maschere ai testi: spazio di riferimento, comportamento dopo modifiche di contenuto/font/box e budget devono essere espliciti. Le maschere attuali di immagini/vettori non possono essere trasferite sul testo assumendo larghezza/altezza statiche inesistenti nello schema.
5. Aggiungere campione sintetico JSON/SVG portabile, prove positive e negative (maschera che taglia davvero), confronto nativo indipendente e test UI. Verificare SVG editabile; Illustrator rimane un collaudo umano.
6. Soltanto dopo i controlli generali, confrontare entrambe le composizioni complete con il sorgente nativo. Nessuna importazione o rimozione dei vincoli prima di quelle verifiche.

Nell’attesa dell’autorizzazione al cambio dell’archivio si può implementare e collaudare questa capacità su fixture e conversioni diagnostiche. Il JSON principale è quasi pieno e rimane invariato. I due casi continuano a essere conteggiati nei 16 prioritari, distinti dai sei simboli mancanti nei font, da Gloria Hallelujah 700 e dai sette primi piani da classificare.

## Primo incremento completato

[Inclinazione fisica del box](iteration-editor-text-skew.md): proprietà canonica opzionale, ispettore, trasformazione `R * K * S`, misure di impaginazione distinte dall’ingombro e otto maniglie sul parallelogramma con punto opposto stabile. Testo, stili e font rimangono editabili, con comandi/storico/JSON condivisi. Il parametro interno Fabric viene convertito perché usa un ordine diverso delle matrici; la decomposizione futura dei sorgenti deve produrre l’angolo fisico, non copiarne lo skew grezzo.

Rimangono da completare trasformazioni e origini nell’adattatore PitchPrint, maschere sul testo e confronti integrali dei due cartelli. Nessun preflight allentato o importazione effettuata. La combinazione con testo su percorso resta esplicitamente rifiutata, senza perdita silenziosa delle proprietà.

## Importazione affine completata

[Matrici, gruppi e decorazioni SVG](iteration-editor-pitchprint-affine-text.md): l’adattatore conserva ora lo skew proprio del testo e quello dei genitori, usando l’angolo fisico canonico e la scala verticale corretta del font. Confrontate 216 matrici nel runtime originale 3.4.0; il campione completo con decorazioni Canvas rese esplicite nello SVG coincide nei pixel. Risolto anche un difetto generale dell’SVG delle decorazioni, conservando i segmenti dei glifi.

Le maschere sul testo continuano a bloccare i due cartelli. Il [piano specifico](editor-text-mask-plan.md) si basa anche su dieci prove native del comportamento durante modifica di testo/corpo/larghezza e scala: frame locale stabile, trasformato geometricamente con l’oggetto. Non riutilizzare il frame relativo variabile delle immagini senza questo contratto. Nessuna nuova importazione o migrazione effettiva.

## Maschere canoniche implementate

[Maschere locali del testo](iteration-editor-text-masks.md): proprietà fisica distinta dal frame di impaginazione, comandi e ispettore, cache aggiornata durante la scrittura, clip SVG e bitmap verificati separatamente. L'adattatore PitchPrint rifiuta ancora queste maschere: la conversione delle coordinate legacy e il confronto completo dei due cartelli sono il prossimo incremento. La sola disponibilità manuale della proprietà non li rende importabili.
