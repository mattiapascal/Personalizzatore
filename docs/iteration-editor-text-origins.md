# Origini dei testi importati — 12 novembre 2026

## Problema e verifica

Fabric 3 include lo spessore del contorno nel calcolo dell’origine anche quando il colore del contorno è nullo. L’importatore precedente lo azzerava: alcuni testi restavano spostati rispetto al sorgente. Il [contorno editabile](iteration-editor-text-stroke.md) ha corretto il calcolo per le nuove conversioni; questo controllo riguarda le copie già salvate.

L’inventario dei 473 snapshot trova 47 sorgenti con 285 testi di questo tipo. Incrociandoli con l’archivio effettivo risultano **30 template, 76 testi interessati su 78**. Tutti i 30 documenti coincidono esattamente con i JSON preparati e verificati durante le rispettive importazioni: nessuna modifica manuale alla grafica da sovrascrivere. Hash dei sorgenti e copie precedenti ricontrollati. Nessuno dei 76 testi usa `strokeUniform`; nessun testo dei 473 snapshot omette `strokeWidth`.

Il ricalcolo usa il convertitore attuale sui testi, mantenendo indici e matrici degli antenati in una copia diagnostica. Gli altri elementi diventano segnaposto passivi soltanto in quella prova, per evitare il servizio di espansione durante la suite completa. **Quella copia non viene salvata come template.** Nel candidato completo si aggiornano i soli testi del documento precedente; immagini, tracciati, gruppi e risorse rimangono identici. Campi ammessi: X/Y e proprietà del contorno base/locale; nessun cambiamento a contenuto, font, dimensioni del box o allineamento.

Lo scostamento coincide con il contributo analitico dello spessore all’origine, dopo scala e rotazione di oggetto, gruppi e pagina: errore massimo **6,64 × 10⁻¹⁴ mm**, spostamento massimo effettivo **0,364326 mm**. I due testi non interessati restano identici.

## Confronto completo

Ogni candidato completo è confrontato con il sorgente nativo indipendente, usando i font incorporati esatti e gli originali delle immagini. Non si confronta soltanto il testo isolato. Tutte le 30 copie precedenti superano almeno una delle soglie del riferimento corretto; **tutte le 30 copie corrette rientrano nelle soglie invariate**, rapporto pixel oltre delta 24 < 0,01 ed errore medio < 0,25.

Peggiori risultati dopo la correzione: rapporto **0,0056768312**, errore medio **0,08106147**. Esempio «Io abito qui»: 3.078 → nove pixel discordanti; rapporto 0,01497599 → 0,00004398. «Timbro Posta Raccomandata 1 Business (con prova di consegna)»: 12.472 → 208 pixel, rapporto 0,14016318 → 0,00250292. Tavola sorgente/prima/dopo ispezionata. Nessuna sostituzione tipografica o rasterizzazione dei testi.

Inventari e prove privati: `.local/pitchprint-migration/text-stroke-prepared/imported-origin-*.json` e `text-origin-corrections/report.json`; SVG completi precedenti/corretti/di riferimento conservati separatamente. Il primo confronto si è fermato su un attributo `strokeLineJoin: round` non incluso nell’elenco consentito dal verificatore; aggiunto il campo reale e ripresi i quattro casi mancanti, senza cambiare dati o soglie.

## Regressioni

Suite completa sul codice applicativo `a213f09`: **537/538 passati in 21 minuti**, `.local/text-stroke-full-browser.log`, handle 19662 terminale. Il solo errore è nel test SVG con ancoraggio middle: il font TEST non era ancora visibile nel registro al momento dell’importazione. Il test ora attende l’editor e carica/rende espliciti i font TEST nella stessa istanza del modulo usata dall’applicazione. Non è una modifica al comportamento o ai fallback del prodotto.

