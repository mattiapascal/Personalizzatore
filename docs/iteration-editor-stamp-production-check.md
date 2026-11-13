# Controllo dei pixel B/N e dei contorni del timbro — 13 novembre 2026

Incremento locale sui vincoli produttivi già concordati, senza nuovi strumenti avanzati. Le montature inchiostrate del catalogo TEST richiedono grafica B/N; la bozza può rimanere incompleta e modificabile. La verifica prima della conferma deve fermare anche la trasparenza continua prodotta dalla rimozione del bianco e il contorno semitrasparente di un solo carattere.

## Diagnosi

Il controllo precedente segnalava immagini in modalità scala di grigi e riempimenti con alpha parziale, ma non la rimozione del bianco a luminanza usata dalla modalità binaria né tutti i contorni dei testi. Un documento valido con PNG grigio e `backgroundRemoval: luminance` produceva nero con alpha intermedio senza essere fermato dal controllo finale. Mancavano anche `strokeOpacity` effettivo dei caratteri e la distinzione tra un contorno presente e uno di larghezza zero.

La prima ipotesi sulle immagini in modalità originale non era una lacuna della conferma: tale modalità è già rifiutata dallo schema del documento monocromatico. La prova iniziale chiamava soltanto il controllo testuale. Lo schema resta invariato e continua a rifiutarla nei timbri. Nessun allentamento implicito per i file originali.

## Contratto e comportamento

- `assertDocumentProduction` è il gate condiviso da conferma cliente nell’editor, anteprima del carrello di prova e API locale add/replace. Usa gli stessi documenti, profili di catalogo e controlli testuali; l’adattatore di decodifica è distinto per browser/Node.
- Controlla tutte le pagine con il relativo binding. Un catalogo/profilo obsoleto continua a bloccare la conferma; gli errori multipagina identificano la pagina.
- Considera soltanto gli oggetti produttivi: riferimenti individuali e di gruppo esclusi. Timbri a secco e documenti liberi/targhe non ereditano una regola B/N non prevista dal loro profilo.
- I campioni RGBA prima dell’interpolazione devono essere neri/bianchi con alpha 0 o 255. RGB nascosti da alpha zero ignorati. La soglia e i mezzitoni garantiscono campioni binari; la rimozione a luminanza viene controllata sul risultato reale. Un PNG già B/N con bianco rimosso resta ammissibile.
- Il controllo dell’immagine riguarda l’intero originale elaborato, anche fuori dal crop, come chiarito nell’errore. Non certifica la sola parte ritagliata o mascherata né la risoluzione/lavorabilità del logo. Non usa il canvas ingrandito: l’interpolazione dello zoom può apparire grigia senza introdurre pixel grigi nel file raster elaborato.
- Browser: originali già preparati, buffer di lettura di 128 righe. API: decodifica locale limitata a 24 MP, una sorgente alla volta, nessuna rete; PNG concatenati verificati con il controllo preesistente. JPEG baseline/progressivi/grigi e orientati coperti; CMYK rimane esplicitamente escluso dal contratto corrente.
- Nel singolo controllo si riusano i soli esiti per contenuto esatto e parametri. ID/nome/crop differenti non fanno riutilizzare un risultato relativo a filtri diversi. Non viene aggiunta una cache permanente di bitmap decodificate nel server.
- Testo: alpha del riempimento e del contorno per ciascun carattere visibile, con ereditarietà dei valori base/run; contorno `none` o largo zero escluso. Le opacità di newline/spazi senza caratteri stampati non provocano falsi rifiuti.

Un rifiuto non cambia documento, revisioni, font, byte immagini, Undo/Redo, record o ricevute del carrello di prova. L’utente corregge nell’ispettore con i normali comandi, anche annullabili. Non c’è una conversione automatica. Un salvataggio della bozza resta possibile; la chiusura con conferma cliente richiede i controlli. L’API amministrativa salva bozze e non viene descritta come una nuova API di approvazione produttiva.

## Campione e verifiche

[JSON](../fixtures/illustrator/stamp-production.TEST.json) / [SVG](../fixtures/illustrator/stamp-production.TEST.svg), 58 × 22 mm, tre oggetti e Arimo incorporato. Il generatore `node --import tsx scripts/capture-editor-stamp-production.ts` parte da due errori intenzionali, rileva il contorno, lo corregge tramite comando manuale, rileva l’alpha e lo corregge tramite comando AI simulato. Esporta solo la copia corretta; entrambi gli originali rimangono identici. Nessun record personale o font della libreria viene modificato. I PNG da 2 × 2 sono campioni diagnostici, non loghi di qualità produttiva.

- **1.106 unitari / 158 file** passati, con **17 nuovi casi** su livelli RGBA, trasparenze, soglia/mezzitoni, stili locali, riferimenti, binding, pagine, riuso degli esiti, seconda striscia, Undo/Redo, API atomica e JPEG. Build/TypeScript passati.
- Tre nuovi browser iniziali passati: correzione con Undo/Redo e conferma, contorno locale nella conferma cliente senza scritture, parità tra adattatori su cinque campioni.
- Generatore riuscito e schermata `.local/stamp-production/capture/corrected.png` ispezionata: zero errori, richieste esterne e scritture negli archivi.

La prima esecuzione completa dei test è stata interrotta dopo errori sui server temporanei privi dei necessari permessi; un nuovo test assumeva inoltre erroneamente JPEG CMYK supportato. Corretta la fixture per verificare il rifiuto già previsto, poi ripetuta l’intera suite con i permessi HTTP locali: 1.106/1.106. Il primo generatore richiedeva l’helper `__name` usato dal trasporto TSX/Playwright: corretto il generatore senza modificare l’app per mascherare l’errore.

**Controlli finali conclusi:** 42 browser pertinenti (compresi i tre nuovi), 13 browser pubblici e 66 riaperture/esportazioni JSON/SVG passati. Zero errori o richieste esterne nei campioni. Runtime Worker/SQLite, pacchetto `--dry-run` e scansioni dei segreti dei due bundle passati. JavaScript pubblico ancora `index-BG2r_x-8.js`. Lettura del principale: R630, 341 record (339 template e due composizioni), 219 font e 297 risorse; invariato durante le prove. Non è stata eseguita una nuova suite browser generale. Log privati in `.local/stamp-production/`. Nessun nuovo esito umano Illustrator, migrazione di dati, deploy o modifica di Shopify/tema/PitchPrint/BSS/prezzi/carrello online/checkout. I profili amministrativi non sono ancora applicati al canvas: questo incremento completa il gate delle montature TEST già collegate, senza attribuire loro nuove misure/regole reali.
