# Recupero delle immagini dal CDN PitchPrint verificato — 12 novembre 2026

## Adattatore e controlli

I sorgenti originali dell’account contengono anche immagini di `d3jpr00va563vk.cloudfront.net`. L’asset del cartello «Io abito qui» è stato letto in sola lettura sia dall’URL originale sia dalla copia su `pitchprint.io/assets/`: entrambe **875.512 byte**, PNG statico **650 × 720 px**, SHA-256 `b2e076bfcdc0700aa6fc2602d0a6b859465d13d0c249993b78a73c48b5350997`, byte identici e decompressione valida. Sorgenti e rapporti privati in `.local/pitchprint-migration/cdn-analysis/`.

Il backend di sviluppo ammette ora questa precisa distribuzione, solo HTTPS, percorso `/assets/img_<64 cifre esadecimali>.png|jpg|jpeg`, senza query, frammenti, credenziali o porte alternative. Non è stata aperta la famiglia `*.cloudfront.net`. Restano download GET senza credenziali, redirect rifiutati, timeout di 15 secondi e volume massimo di 20 MB; i decoder del documento convalidano poi firma, pixel e dimensioni. Gli altri archivi già noti mantengono il comportamento precedente. Non viene riscritto l’URL del sorgente per scegliere una copia presunta equivalente.

Il frontend usa il medesimo endpoint locale protetto e incorpora i byte nel documento, attraverso i comandi validati già esistenti. Il JSON riaperto e l’SVG non hanno dipendenze dal CDN. Nessun nuovo tipo di oggetto o modifica allo schema; i campioni raster/immagini di pagina esistenti restano validi.

## Bozza salvata

**Io abito qui**, **250 × 125 mm**, cinque oggetti e tre gruppi, immagine originale completa e fondo vettoriale conservati. Confronto completo con riferimento indipendente a campionamento 4×: **nove pixel oltre delta 24 su 204.700 pixel grafici**, rapporto **0,0000439668**, errore medio **0,007386**. Le soglie restano 0,01 e 0,25; nessun oggetto, testo o effetto è stato rimosso per far passare il confronto.

Importata una nuova bozza TEST con tag «Da verificare», nessuna associazione prodotto, ID locale `238a9d44-1a24-4c99-b318-9fc395a0a5cd`. Archivio a **255 template, due composizioni, 219 font**, revisione **508 → 509**. Backup verificato prima della scrittura: `.local/pitchprint-migration/verified-cdn-local-import/backup-revision-508-45b75b5dd43d.json`, SHA-256 `45b75b5dd43d1a56063930aad8e2750f396c526551104cb9e533e27cbcc3d571`. Record precedenti, font, impostazioni, profili e ordine dei tag invariati; originali e copia incorporata confrontati per SHA-256. Manifest in `report-final.json` nella stessa cartella.

Riapertura effettiva nel browser conforme a oggetti, gruppi, font, area, carta e impostazioni della targa; screenshot ispezionato. Miniatura generata e riutilizzata dopo ricaricamento, zero richieste del record nella fase di cache. Nessun errore o scrittura in queste verifiche; checksum dell’archivio invariato. Non è un collaudo Illustrator né un’approvazione per produzione.

## Verifiche e seguito

**831 unitari / 123 file**, build laboratorio/pubblico e scansioni dei segreti passati. **Otto browser pertinenti passati**, incluso il nuovo caso riproducibile offline: importazione UI con URL CDN originale, download attraverso l’adattatore, pixel incorporati, riapertura JSON ed esportazione SVG senza richieste esterne o scritture. Test unitari su distribuzioni estranee, percorsi diversi, query/frammenti, credenziali/porte, errori HTTP/stream e policy GET/redirect/timeout.

La suite completa **524/524** è stata conclusa prima di questa modifica del solo adattatore server; dopo la modifica sono stati eseguiti gli otto casi pertinenti, non un secondo comando completo dei 525 scenari ora disponibili. Le **13 regressioni pubbliche** e i **41 campioni** appartengono al collaudo PNG precedente; renderer e campioni sono invariati. JavaScript pubblico ancora `index-BG2r_x-8.js`. Log `.local/cdn-*.log`.

Restano da estendere coerentemente i limiti del documento e degli importatori per i progetti grandi. Il prototipo isolato da 304 oggetti supera già il confronto ma non è una capacità attiva; «Rappresentanti» richiede anche testo con contorno editabile. Restano maschere, glifi/font e primi piani da classificare. Nessun deploy, scrittura online, variazione di prezzi/acquisti o chiamata AI a pagamento.
