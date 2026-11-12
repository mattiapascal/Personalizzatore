**12 novembre — progetti fino a 1.000 oggetti:** [incremento e collaudo](iteration-editor-large-scenes.md). Capacità unica per manuale/AI/JSON/archivi, SVG fino a 2 MiB con espansione limitata e PDF allineati. «Il cane è buono, mia moglie no» completo di 304 oggetti/cinque gruppi confrontato e salvato con backup: **256 template**, due composizioni e 219 font conservati, zero associazioni. **838 unitari, 127 browser pertinenti, 13 pubblici e 42 campioni** passati; build/schemi/segreti verificati. Regressione completa conclusa: **528/529 passati**; il solo test storico attendeva ancora il rifiuto a 200 oggetti. Aggiornato al confine effettivo 1.000 e ricontrollato insieme ad altri due casi grandi: **3/3 passati** (`.local/capacity-final-rerun.log`). Tutti i 529 scenari verificati fra esecuzione e ricontrollo; il primo comando completo resta registrato come fallito. Si può riprendere lo sviluppo. Rappresentanti resta bloccato dal contorno dei testi. Nessun deploy o collaudo Illustrator.

**12 novembre — CDN verificato e un altro cartello:** [incremento e prove](iteration-editor-pitchprint-cdn.md). Adattatore ristretto alla distribuzione e ai percorsi osservati, originali incorporati senza dipendenze remote. «Io abito qui» confrontato e salvato con backup: **255 template**, due composizioni e 219 font conservati, zero associazioni. Riapertura e cache miniatura verificate. **831 unitari**, otto browser pertinenti dopo la suite completa PNG **524/524**, build/segreti passati; bundle pubblico invariato. Prossimo: capacità dei documenti grandi, con il contorno dei testi di Rappresentanti ancora da preservare. Nessun deploy o collaudo Illustrator.

**12 novembre — PNG e un altro cartello recuperato:** [incremento e prove](iteration-editor-png-metadata.md). PNG EXIF canonici, copie concatenate equivalenti verificate anche nel backend, originali completi nel JSON e orientamento SVG senza ricampionamento, anche a 16 bit/palette/Adam7. Salvato «Corrieri: Cane onnivoro» con backup e confronto completo superato: **254 template**, due composizioni e 219 font conservati, nessuna associazione. Riapertura e cache miniatura verificate. **828 unitari**, 90 browser pertinenti, 13 pubblici e 41 campioni passati; build/schemi/segreti verificati, JavaScript pubblico invariato. Regressione completa **524/524 passata in 17,8 minuti** (`.local/png-full-browser.log`), processo concluso; verificato il codice `9c164d9`. Si può riprendere lo sviluppo. Nessun deploy o collaudo Illustrator.

**12 novembre — checkpoint fondi vettoriali:** [incremento e nove copie salvate](iteration-editor-page-vectors.md), archivio a **253 template**, due composizioni e 219 font conservati. Nove riaperture e cache miniature verificate. **794 unitari**, 13 pubblici e 40 campioni passati. Suite completa conclusa: 518/519 passati; corretto il solo test di attesa della rimozione e verificato con dieci ripetizioni e cinque regressioni configurazioni. Tutti i 519 scenari verificati fra esecuzione e ricontrolli, senza dichiarare verde il primo comando. Il processo completo è terminale; si può riprendere lo sviluppo. Prossime diagnosi: PNG EXIF/integrità, capacità dei due corpi da 542/301 elementi, maschere, fonte esatta del CDN e due primi piani; restano anche i 28 casi dell’altro lotto e i font/glifi precedentemente segnalati.

**12 novembre — checkpoint:** [107 nuove bozze complete](iteration-editor-pitchprint-comparison.md), archivio a **244 template**, due composizioni e 219 font conservati. Tutte le nuove copie riaperte in sola lettura e 107 miniature verificate dalla cache dopo ricaricamento; regressione completa **513/513 passata**, insieme a 783 unitari, 13 pubblici e 39 campioni. [Cache/capacità locale](iteration-editor-archive-capacity.md) a 512 MiB, senza migrazione del JSON. Confronti completati sui 135 candidati; prossimi casi: 28 sospesi e fondi SVG attivi, oltre ai 29 da classificare o estendere. Nessuna associazione prodotto o deploy.

# Lavori attivi e direttive più recenti — 12 novembre 2026

Questa nota mantiene le richieste più recenti. Gli incrementi completati e quelli ancora aperti sono distinti qui sotto.

