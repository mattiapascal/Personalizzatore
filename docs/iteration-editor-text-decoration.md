# Decorazioni e giustificazione del testo — 9 novembre 2026

## Piano iniziale

Completare le decorazioni manuali con barrato e sopralineato, per tutto il box o per i soli caratteri selezionati. Parametri nel testo base e negli intervalli Unicode; lettura durante editing e ripristino/JSON/SVG devono conservarli. Stesso `updateObject`, nessuna modifica delle metriche o conversione in tracciati.

Aggiungere allineamento giustificato con ultima riga del paragrafo a sinistra tramite il supporto Textbox già installato. Richiede box a larghezza fissa: controllo disabilitato con larghezza automatica e messaggio esplicito; prima di passare all’automatica scegliere un altro allineamento. Schema rifiuta la combinazione incompatibile anche via comandi AI. Altezza sempre automatica, nuovi box sempre centrati come già concordato. Font, limiti TEST e vecchi JSON invariati.

Prove: campi opzionali v2 e v1 conservativo; caratteri selezionati con stile misto, impostazione sul box intero, scrittura successiva, Unicode, undo/redo e decorazioni nello SVG. Giustificazione su testo realmente mandato a capo, ultimo rigo a sinistra e ritorno a centrato; contorno del box e dati invariati oltre allo stile. Nessuna AI reale o modifica online.

## Implementazione e prove mirate

Aggiunti `linethrough` e `overline` opzionali al testo base e agli intervalli; adattatore e snapshot di scrittura preservano entrambi. Due pulsanti grafici con stato misto, stessa applicazione a selezione/box già esistente. Allineamento `justify-left` nel documento v2 e renderer Textbox; validatore rifiuta l’assenza di larghezza fissa, UI rende esplicito il requisito. V1 continua a rifiutare proprietà nuove.

Tre unitari e due browser mirati superati: selezione Unicode e box intero, stili preservati dopo scrittura, JSON riaperto e `line-through`/`overline` nello SVG; righe avvolte con estremità alla larghezza del box, ultima riga a sinistra e controllo del passaggio all’automatica. Attesa del campo testo resa stabile con etichetta accessibile esplicita. TypeScript e schemi rigenerati; regressione completa in esecuzione.

Campione `text-decoration.TEST.json/svg`, generato da `node --import tsx scripts/capture-editor-text-decoration.ts`: Arial 9 pt, larghezza fissa 38 mm, accento in «Città», grassetto/sopralineato sui primi caratteri, barrato su «testo» e paragrafo giustificato. Anteprima desktop ispezionata. Verificare in Illustrator spazi, ultima riga, decorazioni locali e testo ancora editabile: **collaudo non eseguito**.


Regressione completa: `npm run check` superato con **361 unitari, 139 browser laboratorio, build e controllo segreti**. Anteprime desktop/mobile ispezionate.
