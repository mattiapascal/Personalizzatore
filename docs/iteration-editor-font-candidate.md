# Verifica e anteprima del font scelto per una correzione — 13 novembre 2026

Nel pannello **Font del progetto**, quando mancano caratteri, il file scelto viene ora controllato **prima** di abilitare «Applica ai soli caratteri mancanti». Durante la verifica o se il file non contiene i glifi il pulsante rimane disabilitato. Una copertura non verificabile offre **Ricontrolla il font scelto**. Nessuna scelta del menu cambia automaticamente il disegno.

Quando il file è verificato, compare un’anteprima dei soli caratteri che verranno corretti, nel font esatto scelto, comprese le varianti reali. Non si usa una frase campione che potrebbe contenere caratteri estranei al file. L’anteprima comprende al massimo 16 glifi; per soli spazi, segni combinanti o caratteri di formato resta il messaggio di verifica, senza un campione grafico ambiguo.

## Stessi controlli e documento unico

La verifica preventiva richiama **`missingCharacterFontCommand`**, lo stesso costruttore validato usato dal pulsante Applica e dalle prove manuali/AI. La proposta è di sola lettura: nessuna misura con font sostitutivi, comando eseguito, revisione, incorporamento di file o salvataggio implicito. L’anteprima è ricavata dai caratteri effettivamente modificati dalla proposta, escludendo quelli già corretti con altri font.

L’applicazione esplicita ripete i controlli sul documento attuale e passa dall’`updateObject` esistente: revisione, permessi e risorse immutabili rimangono validati; coordinate X/Y, contenuto e stili estranei alla correzione sono conservati. L’anteprima pronta non autorizza l’output del documento originale ancora errato. Undo/Redo e riapertura JSON mantengono il comportamento precedente.

Il risultato è legato a documento, revisione, pagina, segnalazione, file e versione della libreria. Una risposta WOFF2 tardiva viene scartata dopo un cambio di scelta. Si analizza il solo candidato selezionato, riusando la cache dei file: nessun controllo preventivo di tutti i font della libreria o nuovo servizio esterno.

## Verifiche

**1.161 unitari / 163 file passati**, inclusi i controlli esistenti del comando di correzione: soltanto i glifi interessati, file incompatibili/non verificabili, revisione obsoleta, blocchi, risorse originali e uguaglianza manuale/AI. **18 browser pertinenti passati**, inclusi:

- anteprima dei soli `A`/`B`, scelta della variante Arimo Bold reale e applicazione esplicita a 1440 e 390 px; coordinate, altri caratteri/oggetti, Undo/Redo e JSON conservati;
- candidato incompatibile respinto prima del clic, senza anteprima o revisione;
- risposta WOFF2 ritardata fino a dopo la scelta di Arimo, attesa effettiva della risposta e di due frame: nessuna sostituzione del nuovo candidato, documento originale ancora bloccato all’esportazione finché non si applica la correzione;
- errore WOFF2, nessuna anteprima, retry sui byte reali e modifica del solo carattere mancante; nessuna aggiunta duplicata dei font;
- regressioni di preflight/resa/metriche, controllo stabile, diagnosi nell’ispettore e scheda mantenuta: Geometria resta attiva dopo il fallback.

Due casi browser nuovi e tre precedenti aggiornati al controllo preventivo. Nessuna modifica a validatori, regole produttive o timeout per superare le prove. Build/TypeScript, build pubblica e scansione segreti dei due bundle passati; JavaScript pubblico sempre `index-BG2r_x-8.js`. Non è una nuova esecuzione della suite browser generale.

Log `.local/font-candidate-all-units.log`, `font-candidate-browser-regressions.log`, `font-candidate-build.log`, `font-candidate-public-build.log`, `font-candidate-secrets.log` e `font-candidate-public-secrets.log`. Il generatore aggiornato `node --import tsx scripts/capture-editor-font-repair.ts` verifica documento invariato prima di Applica e mostra **Ω** nel candidato Arimo, poi applica al solo indice 4. Catture desktop/mobile ispezionate in `.local/previews/editor-font-repair-choice-*.png`; report `.local/editor-font-repair-capture.json` con zero errori e scritture amministrative.

Riutilizzati il [JSON](../fixtures/illustrator/font-repair.TEST.json) e lo [SVG](../fixtures/illustrator/font-repair.TEST.svg) 80×40 mm, con file TEST incorporati: il nuovo passaggio non ne cambia i byte. **Illustrator non collaudato.**

**70 campioni JSON/SVG riaperti/esportati** e **13 browser pubblici passati**, senza errori o richieste esterne; nessuna lettura di font personali nel controllo dei campioni. Log `.local/font-candidate-artifacts.log` e `.local/font-candidate-public.log`.

### Prova manuale senza progetti personali

Aprire il [laboratorio](http://127.0.0.1:5173/editor?workspace=1) e caricare il [sorgente TEST](../fixtures/illustrator/font-repair.source.TEST.json) tramite **Apri file JSON**. Contiene `ABC Ω` nel subset ABeeZee privo di Ω, più il candidato Arimo incorporato per rendere la prova indipendente dai font della libreria personale. È una bozza volutamente irrisolta, non un file produttivo: resta esclusa dall’elenco dei 70 campioni pronti per lo SVG.

In **Strumenti → Font del progetto**, scegliere Arimo per i caratteri mancanti: deve comparire l’anteprima Ω e abilitarsi Applica, mentre la bozza rimane invariata. Applicando la correzione compare il testo completo; Annulla ripristina il problema e Ripristina la correzione. Il generatore carica proprio questo sorgente e verifica il risultato contro il campione JSON/SVG precedente, rimasto identico.

## Riesame dei sette sorgenti prioritari esclusi

Conversione e preflight ripetuti con il resolver e i file attuali, in sola lettura, sugli originali con hash conservato. Nessun nuovo template importato o font sostituito.

| Template | Casi | Blocco attuale confermato |
|---|---:|---|
| Design fotografico | 2 | `HelveticaNeueLTStd-BdCn`: manca `▪` U+25AA |
| Panificio | 2 | Times New Roman: manca `♨` U+2668 |
| Barbershop | 2 | Times New Roman: manca `✂` U+2702 |
| Vogliamo solo coccole | 1 | File esatto Gloria Hallelujah 700 assente |

Report privato `.local/font-blockers-r638/conversion-review.json`: zero richieste browser esterne o scritture. L’anteprima migliora la correzione manuale dei progetti apribili; non scavalca il preflight di quei sorgenti PitchPrint o sceglie autonomamente un altro carattere.

Archivio principale **SQLite R638: 346 template, due composizioni, 219 font e un profilo**. Nessuna migrazione, nuova importazione, immagine AI, sviluppo multipagina, deploy o modifica a Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout. Chat pubblicata preservata.
