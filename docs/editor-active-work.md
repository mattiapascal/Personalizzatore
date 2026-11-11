# Lavori attivi e direttive più recenti — 11 novembre 2026

Questa nota mantiene le richieste più recenti. Gli incrementi completati e quelli ancora aperti sono distinti qui sotto.

## Ordine di lavoro

1. **Completati:** trasparenza fill/contorno e zoom interno delle foto, collaudi/campioni e sincronizzazione GitHub.
2. **Immagine monocolore:** switch grigi da qualsiasi RGB, poi bianco→trasparenza proporzionale e tinta scelta al posto del nero. Conservare alpha e byte originali, crop, EXIF, filtri non distruttivi, cache e comandi condivisi. [Completato e collaudato](iteration-editor-raster-monochrome.md), compresi RGB, alpha e tinta.
3. [Colore del foglio completato](iteration-editor-paper-color.md): conserva i fondi pieni nei template e nelle esportazioni; corregge anche il passaggio RGB al compositore targhe. [Recupero delle immagini di fondo/primo piano implementato](iteration-editor-page-images.md), con scelta esplicita del ruolo e collaudi riportati nel resoconto. La verifica reale di Azienda Agricola ha evidenziato due contorni da espandere dopo la correzione degli assi fisici: nessuna bozza parziale salvata. Usare le funzioni collaudate per **convertire i template non a bassa priorità**, correggendo le incompatibilità per gruppi. La sequenza richiesta è prima sviluppare/verificare la capacità, poi convertire; niente dichiarazioni di pronto basate solo sul superamento del primo errore.
4. **Librerie Immagini/Pictures e Sfondi completate in locale** ([resoconto](iteration-editor-media-library.md)): 725 immagini e 59 sfondi, 13 categorie, 254 bandiere con larghezza iniziale 50 mm. Una bandiera con testo/font non verificati sospesa. Quattro materiali distinti dai 55 sfondi produttivi. Backend per categorie/contenuti e controlli frontend. Trasferire categorie e contenuti PitchPrint in locale se leggibili. Riutilizzare le risorse del documento e i comandi validati, con miniature persistenti e originali verificati. Inventario e piano prima delle scritture locali massive; nessuna scrittura su PitchPrint o sul negozio.

## Eccezione Azienda Agricola

Il titolare autorizza a escludere il solo testo curvo dall’Azienda Agricola **99 × 139 mm**, quello con i filtri dell’immagine; lo reinserirà manualmente. Gli altri template curvi restano a priorità bassa, compreso il 99 × 93 mm. Copia derivata e manifest in `.local/pitchprint-migration/prepared-sources/`; originale invariato per SHA-256. Rimossi uno degli otto elementi radice, sette conservati. Non togliere altri testi, gruppi, sfondi o filtri senza conversione esplicita.

Originale dell’immagine letto in sola lettura: PNG 870 × 1148 px, 1.107.246 byte, SHA-256 `a92f918899d7fdfa51c3e81cdae6ef3876d759c86e59a0de2fa9b0c9952da35a`. I filtri originali sono Kodachrome, HueRotation -1,748, Saturation 0,85. La nuova resa monocolore è una trasformazione voluta, non una certificazione di equivalenza ai tre filtri. Le informazioni originali vanno conservate nel manifest.

Ultima analisi precedente alla correzione degli assi fisici (conteggi storici, sostituiti dall’analisi seguente): **345 sorgenti a pagina singola prioritari: 258 convertibili e 87 ancora bloccati**. Venticinque a bassa priorità: 13 nelle categorie Biglietti da Visita/Templates PitchPrint (1 convertibile, 12 bloccati), 12 con testo curvo (tutti bloccati). Conteggi complessivi invariati: 259/370 convertibili. Nessuna nuova importazione nell’archivio, ancora 117 template e due composizioni. [Analisi dei blocchi](editor-template-blockers-priority-2026-11-11.md).

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

Sfondi/primi piani raster ora ricostruiti con originali e griglia dell’anteprima verificata, senza trasformare materiali in grafica produttiva. Il passaggio SVG dei vettori ora rispetta entrambi gli assi fisici; i contorni deformati non vengono approssimati. Prossimo incremento: espansione fedele dei contorni in tracciati per recuperare i casi reali, inclusi i due ornamenti di Azienda Agricola, poi nuova conversione e confronto completo prima del salvataggio. Non cancellare i contorni per aggirare il blocco.

Analisi corrente con assi fisici esatti, stessi sorgenti e sfondi esclusi: **238/370 convertibili**, 132 bloccati; **238/345 prioritari convertibili**, 107 bloccati. Ventuno nuovi arresti corretti per contorni non uniformi; fra le bozze esistenti riguarda solo «Retro bottiglia classico», lasciata intatta. Prototipo privato di espansione dei due contorni di Azienda Agricola: confronto completo superato (rapporto 0,000187, errore medio 0,104/255), 31 oggetti. Da trasformare in capacità generale con contratto numerico sicuro, precisione e limiti collaudati prima dell’importazione reale. [Evidenze e limiti](iteration-editor-page-images.md).
