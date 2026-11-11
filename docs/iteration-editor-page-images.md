# Sfondi e primi piani PitchPrint — 11 novembre 2026

## Comportamento locale

L’importatore conserva ora le immagini di pagina, oltre al colore del foglio e agli oggetti. Nella [pagina di importazione](http://127.0.0.1:5173/editor/import-pitchprint?mode=admin), **Sfondo immagine** e **Primo piano** hanno scelte separate: da verificare, grafica da stampare, riferimento del materiale oppure esclusione. Il valore iniziale richiede una scelta: un legno, un ottone o una texture del supporto non vengono trasformati automaticamente in una grafica produttiva. L’esclusione globale già presente continua a escludere anche il colore del foglio.

Lo sfondo produttivo viene inserito sotto gli oggetti e collegato a `backgroundImageId`; il primo piano è un’immagine normale sopra gli oggetti. Il riferimento del materiale resta visibile nell’editor, con selezione/trasformazione/eliminazione bloccate, e viene escluso da SVG, PNG e miniature produttive. La proiezione produttiva pulisce anche il riferimento allo sfondo eventualmente escluso. Si usano gli oggetti immagine canonici esistenti: nessun secondo stato grafico. Trasformazioni manuali e AI simulata usano gli stessi comandi, con revisioni e Undo/Redo.

Cambiare le opzioni azzera conversione e approvazione dell’anteprima. Nell’importazione massiva invalida l’analisi precedente: occorre analizzare di nuovo prima di salvare le bozze. La miniatura dell’importatore mostra la grafica produttiva; per esaminare i riferimenti del materiale si apre la copia nell’editor.

## Originali e geometria

Il canvas serializzato identifica l’immagine attiva; il descrittore `fillData.assetData`, `templateSource` o `foregroundSource` ne identifica l’originale. Discordanze fra gli originali, assenza della sorgente della griglia pixel ed effetti non rappresentabili restano errori. La sola anteprima a bassa risoluzione non può diventare l’originale del documento.

L’anteprima dichiarata viene decodificata per ricostruire la griglia delle coordinate originali, senza usarne i pixel nel risultato. Crop, dimensioni fisiche, origini, rotazioni, riflessioni e bordi fuori dal foglio vengono convertiti rispetto all’immagine originale. Senza geometria del canvas sono ammessi soltanto gli adattamenti espliciti stretch/fill/fit senza dimensioni personalizzate ambigue. Non vengono scartati silenziosamente filtri, opacità, contorni o inclinazioni non rappresentabili.

Le risorse già presenti nella libreria locale vengono riutilizzate per URL di origine esatto e SHA-256 verificato. Un blob locale corrotto ferma la conversione; non si scarica una sostituzione remota per nascondere l’errore. Per una risorsa non presente si usa l’adattatore di lettura PitchPrint esistente. Richieste identiche condivise nella stessa conversione; un errore viene eliminato dalla cache per permettere il tentativo successivo. Font sempre risolti con la politica dei file esatti, senza font del computer.

Restano i limiti del documento: raster fino a 24 MP e formati PNG/JPEG supportati. La libreria può conservare originali più grandi, ma il convertitore non li riduce di nascosto. Sfondi SVG, maschere, deformazioni inclinate ed effetti diversi richiedono un incremento successivo; non sono certificati da queste prove.

## Correzione degli assi fisici e Azienda Agricola

Il confronto indipendente del template 99 × 139 mm ha isolato una differenza negli ornamenti vettoriali. Il canvas originale è 281 × 394 pixel: gli assi fisici hanno scale leggermente diverse. Testi e immagini usavano già entrambe le scale; lo SVG intermedio dei vettori usava invece l’adattamento predefinito proporzionale, introducendo margini impliciti. Ora usa `preserveAspectRatio="none"`, coerente con la matrice della pagina.

Questa correzione mantiene le coordinate dei riempimenti e rende esplicito un limite precedentemente nascosto: i contorni con scala non uniforme richiedono espansione in tracciati, anche quando la differenza deriva dall’arrotondamento dei pixel. Non è stato introdotto un contorno medio approssimato.

Su Azienda Agricola sono stati recuperati il fondo `#fffeef` e il primo piano PNG originale 1426 × 2000 pixel, con la griglia dichiarata da 713 × 1000. La trasformazione monocolore del logo coincide pixel per pixel con il calcolo indipendente; immagini e testi coincidevano nel confronto separato. La conversione esatta completa resta bloccata da due contorni degli ornamenti da espandere. Il solo testo curvo autorizzato resta escluso nella copia derivata; nessun altro contenuto è stato tolto e nessuna bozza parziale è stata aggiunta all’archivio.

La nuova analisi in sola lettura degli stessi 370 sorgenti (colori conservati, sfondi esclusi come nelle analisi precedenti) dà **238 convertibili e 132 bloccati**, rispetto a 259/111: 21 casi ora fermati per contorno non uniforme. Fra i 345 prioritari: 238 convertibili/107 bloccati; i 25 a bassa priorità sono bloccati. Non è un conteggio di template con sfondi classificati o pronti per la produzione. Un’unica bozza già salvata è fra i 21 casi: **Retro bottiglia classico**, conservata senza modifiche. Resoconti e lista di revisione privati in `.local/pitchprint-migration/page-axes-*.json`; zero scritture, zero errori browser, checksum dell’archivio invariato.

Prova preliminare successiva: Ghostscript 10.08.0 già disponibile sul computer ha espanso i due contorni di Azienda Agricola in copie private, conservando anche i riempimenti e le trasformazioni. Confronto del prototipo completo a 792 × 1112 pixel: 157 pixel oltre 24/255, rapporto 0,000187, errore medio 0,104/255; logo monocolore con zero differenze rispetto al calcolo indipendente, 31 oggetti, nessuna scrittura nell’archivio. Il primo tentativo troppo dettagliato ha superato i limiti del documento. Prima di integrare questa strada occorrono un contratto sicuro per dati numerici, limiti di precisione/capacità espliciti e prove generali su giunzioni, estremità e trasformazioni: il prototipo non viene presentato come capacità già disponibile nel frontend. Riferimento dell’operatore di espansione: [PostScript Language Reference](https://www.adobe.com/jp/print/postscript/pdfs/PLRM.pdf).

## Campioni e collaudo

`page-images.source.TEST.json` genera `page-images.TEST.json/svg` e `page-image-references.TEST.json/svg`, formato **100 × 60 mm**, tre oggetti. Originali sintetici incorporati, anteprime con griglia diversa, sfondo oltre il bordo, primo piano trasparente e colore del foglio. Generatore: `node --import tsx scripts/capture-editor-page-images.ts`, con server locale. Prova di comando AI sul primo piano e Undo prima dell’esportazione.

Confronti indipendenti del generatore: zero pixel con differenza oltre 24/255; errore medio massimo 0,032/255 nei due campioni. Schermate delle copie aperte nell’editor ispezionate. In Illustrator controllare le misure della tavola, l’immagine di fondo oltre bordo e ritagliata alla tavola, l’originale del primo piano, l’ordine degli oggetti e l’assenza del materiale nel secondo SVG. Il JSON del riferimento deve conservarlo per l’editor. Collaudo Illustrator non eseguito.

I test coprono destinazioni esplicite, esclusione singola/globale, risorse locali e checksum, errori/retry, confronto pixel su dodici combinazioni di rotazioni/riflessioni/crop, matrici fisiche non proporzionali, metadati con opacità/contorno e invalidazione delle analisi massive.

Verifica finale: **761 unitari / 117 file**, build laboratorio/pubblica e controlli dei segreti passati; **37 campioni** riaperti/esportati, zero errori browser o richieste esterne. L’esecuzione completa da 501 casi ha prodotto **500 passati e un errore nella raccolta degli artefatti**: la suite pubblica avviata contemporaneamente usava la stessa cartella e ha cancellato un file della traccia durante la chiusura del caso JPEG. Non era un’asserzione funzionale sul JPEG. Corrette le due configurazioni Playwright con cartelle sorelle `test-results/local` e `test-results/storefront`. Il ricontrollo finale contemporaneo è passato: **32/32 casi del convertitore/JPEG e 13/13 pubblici**, entrambe le cartelle con esito passato e nessun errore. Non viene dichiarata una nuova esecuzione completa dopo l’ultima guardia per dichiarazioni immagine malformate; quest’ultima è coperta dal nuovo unitario e dai ricontrolli del convertitore. Log iniziali, incluso l’errore, conservati in `.local`.

Archivio personale verificato invariato: revisione 371, **117 template, due composizioni e 219 file font**; SHA-256 `bd14a55986b4e8ebe226f893c1e87df4032d0df82efba700543891e43b9de62a`. Libreria media: revisione 797, 784 risorse/13 categorie, incluse le 254 bandiere a 50 mm iniziali. Nessuna bozza parziale o prototipo aggiunto all’archivio.

Nessun deploy o modifica al negozio, a PitchPrint, BSS, prezzi o acquisti. Originali privati e resoconti reali restano in `.local`; i campioni Git sono sintetici.
