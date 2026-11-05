# Registro decisioni

## 2026-11-05 — Primo incremento

- Fonte autorevole: specifica MD effettivamente presente; riferimento `_Codex` in AGENTS non trovato. Conservata specifica originale.
- Repository isolato dalla cartella padre; remoto GitHub vuoto fornito dall'utente. Sincronizzazione del codice richiesta, nessun deploy.
- Singola app Vite locale per non registrare un'app Shopify o attivare tunnel. Futuro scaffold ufficiale React Router dopo disponibilità dev store e consenso. Nessun monorepo o framework backend prematuro.
- TypeScript rigoroso e Zod, versioni npm esatte e package-lock. Node locale 24.17.0 fissato. Fabric 7.4.0, React 19.3.1; renderer separato dal dominio. Fabric caricato solo aprendo il laboratorio.
- Dati fixture veri acquisiti in sola lettura; URL da `onlineStoreUrl`; prezzi/inventario esclusi dalla logica. Profili tecnici non certificati e vincoli ignoti null.
- Parser simulato esplicito, senza invio di richieste a provider a pagamento; contratto runtime e fallback pronti. LLM reale e misure di costo rinviati al prossimo incremento con budget/dati confermati.
- Documento editor indipendente TEST: non attribuire 7 pt/margine/nero a uno dei prodotti reali senza conferma. SVG Fabric separato dal JSON; nessun import di codice/grafiche non attendibili.
- Handoff tema/Preventivometro: riuso futuro delle fonti canoniche; non duplicare prezzi o bridge, non confondere Preventivometro V2 con BSS V2. La copia locale del tema non è prova dello stato attuale pubblicato.

## Questioni aperte

Profili produttivi e area utile; verifica umana Illustrator; servizio produttivo e carico; accessibilità su dispositivi reali; supporto rollback BSS. No-AI, backend/provider locale, budget e catalogo server sono stati affrontati nell'incremento successivo descritto sotto.

## 2026-11-05 — Riscontro visibile per ogni azione di selezione

La prova dell'utente ha evidenziato che un aggiornamento dei requisiti senza conferma sembra un pulsante non funzionante. Il prototipo deve confermare dati riconosciuti e scelte, spiegare quale criterio manca e rendere raggiungibili i risultati. Una UI con reducer aggiorna insieme stato e messaggio, mantenendo il controllo delle revisioni. Le misure ignote possono essere indicate prima della montatura e non vanno perse; nessuna montatura o idoneità per fatture viene presunta. La correzione resta locale e senza costi AI.

## 2026-11-05 — Percorso selezione → canvas e scrittura diretta

La prova separata del primo incremento non esprimeva il percorso atteso dall'utente. Il canvas ora si apre da un candidato e usa identità/versioni commerciali e area nominale del catalogo. I vincoli del renderer rimangono TEST; l'associazione non implica validazione produttiva. IText permette scrittura diretta, multilinea e trascinamento; tutte le modifiche confermate passano dallo store. Gli strumenti JSON di prova sono in un pannello sviluppatore, non nel flusso principale.

Cambio modello conservativo: non deformare né ridurre; rifiuto atomico se non entra, undo azzerato al successo per mantenere coerente l'identità prodotto. Non azzerare la grafica quando si cambiano soltanto i requisiti. Import coerente con prodotto/versione/area; adozione compatibile della fixture storica.

La consultazione della skill e documentazione Shopify conferma l'uso futuro di notifiche prodotto e riconciliazione, senza supporre che tutti i cambi di pubblicazione siano notificati a ogni app. Nessuna sottoscrizione creata. Parser e catalogo statico sono limiti espliciti, non soluzioni definitive: [piano del seguito](iteration-canvas.md).

## 2026-11-05 — AI reale, catalogo collegato e conversazione senza form

Il titolare ha autorizzato massimo 2 EUR per collaudo e configurato le due credenziali nel file privato. Budget locale prudente 1 USD, nessun retry automatico, quota persistente e lock fra processi. OpenAI Docs ha guidato function calling strict, assenza di tool amministrativi, modello fissato e separazione fra store:false e condivisione dati. La gratuità promozionale non viene presunta dal contatore.

La skill e lo schema Shopify hanno guidato query paginata, onlineStoreUrl per escludere prodotti non pubblicati, API 2026-10 e accesso read_products. Poll locale ogni cinque minuti al posto di registrare webhook/servizi non autorizzati. Nuovi modelli e profili modificati richiedono revisione tecnica. No-AI chiarito dal titolare: riguarda solo la generazione grafica PitchPrint.

Su richiesta successiva dell'utente il percorso principale usa soltanto chat e domande successive: rimossi form dimensionali e pulsanti montatura. Stato raccolto in riepilogo rosso/verde derivato dal dominio, con valori e stato testuale. Forma esplicita richiesta prima delle misure; nessuna forma rettangolare sottintesa. Misure ignote distinguono una risposta ricevuta dall'idoneità da verificare. Le correzioni ritirano campi senza perdere gli altri, e le risposte obsolete sono respinte per UUID/revisione.

La conversazione resta in memoria (massimo 40 messaggi); al modello passano requisiti, ultima domanda ed estratti degli ultimi sei scambi. Nessuna scheda del catalogo o credenziale. Rilettura catalogo e ripristino sessione preservano requisiti ma rivalutano candidati e vecchie selezioni; la bozza resta sulla propria versione finché rivalidata. JSON sempre salvabile fuori da un gesto, SVG sospeso con catalogo obsoleto/conflitto.