## Diagnosi successive al PNG — 12 novembre

Prove isolate, senza cambiare applicazione o archivio durante la regressione completa:

| Caso | Evidenza | Prossimo intervento |
| --- | --- | --- |
| Il cane è buono, mia moglie no | 301 elementi nativi, 304 oggetti / cinque gruppi convertiti nel solo prototipo con budget 1.000; confronto indipendente rapporto 0,0008336, errore medio 0,0151334 | [Capacità estesa e collaudata, conversione senza override e importazione completate](iteration-editor-large-scenes.md) |
| Rappresentanti | 542 elementi, 6.833 comandi dei tracciati; superata la prima barriera emergono sette box di testo con contorno | Serve conservare il contorno e l’editabilità del testo. Non togliere lo stroke o convertire automaticamente i testi in vettori |
| Io abito qui | Immagine della distribuzione CDN indicata dal sorgente e copia `pitchprint.io/assets/` lette in sola lettura: entrambe 875.512 byte e stesso SHA-256 | [Adattatore, confronto e importazione completati](iteration-editor-pitchprint-cdn.md) dopo queste prove |

Gli override del prototipo esistevano soltanto nel trasporto Playwright di un browser separato. I successivi incrementi hanno attivato e collaudato la capacità a 1.000 oggetti e importato **Il cane è buono, mia moglie no** e **Io abito qui**; Rappresentanti resta bloccato dai contorni del testo. Rapporti privati del prototipo in `.local/pitchprint-migration/large-design-prototype/`, `cdn-analysis/` e `recovery-readiness-2026-11-12.json`; i successivi esiti effettivi sono nei resoconti degli incrementi. Non sono conteggi globali degli esclusi.

Controllo della cache di lettura su archivio reale a revisione 508: caricamento freddo del processo separato **5.498 ms**, riuso dello stesso snapshot **0,13 ms**, heap rilevato a fine lettura circa **1.494 MiB**. Nessuna scrittura. È una misura singola durante altre prove locali: conferma il riuso, ma lascia da migliorare tempo/memoria della lettura completa; non descriverla come caricamento istantaneo dell’editor.

## Ordine di lavoro

1. **Completati:** trasparenza fill/contorno e zoom interno delle foto, collaudi/campioni e sincronizzazione GitHub.
2. **Immagine monocolore:** switch grigi da qualsiasi RGB, poi bianco→trasparenza proporzionale e tinta scelta al posto del nero. Conservare alpha e byte originali, crop, EXIF, filtri non distruttivi, cache e comandi condivisi. [Completato e collaudato](iteration-editor-raster-monochrome.md), compresi RGB, alpha e tinta.
3. [Colore del foglio](iteration-editor-paper-color.md), [immagini di pagina raster](iteration-editor-page-images.md) ed [espansione dei contorni deformati](iteration-editor-stroke-outlines.md) completati. **20 nuove bozze locali**, archivio a **137 template**, due composizioni e 219 font conservati; backup, nessuna sovrascrittura o associazione prodotto. Azienda Agricola 99×139 importata nella copia senza il solo testo curvo, da completare manualmente. Continuare le conversioni prioritarie: prima sviluppare/verificare la capacità, poi confronto completo e salvataggio. [Riconoscimento dei descrittori inattivi completato](iteration-editor-inactive-page-assets.md): altre sei copie complete salvate, compresi tre Attenti al cane. Prossimo lavoro: confronto di altri 135 candidati con ruoli già determinabili; poi sfondi SVG di pagina, maschere/opacità e diagnosi dei glifi mancanti.
4. **Librerie Immagini/Pictures e Sfondi completate in locale** ([resoconto](iteration-editor-media-library.md)): 725 immagini e 59 sfondi, 13 categorie, 254 bandiere con larghezza iniziale 50 mm. Una bandiera con testo/font non verificati sospesa. Quattro materiali distinti dai 55 sfondi produttivi. Backend per categorie/contenuti e controlli frontend. Trasferire categorie e contenuti PitchPrint in locale se leggibili. Riutilizzare le risorse del documento e i comandi validati, con miniature persistenti e originali verificati. Inventario e piano prima delle scritture locali massive; nessuna scrittura su PitchPrint o sul negozio.

## Eccezione Azienda Agricola

