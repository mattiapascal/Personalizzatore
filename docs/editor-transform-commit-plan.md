# Trasformazioni e input dell’ispettore — piano del 14 novembre 2026

Dopo `5bfc6eb`, verificare trasformazioni/allineamenti con misure incomplete o ancora in attesa nell’ispettore. Riprodurre il problema prima di modificare l’applicazione. Il controllo condiviso deve precedere il comando e il comando deve usare la revisione aggiornata dopo l’applicazione dell’ispettore, anche per un solo oggetto e per i membri di un gruppo.

- Riflessi, inclinazione, allineamenti pagina/selezione/master, distribuzione e distanza restano gli stessi comandi tipizzati e validati. Input invalidi: nessuna trasformazione, fuoco al campo da correggere. Input validi: applicazione e trasformazione successive, con Undo distinti.
- Il punto di ingresso condiviso serve anche i pulsanti raggruppa/separa e ordine dei livelli: mantenere il medesimo controllo per queste azioni. I trascinamenti dei livelli hanno una propria revisione catturata e richiederanno un controllo separato, senza aggiornare arbitrariamente quella revisione.
- Controllare anche gli spostamenti con frecce dal canvas: calcolare la nuova posizione sul documento aggiornato; le frecce nei campi conservano il proprio comportamento.
- Durante il collaudo visivo è emerso anche uno spostamento della vista quando appare l’errore. Mostrare l’avviso in sovrimpressione senza variare la geometria del viewport; verificare posizione del canvas e zoom su desktop/telefono.
- Non introdurre un controllo globale dentro `act`, che entrerebbe in ricorsione durante l’applicazione dell’ispettore e interferirebbe con scarto/Undo. Conservare ruoli, blocchi e scope dei membri.
- Browser desktop/telefono e comandi AI sullo stesso documento, errori/retry/Undo/Redo, campione JSON/SVG portabile, regressioni pertinenti e chat pubblica. Dati personali in sola lettura; nessun deploy, nuova funzione multipagina, AI immagini o integrazione commerciale. Commit e sincronizzazione GitHub dopo i controlli.
