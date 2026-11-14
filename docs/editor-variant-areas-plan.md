# Misure delle varianti nello stesso profilo

14 novembre 2026, dopo `19734d9`. Incremento locale richiesto dal percorso prodotti reali; nessuna scrittura Shopify, prezzo o deploy.

Aggiungere il modo «Per variante» al profilo, con tabella opzionale di ID variante, misure fisse/personalizzate e sagoma. Le misure sono inserite esplicitamente in mm, mai dedotte dai titoli. Le regole del profilo restano comuni; margini e zone riservate non vengono scalati. Verificare che ogni area configurata contenga le zone e lasci spazio al margine. In salvataggio ricontrollare che gli ID appartengano al prodotto e alle varianti associate.

Nel frontend scegliere solo varianti ammesse già lette dal catalogo. Una variante non configurata non usa le misure generiche. Le varianti personalizzate accettano misure esplicite: BSS sarà collegato successivamente. I timbri mantengono la variante del corpo scelta dall’amministratore. La risoluzione del profilo usa lo snapshot prodotto/variante conservato nella pagina, senza modificarne versione o dati. Il comando canonico di scelta rifiuta un cambio variante incompatibile con l’area corrente; il futuro cambio con adattamento richiederà anteprima esplicita.

Aggiungere configurazione amministrativa con lettura tramite adattatore esistente, ricerca varianti, numeri editabili e schema visivo della variante scelta. I vecchi profili fissi/parametrici restano validi, senza migrazione SQLite. Collaudi: unitari dei contratti e server, UI amministrativa su archivio separato, apertura/salvataggio/riapertura, errori concorrenti, campione portatile JSON/SVG e regressioni della chat pubblica. Nessun collaudo Illustrator dichiarato senza verifica umana.
