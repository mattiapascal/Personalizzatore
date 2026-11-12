# Tredici template recuperati con i riferimenti completi — 12 novembre 2026

## Riesame e fedeltà

Riesaminati i 16 confronti prioritari oltre soglia usando gli originali completi delle immagini di pagina e le rispettive griglie di anteprima legacy, anziché inserirli come normali oggetti del corpo nel riferimento nativo. Nessun abbassamento delle soglie: rapporto dei pixel differenti <1%, errore medio per canale <0,25.

**Tredici sorgenti passano sia la tavola tecnica sia il file produttivo:**

- Targhe ottone 2: Consulente del lavoro, Studio notarile, Notaio con piano, Centro medico specializzato e Fisioterapista, 200 × 100 mm.
- Otto numeri civici: 15 × 10 e 16 × 12 cm con bordo blu, gli stessi due formati con stemma, e quattro varianti 16 × 12 cm con una/due/tre/più cifre. Unità canoniche e interfaccia in mm.

Tutti monopagina, come gli array di pagine dei rispettivi sorgenti acquisiti. Le misure alternative elencate nei metadati smartSizes non sono pagine aggiuntive. Materiali e cornici già sul supporto restano riferimenti inferiori; eventuali viti già incluse nel bitmap non vengono separate o ridisegnate. Loghi, stemmi e testi del corpo conservano colori e ruolo produttivo. Oggetti, blocchi, proprietà e byte delle immagini originali conservati; font esatti, nessun fallback.

Nei 26 confronti dei tredici candidati: **zero pixel oltre la soglia di differenza**, errore medio massimo 0,00411 per le tavole tecniche e 0,004108 per i produttivi. I tre cartelli metallici «20x30», «Modello» e «30x20» restano oltre soglia, rispettivamente circa 1,43%, 1,43% e 2,37% di pixel differenti. Contengono una cornice a tracciato con contorno espanso: da diagnosticare, non eliminata o promossa per approssimazione.

## Salvataggio locale

Tredici nuove bozze con tag «Da verificare», zero associazioni prodotto e nessuna approvazione produttiva. **326 template attivi, due composizioni e 219 font; revisione 616**, partendo dalla revisione 603.

Backup privato preventivo `.local/pitchprint-migration/priority-native-reference-local-import/backup-revision-603-c83e0c364812.json`, SHA-256 `c83e0c364812b01a52c7d0c0035c47d100130c124dbd0750824de19496cd46f2`. Capacità controllata prima di iniziare. Ogni passaggio controlla revisione, hash del documento preparato/riletto, assenza di duplicati e invarianti di tutti i record precedenti, font, impostazioni, profili e ordine dei tag. Nessuna sovrascrittura.

**Tutte le tredici copie riaperte** nell’editor: geometria, oggetti/gruppi, riferimenti, dimensioni, font e contenuto uguali a quelli salvati; canvas pronto e zero avvisi font. Tredici miniature verificate in amministrazione e riutilizzate dopo il ricaricamento senza richieste dei record. Zero errori o scritture durante i controlli. Schermate di targa ottone e numeri civici con/senza stemma ispezionate.

Rapporti privati sotto `.local/pitchprint-migration/`: `priority-native-reference-recheck/report.json`, `priority-native-reference-local-import/report-compact.json`, `reopen-report.json` e `thumbnails-report.json`. Sorgenti originali conservati e verificati tramite hash.

## Stato corrente e capacità

Audit di 473 sorgenti acquisiti: **326 importati, 27 prioritari ancora da risolvere**, tutti monopagina; 18 monopagina e 94 multipagina a bassa priorità, otto esclusi Templates PitchPrint. I 27 comprendono tre confronti di cornici, sette primi piani da classificare, quattro originali mancanti, sei problemi di glifi, due SVG senza elementi visibili, un formato oltre un metro, un PNG non valido, un font esatto assente e due maschere ruotate.

Archivio di **526.058.877 byte, circa 501,7 MiB su 512 MiB**. Audit delle risorse: 1.062 occorrenze, 289 contenuti unici (219 font e 70 immagini); **441.333.657 byte di stringhe ripetute**. [Piano dello storage](editor-local-storage-plan.md): preparare deduplicazione per contenuto su una copia isolata, conservando API e JSON esportabili completi, prima di altri grandi lotti. Nessuna migrazione di storage effettuata.

## Ambiente e verifiche

Durante il primo tentativo di confronto il vecchio processo Vite, rimasto attivo attraverso numerosi aggiornamenti HMR, ha raggiunto il limite heap di circa 2 GiB. Processo terminato verificato; riavviato con il medesimo comando, **senza aumentare l’heap del server**. Con la sessione pulita sono passati tutti i 16 confronti e i tredici salvataggi; l’archivio era invariato durante il tentativo interrotto. La causa precisa dell’accumulo della vecchia sessione non è ancora provata; non dichiarare risolta o dimostrata una perdita di memoria.

Codice applicativo dell’incremento anteprime `ba5f9f0` invariato durante il lotto. Restano valide le verifiche di quell’incremento: **906 unitari, 69 browser pertinenti più otto ricontrolli, 13 pubblici e 54 campioni**, build, Worker e segreti. Il lotto aggiunge confronti, salvataggi protetti, tredici riaperture e cache reali; non equivale a una nuova suite browser generale. Illustrator non collaudato. Nessun deploy o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout.
