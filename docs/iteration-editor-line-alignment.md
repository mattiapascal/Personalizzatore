# Allineamento delle righe e interlinea — 9 novembre 2026

Richieste del titolare: interlinea predefinita 1, passo 0,1; giustificazione attivabile anche dai nuovi box automatici; sinistra/centro/destra/giustifica applicabili alle sole righe toccate da cursore o selezione parziale. Il box selezionato applica invece l’allineamento a tutto il testo.

Piano: intervalli `lineStyles` nel documento canonico, riferiti ai caratteri delle righe visuali intersecate, comprese quelle avvolte automaticamente. Comando `updateObject` condiviso, con revisioni e Undo. I metadati di vista seguono inserimenti/cancellazioni del testo insieme agli stili; la serializzazione ricostruisce gli intervalli. Dopo un cambiamento della larghezza, l’allineamento di una nuova riga viene determinato dal primo carattere: gli intervalli non sono legati a indici di righe instabili.

Giustificazione globale con ultima riga a sinistra; giustificazione esplicita di una riga anche sull’ultima. La giustificazione fissa la larghezza visibile nello stesso comando; l’altezza rimane automatica. Un box con righe giustificate non può passare a larghezza automatica finché tali formati non vengono sostituiti. Allineamento del box azzera gli override di riga; formattazione caratteri e dilatazioni restano intatte.

Rischi/prove: mapping graphemes e wrapping, selezione che termina esattamente a inizio della riga successiva, righe vuote, caratteri accentati, copia/JSON/Undo, modifica contenuti, renderer Canvas/SVG e cursore. I valori espliciti di interlinea già salvati restano invariati; assenza del valore ora significa 1. Nessun deploy; Illustrator da collaudare.

Nei tre campioni storici con testo su più righe `fonts.TEST`, `text-decoration.TEST` e `text-box.TEST`, reso esplicito il precedente 1,16 per conservare la resa degli SVG già salvati; i nuovi testi e i documenti senza valore esplicito usano 1. I riferimenti `stamp.TEST` restano invariati.

Implementate cinque prove unitarie e quattro browser: passi dell’interlinea, formato di una riga parzialmente selezionata, tutte le quattro opzioni, selezione grafica su riga giustificata, righe avvolte, riga vuota e inserimento, ripristino globale e JSON. Campione `text-lines.TEST.json/svg` generato con selezioni parziali reali e anteprima ispezionata. Esito della regressione completa nello stato corrente.
