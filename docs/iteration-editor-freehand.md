# Disegno a mano libera vettoriale — piano locale

Prossimo incremento dopo ellissi: pennello manuale che registra una polilinea, senza generazione immagini. Anteprima transitoria e un solo `addObject` al rilascio, Esc annulla. Punti normalizzati e dimensioni in mm nel documento canonico, limiti sul numero di nodi e semplificazione locale con tolleranza legata allo zoom. Nessun JavaScript o SVG libero nel comando.

Proposta tecnica reversibile: tipo `path` con punti normalizzati, larghezza/altezza, rotazione, contorno nero/bianco del profilo TEST ed eventuale chiusura. Nuovo tipo nel v2, v1 invariato. Renderer vettoriale Fabric Polyline/Polygon, estremità e giunzioni arrotondate; geometria conservata nel JSON ed esportata nello SVG. Spostamento, dimensioni, rotazione, gruppi, storico e ispettore riutilizzati. I tracciati orizzontali/verticali sono ammessi senza inventare uno spessore geometrico: altezza/larghezza può essere zero, il tratto resta positivo.

Rischi e prove: fedeltà preview/commit, niente perdita della fine del tratto al limite di punti, semplificazione stabile con estremità conservate, rotazione e centro, selezione solo sul tratto trasparente, errori atomici e revisione iniziale, file riapribili e vettoriali. Editing nodi/Bézier e import SVG sono incrementi successivi, non promessi da questa prima polilinea.

## Implementazione e verifiche mirate

`path` è nel documento v2 e nei comandi comuni: 2–512 punti normalizzati, dimensioni fisiche anche piatte, rotazione, chiusura e aspetto. Non ammette riempimento se aperto, chiusura con meno di tre punti, coordinate non finite/non normalizzate, dimensioni entrambe nulle, contorno assente o codice aggiuntivo. UI e AI simulata attraversano `addObject`, `updateObject` e `transformObject`; gruppi scalano dimensioni e tratto, mantenendo i punti normalizzati.

Il pennello campiona a distanza minima di 0,75 pixel visibili; a 512 punti dimezza il campione conservando inizio e fine, poi continua a raccogliere. Al rilascio usa Ramer–Douglas–Peucker iterativo con tolleranza di 0,5 pixel visibili. Preview transitoria, file/zoom/cambio formato sospesi durante il gesto, un solo comando validato, ritorno alla selezione. Clic o gesto inferiore a due pixel non crea oggetti. Esc annulla anche nel workspace. Nessun servizio AI.

Il renderer conserva vettori (`Polyline` aperta/`Polygon` chiuso), cap e giunzioni rotondi, riempimento pari/dispari. Il cestino controlla i segmenti con il loro spessore e il riempimento del poligono, anche nell’area tonda. La singola scala conserva il tratto; ispettore con proporzioni opzionali, angolo e chiusura. Gli assi geometricamente nulli non possono essere allargati senza un successivo editor di nodi.

Verifica attuale: **294 unitari** e browser mirati per gesto, Esc, clic degenere, 1100 campioni, estremità conservata, chiusura/riempimento, JSON/SVG e coincidenza dei riquadri ruotati. Test aggiunto per maniglia e centro, ora passato isolato dopo aver reso tollerante il confronto numerico floating point. La prima suite completa ha superato 90 browser su 91 (solo quel confronto fallito); build e controllo segreti passati. **Nuova suite completa superata con le forme poligonali: 297 unitari, 94 browser laboratorio, build e controllo segreti.** Campione `paths.TEST.json/svg` con polilinea e triangolo generabile tramite `npm run capture:selection -- --paths`; Illustrator non collaudato.

Il limite di riapertura JSON locale passa da 100 KB a **5 MB** per consentire progetti con più tracciati e formattazioni; rimangono i limiti strutturali (30 oggetti, 512 punti per tracciato e stili limitati). Test browser con 30 tracciati da 512 punti, export/riapertura oltre 100 KB e rifiuto atomico sopra 5 MB. Nessuna modifica ai limiti API pubblici.

Stato: implementato; preview desktop/mobile ispezionate e campione generato, regressione completa superata. Nessun servizio immagini, spesa o deploy.
