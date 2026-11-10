# Configurazioni indipendenti e varianti font — prova locale del 9 novembre 2026

## Obiettivo e accesso

Proteggere il caso dei civici 13 e 15, rendendo comprensibile la differenza fra aggiungere un altro articolo e modificare quello già salvato. Questa prova è separata dal carrello Shopify e non calcola prezzi, non effettua acquisti e non modifica il negozio.

Aprire <http://127.0.0.1:5173/editor?workspace=1&configurations=1>. Il normale editor senza questo parametro non mostra il pannello sperimentale. Backend font: <http://127.0.0.1:5173/editor/admin>.

## Percorso da provare

1. Modificare il testo sul foglio; se si sta scrivendo, premere Esc per terminare l’editing.
2. Premere **Controlla e aggiungi**. Si apre l’anteprima; il carrello non cambia ancora.
3. Controllare grafica, nome e quantità; premere **Aggiungi al carrello di prova** per confermare.
4. Dal riepilogo, **Crea una copia da aggiungere** apre una nuova bozza: cambiare per esempio 13 in 15 e ripetere il controllo/conferma. Il primo articolo rimane 13.
5. **Modifica questo articolo nel carrello** apre invece la modifica di quella sola riga. **Controlla le modifiche** mostra affiancati **Adesso nel carrello** e **Dopo la conferma**. Solo **Sostituisci questo articolo** cambia la riga.

Chiudere il riepilogo, premere Esc o continuare a disegnare non conferma modifiche. La rimozione ha una conferma separata. Il riepilogo è una finestra ampia su desktop, a colonna su mobile; le scorciatoie dell’editor non agiscono sul foglio mentre è aperta. Messaggi contestuali chiariscono quale articolo è stato aggiunto/sostituito e che gli altri sono rimasti invariati.

Questa sistemazione sostituisce il primo pannello sperimentale troppo denso, risultato ambiguo durante le prove del titolare. Prima di aggiungere altre funzioni di editing, verificare comprensibilità e percorso cliente.

## Implementazione e garanzie locali

- `src/editor-workflow/schema.ts`: contratti di configurazione congelata, righe e comandi tipizzati; `ConfigurationPanel.tsx`: controllo e conferma espliciti, copia e sostituzione distinte.
- `scripts/configuration-store.ts`: documento e SVG copiati in una configurazione immutabile; la riga conserva il suo ID esatto. Le configurazioni precedenti restano disponibili dopo una sostituzione.
- Sostituzione/rimozione/quantità verificano ID riga, ID configurazione e versione attesa. Due schede in conflitto non sovrascrivono silenziosamente lo stesso articolo.
- Identificativo della richiesta e impronta del payload impediscono di ripetere una stessa aggiunta dopo perdita della risposta. Il client conserva il payload esatto da ritentare.
- Scritture serializzate e atomiche nell’archivio ignorato `.local/editor-configurations/state.json`, separato dalla libreria font/template. Le prove automatiche usano archivi temporanei, non quello del titolare.
- `scripts/local-configurations.ts`: sole API Vite locali, loopback/origine/intestazione controllati. SVG limitato a contenuti passivi e risorse incorporate; nessun riferimento di rete esterno.

Non è un adattatore Shopify né un sistema pronto per account, ordini o produzione. Autenticazione, proprietà dei progetti, conservazione, revisioni economiche, disponibilità e ponte BSS restano da implementare in un ambiente autorizzato. I profili sono ancora TEST e i limiti grafici esistenti non sono stati generalizzati alle targhe.

## Gestione delle varianti font

Le famiglie della libreria sono raggruppate nel menu dell’ispettore. **Variante font** permette di scegliere i file installati; per font personali con metadati noti, Grassetto/Corsivo selezionano il file della variante disponibile, con pulsanti disabilitati quando manca. La scelta passa dallo stesso comando grafico e include l’asset, quindi resta riapribile nel JSON e annullabile.

Backend: famiglia, stile, peso e corsivo rilevati dai metadati TTF/OTF/WOFF; caricamento con eventuale indicazione manuale del peso/stile. WOFF2 non ha ancora il rilevamento automatico di questi metadati. Google Fonts offre scelta della variante disponibile, anteprima della variante e installazione del relativo file; la stessa variante già presente viene riutilizzata/riattivata. Una prova reale temporanea ABeeZee normale/corsivo ha verificato i due file e non ha modificato la libreria personale.

Aggiornamento successivo: il [controllo dei caratteri mancanti e degli stili simulati](iteration-editor-font-preflight.md) ora è collegato alla bozza e alla conferma locale, sia nella UI sia nell’API. Non impedisce la correzione/importazione di una bozza con errori e non certifica ogni formato o shaping. Restano assi dei font variabili, licenze e indisponibilità delle risorse in un servizio remoto.

## Evidenze

Le verifiche finali e i log sono registrati in [editor-local-status.md](editor-local-status.md). I test del flusso coprono 13/15, sostituzione della sola riga, annullamento, retry dopo perdita della risposta, conflitto fra schede, controllo senza scritture, conferma rimozione e viewport mobile. Campioni visivi privati in `.local/previews/editor-configurations-{13-15,replace,mobile}.png`.

Nessun deploy o modifica al negozio; Illustrator non collaudato.
