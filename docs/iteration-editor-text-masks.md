# Maschere locali del testo — 13 novembre 2026

**Seguito completato:** [importazione delle maschere PitchPrint e confronti dei due cartelli](iteration-editor-pitchprint-text-masks.md). Le indicazioni sotto sull'adattatore ancora da realizzare descrivono il checkpoint precedente; le copie reali restano preparazioni private, senza nuovi record nell'archivio.

Segue l'[importazione dei testi affini](iteration-editor-pitchprint-affine-text.md). Il documento canonico conserva ora maschere vettoriali sul testo: stesso stato, comandi validati manuali/AI, cronologia e appunti. Nessuna condizione sul nome o sull'ID di un template. Questa fase implementa la capacità dell'editor; l'adattatore PitchPrint e il confronto completo dei due cartelli sono ancora da completare.

## Documento e comportamento

`textClipMasks` è una proprietà opzionale dei testi, assente nei vecchi documenti. Ogni maschera contiene curve normalizzate chiuse, regola `nonzero`/`evenodd` e `frameMm` nel piano locale dei caratteri, prima di dilatazione, inclinazione e rotazione. Il frame non dipende dalla larghezza corrente del testo. Restano distinti i frame relativi già usati da immagini e vettori.

Digitazione, modifica tipografica del corpo e larghezza di impaginazione conservano la maschera. Il ridimensionamento geometrico che assorbe la scala nel font scala anche il frame locale: comandi singoli/multipli, numeri dell'ispettore e maniglie. Il centro numerico e l'ancoraggio opposto delle maniglie mantengono le regole precedenti. I budget vettoriali comprendono le maschere anche sulle pagine non attive; massimo otto maschere per testo, con intersezione fra esse. Il limite effettivo trasformato rimane 10 m. Il limite delle coordinate locali è più ampio per consentire la normalizzazione della scala senza rifiutare geometrie fisiche valide.

I blocchi delle trasformazioni proteggono anche la geometria delle maschere, comprese quelle di immagini/vettori già esistenti. La combinazione testo su percorso/maschera del box rimane esplicitamente rifiutata, senza eliminazioni implicite. I controlli dei font continuano a verificare anche i caratteri nascosti dalla maschera.

## Interfaccia e renderer

Nella scheda Testo dell'ispettore, la sezione richiudibile **Maschera del testo** permette di aggiungere rettangoli, impostare centro e dimensioni locali in mm e rimuoverli. Le curve eventualmente presenti rimangono curve; i numeri ne modificano il frame. Non è ancora un editor di nodi della maschera. Lo stato «Maschera attiva» segnala che una parte del contenuto può essere nascosta, anche con altezza automatica. Il contenuto completo rimane editabile e conservato nel JSON.

Il renderer ricostruisce la catena di clip dopo il ricalcolo del testo e invalida la cache Canvas. Il ritaglio del box fisso si interseca con le maschere; non vengono accumulati wrapper SVG a ogni digitazione. L'SVG mantiene glifi editabili e clip vettoriali, applicati anche alle decorazioni. PNG e miniature usano il campionamento limitato già previsto per le maschere; la chiave cache include il nuovo stato. Le sole misure di impaginazione non costruiscono inutilmente le curve delle maschere.

## Riferimenti indipendenti

Il campione comprende testo automatico inclinato/ruotato con sottolineatura e un box multiriga fisso con foro e intersezione curva. Il riferimento SVG parte dal testo senza maschere e costruisce separatamente i clip in coordinate di pagina, senza usare il mapper o il renderer delle maschere applicativo. Nei due casi il confronto SVG ha zero pixel differenti.

Per PNG a 150 DPI e miniature a 960 px, un secondo riferimento dipinge il testo nativo con cache alla stessa scala e applica clip Canvas2D in coordinate di pagina. Nessun pixel oltre la soglia di 24 livelli; errore medio massimo inferiore a 0,001/255. Togliere le maschere produce differenze di circa 58% e 13% dell'inchiostro, sia nei bitmap sia nell'SVG. Il confronto bitmap diretto con SVG rimane una diagnostica distinta: circa 10–15% dei pixel dell'inchiostro oltre soglia, errore medio 0,076–0,136/255, per la diversa rasterizzazione del testo nei due percorsi. Non è una prova di identità di tutti i Canvas/SVG o dei runtime Fabric 3/7.