Ricontrollo: **4/4 passati in 11,2 secondi**, `.local/text-origin-final-browser.log`: start/middle/end e un nuovo scenario con **18 combinazioni** (IText/Textbox, nove origini, scala non uniforme, rotazione e gruppo). Delta delle origini verificati a nove decimali; larghezza/altezza e ingombro invariati; contorno invisibile conservato nel JSON. Tutti i 538 scenari originali verificati fra esecuzione e ricontrollo, più il nuovo caso: **non una nuova esecuzione completa verde di 539 scenari**. Il primo comando completo resta registrato come fallito.

Nel nuovo campione ruotato, geometrie SVG e delta coincidono, ma il campionamento 4× produce 77 pixel discordanti su 2.907, errore medio 0,0081648. Diagnosi conservata: 1× e 2× danno zero differenze, 8× zero pixel oltre soglia ed errore medio 0,0010336. Il test controlla sia la resa normale sia quella ad alta risoluzione con le stesse soglie, oltre alle 18 verifiche geometriche esatte; non allarga la tolleranza per far passare il campione 4×. I 30 confronti reali sopra restano tutti a 4×. Ripetuti inoltre cinque volte per ancoraggio i tre casi SVG: **15/15 passati**, `.local/text-origin-svg-repeat.log`, per controllare la corsa dei font su pagine nuove. TypeScript verificato. Il codice applicativo non cambia in questo incremento; restano le 854 prove unitarie, 13 pubbliche e 44 campioni dell’incremento precedente, senza dichiararne una nuova esecuzione.

## Salvataggio locale

Applicate le 30 correzioni tramite `replaceRecord`, con revisione attesa e versione del singolo record. **Stessi ID di record, documento e oggetti**, versione record 1 → 2 e revisione grafica incrementata. Le schede eventualmente aperte sulla versione precedente dovranno riaprire il progetto prima di sovrascriverlo: vale il controllo concorrente già presente nell’editor.

Archivio **513 → 543**, sempre **259 template, due composizioni e 219 font**. Nessun nuovo template o associazione. Impronte dei 231 record estranei invariate; per i 30 target, titolo, tag, provenienza, associazioni e altri metadati identici. Impostazioni, profili, font e priorità dei tag invariati. Prima di ogni salvataggio il documento precedente doveva ancora coincidere con quello verificato; un conflitto interrompe la procedura.

Backup completo `.local/pitchprint-migration/text-origin-corrections/backup-revision-513-3a892bf7c34d.json`, SHA-256 `3a892bf7c34da0cc704c3207a6735a16866bca78f771b805dca2fa17ff271306`. Manifest `applied-report.json` con fingerprint delle copie aggiornate e controllo finale degli invarianti. Originali dei sorgenti immutati. Nessuna scrittura su Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout; chat pubblicata e codice applicativo invariati. Nessun deploy o chiamata AI a pagamento; Illustrator resta da collaudare.

Riapertura effettiva dei **30 record** nel browser: oggetti, gruppi, font, area, carta e targa identici a quanto salvato, zero errori o scritture. Screenshot del timbro ispezionato. Miniature generate per tutte le 30 copie e ricontrollate dopo ricaricamento: **zero riletture dei record dalla cache**, zero errori e scritture; archivio invariato per SHA-256 durante entrambi i controlli, `e86088a56c0d803677396bf514dc8fa7e35a6610df2d6cc9134a1e201607ea2b`. Log `.local/text-origin-corrections-reopen.log` e `text-origin-corrections-thumbnails.log`. L’invalidazione usa la chiave del contenuto già presente, senza cancellare indiscriminatamente le altre miniature.

La distinta richiesta sulle bandiere è stata applicata a **100 mm**, con [prova reale e backup della libreria](iteration-editor-media-library.md#larghezza-delle-bandiere--12-novembre). Prossimo lavoro: riprendere i template prioritari ancora sospesi e le maschere/testi e i font/glifi non rappresentabili, mantenendo confronti completi e originali. Non estendere il perimetro commerciale o trattare questi controlli come approvazione produttiva.
