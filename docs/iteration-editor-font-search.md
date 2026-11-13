# Ricerca per nome nel menu dei font — 13 novembre 2026

Nel menu **Font** dell’ispettore e in quello della correzione dei caratteri è presente **Cerca font**. Scrivendo si filtrano i nomi già disponibili, senza distinguere maiuscole o accenti; più parole devono comparire tutte nel nome. Le famiglie mantengono ordine alfabetico e anteprima nel proprio font. Il conteggio indica i risultati; la ricerca senza corrispondenze resta aperta e si può svuotare con la piccola X.

Scrivere, navigare o annullare non modifica il progetto. Il file viene applicato soltanto scegliendo una voce disponibile, mediante il comando `updateObject` esistente. Il cambio continua a riguardare tutto il box o soltanto i caratteri selezionati, secondo la selezione dell’editor. Nessuna ricerca esterna o richiesta aggiuntiva dovuta alla digitazione; il caricamento della libreria resta quello esplicito all’apertura del menu. I nomi dei file in preparazione sono filtrabili, ma non selezionabili finché il font non è caricato.

## Interazione e posizione

- Il campo riceve il focus all’apertura; Escape chiude senza applicare e restituisce il focus al pulsante. Alla successiva apertura la ricerca è vuota.
- Frecce su/giù e Invio permettono di scegliere; Home/End nel campo continuano a spostare il cursore di scrittura. Dal pulsante rimane disponibile la navigazione Home/End dell’elenco. Spazi, cancellazione, copia/incolla e composizione IME non diventano comandi del canvas.
- Il filtro non registra nomi nel documento e non risolve alias o sostituisce file: `font-name-search.ts` serve soltanto a cercare etichette.
- La barra di ricerca rimane ferma mentre le opzioni scorrono. Altezza delle righe e distinzione dei file non caricati sono conservate; hover e aggiornamenti delle risorse non riportano indietro la rotella.
- Il popup sceglie lo spazio sopra/sotto il pulsante e ne ancora il bordo effettivo: filtrando una lista corta non resta più il vuoto che occuperebbe un elenco alto 320 px. Verificato anche a 390 px, con distanza di 4 px dal pulsante e dentro il viewport.

Campo nativo `searchbox`, lista controllata e discendente attivo seguono le proprietà descritte in [WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant). Focus/tastiera sono verificati automaticamente; non si dichiara un collaudo umano con VoiceOver o tastiera virtuale iOS.

## Campione e verifiche

`scripts/capture-editor-font-search.ts` importa una bozza TEST, cerca e sceglie Cousine e genera [JSON](../fixtures/illustrator/font-search.TEST.json) / [SVG](../fixtures/illustrator/font-search.TEST.svg). Solo file OFL di prova; testo editabile, font incorporati e nessuna segnalazione font. Catture `.local/previews/editor-font-search-{desktop,mobile}.png` ispezionate. La regolazione finale della posizione del popup lascia identici gli hash del campione. Illustrator da collaudare manualmente.

**1.200 unitari / 171 file passati** (`delivery-units.log`). **41 browser pertinenti distinti passati**: 27 nei file dedicati e 14 regressioni in `local.spec.ts`, incluse scelta sui soli caratteri selezionati tramite ricerca, scroll/hover, annullamento, file pendente, IME, candidati tardivi, retry, stessi comandi manuali/AI, Undo/Redo e riapertura JSON/SVG (`browser-final-all.log`, `browser-delivery-regressions.log`). Non è una nuova esecuzione dell’intera suite browser.

**72 coppie JSON/SVG riaperte/esportate**, senza errori, rete esterna o richieste dei font personali (`delivery-artifacts.log`). **13 browser pubblici passati** (`public-tests.log`). Build/tipi, build pubblica e scansioni segreti passati (`delivery-build.log`, `delivery-types.log`, `delivery-public-build.log`, `delivery-secrets.log`, `delivery-public-secrets.log`); JavaScript pubblico sempre `index-BG2r_x-8.js`. Log in `.local/font-search/`. L’archivio personale rimane **SQLite R638: 346 template, due composizioni, 219 font di cui 218 attivi e un profilo** (`archive.json`). Le prove usano archivi/font TEST; nessuna scrittura o importazione nei dati personali.

Nessun deploy o modifica Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout. Nessuna immagine AI o nuova funzione avanzata di editing. Roadmap ancora aperta.
