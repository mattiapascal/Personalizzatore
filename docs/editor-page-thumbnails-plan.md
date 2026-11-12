# Navigazione con miniature — 12 novembre 2026

Nuova richiesta esplicita del titolare: sfogliare i documenti multipagina tramite miniature sotto il canvas ed eliminare il menu a discesa a sinistra, diventato ridondante. È autorizzata questa nuova navigazione multipagina, che supera il vecchio limite testuale del goal. Ogni pagina mantiene il proprio formato già presente nel documento canonico.

1. Striscia sotto il canvas con miniature proporzionate, nome, dimensioni in mm e pagina attiva evidenziata. Scorrimento orizzontale e navigazione da tastiera; selezione attraverso `selectPage`, senza un altro stato del documento.
2. Rimuovere il selettore sinistro e raccogliere la gestione delle pagine accanto alla striscia. Pannello sovrapposto, entro la finestra, con chiusura/Escape e senza spostare il canvas. Conservare i controlli di revisione, blocco durante editing/operazioni e conferma eliminazione.
3. Miniature tecniche: supporto sotto, grafica al centro, riferimenti/fissaggi sopra, riutilizzando le proiezioni esistenti. Output produttivo invariato. Cache distinta quando vi sono riferimenti; stessa chiave produttiva per documenti che ne sono privi. Preparazione progressiva delle sole miniature vicine alla zona visibile.
4. Evitare lampeggiamenti delle miniature al semplice cambio pagina/metadati e rigenerare soltanto la grafica cambiata. Niente download di font del computer, fallback, miniature da asset non verificati o scritture nell’archivio reale.
5. Testare formati diversi, selezione/Undo/Redo, gestione, frecce/touch/mobile, contenuti e font bloccati, cache e allineamento del canvas durante editing. Aggiornare i test/campioni che usavano il selettore rimosso, poi verificare gli otto libri reali in sola lettura.

L’anteprima amministrativa con i riferimenti riutilizzerà lo stesso renderer in un incremento successivo; questa modifica non la sostituisce con il file produttivo e non modifica dati reali, prezzi o integrazioni online.

Il renderer riutilizza i contratti di colore esistenti: RGB nei documenti a colori, nero/bianco nei monocromatici. Colori RGB dei riferimenti su un documento monocromatico richiederebbero anche una revisione del filtro di tinta dell’intero canvas; non estendere soltanto lo schema senza quel collaudo.

## Esito

Completati i cinque punti. [Implementazione e prove](iteration-editor-page-thumbnails.md): 905 unitari, 75 browser pertinenti completi, 13 pubblici e 54 campioni passati; otto documenti reali con 44 pagine verificati in sola lettura, archivio invariato. Nessun deploy.
