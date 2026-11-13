# Confronto sulla stessa griglia fisica e Retro bottiglia — 13 novembre 2026

**Retro bottiglia classico — 99×93 mm è ora importato nell’archivio locale.** Il disegno non richiedeva una correzione: il confronto precedente era alterato dalla cache del renderer originale e da griglie di rasterizzazione differenti. La nuova prova conserva geometrie, colori e font; non modifica il template né allarga le soglie di accettazione.

## Diagnosi riproducibile

Le copie private del sorgente sono state separate in testi, cornici, sfondo e primo piano. Sono state mantenute anche le prove fallite. Il confronto iniziale fra Canvas Fabric 3.4 e lo SVG caricato direttamente in un elemento `Image` dava 1,509% di pixel oltre soglia ed errore medio 1,208/255.

Due effetti interferivano con la prova ad alta risoluzione:

- Fabric 3 limita la propria cache bitmap a 2.097.152 pixel totali per oggetto: gruppi e testi grandi possono essere ridotti e poi ingranditi, mentre lo SVG rimane vettoriale. Disabilitare la cache nel solo riferimento di confronto evita di trattare quella sfocatura come differenza del documento.
- Il browser espone **374×351 pixel naturali** per uno SVG 99×93 mm. Disegnarlo direttamente su una bitmap ricavata dagli interi 281×264 del canvas legacy combina arrotondamenti e rapporti differenti. Occorre fissare una sola scala pixel/mm, conservare i bordi frazionari e allineare i due viewport prima di confrontare i campioni.

`tests/helpers/svg-physical-grid.browser.ts` costruisce una griglia fisica esplicita. Lo SVG originale viene annidato in un viewport esterno con dimensioni intere, mantenendo internamente misure frazionarie, `viewBox` e regola `preserveAspectRatio` originali. Il bordo finale viene completato con lo spazio del pixel, senza dilatare separatamente larghezza e altezza. Le misure dichiarate devono corrispondere alla griglia: una dimensione diversa è rifiutata. Il risultato è solo una proiezione per i test; **non sostituisce lo SVG produttivo in mm** e non entra nel JSON.

La prova Canvas originale usa la stessa scala fisica e lo stesso ritaglio della pagina, con i byte esatti dei font e le immagini originali. Le coordinate dei gruppi/testi sono costruite direttamente da Fabric 3.4.0, indipendentemente dal convertitore. Il runtime originale mantiene hash `258c39e56febc83362baf4144cf534cd77e54cf17f1c396b217bfcfa47cfe5f3`.

Tutte e sette le etichette passano anche con l’helper di regressione condiviso. Nel Retro bottiglia rimane **un pixel oltre 24/255 su 895.162 pixel di grafica**: circa **0,000112%**, errore medio **0,0878/255**. Le soglie restano 1% e 0,25/255. Le altre sei etichette già importate hanno zero o un pixel oltre soglia e media 0,0053–0,0113/255. Le versioni precedenti dei confronti restano documentate nel [resoconto delle sei importazioni](iteration-editor-foreground-label-import.md); il nuovo metodo supera quella diagnosi, non riscrive i log storici.

## Regressioni e campione

Tre test browser verificano:

1. Un disegno SVG confrontato con linee/rettangolo Canvas analitici indipendenti: **zero pixel differenti** sulla griglia esplicita; il caricamento diretto in mm lascia un errore misurabile.
2. Bordi fisici frazionari senza perdita dell’ultima riga/colonna. Uno spostamento di 1 mm e un `viewBox` sbagliato continuano a produrre differenze; una misura fisica sbagliata viene rifiutata. Il metodo non normalizza una geometria errata per farla passare.
3. Gli stessi comandi manuali e AI simulati producono lo stesso documento; uno spostamento reale resta rilevabile, Undo ripristina pixel identici, JSON e documento sorgente restano invariati durante il confronto.

**1.161 unitari / 163 file passati**, inclusi tre nuovi casi su griglia/budget/confronti, **tre nuovi browser passati**, build e TypeScript passati. I primi tentativi browser hanno rilevato due problemi del nuovo test: `strokeMm: 0` nella fixture, non ammesso dallo schema, e il confronto fra input grezzo e documento normalizzato invece che con la copia iniziale dello stesso input. Corretti solo i test; nessuna modifica ai validatori applicativi, ai timeout o ai controlli dei font.

**70 campioni JSON/SVG riaperti e riesportati**, zero errori browser, richieste esterne o letture di font personali. [JSON TEST](../fixtures/illustrator/physical-grid.TEST.json) e [SVG TEST](../fixtures/illustrator/physical-grid.TEST.svg), 99×93 mm, Arimo incorporato. Generatore `node --import tsx scripts/capture-editor-physical-grid.ts`; cattura ispezionata, report e cronologia manuale/AI/Undo in `.local/physical-grid-capture/`. Nessuna nuova funzione multipagina o immagine AI. **Illustrator non collaudato**.

Log `.local/physical-grid-all-units.log`, `physical-grid-browser-passed.log`, `physical-grid-build.log`, `physical-grid-types-final.log`, `physical-grid-artifacts.log` e `physical-grid-secrets.log`. Non è stata rieseguita la suite browser generale; i 47 casi pertinenti dell’incremento precedente non vengono conteggiati come nuovi.

**13 browser pubblici passati** nel laboratorio, log `.local/physical-grid-public.log`. Il JavaScript applicativo è invariato (`index-nQ_oy_t1.js` nel laboratorio); l’incremento riguarda helper/campioni/test e documentazione, senza cambiare i moduli pubblici o preparare un deploy.

## Importazione locale verificata

Backup SQLite nativo indipendente a **R637**, riletto integralmente e confrontato con il checkpoint attivo. Un solo `importPitchprintTemplate`, con `formOrderVersion: 1`, tag originali/«Da verificare» e nessuna associazione prodotto. Grafica, testi editabili, colori, primo piano e sfondo conservati; nessuna modifica al convertitore o al renderer applicativo richiesta da questo recupero.

Rilettura esatta del documento salvato e controllo di tutti gli indici/checksum preesistenti: **R637 → R638, 346 template attivi, due composizioni, 219 font e un profilo**. Record/font/impostazioni precedenti invariati. Riapertura nel vero editor, otto testi e un’immagine nello SVG, nessun avviso font/errore. Miniatura generata e riutilizzata dopo ricaricamento senza leggere nuovamente il documento; zero scritture amministrative o variazioni al database durante la verifica.

Evidenze private in `.local/foreground-classification/physical-grid-helper/` e `.local/pitchprint-migration/retro-bottle-local-import/`: confronto, sorgenti con hash, backup, record e verifica. Dati personali e file dei font non vengono aggiunti a GitHub.

Il censimento aggiornato da SQLite conta **473 sorgenti: 346 importati, 7 prioritari residui, 112 a priorità bassa e 8 esclusi**. Restano le due versioni di Design fotografico, Panificio e Barbershop con glifi mancanti nei file già individuati, più Vogliamo solo coccole con il file esatto Gloria Hallelujah 700 assente. Nessuna sostituzione silenziosa dei font. Nessun deploy, migrazione o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout; chat pubblicata preservata.
