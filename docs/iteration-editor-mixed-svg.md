# SVG misti e maschere — 12 novembre 2026

L’importazione locale conserva immagini PNG/JPEG incorporate insieme ai vettori. I riferimenti `use` locali vengono espansi; immagini remote, SVG annidati tramite data URI, script, eventi, tipi MIME falsi e dati corrotti vengono rifiutati. Limiti: 2 MiB di sorgente/espansione, 4000 elementi e 24 milioni di pixel complessivi delle istanze incorporate. La decodifica completa precede il commit. Nessun ricorso a font del computer.

## Documento e renderer

Immagini e vettori possono avere fino a otto `clipMasks`: contorni M/L/C/Z normalizzati, frame relativo all’oggetto e regola `nonzero`/`evenodd`. I contorni nello stesso livello formano la maschera; i livelli si intersecano. Le curve e i fori rimangono vettoriali nello SVG. I comandi delle maschere concorrono ai limiti del singolo oggetto, del documento e del libro multipagina; limite fisico delle maschere 10 m. La vecchia `clipRect` resta leggibile.

Stessi `insertObjects`/`updateObject`, validazione, revisioni, Undo/Redo e appunti manuali/AI. Le copie delle maschere sono indipendenti. Il ritaglio dei bordi conserva la porzione della maschera nei pixel originali; PAN e ingrandimento della foto mantengono la cornice. Sostituzione dell’immagine e ridimensionamento conservano la forma. Vettori mascherati esclusi dalla compattazione e dall’uso come guida testo, per evitare perdite silenziose.

Fabric risolve la resa canvas. L’esportatore SVG emette esplicitamente tutte le intersezioni nel piano del gruppo: l’esportazione nativa della catena non era sufficiente. Corretto durante il collaudo un primo markup con gruppi interni ai `clipPath` che rendeva invisibile l’SVG. Il riferimento indipendente usa archi SVG per i fori, mentre il documento usa Bézier cubiche.

PNG e miniature con maschere vengono campionati insieme fino a 8× e poi ridotti. Ogni superficie resta entro 8192 px/16 MP; il fattore scende a 4×, 2× o 1× quando necessario. Rimangono DPI e dimensioni finali richiesti, senza riduzione silenziosa dell’output. Il confronto PNG usa gli stessi DPI fisici e il medesimo arrotondamento della superficie; il riferimento è campionato prima della riduzione, il PNG già ridotto viene letto direttamente.

## Importazione SVG e PitchPrint

Le maschere dei diversi antenati SVG vengono risolte separatamente prima che Fabric sposti le definizioni condivise: conservati proprietario, trasformazioni e regola di ritaglio ereditata. Una maschera può contenere una forma o un percorso composto; più antenati producono intersezioni. Ogni file deve essere convertito interamente prima dell’inserimento.

L’importatore PitchPrint riconosce gli SVG dai byte anche quando l’estensione è `.png`. Il viewport completo, compresi gli spazi vuoti, viene associato al frame legacy. La griglia intrinseca viene letta dal browser soltanto dopo il preflight; campionamento parziale, centratura subpixel, rotazione e riflessione confrontati con un riferimento nativo indipendente. Il risultato diventa un gruppo di vettori e bitmap originali. I contorni deformati sono espansi geometricamente; nessuna immagine sostitutiva del logo.

Distinti limite dei poligoni intermedi Ghostscript (131072, coerente con il worker di unione già limitato) e limite del risultato canonico (32768 per oggetto, 65536 complessivi). Un caso reale produceva 42765 comandi intermedi; la loro unione rientra nei limiti finali. Conservati timeout, limite stdout, memoria worker, precisione fisica e validazione finale.

## Limiti espliciti

- Nessun nuovo strumento avanzato per disegnare o modificare interattivamente le maschere.
- Maschere sul testo editabile, `objectBoundingBox`, unioni di più forme separate in un singolo `clipPath` e definizioni che referenziano altre maschere ancora bloccati. Usare un tracciato composto per una singola sagoma.
- SVG misti con testo: modalità editabile con file font esatti; conversione dei soli testi in contorni da aggiungere. Il convertitore dell’intero SVG viene fermato prima di alterare i pixel delle immagini.
- Bitmap inclinate da una trasformazione affine non rappresentabile, crop legacy SVG con origine pixel non nulla e SVG composti usati come campo foto sostituibile restano bloccanti. Nessun appiattimento o omissione.
- Nessuna attivazione SQLite, migrazione dell’archivio attivo, modifica commerciale o deploy. Illustrator richiede ancora collaudo umano.

## Campione

[JSON](../fixtures/illustrator/mixed-svg.TEST.json), [SVG esportato](../fixtures/illustrator/mixed-svg.TEST.svg), [SVG sorgente sintetico](../fixtures/illustrator/mixed-svg.source.TEST.svg). Tre oggetti, 100 × 70 mm, PNG originale con foro e due intersezioni, vettore con tre intersezioni. Generatore: `node --import tsx scripts/capture-editor-mixed-svg.ts`. Catture desktop/mobile private, nessuna scrittura all’archivio o richiesta esterna. Il verificatore generale comprende il nuovo campione.

