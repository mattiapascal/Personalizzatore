# Dodici altri template conformi — 12 novembre 2026

Audit completo dei 65 sorgenti rimasti dopo Modello generico: 18 superano il confronto indipendente, 47 restano bloccati o fuori soglia. Sei dei 18 contengono una texture metallica da trattare come riferimento; non sono stati importati con la texture stampabile. I dodici senza immagini di pagina hanno superato il confronto e sono stati salvati; la riapertura successiva ha isolato due difetti descritti sotto. [Diagnosi dei casi rimanenti](editor-remaining-templates-plan.md).

| Template | Formato mm | Oggetti |
|---|---:|---:|
| Nome e Bandieraa | 250 × 30 | 2 |
| 4915 - Mod. B | 70 × 25 | 2 |
| Resi Mittente | 25 × 10 | 8 |
| Dietro al vetro | 250 × 30 | 4 |
| Nome e Bandiera | 250 × 30 | 2 |
| Nome e telefono | 26 × 10 | 2 |
| Timbro aziendale - Mod. A | 58 × 22 | 3 |
| Timbro aziendale - Mod. A | 49 × 29 | 3 |
| Rappresentanti | 250 × 125 | 544 |
| IBAN | 70 × 10 | 1 |
| Copia | 26 × 10 | 1 |
| Sul davanti | 250 × 30 | 4 |

Quattro immagini originali confrontate byte per byte; testo, font, colori e misure conservati. I due nomi Mod. A corrispondono a sorgenti e formati distinti. I contorni deformati diventano tracciati come previsto dal convertitore generale; label, gruppi e blocchi restano nel documento. Liste/hook speciali non vengono eseguiti: i relativi avvisi sono conservati nella provenienza. Nessuna modifica al codice applicativo `435a359` durante questo lotto.

## Salvataggio con protezione dei dati

**292 template, due composizioni, 219 font; revisione 564 → 576**. Backup preventivo `.local/pitchprint-migration/remaining-unambiguous-local-import/backup-revision-564-30895e08aa41.json`, SHA `30895e08aa41b1ab09f659017e8ce167767323546118195c1f4fb1d8593803e8`. Tag «Da verificare», sorgente/hash e avvisi registrati, nessuna sovrascrittura o associazione prodotto. Record preesistenti, font, impostazioni, profili e priorità tag conservati; originali sorgente invariati.

Preparazione completa `.local/pitchprint-migration/remaining-priority-full-20261112/report.json`, selezione e guardia originali in `remaining-unambiguous-prepared/`, manifest di salvataggio in `remaining-unambiguous-local-import/report-compact.json`. Tutti sono privati e non sincronizzati nel repository.

## Verifiche del codice

**879 unitari, 48 browser pertinenti, build/scansione segreti e 48 campioni** già passati sullo stesso codice nell’[incremento degli stili oltre fine riga](iteration-editor-trailing-text-styles.md). Nessuna ripetizione o nuova dichiarazione di suite completa per questo lotto dati. Il controllo Illustrator resta umano e non eseguito; template TEST/non validati per produzione. Nessun deploy o intervento commerciale.


## Difetto intercettato nella riapertura

Il primo controllo si è fermato su «Dietro al vetro»: un rettangolo residuale totalmente fuori foglio impedisce la creazione dello store. L’audit completo ha isolato lo stesso difetto in «Sul davanti». Nessuna differenza nel foglio stampato, ma entrambi erano inutilizzabili nell’editor e nelle miniature: non vengono dichiarati collaudati.

**Correzione preventiva generale:** l’importatore applica ora il medesimo validatore di layout prima di offrire una bozza; il nuovo test conserva il sorgente e rifiuta l’importazione non riapribile. **49 browser pertinenti, 43 unitari pertinenti, build e scansione segreti passati** sul controllo aggiuntivo. Log `.local/pitchprint-layout-gate-*`. Gli 879 unitari completi e 48 campioni appartengono al checkpoint precedente `435a359`; non sono stati interamente rieseguiti dopo questo controllo.

**Protezione delle copie locali:** entrambe archiviate, con file originali/documenti/font integralmente conservati, nessuna modifica alla grafica. Backup prima dell’archiviazione `backup-before-quarantine-revision-576.json`, SHA `3b89ef1b95340ade933434b121474d40356aa93e1665cda1a06c5fcdf9f9e2b1`; rapporto `layout-quarantine-report.json` nella cartella privata del lotto. Revisione 576 → 578. **292 template totali, 290 attivi, due in attesa di recupero**; due composizioni e 219 font conservati. Gli altri record sono invariati.

Restano **53 sorgenti prioritari non importati**, 25 a priorità bassa e 103 multipagina esclusi. I due archiviati sono già presenti e separati dai 53. Le sei targhette metalliche sono state preparate come riferimenti del supporto e non salvate. Il recupero degli elementi fuori foglio ha precedenza su ulteriori importazioni. Nessun deploy.


**Dieci copie attive ricontrollate:** riapertura effettiva, font/geometria/canvas pronti e documenti identici; tutte le dieci miniature generate e ricaricate dalla cache con zero letture dei record. Zero errori o scritture, archivio invariato durante i controlli. Log `.local/remaining-valid-reopen.log` e `remaining-valid-thumbnails.log`; rapporti nella cartella privata del lotto. I primi log falliti sulle due copie esterne sono conservati e non dichiarati superati.
