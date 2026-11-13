# Sorgenti prioritari rimasti — diagnosi del 12 novembre 2026

**Aggiornamento 13 novembre:** [maschere sul testo e due cartelli verificati](iteration-editor-pitchprint-text-masks.md). Il principale conserva 337 template, due composizioni e 219 font (R627). Dei **16 sorgenti prioritari non importati**, i due «Esiste la morte dopo la vita?» ora superano la conversione completa, ma sono preparazioni private; gli altri 14 riguardano sette primi piani da classificare, sei simboli assenti nei font originali e Gloria Hallelujah 700. Prima dei salvataggi restano ruolo produttivo del supporto/foratura e capacità dell'archivio: SQLite non attivato senza il consenso già richiesto. I conteggi e i blocchi successivi sono lo storico del 12 novembre.

Audit dei 65 sorgenti rimasti dopo Modello generico: convertitore generale, testo/colori e risorse complete, riferimento nativo indipendente. Nessun cambiamento di codice durante l’audit. Rapporto privato `.local/pitchprint-migration/remaining-priority-full-20261112/report.json`.

Diciotto superano il confronto grafico. Dodici non hanno immagini di pagina e hanno superato anche formato/font e confronto dei quattro file immagine originali. Salvataggio e verifiche effettive del lotto descritti nel [resoconto dedicato](iteration-editor-remaining-template-batch.md). Due copie salvate conservano un rettangolo residuo totalmente fuori foglio: sono state archiviate integralmente in attesa del recupero, non considerate utilizzabili.

## Sei sfondi metallici

Cinque targhette «con fori» (200 × 100, 120 × 30, 150 × 40, 110 × 70 e 180 × 80 mm) e «Targhetta metallica rettangolare» 170 × 80 mm condividono la stessa texture di metallo. Riconosciuta per ispezione dell’immagine, identità dell’URL originale e presenza del solo supporto nel modello senza oggetti. Byte della preview: SHA `4e1816cefaf25a0bc1d5783895b351e3e9add5be23b21e0df12d5c94893eb089`, 5.536 byte. Nessun dato produttivo va ottenuto da una preview a bassa risoluzione.

Prossimo passo: convertirla esplicitamente come **riferimento del materiale**, conservata e bloccata nella bozza, esclusa da SVG/PNG/miniature produttive. Ricomparare il corpo stampabile senza la texture, controllare separatamente la presenza visiva del supporto e i blocchi. Il modello senza oggetti stampabili rimarrà un canvas vuoto con riferimento del supporto: non inventare una grafica. I gruppi di vecchi fori non sono nuovi kit commerciali e non vanno associati implicitamente a opzioni/prezzi.

Preparatore privato `.local/prepare-metal-reference-drafts.ts` eseguito a archivio stabile anche dopo il nuovo controllo di layout: sei conversioni pronte, zero pixel differenti nel corpo stampabile, media massima 0,000404/255. Il modello privo di grafica ha zero inchiostro, come il sorgente senza il materiale. Rapporto `.local/pitchprint-migration/metal-reference-prepared/report.json`. Nessun salvataggio reale: restano da controllare presenza/identità e blocchi del riferimento nella bozza. Prima di ogni import: verifica delle risorse e del ruolo, backup, nessuna sovrascrittura/associazione, riapertura effettiva e cache miniature.

## Altri 47 casi

- **16** differenze grafiche oltre le soglie: soprattutto numeri civici, targhe professionali e modelli con immagini/testi. Conservare i confronti e identificare la causa senza aumentare la tolleranza.
- **7** primi piani senza ruolo esplicito: etichette vino e Sposini in auto. Verificare se stampati o riferimenti, senza eliminarli automaticamente.
- **9** maschere immagine non rettangolari, soprattutto datari; non scartare il contorno o perdere aree riservate.
- **4** originali mancanti dei cartelli Passo carrabile: il fondo ha soltanto un URL `lowres`; lo SVG serializzato dichiara `href="undefined"`. Non sostituire l’originale con la preview né inventare un URL produttivo.
- **6** font installati privi di simboli richiesti: HelveticaNeueLTStd-BdCn senza ▪, Times New Roman senza ♨/✂. Non sono sei file font mancanti. Nessuna sostituzione automatica.
- **1** Gloria Hallelujah 700 non presente come file esatto; preservare il blocco senza simulare il grassetto.
- **1** Cartello viario monofacciale 1100 × 400 mm supera il limite tecnico di formato a 1000 mm. Estendere congiuntamente modello, comandi/import, ispettore, vista/zoom e budget bitmap; non cambiare soltanto il controllo dell’importatore.
- **2** Etichetta adesiva 80 × 80 e 50 × 50: sottoelemento SVG privo di elementi visibili, da distinguere da eventuali tracciati o contorni persi.
- **1** Qr-Code Agenzia Entrate: un URL con suffisso `.png` restituisce uno **SVG**, SHA `2d280ba121360663b1f9983f5b8235b2e5847ee7ad01c940c1b275002a289bb5`, 158.449 byte. ViewBox 1329,3 × 313,21, 73 path, due immagini, 15 clipPath e due use; nessun collegamento esterno o doctype. Il parser SVG attuale rifiuta correttamente `image`: la sola rilevazione del tipo reale non risolve il caso. Servono importazione sicura di SVG misti, originale incorporato, composizione/ritagli fedeli e confronto; nessun raster sostitutivo o file di produzione incompleto. L’altro originale è JPEG valido, SHA `85950fff824df2076b94df4567cacdd9de54a7cd3431c417334d4cbf539cf95b`.

I sette gruppi principali non significano sette funzioni nuove da aggiungere indiscriminatamente: privilegiare recuperi fedeli con le capacità esistenti e usabilità. Multipagina e generazione immagini AI restano esclusi; testo curvo e categorie a priorità bassa restano differiti. Nessuna modifica allo store o deploy.


## Blocco nuovo da risolvere prima di altri salvataggi

«Dietro al vetro» e «Sul davanti» conservano un rettangolo `pp-4` da 0,2678 × 0,2680 mm a Y −129,7278 mm, già presente negli originali. Il confronto del foglio lo nasconde, mentre `DocumentStore` e PNG/miniature lo rifiutano. I due record appena aggiunti sono stati archiviati reversibilmente con backup, senza cambiare grafica o font; nessun record precedente modificato. Totale 292 copie, **290 attive e due in attesa**, revisione 578. Il conteggio dei sorgenti non ancora importati resta 53, separato da queste due copie.

Il convertitore ora esegue `validateLayout(..., 'edit')` prima di restituire una bozza: stesso controllo usato dalla riapertura e dai comandi. Prova browser di rifiuto atomico su sorgente con elemento fuori foglio; niente spostamenti, cancellazioni, raster sostitutivi o allentamenti impliciti. Il recupero di questi oggetti esterni richiede una politica esplicita e non distruttiva; preservare la richiesta del titolare di eliminazione tramite trascinamento totalmente fuori dal canvas e di libertà per gli oggetti parzialmente esterni.
