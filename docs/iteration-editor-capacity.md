# Capacità dei progetti e continuità delle bozze

Incremento locale del 9 novembre 2026. Estende i limiti del laboratorio senza dichiarare verificati i profili produttivi reali.

## Limiti aggiornati

Fonte unica: `src/editor/limits.ts`. Documento v2: 200 oggetti, 100 gruppi, 4.000 caratteri Unicode e 100 righe esplicite per box, 20.000 caratteri complessivi. Corpo massimo 500 pt; rimane il minimo TEST di 7 pt. Il conteggio Unicode considera un carattere fuori dal BMP come un solo punto di codice. Gli ingombri misurati superiori a 10.000 mm sono respinti prima del rendering.

Creazione, inserimento, duplicazione, template, import SVG e controlli del testo usano gli stessi limiti; il superamento rifiuta l’intero comando senza un inserimento parziale. Il vecchio formato v1 conserva i suoi limiti storici in lettura.

Restano i limiti separati delle risorse: quattro immagini, 256 KB e un megapixel ciascuna; SVG 256 KB, PDF 2 MB, JSON 10 MB, massimo 16 file font e 4 MB complessivi di font nel progetto, 8.192 segmenti vettoriali complessivi. Questi limiti restano espliciti e andranno misurati su altre composizioni reali; non sono vincoli della lavorazione.

## Continuità del progetto

Prima di aprire una diversa configurazione dall’editor con autosalvataggio viene conservato anche lo stato corrente non ancora raggiunto dal debounce. La protezione vale già nel cambio formato. Non si sovrascrivono le copie congelate del carrello.

Il colore dell’impronta del template viene trasferito tramite `applyTemplate`; le configurazioni precedenti che avevano il colore soltanto nelle opzioni lo ripristinano nel documento all’apertura. Nuove conferme conservano così la stessa tinta fra preview, editor e copia del carrello. L’SVG produttivo rimane monocromatico.

## Evidenze

Tre nuovi test unitari sui limiti e casi Unicode; due browser su importazione/esportazione/riapertura di 200 oggetti, rifiuto atomico della duplicazione e conservazione di 100 righe con corpo editabile 100–120 pt. Aggiornate le prove dei precedenti limiti affinché controllino il nuovo confine effettivo. Prove aggiuntive su template colorato e vecchia configurazione con colore nelle sole opzioni.

Checkpoint mirato: 523 unitari in 66 file passati; nove browser pertinenti e una prova specifica sulle configurazioni precedenti passati. Checkpoint completo e log nello [stato locale](editor-local-status.md). Nessuna prova Illustrator o certificazione di prestazioni su tutti i dispositivi.

Nessuna modifica a negozio, chat pubblicata, BSS, PitchPrint o prezzi; nessun deploy, servizio nuovo o dipendenza aggiunta.
