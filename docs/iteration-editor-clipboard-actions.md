# Appunti e azioni Modifica — 14 novembre 2026

Copia, taglia, incolla e duplica verificano l’ispettore prima di acquisire o modificare il documento. Geometria e stile ancora in attesa passano dagli stessi comandi validati già usati dall’interfaccia e dalla simulazione AI. Un campo incompleto riapre l’ispettore sul valore da correggere; documento e appunti precedenti restano disponibili. Il messaggio comune ora dice «prima di continuare», perché il controllo non riguarda più soltanto salvataggio ed esportazione.

## Difetti riprodotti

Sul codice precedente, una larghezza vuota di una selezione non impediva di sovrascrivere gli appunti con la geometria precedente. Inoltre il taglio, dopo la scrittura asincrona degli appunti, leggeva la selezione corrente: selezionare un altro oggetto durante l’attesa poteva cancellare quell’altro oggetto. Entrambe le prove sono fallite prima della correzione (`.local/clipboard-actions-before.log`).

Il comando di cancellazione viene ora preparato dagli ID catturati, con revisione e ambito del singolo membro espliciti. Cambiare soltanto selezione non cambia il bersaglio del taglio. Il comando passa comunque dal validatore del documento: i blocchi del cliente restano applicati anche quando il bersaglio è stato catturato in precedenza. Nessuna cancellazione avviene prima che la transazione degli appunti sia completata.

Se il documento o la pagina cambiano durante la scrittura, la copia viene conservata e la cancellazione annullata. Un errore della transazione conserva anche gli appunti precedenti. Durante il taglio i campi dell’ispettore sono temporaneamente disabilitati, con stato visibile in alto; selezione e navigazione della vista restano disponibili. Un altro comando sul documento non viene scambiato per una modifica della sola selezione.

Incolla ricontrolla il documento di destinazione dopo l’eventuale attesa di una copia. Riconosce soltanto l’avanzamento prodotto dal proprio taglio appena atteso: la sequenza rapida Taglia → Incolla continua quindi a funzionare, con due comandi e due Undo distinti. Un documento aperto dopo l’invocazione dell’incolla non riceve oggetti per errore. Dopo l’attesa vengono ricontrollati anche eventuali nuovi input dell’ispettore; la successiva preparazione delle risorse conserva le verifiche di revisione già esistenti.

I pulsanti delle quattro azioni mantengono il fuoco fino all’esecuzione del loro controllo, evitando un’acquisizione anticipata tramite blur. I campi e la scrittura nel canvas mantengono le proprie scorciatoie native; gli appunti grafici restano locali al configuratore, distinti da quelli di sistema. Elimina, Undo e svuotamento appunti non ricevono un nuovo controllo che impedisca di scartare intenzionalmente un input.

## Verifiche

- **1.399 test unitari in 192 file passati**: cinque nuovi casi con comandi reali, parità manuale/AI, bersagli e gruppi, ambito diretto, revisioni obsolete, blocchi cliente e Undo/Redo (`.local/clipboard-actions-units.log`).
- **136 browser pertinenti distinti passati**: 108 su appunti/ispettori/gruppi/risorse e percorsi locali esistenti, più 15 QR e 13 trasparenza immagini (`clipboard-actions-regressions.log`, `clipboard-actions-resource-tests.log`). Comprendono i 16 nuovi casi, passati anche separatamente: input incompleti, geometria e stile simultanei prima del timer, menu/tastiera/tasto destro, taglio lento e diretto, cambio documento, transazione annullata, nuovo input durante l’attesa e Taglia → Incolla con Undo. Non è una nuova esecuzione della suite browser generale.
- Due attese iniziali del nuovo collaudo sono state corrette: il confronto geometrico include ora il riancoraggio dovuto al cambio dello spessore del contorno, usando gli stessi comandi AI come riferimento; la selezione diretta usa il pulsante reale «Seleziona solo». Nessuna modifica alle regole o alle tolleranze del motore per far passare queste prove.
- **89 campioni JSON/SVG riaperti ed esportati**, nessun errore browser, richiesta esterna o lettura di font della libreria reale (`.local/clipboard-actions-artifacts.log`).
- **13 browser pubblici locali passati**; build laboratorio/storefront, TypeScript Worker, generazione schemi invariata e scansioni segreti passati. JavaScript della chat ancora `index-BG2r_x-8.js` (`.local/clipboard-actions-build.log`, `clipboard-actions-storefront-build.log`, `clipboard-actions-public-tests.log`, `clipboard-actions-schemas.log`, `clipboard-actions-secrets.log`, `clipboard-actions-public-secrets.log`).

## Campione e ripetibilità

[JSON](../fixtures/illustrator/clipboard-actions.TEST.json) e [SVG](../fixtures/illustrator/clipboard-actions.TEST.svg), 120×100 mm: due rettangoli raggruppati, copia con nuovi ID e gruppo indipendente spostato verso il basso, didascalia Arimo OFL incorporata. Il generatore `node --import tsx scripts/capture-editor-clipboard-actions.ts` verifica prima il rifiuto della copia con misura vuota, poi copia/incolla/spostamento e scarica lo SVG dal laboratorio. Screenshot desktop e telefono in `.local/previews/editor-clipboard-actions-*.png`, ispezionati; rapporto `.local/clipboard-actions-capture.json`.

Le prove asincrone usano transazioni IndexedDB reali: ritardano soltanto la notifica di completamento per consentire di cambiare selezione/documento nell’intervallo. La prova di errore annulla una vera transazione prima del commit, verificando il mantenimento dei dati precedenti. Non sono modifiche al codice applicativo per simulare il successo.

## Ambito

Nessun nuovo schema persistente, renderer o migrazione. Stessi comandi, unità mm/pt, font incorporati e separazione JSON/SVG. Nessuna nuova funzione multipagina o generazione immagini AI. Le pagine già presenti sono soltanto ricontrollate per regressione. I test del laboratorio usano fixture/API simulate oppure SQLite temporaneo; nessun salvataggio nell’archivio personale.

Archivio principale controllato in sola lettura: SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo; checksum dei metadati invariato. Nessun deploy o intervento su negozio, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata. La cancellazione PDF già presente nell’albero di lavoro è esclusa dal commit. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: trasformazioni e allineamenti quando l’ispettore contiene valori ancora in attesa, mantenendo la priorità sui percorsi manuali esistenti.