## Verifiche e dati reali

- **948 test unitari in 142 file**, build TypeScript/laboratorio, schemi, pacchetto Worker dry-run e controlli segreti passati. Il primo controllo unitario nel sandbox aveva tre `listen EPERM` e un timeout del nuovo caso pesante; esecuzione autorizzata con quattro worker e timeout del solo caso entro il limite operativo esistente poi verde. Nessun allentamento dei vincoli geometrico/produttivi.
- **255 browser pertinenti completi**, poi **113 SVG ricontrollati** comprendenti due casi aggiuntivi: **257 casi distinti**. Ultimi **otto casi delle maschere** ripetuti con campionamento PNG definitivo a 8×. Non una nuova suite generale completa dell’editor. Confronti mantenuti sotto 1% dei pixel di grafica e 0,25/255 di errore medio; nessuna soglia aumentata.
- **13 browser pubblici**, runtime Worker locale e **56 campioni** riaperti/riesportati, nessun errore, richiesta esterna o uso dei font della libreria personale nei campioni. Bundle pubblico ancora `index-BG2r_x-8.js`.
- PNG/JPEG incorporati, `meet`/`slice`/`none`, clip-rule ereditata, riflessioni/rotazioni, gruppi annidati, crop, manuale/AI/Undo, appunti verso documento più piccolo e JSON portabile coperti. Limite di espansione delle maschere controllato prima di costruire il batch; rettangoli oltre il vecchio intervallo normalizzato conservati tramite `clipMasks`.

### Template reale importato

«Qr-Code Agenzia Entrate», **70 × 35 mm**, ora importato con colori, vettori e PNG originali del logo: **64 oggetti e due gruppi**, incluso lo sfondo tecnico di riferimento. Riferimento nativo indipendente completo, tecnico e produttivo: **80 pixel oltre soglia su 129370 pixel di grafica (0,062%)**, errore medio 0,011802/255. PNG produttivo a 150 dpi **413 × 207 px**: 49 pixel su 22682 (0,216%), errore medio 0,128973/255. La prova a 4× aveva errore medio 0,281 e non è stata accettata; l’aumento della precisione entro lo stesso budget bitmap lo ha corretto.

Backup verificato prima dell’unico salvataggio. **Revisione 617 → 618**, **328 template attivi, due composizioni, 219 font**; nessuna associazione prodotto o sovrascrittura. Confrontati tutti i record preesistenti, font, impostazioni, profili e priorità tag: invariati. Il record `e2ada18c-a021-481a-b909-b1509aad7c58` è unico, documento riletto via API identico alla copia verificata. Riaperto nell’editor con tutti gli oggetti/gruppi; miniatura 512 px generata e riusata dopo ricarica con zero letture del record, zero scritture/errori. Schermata reale ispezionata. Sorgenti e rapporti privati in `.local/pitchprint-migration/mixed-svg-prepared/` e `mixed-svg-local-import/`.

SHA archivio prima `f745282d5a995ce8768d91d2e9fa2c65d3ee8bdf840cb94f5d2c78795a6866d2`, dopo `4197c537d02961531000741f2805dc0ca8f08350616efc69a0785d5e4063d343`. Circa **503 MiB** nel JSON attivo. Audit aggiornato: **25 sorgenti prioritari rimasti**, 112 a bassa priorità e otto Templates PitchPrint esclusi. La copia SQLite resta ferma a revisione 616 e non è stata attivata.

### Arresto del server locale e recupero

Il salvataggio era stato completato quando la successiva rilettura ha esaurito il vecchio heap Node da 2 GiB. Verificati prima file e processo terminato: record già presente a revisione 618, quindi **nessuna ripetizione dell’importazione**. Copia di sicurezza intatta, tutti i dati precedenti confrontati; poi rilettura API completata sul server riavviato. Log dell’interruzione e rapporto precedente conservati separatamente.

`npm run dev` avvia ora esplicitamente Node con heap massimo **4 GiB**, invece di dipendere dal valore automatico del computer. Dopo il riavvio standard sono passate apertura e miniatura/cache reali. È una mitigazione locale per questo archivio grande; non risolve la duplicazione sul disco e non dimostra l’assenza di altri accumuli dopo molti HMR. Il riavvio temporaneo a 6 GiB è stato chiuso. Restano necessari i controlli e l’autorizzazione separata del [piano storage](editor-local-storage-plan.md) prima di qualsiasi migrazione.

Fonti tecniche: [intersezioni di clipPath in Fabric](https://www.fabricjs.com/docs/old-docs/clippath-part2/), [immagini incorporate SVG 2](https://www.w3.org/TR/SVG/embedded.html), codice della versione Fabric installata. [Piano incrementale](editor-mixed-svg-plan.md).
