# Prossimo incremento: stili residui oltre fine riga — 12 novembre 2026

## Evidenza

«Modello generico», sorgente `be1f0cfd9133fc4b1c98beab2be1df2a`, resta escluso dall’importazione. Primo oggetto IText 3.4.0, sette righe esplicite di 11/16/16/22/14/17/15 caratteri; la prima conserva stili nelle colonne 12–23. Lo stile alla colonna 11 è già trattato dalla politica esistente dei dati di inserimento. Le colonne successive non sono ancora supportate. Gli altri due oggetti IText non hanno posizioni invalide.

Root Open Sans normale, primo rigo con file corsivo esplicito; gli stili oltre fine riga dichiarano il medesimo corsivo e corpo 40. Non devono essere spostati sui caratteri delle righe successive. Nella prova privata, la copia che esclude soltanto le colonne oltre la lunghezza della riga supera il confronto completo con l’originale, senza alterare i font: rapporto 0,000356964, media 0,00131818/255. Rapporto `.local/pitchprint-migration/trailing-styles-prototype/report.json`, `prototypeOnly: true`, `notApprovedForArchive: true`.

## Capacità generale da verificare e realizzare

1. Provare nel runtime originale Fabric 3.4.0 che questi stili non dipingono o misurano caratteri presenti. Confrontare originale/copia con IText e Textbox, più righe esplicite e ritorni a capo, Unicode non ambiguo e font differenti sulle righe successive. Verificare che non venga mai usato un font mancante dei soli dati residui. Confronti omogenei canvas/canvas e SVG/SVG; conservare separatamente eventuali difetti dell’esportatore legacy.
2. Estendere la classificazione condivisa `inactivePitchprintStylePosition` per il solo caso dimostrato, con versione/tipi verificati e indici interi nei budget. Mantenere bloccanti proprietà sconosciute, indici malformati, versioni diverse e casi non rappresentabili. Non ignorare gli stili delle righe vuote: possono influenzare l’altezza anche senza un glifo.
3. Contare e segnalare gli stili esclusi; allineare censimento dei font e importatore. Lasciare invariati testo, stili visibili, identità degli oggetti, geometria, JSON canonico e comandi manuali/AI. Non troncare le righe né appiattire gli indici attraverso i ritorni a capo.
4. Unitari per font inutilizzati non richiesti e preservazione delle righe successive, browser nativo indipendente, editing/Undo/Redo/JSON/SVG e campione portabile. Eseguire le regressioni pertinenti prima del salvataggio.
5. Ricomparare il sorgente completo mediante le funzioni generali, senza la rimozione diagnostica privata. Solo se conforme, seguire il flusso autorizzato di importazione con backup, provenienza, tag «Da verificare», colori, nessuna sovrascrittura o associazione prodotto.

Questo documento registra il prossimo lavoro, non dichiara già implementato il nuovo caso. Restano esclusi multipagina, generazione immagini AI e interventi online.
