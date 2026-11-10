# Schema tecnico dei profili produttivi

Incremento locale del 9 novembre 2026. Nel backend, **Profili produttivi**, lo schema mostra le misure compilate: area utile rettangolare/quadrata/tonda, margine, zone riservate rettangolari/ellittiche e uno schema di fissaggio alla volta. Coordinate in millimetri, origine superiore sinistra. La scala a schermo conserva le proporzioni e non rappresenta una misura fisica del monitor.

I fori usano la stessa funzione `fixingPositions` del validatore dei profili. Diametro, offset dal bordo e zona di rispetto sono separati. Al cambio formato gli offset restano fisici; le zone riservate mantengono le proprie misure. I kit senza foratura mostrano esplicitamente questa caratteristica. Nessuna misura mancante viene sostituita da un default inventato.

La vista segnala area incompleta, misure incoerenti per sagome tonde/quadrate, margine non utilizzabile, zone da completare/fuori dal rettangolo di area e foratura non rappresentabile. Le zone sono ritagliate alla sagoma nell’anteprima. **Non è una certificazione di contenimento/lavorabilità**, in particolare per forme riservate in aree tonde, distanze effettive dalla grafica o finezza dell’incisione.

La scelta del fissaggio nella preview e le modifiche dei campi non salvano nulla finché non si preme Salva profilo locale. Il documento grafico, i template e le configurazioni rimangono separati. I profili restano non validati e non governano ancora il canvas.

Moduli: `ProductionProfilePreview.tsx`, collegamento in `ProductionProfilesPanel.tsx`, stili amministrativi. Nessun nuovo comando grafico né cambiamento ai file produttivi.

Prove: due browser passati, compresa la precedente gestione dei profili; quote dei centri/diametri/zone di rispetto confrontate con i valori TEST, 4 fori/2 fori/kit senza fori, ridimensionamento senza scala degli offset/zone, sagoma tonda e layout mobile. Stato dell’archivio confrontato prima/dopo per escludere scritture implicite. 15 unitari backend/profili, TypeScript e build passati. Schermate desktop/mobile ispezionate (`.local/previews/editor-profile-diagram-*.png`). [Checkpoint completo precedente e limiti](editor-local-status.md).

Nessuna misura attribuita a un prodotto reale, modifica al negozio, deploy o prova Illustrator.
