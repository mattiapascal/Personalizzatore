# Estremità delle linee — piano locale

Controllo manuale a icone per estremità piatte, arrotondate o quadrate. Prima estensione: linee rette e vettori SVG, che possiedono già i parametri delle estremità; controlli singoli e stile comune di selezioni compatibili. Tracciati a punti/Bézier e giunzioni rimangono un seguito della roadmap, non vengono dichiarati completati.

- `strokeLineCap` opzionale sulle linee: valore assente = arrotondato, così vecchi documenti e strumenti di disegno restano invariati. SVG conserva il valore scelto.
- Stesso `updateObject`/`styleObjects`, validazione atomica di tutti i membri. Selezioni incompatibili rifiutate; blocchi cliente, revisioni, Undo/Redo e appunti preservati.
- Centro geometrico fermo durante il cambio, lunghezza nominale inalterata. Il renderer Fabric distingue già l’ingombro di una linea piatta da quello con estremità estese; misurazione e UI devono usarlo.
- Il punteggiato mantiene estremità rotonde per mostrare i punti; il controllo è disabilitato in quel caso e la preferenza resta salvata per il ritorno a continuo/tratteggiato.
- Verificare pixel Canvas/SVG indipendenti, estremi, rotazione/inclinazione/riflessione, selezione multipla, JSON e Undo. Campione TEST e regressioni di disegno/trasformazioni, chat pubblica locale, build/schemi/segreti. Nessuna migrazione, modifica ad archivi personali, deploy, AI immagini o nuova funzione multipagina.