La prima prova PNG/SVG ha quindi fallito la soglia stretta ed è conservata. Il riferimento Canvas indipendente isola il ritaglio dalla rasterizzazione dei glifi senza aumentare la tolleranza. Nel primo tentativo del riferimento Canvas il secondo testo era erroneamente escluso come fuori viewport: corretto il solo helper disabilitando l'ottimizzazione offscreen per la superficie di prova. Nessun allentamento dei controlli applicativi.

## Campione e collaudi

[JSON](../fixtures/illustrator/text-masks.TEST.json) e [SVG](../fixtures/illustrator/text-masks.TEST.svg), **160 × 110 mm**, due box con Arimo TEST incorporato. Generatore `node --import tsx scripts/capture-editor-text-masks.ts`. Cattura e miniatura in `.local/text-masks-capture/`, ispezionate visivamente; zero errori browser, richieste esterne o scritture amministrative. In Illustrator verificare maschere, fori/intersezioni, misure e testo editabile: **collaudo umano non eseguito**. Le decorazioni SVG separate conservano il limite già documentato: rigenerarle dal JSON dopo una modifica del testo.

**1.026 unitari in 152 file**, **79 scenari browser pertinenti distinti**, **13 browser pubblici** e **62 campioni** riaperti/esportati passati. Le 78 regressioni iniziali e il successivo controllo della cache coprono insieme 79 scenari; i sei nuovi casi sono stati ricontrollati dopo il riavvio ordinario. Non è una nuova suite browser completa. Build TypeScript/laboratorio, schemi, Worker dry-run/runtime locale e controlli segreti passati; JavaScript pubblico ancora `index-BG2r_x-8.js`.

Nove nuovi unitari coprono validazione, coordinate fisiche, corpo tipografico/scala geometrica, gruppi e selezioni parziali rifiutate, comandi manuali/AI, Undo/Redo, appunti, JSON, blocchi e budget multipagina. La prova del gruppo confronta punti della maschera in coordinate di pagina dopo scala e rotazione, non soltanto i valori serializzati. Le prove browser comprendono l'ispettore reale, digitazione, numeri e maniglie dei box automatici/fissi inclinati, ancoraggio opposto, esportazione e rimozione. Il confronto della stessa vista con una nuova verifica anche i pixel dopo modifiche di testo/frame/corpo e dopo rimozione della maschera: identità dei byte a parità di trasformazioni e cache. I primi tentativi dell'helper avevano un campo `type` di sola lettura, trasformazioni arrotondate da `toObject` e cache diversa: corretti solo i riferimenti, senza cambiare il codice applicativo o ammettere tolleranze aggiuntive. Il caso negativo unitario del gruppo è stato corretto da uno a due selezionati su tre: un solo ID era già rifiutato dallo schema prima di raggiungere la regola del gruppo.

Rapporti `.local/text-masks-unit-final-complete.log`, `text-masks-regression.log`, `text-masks-final-browser.log`, `text-masks-cache-browser-precise.log`, `text-masks-artifacts.log` e `text-masks-archive-unchanged.json`. Dopo il riavvio ordinario del laboratorio, API/revisione/hash confermano **337 template, due composizioni, 219 font, JSON R627**, SHA `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb`; selettore SQLite assente, risoluzione del font Alida originale HTTP 200 e zero scritture negli archivi personali.

## Prossimo incremento e limiti

Completare la conversione delle maschere relative PitchPrint nel piano locale del font e confrontare integralmente entrambi i cartelli «Esiste la morte dopo la vita?», con originali e font esatti. I due template restano bloccati nell'importatore e non sono stati aggiunti all'archivio. Maschere assolute/invertite, nuovi tipi di effetti e combinazioni non rappresentabili continuano a essere rifiutati. L'avviso sul testo mascherato non certifica automaticamente che ogni futuro contenuto del cliente sia interamente visibile: un controllo produttivo dell'inchiostro effettivamente ritagliato rimane da sviluppare.

Archivio principale e scelta del backend conservati. Nessuna attivazione SQLite, installazione di font, migrazione reale o modifica commerciale. Nessun deploy; chat pubblicata preservata.
