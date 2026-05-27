# Szpitalik

![hero](public/hero.jpeg)

Planowanie dyżurów lekarskich — szybko, lokalnie, bez chmury.

Progressive Web App for hospital duty scheduling. All compute and data stay in the browser (IndexedDB + Web Worker GA). No backend.

## Live

https://gregolsky.github.io/szpitalik/

## Features

- **Per-unit setup wizard** — define wards (piony), doctors, and rules
- **Automatic plan generation** — genetic algorithm runs in a Web Worker; pinned cells survive regeneration
- **Doctor preferences mode** — click cells to mark unavailability or priority for a given day
- **Two viewing aspects** — `📋 Przypisania` (rows = doctors) and `🏥 Piony` (rows = wards)
- **Export / Import** — JSON snapshot or encrypted password-protected link
- **Print-friendly** — toolbar hidden in print view
- **Offline-first PWA** — installable, works without network

## Screenshots

| Setup wizard | Plan — Przypisania | Plan — Piony |
| --- | --- | --- |
| ![setup](docs/screenshots/setup.png) | ![aspect-a](docs/screenshots/aspect-a.png) | ![aspect-b](docs/screenshots/aspect-b.png) |

## Stack

- React 18 + TypeScript + Vite
- IndexedDB (idb) for persistence
- Web Worker genetic algorithm for plan generation
- Vitest + Testing Library
- vite-plugin-pwa (service worker + manifest)

## Develop

```bash
npm install
npm run dev      # vite dev server
npm run test     # vitest watch
npm run build    # tsc -b && vite build
```

## Specs

See [SPECS.md](./SPECS.md) for the full feature specification.
