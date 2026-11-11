# De pakjestelefoon van Sinterklaas

Een klassikaal telspel met een getekende Sinterklaas, een apart digibordscherm en een mobiele bedieningspagina. De kinderen leggen echte blokjes neer: ieder blokje stelt een pakje voor.

## Spelen

1. Open het spel op het digibord en kies **Open het digibord**.
2. Klik **Start spel en geluid**. Zet het geluid van het digibord aan.
3. Open hetzelfde webadres op je mobiel en kies **Ik gebruik mijn mobiel**. Bij een privépublicatie gebruik je hetzelfde account op beide apparaten.
4. Toets het zescijferige belnummer van het digibord in en druk op **Bel Sinterklaas**. Het is een spelnummer, geen echt telefoonnummer.
5. Sta de microfoon op je mobiel toe. Na het overgaan neemt Sinterklaas op. Zeg **hoeveel pakjes**. Zo nodig tik je eerst op de microfoonknop.
6. Sinterklaas denkt even na, toont een willekeurig getal van **1 tot en met 12** in zijn wolkje en spreekt het uit. De kinderen leggen dat aantal blokjes neer.
7. Kies **Ophangen / nieuwe ronde** om opnieuw te bellen. Op het digibord kun je het getal nog eens laten uitspreken.

Spraakherkenning hangt af van browser, microfoontoestemming en de spraakdienst van het apparaat. De knop **Vraag zonder microfoon** voert dezelfde spelactie uit. Er wordt geen audio door deze applicatie opgeslagen; de browser kan audio voor herkenning naar zijn spraakdienst sturen. De stem komt van de beschikbare Nederlandse systeemstem. Het belnummer is drie uur geldig. Houd het digibord open en gebruik één bedienende telefoon per klas.

## Techniek

Geen npm-afhankelijkheden. Node.js 22 of nieuwer.

```sh
npm test
npm run build
npm run dev
```

De lokale preview staat op http://localhost:4173 en gebruikt geheugenopslag. Deze loopback-preview is alleen voor dezelfde computer; voor mobiel gebruik is de gehoste HTTPS-versie nodig. Statische GitHub Pages-hosting alleen is niet voldoende: de twee schermen wisselen hun spelstatus uit via een Worker en een R2-bucket met binding `BUCKET`. `worker.mjs` bevat de API, `index.html` de interface en de eigen SVG-tekening. `build.mjs` bundelt beide in `dist/server/index.js`. `.openai/hosting.json` configureert de Sites-publicatie.

Er worden alleen belnummer, tijdstippen, ronde en getal opgeslagen. Een reset verwijdert het getal uit de actieve spelstatus. Verlopen sessies worden niet meer aangeboden. Er is geen automatische beoordeling van de fysieke blokjes.
