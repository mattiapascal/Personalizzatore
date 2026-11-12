# Recupero verificato delle immagini originali — diagnosi 13 novembre 2026

Quattro Passo Carrabile sono ancora bloccati: le immagini fisse di base non hanno `url`, ma soltanto `src` nell’archivio `lowres`. La guardia dell’importatore è intenzionale: una preview non diventa un file produttivo. Non sono state modificate le copie sorgente o installati nuovi originali nell’archivio.

## Evidenze disponibili

Due nomi di file ricorrono nei quattro sorgenti. I candidati nell’archivio pubblico `assets` esistono e hanno **1136 × 1703 px** (JPEG) e **712 × 1280 px** (PNG), precisamente le dimensioni dichiarate negli oggetti sorgente. Le preview sono **667 × 1000** e **556 × 1000 px**, con byte diversi.

La riduzione Lanczos3 dei candidati alla dimensione delle preview produce rispettivamente 0,290% e 0,348% di pixel con differenza massima RGB oltre 24/255; PSNR circa 38,92 e 39,01 dB. Questo confronto descrive il contenuto, non sostituisce una prova di provenienza. Entrambi i candidati sono stati ispezionati: contengono il cartello completo, non soltanto il materiale o i fori. Non classificarli automaticamente come riferimenti non stampabili.

Il codice pubblico PitchPrint già acquisito (`.local/pitchprint-app-public.js`) costruisce il percorso degli asset originali con `domainBase + assets/ + basename` e mantiene `lowres` separato. Il designer produce a sua volta le preview sostituendo `assets/` con `lowres/`. Queste sono prove del rapporto tra i due archivi del fornitore; non autorizzano trasformazioni di URL di altri host o percorsi arbitrari.

File, hash, metadati, preview e misure: `.local/sign-original-candidates/`, in particolare `comparison.json` e `pixel-comparison.json`. I candidati non sono ancora usati nei documenti.

## Incremento da realizzare

1. Recupero nell’adattatore, con un contratto esplicito per gli indirizzi legacy noti del fornitore. Niente regole per titolo/ID del template, host arbitrari, query, redirect o fallback alla preview.
2. Verificare formato effettivo, byte, dimensioni, rapporto con la griglia di campionamento dichiarata e provenienza prima di restituire una bozza. Conservare i parametri frazionari e i limiti esistenti di file/immagini.
3. Rendere verificabile nel rapporto quale originale è stato recuperato. Se manca o non coincide con le evidenze richieste, mantenere un errore esplicito. Non modificare gli originali PitchPrint né sovrascrivere progetti già importati.
4. Campione sintetico con preview e originale di dimensioni differenti, unit test delle URL ammesse e dei rifiuti, confronti nativi con ritagli/trasformazioni, stessi comandi manuali/AI/Undo e JSON/SVG.
5. Ripreparare integralmente i quattro sorgenti e confrontare grafica, colori, testo e campionamento. Solo dopo: backup verificato, import locale senza associazioni e riapertura/cache. Controllare prima la capacità residua dell’archivio JSON, senza attivare SQLite o migrare implicitamente.

Questa diagnosi non autorizza il cambio di font per gli altri template: anche i file tipografici originali esaminati mancano dei simboli `▪`, `♨` e `✂`. Per Gloria Hallelujah 700 il catalogo non contiene una faccia esatta. Niente font del computer o grassetto simulato.

## Prototipo diagnostico successivo

I quattro sorgenti sono stati convertiti su copie in memoria con i soli URL riconciliati. Confronto nativo completo tecnico/produttivo: zero pixel oltre soglia, errore medio massimo 0,000128/255. Tutti i sorgenti e l’archivio sono rimasti invariati. Rapporto `.local/pitchprint-migration/sign-original-probe/report.json`, stati espliciti «Diagnosi superata — non importabile». Questo dimostra la fattibilità geometrica con quei byte, ma non rende ancora disponibile il recupero nell’importatore ordinario e non equivale a un’importazione.
