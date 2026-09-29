# Reihen-Mission

A standalone German-language multiplication app based on [grafxp/blitzrechnen](https://github.com/grafxp/blitzrechnen). Practise the **2, 3, 4, 5, 6, 7, 8, 9, 11 and 12 times tables**, with factors **1–12** and products through **144**.

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

In this Ubuntu/Termux workspace, use the installed Linux Node 24 runtime before running the commands above:

```bash
export PATH=/root/.local/node-runtime/node-v24.21.0-linux-arm64/bin:$PATH
```

- Choose individual rows, several rows, or all ten for mixed practice.
- Explore each row through twelve equations, interactive dot arrays and calculation strategies. Hide and reveal results for recall practice.
- Practise products, missing factors and sequences, with choices for beginners and number input as confidence grows.
- Request a hint at any time; visual help also appears after two incorrect answers.
- Saved progress tracks independent evidence for every fact. A row becomes secure only after all twelve facts have been solved independently. Unlearned facts receive priority.
- Keep the template's calm mission maps, 10 points per solved task, repeatable rewards, protected parent settings, accessibility options and seven-day learning overview.
- Work offline after the first visit; install as a PWA over HTTPS. All progress is stored locally in a separate `reihen-mission` IndexedDB database.
- Row selections stay fixed during a started reward round and can change after collection.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The browser suite covers phone and tablet layouts, row learning, complete reward rounds, saved progress, parent controls, hints, and offline loading. It needs Chromium:

```bash
npx playwright install chromium
```

`npm run generate:pwa-assets` regenerates installation icons from `public/app-icon.svg`.
