# Colore del foglio canonico — 11 novembre 2026

## Funzione

Nel pannello **Strumenti → Colore del foglio** si sceglie un fondo nero/bianco, RGB nei documenti a colori, oppure Nessuno. `paperColor` è un campo opzionale del documento v2; `setPaperColor` è il comando validato comune a UI e AI simulata, con revisione, Undo/Redo e JSON portabile. Non si aggiunge un rettangolo fittizio alla lista dei livelli e gli oggetti conservano ID, geometrie, caratteri e risorse.

Il fondo scelto è parte della grafica: compare nel canvas, nello SVG, nel PDF che deriva dallo SVG, nel PNG e nelle miniature. Nel PNG trasparente un fondo esplicito rimane opaco; senza `paperColor`, resta la precedente trasparenza. Il foglio bianco di visualizzazione dei vecchi documenti e il loro SVG bianco preesistente non cambiano. Il PNG opaco completa in bianco anche l’esterno della sagoma circolare; il PNG trasparente, SVG e miniature conservano invece il ritaglio della sagoma. Un’immagine di fondo si compone sopra il colore del foglio.

Il colore segue il template nei cambi di formato. `applyTemplate` trasferisce il valore o elimina quello del progetto precedente se il template non lo contiene. È ammesso un template fatto del solo fondo, senza oggetti; una composizione completamente vuota, priva anche di colore, resta rifiutata come template da applicare. Nel compositore targhe è stato corretto anche il trasferimento della modalità RGB dal template all’editor, insieme al fondo. Anteprima a nuove misure e applicazione conservano il progetto sorgente.

Il colore RGB viene rifiutato nei documenti monocromatici, senza convertirlo implicitamente. Le normali regole degli oggetti rimangono attive; un oggetto bloccato chiamato `canvas` non viene erroneamente identificato come bersaglio di un comando che riguarda il foglio.

## PitchPrint e limiti ancora aperti

Senza esclusione dello sfondo, il convertitore conserva ora il colore pieno del foglio in `paperColor`. Scegliendo esplicitamente B/N, converte anche quel colore; scegliendo esplicitamente l’esclusione, lo omette con un avviso. Il bianco predefinito del sorgente mantiene il comportamento storico. Colori con alpha parziale o riempimenti complessi rimangono bloccati quando si chiede di conservarli; possono essere esclusi solo con l’opzione esplicita.

**Immagini di fondo, materiali e primi piani restano da convertire.** Il convertitore continua a rifiutarli se non ne è stata autorizzata esplicitamente l’esclusione: questo incremento non ne perde silenziosamente nessuno e non dichiara completata l’importazione di Azienda Agricola. I dati sulle impostazioni globali del design, quali blocco dello sfondo e categorie abilitate, richiederanno inoltre il relativo adattatore; non sono dedotti dai colori del foglio.

Censimento in sola lettura delle 370 copie a pagina singola, includendo gli involucri `data`: sette dichiarano un foglio non bianco. Uno soltanto, `Simple A5 sale sign (Instore)`, non dichiara anche risorse di fondo/primo piano; appartiene alla categoria a bassa priorità Biglietti da Visita e non è stato importato nuovamente. 229 sorgenti dichiarano riferimenti a immagini di fondo/primo piano. La funzione è il presupposto per conservarne la parte cromatica, non una prova di fedeltà dell’intera composizione. Inventario privato in `.local/pitchprint-migration/paper-inventory.json`.

Nessuna modifica ai 117 template personali, alle due composizioni o ai 219 file font; nessuna nuova associazione commerciale. I conteggi precedenti di 259/370 convertibili si riferivano all’esclusione esplicita degli sfondi e non vengono aumentati in questa iterazione.

## Cache e prove

Il fingerprint delle miniature include il colore soltanto se presente. Un cambiamento del colore invalida la sua miniatura, mentre i documenti storici conservano la chiave precedente. Niente rigenerazione globale dell’archivio. Dopo il riavvio del solo server dev, verificato anche il contratto HTTP di salvataggio: un documento con `paperColor` supera lo schema e viene respinto per revisione intenzionalmente impossibile (409); hash dell’archivio invariato, nessun record di prova salvato.

- **752 unitari / 116 file** superati.
- **76 regressioni browser** per immagini, PNG, cache, miniature, trasparenza e originali; **sette ricontrolli dei flussi template**, in parte sovrapposti, compresi applicazione senza oggetti e targa RGB.
- **13 browser pubblici locali**, build normale/pubblica, schemi e scansioni segreti superati.
- **35 campioni JSON riaperti ed esportati in SVG**, senza errori o rete esterna; controllati anche `paperColor` e `backgroundImageId` nel round trip.
- Il precedente controllo completo di 487 browser precede questo incremento: non è una nuova esecuzione completa della suite attuale.

Campione `fixtures/illustrator/paper-color.source.TEST.json`, `paper-color.TEST.json/.svg`, generatore `scripts/capture-editor-paper-color.ts`: 120 × 80 mm, fondo `#fffeef`, rettangolo blu con alpha 50%, rettangolo bianco con contorno nero. UI → AI → Undo, stessa geometria; confronto indipendente Canvas2D: **zero pixel con delta >24**, errore medio **0,001516/255**, zero errori e zero scritture amministrative. Catture desktop/mobile ispezionate. Il primo generatore si è arrestato cercando un pulsante denominato erroneamente «Pannello strumenti»; corretto il selettore al vero nome «Strumenti» e completata la nuova esecuzione, con timeout esplicito.

Illustrator resta da collaudare: formato fisico, fondo incluso, colori/compositing e vettori editabili. Nessun deploy, chiamata AI reale, modifica Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout o cambiamento alla chat pubblicata.
