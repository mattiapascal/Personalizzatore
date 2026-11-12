# Copia fra template, documenti e schede — 12 novembre 2026

Copia/Taglia/Incolla ora usano appunti condivisi nel browser tramite IndexedDB. Gli oggetti rimangono disponibili dopo chiusura/apertura di un template, ricaricamento o passaggio a un’altra scheda dello stesso configuratore. Le altre schede aggiornano la disponibilità senza ricevere i dati grafici nelle notifiche; il contenuto si legge soltanto all’incolla. Una sola copia corrente, sostituibile e cancellabile con «Svuota appunti del configuratore».

Sono conservati ordine, gruppi e gerarchia, proprietà, stili, immagini originali, ritagli/riflessioni e i soli file font utilizzati dalla selezione. L’incolla genera nuovi ID e usa `insertObjects`, lo stesso comando validato disponibile alla simulazione AI. Documento/prodotto di destinazione e sorgente restano distinti. Undo/Redo agisce sulla destinazione. Nessun fallback tipografico, conversione colore o deformazione implicita.

L’incolla normale conserva dimensioni e posizioni. «Incolla adattando al foglio» offre una riduzione proporzionale esplicita e centrata, senza ingrandimento; per il foglio tondo usa un rettangolo inscritto. I normali comandi dell’ispettore e le maniglie rimangono disponibili. Le maniglie già fuori dal canvas richiedono ancora l’ampliamento della superficie interattiva: **non dichiarato risolto in questo incremento**. [Lavoro collegato al multipagina](editor-multipage-plan.md).

## Comandi disponibili

- Pulsanti nel pannello Livelli.
- ⌘C/⌘X/⌘V su Mac, Ctrl+C/Ctrl+X/Ctrl+V.
- Tasto destro sul canvas o sull’area circostante: Taglia, Copia, Incolla, Incolla adattando al foglio. Sull’oggetto seleziona l’unità pertinente; sulla selezione multipla conserva l’insieme. Menu nel viewport, frecce, Home/End, Esc e ritorno al canvas.

La funzione Copia oggetti non scrive negli appunti del sistema operativo: incollando in un programma esterno rimane il contenuto precedente del computer. La copia del testo selezionato durante l’editing mantiene invece il comportamento nativo del browser. Le scorciatoie nei campi non diventano comandi grafici. Nessun upload di oggetti, immagini o font; dati locali con limite 120 MB e validazione di struttura/risorse prima della scrittura e della lettura.

La transazione scrive contenuto e contatore insieme. In caso di errore conserva la copia precedente. Il taglio elimina dal documento soltanto dopo la copia riuscita, verificando che revisione e sessione non siano cambiate; se fallisce la scrittura o cambia il documento, il sorgente non viene cancellato. Incolla asincrono usa la protezione delle revisioni già esistente e non pubblica copie parziali.

## Prove

**882 unitari / 130 file**, build e scansione segreti passati. **12 browser pertinenti completi** passati in 43,1 s: appunti precedenti, trasferimento fra due schede con font e immagine/riflessione, chiusura del sorgente, dimensioni originali, gruppi/ID, Undo/Redo nella destinazione, persistenza dopo reload, formato piccolo e ridimensionamento nell’ispettore, cancellazione appunti, menu e tastiera, errore di scrittura che annulla il taglio e conserva la copia precedente, selezione multipla e cestino. Log privati `.local/shared-clipboard-all-unit.log`, `shared-clipboard-pertinent-browser.log`, `shared-clipboard-final-build.log`.

Nel primo gruppo sette casi, sei sono passati e il test dell’errore di storage partiva prima dell’inizializzazione del canvas; attesa esplicita corretta e successiva esecuzione completa verde. Il test del menu usa coordinate aggiornate dopo lo scorrimento e Undo, con controllo degli errori browser. I log intermedi sono conservati. Nessuna nuova dichiarazione di suite browser generale o collaudo Illustrator; archivio reale non modificato e UI pubblica non cambiata.

## Revisione delle importazioni e prossimi passi

Audit in sola lettura di tutti i **292 template** salvati contro i sorgenti acquisiti: tutti provenivano da una pagina singola, nessuna copia individuata come estrazione parziale di un sorgente multipagina. Questo controllo non certifica eventuali modifiche online successive all’acquisizione. Rapporto privato `.local/pitchprint-migration/multipage-history-audit.json`, archivio invariato.

Nei sorgenti acquisiti: 103 multipagina, dei quali **otto prioritari** (quattro cartelli viari e quattro numeri civici), **94 Biglietti da Visita** a priorità bassa e **uno Templates PitchPrint escluso dall’importazione**. La nuova direttiva autorizza il multipagina e prevale sulle esclusioni storiche. Modello/controlli/esportazione/importazione completa ancora da realizzare, secondo il piano collegato. Nessun deploy o modifica commerciale.