Il titolare autorizza a escludere il solo testo curvo dall’Azienda Agricola **99 × 139 mm**, quello con i filtri dell’immagine; lo reinserirà manualmente. Gli altri template curvi restano a priorità bassa, compreso il 99 × 93 mm. Copia derivata e manifest in `.local/pitchprint-migration/prepared-sources/`; originale invariato per SHA-256. Rimossi uno degli otto elementi radice, sette conservati. Non togliere altri testi, gruppi, sfondi o filtri senza conversione esplicita.

Originale dell’immagine letto in sola lettura: PNG 870 × 1148 px, 1.107.246 byte, SHA-256 `a92f918899d7fdfa51c3e81cdae6ef3876d759c86e59a0de2fa9b0c9952da35a`. I filtri originali sono Kodachrome, HueRotation -1,748, Saturation 0,85. La nuova resa monocolore è una trasformazione voluta, non una certificazione di equivalenza ai tre filtri. Le informazioni originali vanno conservate nel manifest.

Analisi corrente: **279/370 convertibili**, 91 bloccati; **278/345 prioritari convertibili**, 67 bloccati. Venticinque a bassa priorità: uno convertibile, 24 bloccati. Il benchmark esclude globalmente gli sfondi e non certifica la conversione completa. I 13 candidati con ruoli di pagina chiari hanno superato confronti indipendenti prima del salvataggio, insieme alla copia autorizzata di Azienda Agricola. Sei dei sette nuovi candidati sospesi erano descrittori inattivi: corretti e importati. Resta il Retro bottiglia 99×93 con fondo vettoriale attivo. [Resoconto](iteration-editor-stroke-outlines.md), [analisi dei blocchi](editor-template-blockers-priority-2026-11-11.md).

## Librerie: criteri di accettazione

- Immagini e sfondi distinti, entrambi con categorie, ricerca, miniature e gestione locale nell’amministrazione.
- Conservare titoli, appartenenze, ID di origine e checksum; controllare formati/pesi/dimensioni e non sostituire file mancanti con anteprime a bassa risoluzione.
- Scelta/inserimento dal frontend con gli stessi comandi già usati per i caricamenti manuali; progetto riapribile senza dipendenze dai file originali su PitchPrint.
- Per gli sfondi distinguere grafica produttiva e sola anteprima del materiale; non trasformare automaticamente ottone/legno/materiali in immagini stampate.
- Il recupero degli sfondi può sbloccare template, ma resta necessario convertirne fedelmente collocazione e ruolo, non solo scaricare il file.

La guida ufficiale [Managing your Designs](https://docs.pitchprint.com/article/65-managing-your-designs) descrive filtri Include/Exclude delle categorie delle risorse (Pictures, Backgrounds, Colors, Fonts, Text Art), blocco dello sfondo e visibilità dei pannelli. Sono comportamenti da considerare insieme alle proprietà del template. Nel client pubblico già acquisito, `assets/` alimenta raccolte `image` e `background`; il censimento generale è stato ottenuto dalla stessa richiesta `assets/` del client, in sola lettura. Il primo elenco per design era filtrato: solo la lettura generale ha restituito anche le quattro categorie degli sfondi. 785 originali recuperati; 784 risorse verificate/importate, una sospesa per evitare font del computer.

## Multipagina

Il titolare ha chiesto di valutarne l’aggiunta: proposta una prima modalità fronte/retro, mantenendo un progetto canonico. È ancora una discussione; non è un’autorizzazione già eseguita né una funzione implementata. I nove layout dei civici sono alternative; i viari contengono effettivamente Fronte/Retro. [Dettagli](editor-template-blockers-priority-2026-11-11.md).

## Confini

Tutto locale. Nessun deploy o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello, checkout, ordini o chat pubblicata. No immagini AI. Nessun font del computer o sostituzione implicita. I sorgenti privati rimangono in `.local`, non nel repository.

## Prossimo blocco di conversione

Sfondi/primi piani raster e contorni deformati ora conservati con originali e precisione collaudati. Completato il confronto indipendente dei **135 candidati**: 107 importati, 28 sospesi. Miniature e riapertura verificate; codice sincronizzato dopo unitari, build, regressioni pertinenti e pubbliche. Suite completa conclusa: 513 passati. Gli **sfondi SVG di pagina** sono ora gestiti per le geometrie native serializzate ([incremento](iteration-editor-page-vectors.md)); nove copie complete salvate. Conservare vettori, colori, proporzioni e distinzione grafica/materiale; completare i dieci blocchi residui del lotto senza sostituzioni con miniature. Poi maschere/opacità e copertura dei caratteri. Non cancellare elementi per aggirare i blocchi e non importare risultati che superino soltanto il primo errore del convertitore.
