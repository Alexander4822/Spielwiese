# Family Office Dashboard Starter

Dieses Repository enthält ein Next.js-Projekt (TypeScript, App Router, `src/`-Struktur) mit Tailwind, shadcn/ui und Prisma + SQLite.

## Setup

```bash
npm install
npm run dev
```

Danach ist die Anwendung unter `http://localhost:3000` erreichbar.

## Erstbefüllung (Snapshot)

Die bereitgestellten Startdaten sind in `src/lib/portfolio-data.ts` hinterlegt und werden direkt in den Dashboard-Seiten verwendet (`overview`, `equities`, `crypto`, `real-estate`, `cash`).

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

`DATABASE_URL` ist standardmäßig auf SQLite gesetzt:

```env
DATABASE_URL="file:./dev.db"
```

## Enthaltene Grundstruktur

- Dashboard-Routen unter `src/app/(dashboard)/...`
- UI-Bausteine unter `src/components/ui`
- Utility-/Server-Layer unter `src/lib` und `src/server`
