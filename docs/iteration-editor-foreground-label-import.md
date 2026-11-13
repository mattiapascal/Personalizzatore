# Sei etichette con primo piano importate — 13 novembre 2026

Importate nel solo archivio locale le due misure, **99×93 e 99×139 mm**, di **Battesimo Lui**, **Battesimo Lei** e **Sposini in auto**. Titoli distinti con il formato, categorie originali e tag «PitchPrint»/«Da verificare»; nessuna associazione prodotto. Testi editabili, colori, gruppi e file originali delle immagini conservati. Non sono state aggiunte regole grafiche speciali per il nome del template.

## Classificazione e confronto

I sei sorgenti condividono un primo piano PNG bianco con centro trasparente. Sono stati verificati i pixel originali: tutte le parti visibili sono bianche, ma la risorsa non è vuota. Può coprire la grafica sottostante e partecipa al risultato originale. È stata perciò conservata come **grafica produttiva**, usando la scelta già disponibile nell’importatore, senza eliminarla né promuoverla a riferimento non stampabile. L’originale 1426×2000 è preservato; la griglia nativa 713×1000 determina crop e trasformazione fisica.

Un confronto indipendente usa **Fabric 3.4.0 originale**, hash `258c39e56febc83362baf4144cf534cd77e54cf17f1c396b217bfcfa47cfe5f3`, e gli stessi byte dei font incorporati. Il runtime originale ricostruisce direttamente gruppi, trasformazioni, testi e campionamento delle immagini; i suoi pixel vengono confrontati con lo SVG del nuovo editor. Si usano originali alla risoluzione completa, mantenendo la griglia di campionamento nativa, e ricampionamento deterministico 4×. Nessun font del computer o richiesta browser esterna.

Soglie di confronto già usate negli incrementi precedenti: meno dell’1% dei pixel di grafica con differenza maggiore di 24/255, errore medio massimo inferiore a 0,25/255. Nei sei casi riusciti: differenze **0,0006–0,1595%**, errore medio **0,063–0,147/255**. Sono confronti raster di queste scene, non una certificazione di ogni possibile modifica o di Illustrator.

**Retro bottiglia classico** è convertibile con gli strumenti attuali, ma il confronto originale non passa: 1,509% e 1,208/255. Rimane escluso, con immagini di confronto conservate, senza allargare le soglie o correggere arbitrariamente la bozza.

## Salvataggio e conservazione

Backup SQLite nativo indipendente a **R630**, riletto integralmente e confrontato con gli indici/checksum dell’archivio attivo. Tutti i record preesistenti, risorse, font, impostazioni e profili sono stati conservati; l’ordine precedente dei tag rimane il prefisso del nuovo elenco. Le associazioni commerciali dei sei nuovi template sono vuote.

Il primo salvataggio ha rilevato un errore nel **solo script operativo privato**: mancava `formOrderVersion` restituito dal convertitore, e il backend aveva applicato nuovamente l’inversione dei campi. Il lotto si è fermato alla rilettura del primo record. Verificato il commit effettivo senza reinserirlo, è stato corretto soltanto quel nuovo template con `replaceRecord`, revisione/versione attese e confronto completo. Le altre cinque importazioni propagano il marcatore 1. L’interfaccia ordinaria singola/massiva lo propagava già; non sono stati cambiati importatore o regole amministrative per aggirare il controllo.

Risultato **R630 → R637**, sei nuovi record e una correzione del primo: **345 template attivi, due composizioni, 219 font e un profilo**, tutti i JSON salvati uguali alle preparazioni verificate. Ordini crescenti da 1 confermati; il primo record è alla versione 2, gli altri alla versione 1. Backup e log del primo arresto conservati per la tracciabilità.

## Riapertura e cache

Tutti e sei riaperti nell’editor ordinario: oggetti, gruppi, font e campionamenti uguali alla preparazione, nessun avviso di font o errore. SVG produttivi con il numero atteso di testi/immagini, colore del foglio e primo piano mantenuti; la tavola tecnica ha il solo livello produttivo. Miniature generate e rilette dopo ricaricamento dell’amministrazione: **zero letture dei documenti per rigenerarle nella seconda passata**, zero scritture amministrative, richieste esterne o variazioni al database durante la verifica. Viste reali ispezionate.

Evidenze private in `.local/foreground-classification/` e `.local/pitchprint-migration/foreground-labels-local-import/`: sorgenti con hash, preparazioni, runtime originale, confronti PNG, backup, salvataggi e `verification.json`. Non vengono pubblicati su GitHub i template personali, le immagini o i font.

Il censimento aggiornato da SQLite comprende **473 sorgenti: 345 importati, 8 prioritari residui, 112 a priorità bassa e 8 esclusi**. I 112 a bassa priorità restano distinti in 18 monopagina e 94 multipagina; nessuna nuova funzione multipagina è stata sviluppata qui. I residui prioritari sono:

| Template | Gruppo | Stato da risolvere |
|---|---|---|
| Design fotografico, due versioni | Targhe ottone / Targhe ottone 2 | Glifi mancanti nei file originali già rilevati |
| Panificio, due versioni | Targhe ottone / Targhe ottone 2 | Glifi mancanti nei file originali già rilevati |
| Barbershop, due versioni | Targhe ottone / Targhe ottone 2 | Glifi mancanti nei file originali già rilevati |
| Vogliamo solo coccole | Attenti al Cane 100% (300×200) | File esatto Gloria Hallelujah 700 non disponibile |
| Retro bottiglia classico | Etichette per vino 99×93 | Differenze rispetto al renderer originale |

La nuova importazione non richiede modifiche al codice applicativo: resta verificato l’[incremento precedente](iteration-editor-geometry-focus.md) con 1.158 unitari, 47 browser pertinenti, 13 pubblici e 69 campioni; non sono conteggiati come rieseguiti dopo i salvataggi. Nessuna migrazione, generazione immagini AI, pubblicazione o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout. **Illustrator non collaudato**.
